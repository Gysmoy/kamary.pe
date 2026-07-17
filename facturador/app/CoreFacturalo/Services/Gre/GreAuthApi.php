<?php

namespace App\CoreFacturalo\Services\Gre;

use App\Models\Billing\Company;
use Illuminate\Support\Facades\Cache;
use Exception;

/**
 * OAuth2 de la nueva plataforma GRE (Guia de Remision Electronica por API REST).
 *
 * Contrato SUNAT:
 *  - POST https://api-seguridad.sunat.gob.pe/v1/clientessol/{client_id}/oauth2/token/
 *  - grant_type = password  (NO client_credentials)
 *  - scope      = https://api-cpe.sunat.gob.pe
 *  - client_id / client_secret : credenciales de API creadas en el menu SOL
 *  - username = RUC + usuario SOL secundario  (== company->soap_username)
 *  - password = clave SOL                       (== company->soap_password)
 *  - Content-Type: application/x-www-form-urlencoded
 *  - El token dura 1 hora; se cachea ~55 min.
 */
class GreAuthApi
{
    const GRANT_TYPE = 'password';
    const SCOPE = 'https://api-cpe.sunat.gob.pe';
    const TOKEN_URL = 'https://api-seguridad.sunat.gob.pe/v1/clientessol/%s/oauth2/token/';

    /** @var Company */
    private $company;

    public function __construct(Company $company)
    {
        $this->company = $company;
    }

    /**
     * Access token valido (cacheado). Lanza excepcion si no se puede obtener.
     *
     * @return string
     * @throws Exception
     */
    public function getToken()
    {
        [$clientId, $clientSecret, $username, $password] = $this->credentials();

        return Cache::remember($this->cacheKey(), now()->addMinutes(55), function () use ($clientId, $clientSecret, $username, $password) {
            return $this->requestToken($clientId, $clientSecret, $username, $password);
        });
    }

    /**
     * Invalida el token cacheado (para reintentar tras un 401).
     */
    public function forget()
    {
        Cache::forget($this->cacheKey());
    }

    private function credentials()
    {
        $clientId = $this->company->gre_client_id;
        $clientSecret = $this->company->gre_client_secret;
        $username = $this->company->soap_username; // RUC + usuario SOL secundario
        $password = $this->company->soap_password; // clave SOL

        if (!$clientId || !$clientSecret) {
            throw new Exception('GRE: falta configurar client_id/client_secret de la API GRE (menu SOL > Credenciales de API SUNAT, servicio GRE).');
        }
        if (!$username || !$password) {
            throw new Exception('GRE: falta usuario/clave SOL (soap_username/soap_password) para autenticar la API GRE.');
        }

        return [$clientId, $clientSecret, $username, $password];
    }

    private function cacheKey()
    {
        return 'gre_token_' . md5($this->company->id . '|' . $this->company->gre_client_id . '|' . $this->company->soap_username);
    }

    private function requestToken($clientId, $clientSecret, $username, $password)
    {
        $form = [
            'grant_type' => self::GRANT_TYPE,
            'scope' => self::SCOPE,
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
            'username' => $username,
            'password' => $password,
        ];

        $curl = curl_init();
        curl_setopt_array($curl, [
            CURLOPT_URL => sprintf(self::TOKEN_URL, $clientId),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_CUSTOMREQUEST => 'POST',
            CURLOPT_POSTFIELDS => http_build_query($form),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/x-www-form-urlencoded',
            ],
        ]);
        $response = curl_exec($curl);
        $errno = curl_errno($curl);
        $error = curl_error($curl);
        $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);

        if ($errno) {
            throw new Exception("GRE auth: error de conexion con SUNAT ({$error}).");
        }

        $data = json_decode($response, true);
        if (is_array($data) && !empty($data['access_token'])) {
            return $data['access_token'];
        }

        $desc = '';
        if (is_array($data)) {
            $desc = $data['error_description'] ?? $data['error'] ?? '';
        }
        if ($desc === '') {
            $desc = is_string($response) ? substr($response, 0, 400) : '';
        }

        throw new Exception("GRE auth: no se obtuvo token (HTTP {$httpCode}) - {$desc}");
    }
}
