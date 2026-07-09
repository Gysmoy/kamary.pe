<?php

namespace App\Http\Controllers\Billing\Api;

use App\CoreFacturalo\Helpers\Certificate\GenerateCertificate;
use App\Http\Controllers\Controller;
use App\Models\Billing\Company;
use App\Models\Billing\Configuration;
use App\Models\Billing\SoapType;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class SetupController extends Controller
{
    public function record()
    {
        $company = Company::active();

        if (!$company) {
            return response()->json([
                'success' => false,
                'message' => 'No hay empresa configurada.',
            ], 404);
        }

        return [
            'success' => true,
            'data' => $this->transformCompany($company),
        ];
    }

    public function tables()
    {
        return [
            'success' => true,
            'data' => [
                'soap_types' => SoapType::all(['id', 'description']),
                'soap_sends' => config('tables.system.soap_sends'),
            ],
        ];
    }

    public function store(Request $request)
    {
        $activeCompany = Company::active();
        $requestedId = $request->input('id');

        if ($activeCompany && !empty($requestedId) && (int)$requestedId !== (int)$activeCompany->id) {
            return response()->json([
                'success' => false,
                'message' => 'Modo monoempresa activo: solo se puede actualizar la empresa principal.',
            ], 422);
        }

        $company = $activeCompany ?: null;

        $creating = !$company;
        $ignoreId = $company ? $company->id : null;

        $validator = Validator::make($request->all(), [
            'id' => ['nullable', 'integer'],
            'identity_document_type_id' => [
                $creating ? 'required' : 'sometimes',
                'string',
                Rule::exists('cat_identity_document_types', 'id'),
            ],
            'number' => [
                $creating ? 'required' : 'sometimes',
                'string',
                'max:20',
                Rule::unique('companies', 'number')->ignore($ignoreId),
            ],
            'name' => [
                $creating ? 'required' : 'sometimes',
                'string',
                'max:255',
                Rule::unique('companies', 'name')->ignore($ignoreId),
            ],
            'trade_name' => [
                $creating ? 'required' : 'sometimes',
                'string',
                'max:255',
                Rule::unique('companies', 'trade_name')->ignore($ignoreId),
            ],
            'soap_send_id' => [
                'nullable',
                'string',
                Rule::in(['01', '02']),
            ],
            'soap_type_id' => [
                $creating ? 'required' : 'sometimes',
                'string',
                Rule::exists('soap_types', 'id'),
            ],
            'soap_username' => [
                'nullable',
                'string',
                'max:255',
            ],
            'soap_password' => [
                'nullable',
                'string',
                'max:255',
            ],
            'soap_url' => [
                'nullable',
                'string',
                'max:255',
            ],
            'certificate_due' => [
                'nullable',
                'date',
            ],
            'detraction_account' => [
                'nullable',
                'string',
                'max:255',
            ],
            'operation_amazonia' => [
                'nullable',
                'boolean',
            ],
            'send_document_to_pse' => [
                'nullable',
                'boolean',
            ],
            'url_signature_pse' => [
                'nullable',
                'string',
                'max:255',
            ],
            'url_send_cdr_pse' => [
                'nullable',
                'string',
                'max:255',
            ],
            'client_id_pse' => [
                'nullable',
                'string',
                'max:255',
            ],
            'integrated_query_client_id' => [
                'nullable',
                'string',
                'max:255',
            ],
            'integrated_query_client_secret' => [
                'nullable',
                'string',
                'max:255',
            ],
        ]);

        $validator->after(function ($validator) use ($request, $company) {
            $soapTypeId = $request->input('soap_type_id', $company ? $company->soap_type_id : null);
            $soapSendId = $request->input('soap_send_id', $company ? $company->soap_send_id : null);

            if (in_array((string)$soapTypeId, ['02'], true) || in_array((string)$soapSendId, ['02'], true)) {
                $soapUsername = $request->input('soap_username', $company ? $company->soap_username : null);
                $soapPassword = $request->input('soap_password', $company ? $company->soap_password : null);

                if (empty($soapUsername)) {
                    $validator->errors()->add('soap_username', 'Este campo es obligatorio para produccion u OSE.');
                }

                if (empty($soapPassword)) {
                    $validator->errors()->add('soap_password', 'Este campo es obligatorio para produccion u OSE.');
                }
            }

            // Request::boolean() no existe en Laravel 5.7
            $sendDocumentToPse = $request->has('send_document_to_pse')
                ? filter_var($request->input('send_document_to_pse'), FILTER_VALIDATE_BOOLEAN)
                : (bool)($company ? $company->send_document_to_pse : false);
            if (!$sendDocumentToPse) {
                return;
            }

            $requiredFields = [
                'url_signature_pse',
                'url_send_cdr_pse',
                'client_id_pse',
            ];

            foreach ($requiredFields as $field) {
                $value = $request->input($field, $company ? $company->{$field} : null);
                if (empty($value)) {
                    $validator->errors()->add($field, 'Este campo es obligatorio cuando send_document_to_pse es true.');
                }
            }
        });

        $validated = $validator->validate();

        if (!$company) {
            $company = new Company();
        }

        $fields = [
            'identity_document_type_id',
            'number',
            'name',
            'trade_name',
            'soap_send_id',
            'soap_type_id',
            'soap_username',
            'soap_password',
            'soap_url',
            'certificate_due',
            'detraction_account',
            'operation_amazonia',
            'send_document_to_pse',
            'url_signature_pse',
            'url_send_cdr_pse',
            'client_id_pse',
            'integrated_query_client_id',
            'integrated_query_client_secret',
        ];

        foreach ($fields as $field) {
            if (array_key_exists($field, $validated)) {
                $company->{$field} = $validated[$field];
            }
        }

        if (empty($company->soap_send_id)) {
            $company->soap_send_id = '01';
        }

        $company->save();

        return [
            'success' => true,
            'message' => 'Empresa guardada correctamente.',
            'data' => $this->transformCompany($company),
        ];
    }

    public function uploadLogo(Request $request)
    {
        $company = Company::active();
        if (!$company) {
            return response()->json([
                'success' => false,
                'message' => 'Primero configure la empresa.',
            ], 422);
        }

        Validator::make($request->all(), [
            'file' => 'required|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ])->validate();

        $file = $request->file('file');
        $extension = strtolower((string)$file->getClientOriginalExtension());
        $companyNumber = $this->safeCompanyNumber($company);
        $name = 'logo_' . $companyNumber . '.' . $extension;

        if (!empty($company->logo) && $company->logo !== $name) {
            $oldPath = storage_path('app' . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'logos' . DIRECTORY_SEPARATOR . $company->logo);
            if (file_exists($oldPath)) {
                @unlink($oldPath);
            }
        }

        $file->storeAs('public/uploads/logos', $name);
        $company->logo = $name;
        $company->save();

        return [
            'success' => true,
            'message' => 'Logo cargado correctamente.',
            'data' => [
                'logo' => $company->logo,
                'logo_url' => $this->logoUrl($company->logo),
            ],
        ];
    }

    public function uploadCertificate(Request $request)
    {
        $company = Company::active();
        if (!$company) {
            return response()->json([
                'success' => false,
                'message' => 'Primero configure la empresa.',
            ], 422);
        }

        Validator::make($request->all(), [
            'file' => 'required|file|max:5120',
            'password' => 'required|string|max:255',
        ])->validate();

        $file = $request->file('file');
        $password = (string)$request->input('password');
        $extension = strtolower((string)$file->getClientOriginalExtension());

        if (!in_array($extension, ['pfx', 'p12'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Formato invalido. Solo se permite .pfx o .p12',
            ], 422);
        }

        try {
            $pfx = file_get_contents($file->getRealPath());
            $pem = GenerateCertificate::typePEM($pfx, $password);

            $path = storage_path('app' . DIRECTORY_SEPARATOR . 'certificates');
            if (!file_exists($path)) {
                mkdir($path, 0755, true);
            }

            $name = 'certificate_' . $this->safeCompanyNumber($company) . '.pem';
            file_put_contents($path . DIRECTORY_SEPARATOR . $name, $pem);

            $company->certificate = $name;
            $company->save();

            return [
                'success' => true,
                'message' => 'Certificado cargado correctamente.',
                'data' => [
                    'certificate' => $company->certificate,
                    'has_certificate' => true,
                ],
            ];
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'No se pudo procesar el certificado.',
            ], 422);
        }
    }

    public function destroyCertificate()
    {
        $company = Company::active();
        if (!$company) {
            return response()->json([
                'success' => false,
                'message' => 'No hay empresa configurada.',
            ], 404);
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
            'data' => [
                'certificate' => null,
                'has_certificate' => false,
            ],
        ];
    }

    private function transformCompany(Company $company): array
    {
        $configuration = Configuration::first();

        return [
            'id' => (int)$company->id,
            'identity_document_type_id' => $company->identity_document_type_id,
            'number' => $company->number,
            'name' => $company->name,
            'trade_name' => $company->trade_name,
            'soap_send_id' => $company->soap_send_id,
            'soap_type_id' => $company->soap_type_id,
            'soap_username' => $company->soap_username,
            'soap_password' => $company->soap_password,
            'soap_url' => $company->soap_url,
            'detraction_account' => $company->detraction_account,
            'operation_amazonia' => (bool)$company->operation_amazonia,
            'certificate' => $company->certificate,
            'certificate_due' => $company->certificate_due,
            'has_certificate' => !empty($company->certificate),
            'logo' => $company->logo,
            'logo_url' => $this->logoUrl($company->logo),
            'send_document_to_pse' => (bool)$company->send_document_to_pse,
            'url_signature_pse' => $company->url_signature_pse,
            'url_send_cdr_pse' => $company->url_send_cdr_pse,
            'client_id_pse' => $company->client_id_pse,
            'integrated_query_client_id' => $company->integrated_query_client_id,
            'integrated_query_client_secret' => $company->integrated_query_client_secret,
            'config_system_env' => $configuration ? (bool)$configuration->config_system_env : false,
            'api_mode' => $this->resolveApiMode($company->soap_type_id),
        ];
    }

    private function resolveApiMode($soapTypeId): string
    {
        if ((string)$soapTypeId === '01') {
            return 'demo';
        }

        if ((string)$soapTypeId === '03') {
            return 'ose';
        }

        return 'production';
    }

    private function safeCompanyNumber(Company $company): string
    {
        $raw = (string)$company->number;
        $safe = preg_replace('/[^A-Za-z0-9_-]/', '', $raw);

        return $safe !== '' ? $safe : (string)$company->id;
    }

    private function logoUrl($logo): ?string
    {
        if (empty($logo)) {
            return null;
        }

        return asset('storage/uploads/logos/' . $logo);
    }
}
