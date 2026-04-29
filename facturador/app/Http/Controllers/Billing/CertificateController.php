<?php

namespace App\Http\Controllers\Billing;

use App\CoreFacturalo\Helpers\Certificate\GenerateCertificate;
use App\Http\Controllers\Controller;
use App\Models\Billing\Company;
use App\Models\Billing\Configuration;
use Exception;
use Illuminate\Http\Request;

class CertificateController extends Controller
{
    public function record()
    {
        $company = Company::active();
        $configuration = Configuration::first();

        return [
            'certificate' => $company ? $company->certificate : null,
            'config_system_env' => $configuration ? (bool)$configuration->config_system_env : false,
        ];
    }

    public function uploadFile(Request $request)
    {
        if (!$request->hasFile('file')) {
            return [
                'success' => false,
                'message' => 'No se recibió archivo.',
            ];
        }

        $password = (string)$request->input('password', '');
        $file = $request->file('file');
        $extension = strtolower((string)$file->getClientOriginalExtension());

        if (!in_array($extension, ['pfx', 'p12'], true)) {
            return [
                'success' => false,
                'message' => 'Formato no válido. Sube un certificado .pfx o .p12. El archivo .crt no incluye clave privada.',
            ];
        }

        if ($password === '') {
            return [
                'success' => false,
                'message' => 'Debe ingresar la contraseña del certificado.',
            ];
        }

        try {
            $company = Company::active();
            if (!$company) {
                return [
                    'success' => false,
                    'message' => 'No existe empresa activa para asignar certificado.',
                ];
            }

            $pfx = file_get_contents($file->getRealPath());
            $pem = GenerateCertificate::typePEM($pfx, $password);

            $path = storage_path('app' . DIRECTORY_SEPARATOR . 'certificates');
            if (!file_exists($path)) {
                mkdir($path, 0755, true);
            }

            $name = 'certificate_' . $company->number . '.pem';
            file_put_contents($path . DIRECTORY_SEPARATOR . $name, $pem);

            $company->certificate = $name;
            $company->save();

            return [
                'success' => true,
                'message' => 'Certificado cargado correctamente.',
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage() ?: 'No se pudo procesar el certificado.',
            ];
        }
    }

    public function destroy()
    {
        $company = Company::active();
        if (!$company) {
            return [
                'success' => false,
                'message' => 'No existe empresa activa.',
            ];
        }

        if (!empty($company->certificate)) {
            $certificatePath = storage_path('app' . DIRECTORY_SEPARATOR . 'certificates' . DIRECTORY_SEPARATOR . $company->certificate);
            if (file_exists($certificatePath)) {
                @unlink($certificatePath);
            }
        }

        $company->certificate = null;
        $company->save();

        return [
            'success' => true,
            'message' => 'Certificado eliminado correctamente.',
        ];
    }
}

