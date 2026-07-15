<?php

namespace App\CoreFacturalo\WS\Services;

use App\CoreFacturalo\WS\Response\BillResult;

/**
 * Class BillSender.
 */
class BillSender extends BaseSunat
{
    /**
     * @param string $filename
     * @param string $content
     *
     * @return mixed
     */
    public function send($filename, $content)
    {
        $client = $this->getClient();
        $result = new BillResult();

        try {
            $zipContent = $this->compress($filename.'.xml', $content);
            $params = [
                'fileName' => $filename.'.zip',
                'contentFile' => $zipContent,
            ];
            $response = $client->call('sendBill', ['parameters' => $params]);
            $cdrZip = $response->applicationResponse;
            $result
                ->setCdrResponse($this->extractResponse($cdrZip))
                ->setCdrZip($cdrZip)
                ->setSuccess(true);
        } catch (\SoapFault $e) {
            $error = $this->getErrorFromFault($e);
            // Diagnostico: adjunta la respuesta cruda de SUNAT al mensaje de error
            $raw = $client->getLastResponse();
            if (!empty($raw)) {
                $snippet = mb_substr(preg_replace('/\s+/', ' ', $raw), 0, 1200);
                $error->setMessage(trim($error->getMessage()) . ' | RAW_SUNAT: ' . $snippet);
            }
            $result->setError($error);
        }

        return $result;
    }
}
