<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use SoDe\Extend\File;
use SoDe\Extend\JSON;
use SoDe\Extend\Response;

class ClientController extends BasicController
{
    public $model = Client::class;
    public $reactView = 'Admin/Clients';
    public $prefix4filter = 'clients';

    public function setReactViewProperties(Request $request)
    {
        $prefixes = JSON::parse(File::get(storage_path('app/utils/phone_prefixes.json')));
        $isEventualClients = str_contains($request->path(), 'eventual-clients');

        return [
            'prefixes' => $prefixes,
            'sectionTitle' => $isEventualClients ? 'Clientes Eventuales' : 'Clientes',
            'defaultClientKind' => $isEventualClients ? 'eventual' : 'regular',
            'requiredPermission' => $isEventualClients ? 'eventual-clients' : 'clients',
            'filterValue' => ['client_kind', '=', $isEventualClients ? 'eventual' : 'regular'],
        ];
    }

    public function setPaginationInstance(string $model)
    {
        return $model::select('clients.*')
            ->with([
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ])
            ->join('users as creator', 'creator.id', '=', 'clients.created_by')
            ->join('users as updater', 'updater.id', '=', 'clients.updated_by');
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $userId = Auth::id();
        $id = $body['id'] ?? null;

        $documentType = strtolower(trim((string)($body['document_type'] ?? '')));
        $documentNumber = preg_replace('/\D+/', '', (string)($body['document_number'] ?? ''));
        $clientKind = strtolower(trim((string)($body['client_kind'] ?? 'regular')));

        if (!in_array($documentType, ['dni', 'ce', 'ruc'], true)) {
            throw new \Exception('Tipo de documento invalido');
        }
        if (!in_array($clientKind, ['regular', 'eventual'], true)) {
            throw new \Exception('Tipo de cliente invalido');
        }

        if ($documentType === 'dni' && strlen($documentNumber) !== 8) {
            throw new \Exception('El DNI debe tener 8 digitos');
        }
        if ($documentType === 'ruc' && strlen($documentNumber) !== 11) {
            throw new \Exception('El RUC debe tener 11 digitos');
        }
        if ($documentType === 'ce' && strlen($documentNumber) < 6) {
            throw new \Exception('El carnet de extranjeria debe tener al menos 6 digitos');
        }

        $fullName = trim((string)($body['full_name'] ?? ''));
        if ($fullName === '') {
            throw new \Exception('El nombre completo o razon social es obligatorio');
        }

        $exists = Client::where('document_type', $documentType)
            ->where('document_number', $documentNumber)
            ->when($id, fn($query) => $query->where('id', '!=', $id))
            ->exists();
        if ($exists) {
            throw new \Exception('Ya existe un cliente con este tipo y numero de documento');
        }

        if (!isset($body['id']) || !$body['id']) {
            $body['created_by'] = $userId;
            $body['status'] = true;
        }
        $body['updated_by'] = $userId;

        $body['document_type'] = $documentType;
        $body['document_number'] = $documentNumber;
        $body['client_kind'] = $clientKind;
        $body['full_name'] = $fullName !== '' ? $fullName : null;
        $body['is_platform'] = $this->toBoolean($body['is_platform'] ?? false);
        $body['has_storage_service'] = $this->toBoolean($body['has_storage_service'] ?? false);
        $body['contract_due_days'] = $this->toNullableInt($body['contract_due_days'] ?? null);
        $body['commercial_channel'] = trim((string)($body['commercial_channel'] ?? '')) ?: null;
        $body['segment'] = trim((string)($body['segment'] ?? '')) ?: null;
        $body['email'] = trim((string)($body['email'] ?? '')) ?: null;
        $body['billing_email'] = trim((string)($body['billing_email'] ?? '')) ?: null;
        $body['primary_contact'] = trim((string)($body['primary_contact'] ?? '')) ?: null;
        $body['primary_contact_phone'] = trim((string)($body['primary_contact_phone'] ?? '')) ?: null;
        $body['phone'] = trim((string)($body['phone'] ?? '')) ?: null;
        $body['phone_prefix'] = trim((string)($body['phone_prefix'] ?? '')) ?: null;
        $body['short_code'] = trim((string)($body['short_code'] ?? '')) ?: null;
        $body['ubigeo'] = trim((string)($body['ubigeo'] ?? '')) ?: null;
        $body['full_address'] = trim((string)($body['full_address'] ?? '')) ?: null;

        return $body;
    }

    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        return $jpa;
    }

    public function lookupByDocument(Request $request, string $type, string $number): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            $documentType = strtolower(trim((string)$type));
            $documentNumber = preg_replace('/\D+/', '', (string)$number);

            if (!in_array($documentType, ['dni', 'ruc'], true)) {
                throw new \Exception('Solo se permite consulta para DNI o RUC');
            }
            if ($documentType === 'dni' && strlen($documentNumber) !== 8) {
                throw new \Exception('El DNI debe tener 8 digitos');
            }
            if ($documentType === 'ruc' && strlen($documentNumber) !== 11) {
                throw new \Exception('El RUC debe tener 11 digitos');
            }

            $existing = Client::where('document_type', $documentType)
                ->where('document_number', $documentNumber)
                ->whereNotNull('status')
                ->first();
            if ($existing) {
                throw new \Exception('El cliente ya existe. Seleccionalo de la lista o usa otro documento');
            }

            $token = env('DEVEX_PEOPLE_API_TOKEN');
            if (!$token) {
                throw new \Exception('No se ha configurado DEVEX_PEOPLE_API_TOKEN en .env');
            }

            $baseUrl = rtrim(env('DEVEX_PEOPLE_API_BASE_URL', 'https://devex.pe/client-api/people'), '/');
            $url = "{$baseUrl}/{$documentType}/{$documentNumber}";

            $apiResponse = Http::acceptJson()
                ->withToken($token)
                ->timeout(15)
                ->get($url);

            if (!$apiResponse->ok()) {
                $response->status = 200;
                $response->message = 'No se encontro informacion para este documento en el servicio externo';
                $response->data = [
                    'found' => false,
                    'client' => null,
                ];
                return response($response->toArray(), $response->status);
            }

            $json = $apiResponse->json();
            $person = $json['data'] ?? null;
            if (!$person) {
                $response->status = 200;
                $response->message = 'No se encontro informacion para este documento en el servicio externo';
                $response->data = [
                    'found' => false,
                    'client' => null,
                ];
                return response($response->toArray(), $response->status);
            }

            $fullName = trim((string)($person['fullname'] ?? $person['name'] ?? ''));
            $address = trim((string)($person['full_address'] ?? $person['address'] ?? '')) ?: null;
            $email = trim((string)($person['email'] ?? '')) ?: null;
            $phone = trim((string)($person['phone'] ?? '')) ?: null;

            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = [
                'found' => true,
                'client' => [
                    'document_type' => $documentType,
                    'document_number' => $documentNumber,
                    'full_name' => $fullName,
                    'full_address' => $address,
                    'email' => $email,
                    'phone' => $phone,
                ]
            ];
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function boolean(Request $request)
    {
        $response = new Response();
        try {
            $data = [];
            $data[$request->field] = $request->value;
            $data['updated_by'] = Auth::id();
            $this->model::where($this->identifier, $request->id)->update($data);
            $response->status = 200;
            $response->message = 'Operacion correcta';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function status(Request $request)
    {
        $response = new Response();
        try {
            $this->model::where($this->identifier, $request->id)->update([
                'status' => $request->status ? 0 : 1,
                'updated_by' => Auth::id(),
            ]);
            $response->status = 200;
            $response->message = 'Operacion correcta';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    private function toBoolean($value): bool
    {
        if (is_bool($value)) return $value;
        if (is_numeric($value)) return (int)$value !== 0;

        $normalized = mb_strtolower(trim((string)$value));
        return in_array($normalized, ['1', 'true', 'si', 'sí', 'yes', 'y', 'activo', 'activa', 'on'], true);
    }

    private function toNullableInt($value): ?int
    {
        if ($value === null) return null;
        $text = trim((string)$value);
        if ($text === '') return null;
        if (!is_numeric($text)) throw new \Exception("Valor numerico invalido: {$value}");

        $number = (int)$text;
        if ($number < 0) {
            throw new \Exception('Los dias de vencimiento no pueden ser negativos');
        }

        return $number;
    }
}
