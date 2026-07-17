<?php

namespace App\CoreFacturalo\Services\Gre;

use App\CoreFacturalo\WS\Zip\ZipFly;
use App\Models\Billing\Company;
use Exception;

/**
 * Envio de Guias de Remision por la nueva API REST GRE 2.0 de SUNAT.
 *
 * Flujo asincrono:
 *   1) token OAuth2 (GreAuthApi)
 *   2) POST del comprobante (ZIP del XML firmado, base64 + hash) -> devuelve numTicket
 *   3) GET consulta del ticket -> codRespuesta (98 en proceso / 0 aceptado / 99 error) + arcCdr
 *
 * Reemplaza al BillSender SOAP (dado de baja por SUNAT: codigo 1085) SOLO para guias.
 */
class GreSender
{
    const SEND_URL = 'https://api-cpe.sunat.gob.pe/v1/contribuyente/gem/comprobantes/%s';
    const STATUS_URL = 'https://api-cpe.sunat.gob.pe/v1/contribuyente/gem/comprobantes/envios/%s';

    /** Reintentos de consulta del ticket cuando SUNAT responde "en proceso" (98). */
    const MAX_POLL = 6;
    const POLL_SLEEP = 3; // segundos

    /** @var Company */
    private $company;

    /** @var GreAuthApi */
    private $auth;

    public function __construct(Company $company)
    {
        $this->company = $company;
        $this->auth = new GreAuthApi($company);
    }

    /**
     * Ejecuta el flujo completo (envio + consulta).
     *
     * @param string $filename  RUC-TT-SERIE-NUMERO (sin extension)
     * @param string $xmlSigned XML firmado
     * @return array Resultado normalizado (ver normalizeStatus()).
     * @throws Exception en errores de transporte o rechazos duros de la API.
     */
    public function process($filename, $xmlSigned)
    {
        $zip = (new ZipFly())->compress($filename . '.xml', $xmlSigned);
        $payload = [
            'archivo' => [
                'nomArchivo' => $filename . '.zip',
                'arcGreZip' => base64_encode($zip),
                'hashZip' => hash('sha256', $zip),
            ],
        ];

        $sendRes = $this->requestWithAuthRetry('POST', sprintf(self::SEND_URL, $filename), $payload);

        $body = $sendRes['body'];
        if ($sendRes['http'] >= 400 || !is_array($body) || empty($body['numTicket'])) {
            throw new Exception('GRE envio (HTTP ' . $sendRes['http'] . '): ' . $this->extractApiError($body, $sendRes['raw']));
        }

        $ticket = $body['numTicket'];

        // IMPORTANTE: a partir de aqui SUNAT YA recibio la guia (tenemos ticket). Un fallo
        // en la consulta NO debe propagar excepcion (revertiria la transaccion y perderiamos
        // el ticket mientras SUNAT lo procesa -> guia duplicada al reintentar). Ante cualquier
        // error de consulta se devuelve "pending" con el ticket para consultarlo despues.
        for ($i = 0; $i < self::MAX_POLL; $i++) {
            try {
                $statusRes = $this->requestWithAuthRetry('GET', sprintf(self::STATUS_URL, $ticket), null);
                $sBody = $statusRes['body'];

                if ($statusRes['http'] >= 400 || !is_array($sBody)) {
                    break; // error de API en la consulta: queda pendiente
                }

                $cod = isset($sBody['codRespuesta']) ? (string) $sBody['codRespuesta'] : null;

                if ($cod === '98') {
                    if ($i < self::MAX_POLL - 1) {
                        sleep(self::POLL_SLEEP);
                    }
                    continue;
                }

                // 0 (aceptado) o 99 (rechazado): resultado definitivo.
                return $this->normalizeStatus($ticket, $sBody);
            } catch (Exception $e) {
                break; // error de red durante la consulta: queda pendiente
            }
        }

        // Sigue en proceso (o consulta no concluyente): se guarda el ticket para consultar luego.
        return [
            'success' => true,
            'ticket' => $ticket,
            'accepted' => false,
            'pending' => true,
            'rejected' => false,
            'code' => '98',
            'description' => 'En proceso en SUNAT. Ticket: ' . $ticket,
            'cdr_zip' => null,
        ];
    }

    /**
     * Consulta un ticket ya emitido (para finalizar guias que quedaron pendientes).
     *
     * @param string $ticket
     * @return array
     * @throws Exception
     */
    public function consult($ticket)
    {
        $statusRes = $this->requestWithAuthRetry('GET', sprintf(self::STATUS_URL, $ticket), null);
        $sBody = $statusRes['body'];

        if ($statusRes['http'] >= 400 || !is_array($sBody)) {
            throw new Exception('GRE consulta (HTTP ' . $statusRes['http'] . '): ' . $this->extractApiError($sBody, $statusRes['raw']));
        }

        $cod = isset($sBody['codRespuesta']) ? (string) $sBody['codRespuesta'] : null;
        if ($cod === '98') {
            return [
                'success' => true,
                'ticket' => $ticket,
                'accepted' => false,
                'pending' => true,
                'rejected' => false,
                'code' => '98',
                'description' => 'En proceso en SUNAT. Ticket: ' . $ticket,
                'cdr_zip' => null,
            ];
        }

        return $this->normalizeStatus($ticket, $sBody);
    }

    /**
     * Normaliza la respuesta de consulta del ticket a un formato uniforme.
     */
    private function normalizeStatus($ticket, array $sBody)
    {
        $cod = isset($sBody['codRespuesta']) ? (string) $sBody['codRespuesta'] : null;
        $cdrZip = (!empty($sBody['arcCdr'])) ? base64_decode($sBody['arcCdr']) : null;

        if ($cod === '0') {
            return [
                'success' => true,
                'ticket' => $ticket,
                'accepted' => true,
                'pending' => false,
                'rejected' => false,
                'code' => '0',
                'description' => 'Aceptado por SUNAT (GRE)',
                'cdr_zip' => $cdrZip,
            ];
        }

        if ($cod === '99') {
            $numError = $sBody['error']['numError'] ?? 'ERROR';
            $desError = $sBody['error']['desError'] ?? 'Rechazado por SUNAT';
            return [
                'success' => true,
                'ticket' => $ticket,
                'accepted' => false,
                'pending' => false,
                'rejected' => true,
                'code' => (string) $numError,
                'description' => (string) $desError,
                'cdr_zip' => $cdrZip,
            ];
        }

        throw new Exception('GRE consulta: codRespuesta inesperado (' . $cod . ') - ' . json_encode($sBody, JSON_UNESCAPED_UNICODE));
    }

    /**
     * Ejecuta la peticion; ante un 401 (token vencido) refresca el token y reintenta una vez.
     */
    private function requestWithAuthRetry($method, $url, $payload)
    {
        $token = $this->auth->getToken();
        $res = $this->httpJson($method, $url, $token, $payload);

        if ($res['http'] === 401) {
            $this->auth->forget();
            $token = $this->auth->getToken();
            $res = $this->httpJson($method, $url, $token, $payload);
        }

        return $res;
    }

    private function httpJson($method, $url, $token, $payload)
    {
        $curl = curl_init();
        $opts = [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 60,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => [
                "Authorization: Bearer {$token}",
                'Content-Type: application/json',
            ],
        ];
        if ($payload !== null) {
            $opts[CURLOPT_POSTFIELDS] = json_encode($payload);
        }
        curl_setopt_array($curl, $opts);
        $raw = curl_exec($curl);
        $errno = curl_errno($curl);
        $error = curl_error($curl);
        $http = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);

        if ($errno) {
            throw new Exception("GRE: error de conexion con SUNAT ({$error}).");
        }

        return [
            'http' => (int) $http,
            'body' => json_decode($raw, true),
            'raw' => $raw,
        ];
    }

    private function extractApiError($body, $raw)
    {
        if (is_array($body)) {
            if (!empty($body['errors']) && is_array($body['errors'])) {
                $parts = [];
                foreach ($body['errors'] as $e) {
                    $parts[] = trim(($e['codError'] ?? '') . ' ' . ($e['desError'] ?? ''));
                }
                return implode('; ', array_filter($parts));
            }
            foreach (['msg', 'error_description', 'message', 'desError'] as $k) {
                if (!empty($body[$k])) {
                    return $body[$k];
                }
            }
        }
        return is_string($raw) ? substr($raw, 0, 500) : 'respuesta no reconocida';
    }
}
