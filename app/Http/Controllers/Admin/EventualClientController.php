<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Http\Classes\dxResponse;
use App\Models\CommercialOrder;
use App\Models\dxDataGrid;
use App\Models\EventualClient;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use SoDe\Extend\File;
use SoDe\Extend\JSON;
use SoDe\Extend\Response;

class EventualClientController extends BasicController
{
    public $model = EventualClient::class;
    public $reactView = 'Admin/EventualClients';
    public $prefix4filter = 'eventual_clients';

    public function setReactViewProperties(Request $request)
    {
        $prefixes = JSON::parse(File::get(storage_path('app/utils/phone_prefixes.json')));

        return [
            'prefixes' => $prefixes,
            'sectionTitle' => 'Clientes Eventuales',
            'requiredPermission' => 'eventual-clients',
        ];
    }

    public function setPaginationInstance(string $model)
    {
        return $model::select('eventual_clients.*')
            ->with([
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ])
            ->leftJoin('users as creator', 'creator.id', '=', 'eventual_clients.created_by')
            ->leftJoin('users as updater', 'updater.id', '=', 'eventual_clients.updated_by');
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $userId = Auth::id();
        $id = $body['id'] ?? null;

        $documentType = strtolower(trim((string)($body['document_type'] ?? '')));
        $documentNumber = preg_replace('/\D+/', '', (string)($body['document_number'] ?? ''));
        $businessName = trim((string)($body['business_name'] ?? ''));

        if (!in_array($documentType, ['dni', 'ce', 'ruc'], true)) {
            throw new \Exception('Tipo de documento invalido');
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
        if ($businessName === '') {
            throw new \Exception('El nombre o razon social es obligatorio');
        }

        $exists = EventualClient::where('document_type', $documentType)
            ->where('document_number', $documentNumber)
            ->when($id, fn($query) => $query->where('id', '!=', $id))
            ->exists();
        if ($exists) {
            throw new \Exception('Ya existe un cliente eventual con este tipo y numero de documento');
        }

        if (!$id) {
            $body['created_by'] = $userId;
            if (!array_key_exists('status', $body)) {
                $body['status'] = true;
            }
        }
        $body['updated_by'] = $userId;
        $body['document_type'] = $documentType;
        $body['document_number'] = $documentNumber;
        $body['business_name'] = $businessName;
        $body['email'] = trim((string)($body['email'] ?? '')) ?: null;
        $body['phone_prefix'] = trim((string)($body['phone_prefix'] ?? '')) ?: null;
        $body['phone'] = trim((string)($body['phone'] ?? '')) ?: null;
        $body['address'] = trim((string)($body['address'] ?? '')) ?: null;
        $body['contact_name'] = trim((string)($body['contact_name'] ?? '')) ?: null;
        $body['notes'] = trim((string)($body['notes'] ?? '')) ?: null;
        if (array_key_exists('status', $body)) {
            $body['status'] = $this->toBoolean($body['status']);
        }

        if (Schema::hasColumn('eventual_clients', 'short_code')) {
            $body['short_code'] = strtoupper(trim((string)($body['short_code'] ?? ''))) ?: null;
        } else {
            unset($body['short_code']);
        }

        if (Schema::hasColumn('eventual_clients', 'contract_due_days')) {
            $contractDueDays = trim((string)($body['contract_due_days'] ?? ''));
            if ($contractDueDays === '') {
                $body['contract_due_days'] = null;
            } else {
                $body['contract_due_days'] = max(0, (int)$contractDueDays);
            }
        } else {
            unset($body['contract_due_days']);
        }

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

            $existing = EventualClient::where('document_type', $documentType)
                ->where('document_number', $documentNumber)
                ->whereNotNull('status')
                ->first();
            if ($existing) {
                throw new \Exception('El cliente eventual ya existe. Seleccionalo de la lista o usa otro documento');
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
                $response->data = ['found' => false, 'client' => null];
                return response($response->toArray(), $response->status);
            }

            $json = $apiResponse->json();
            $person = $json['data'] ?? null;
            if (!$person) {
                $response->status = 200;
                $response->message = 'No se encontro informacion para este documento en el servicio externo';
                $response->data = ['found' => false, 'client' => null];
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
                    'business_name' => $fullName,
                    'address' => $address,
                    'email' => $email,
                    'phone' => $phone,
                    'contact_name' => $documentType === 'dni' ? $fullName : null,
                ]
            ];
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function orders(Request $request, int $id): HttpResponse|ResponseFactory
    {
        $response = new dxResponse();

        try {
            EventualClient::whereKey($id)->whereNotNull('status')->firstOrFail();

            $query = CommercialOrder::query()
                ->select('commercial_orders.*')
                ->selectRaw("COALESCE(NULLIF(businesses.name, ''), '') AS business_label")
                ->selectRaw("COALESCE(NULLIF(TRIM(CONCAT(COALESCE(eventual_clients.document_number, ''), ' | ', COALESCE(eventual_clients.business_name, ''))), '|'), COALESCE(eventual_clients.business_name, ''), '') AS customer_label")
                ->selectRaw("COALESCE(NULLIF(users_seller.fullname, ''), NULLIF(TRIM(CONCAT(COALESCE(users_seller.name, ''), ' ', COALESCE(users_seller.lastname, ''))), ''), users_seller.username, '') AS seller_label")
                ->selectRaw("COALESCE(NULLIF(users_creator.username, ''), NULLIF(users_creator.fullname, ''), NULLIF(TRIM(CONCAT(COALESCE(users_creator.name, ''), ' ', COALESCE(users_creator.lastname, ''))), ''), '') AS creator_label")
                ->selectRaw("TRIM(CONCAT(COALESCE(NULLIF(commercial_orders.payment_method, ''), '-'), CASE WHEN commercial_orders.payment_condition IS NULL OR commercial_orders.payment_condition = '' THEN '' ELSE CONCAT(' [', commercial_orders.payment_condition, ']') END)) AS payment_label")
                ->selectRaw("(SELECT billing_documents.code FROM billing_documents WHERE billing_documents.commercial_order_id = commercial_orders.id AND billing_documents.status IS NOT NULL ORDER BY billing_documents.id DESC LIMIT 1) AS voucher_label")
                ->with([
                    'business:id,name',
                    'eventualClient:id,document_type,document_number,business_name',
                    'seller:id,name,lastname,username,fullname',
                    'creator:id,name,lastname,username,fullname',
                ])
                ->leftJoin('businesses', 'businesses.id', '=', 'commercial_orders.business_id')
                ->leftJoin('eventual_clients', 'eventual_clients.id', '=', 'commercial_orders.eventual_client_id')
                ->leftJoin('users as users_seller', 'users_seller.id', '=', 'commercial_orders.seller_id')
                ->leftJoin('users as users_creator', 'users_creator.id', '=', 'commercial_orders.created_by')
                ->where('commercial_orders.eventual_client_id', $id)
                ->whereNotNull('commercial_orders.status');

            if ($request->filter) {
                dxDataGrid::filter($query, $request->filter ?? [], false, 'commercial_orders', [
                    'business_label',
                    'customer_label',
                    'seller_label',
                    'creator_label',
                    'payment_label',
                    'voucher_label',
                ]);
            }

            $totalCount = 0;
            if ($request->requireTotalCount) {
                $totalCount = (clone $query)->distinct()->count('commercial_orders.id');
            }

            if ($request->sort != null) {
                foreach ($request->sort as $sorting) {
                    $selector = $sorting['selector'];
                    $direction = $sorting['desc'] ? 'DESC' : 'ASC';

                    if (in_array($selector, [
                        'business_label',
                        'customer_label',
                        'seller_label',
                        'creator_label',
                        'payment_label',
                        'voucher_label',
                    ], true)) {
                        $query->orderBy($selector, $direction);
                        continue;
                    }

                    if (!str_contains($selector, '.')) {
                        $selector = "commercial_orders.{$selector}";
                    }
                    $query->orderBy($selector, $direction);
                }
            } else {
                $query->orderBy('commercial_orders.id', 'DESC');
            }

            $orders = $request->isLoadingAll
                ? $query->get()
                : $query->skip($request->skip ?? 0)->take($request->take ?? 10)->get();

            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = $orders;
            $response->totalCount = $totalCount;
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
            $field = $this->allowedBooleanFieldFromRequest($request);
            $data = [];
            $data[$field] = $request->value;
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

    private function toBoolean(mixed $value): bool
    {
        if (is_bool($value)) return $value;
        if (is_numeric($value)) return (int)$value === 1;

        return in_array(strtolower(trim((string)$value)), ['1', 'true', 'on', 'yes', 'activo', 'active'], true);
    }
}
