<?php

namespace App\CoreFacturalo\WS\Client;

use SoapClient;

class WsClient
{
    private $client;

    /**
     * SoapClient constructor.
     *
     * @param string $wsdl       Url of WSDL
     * @param array  $parameters Soap's parameters
     */
    public function __construct($wsdl = '', $parameters = [])
    {
        if (empty($wsdl)) {
            $wsdl = __DIR__.DIRECTORY_SEPARATOR.'Resources'.
                            DIRECTORY_SEPARATOR.'wsdl'.
                            DIRECTORY_SEPARATOR.'billService.wsdl';
        }else if($wsdl === 'consultCdrStatus'){
            $wsdl = __DIR__.DIRECTORY_SEPARATOR.'Resources'.
                            DIRECTORY_SEPARATOR.'wsdl'.
                            DIRECTORY_SEPARATOR.'billConsultService.wsdl';
        }


        if(config('tenant.soap_stream_context_ssl'))
        {
            $parameters['stream_context'] = stream_context_create([
                                                'ssl' => [
                                                    'verify_peer' => false,
                                                    'verify_peer_name' => false,
                                                ],
                                            ]);
        }

        // Diagnostico: habilita traza para capturar la respuesta cruda de SUNAT ante faults
        $parameters['trace'] = 1;

        $this->client = new SoapClient($wsdl, $parameters);
    }

    /**
     * @return string|null Ultima respuesta SOAP cruda (para diagnostico de faults SUNAT).
     */
    public function getLastResponse()
    {
        try {
            return $this->client->__getLastResponse();
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * @param $user
     * @param $password
     */
    public function setCredentials($user, $password)
    {
        $this->client->__setSoapHeaders(new WsSecurityHeader($user, $password));
    }

    /**
     * Set Url of Service.
     *
     * @param string $url
     */
    public function setService($url)
    {
        $this->client->__setLocation($url);
    }

    /**
     * @param $function
     * @param $arguments
     *
     * @return mixed
     */
    public function call($function, $arguments)
    {
        return $this->client->__soapCall($function, $arguments);
    }
}
