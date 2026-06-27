<?php

namespace App\Http\Controllers\Admin;

use App\Http\Classes\dxResponse;
use App\Http\Controllers\BasicController;
use App\Models\Client;
use App\Models\EventualClient;
use App\Models\dxDataGrid;
use Illuminate\Database\Eloquent\Builder as EloquentBuilder;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
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
        $isEventualPath = str_contains($request->path(), 'eventual-clients');
        $initialQuickFilter = $isEventualPath ? 'eventual' : 'all';

        if (($request->query('kind') ?? '') === 'habitual') {
            $initialQuickFilter = 'habitual';
        }

        return [
            'prefixes' => $prefixes,
            'sectionTitle' => $isEventualPath ? 'Cliente eventual' : 'Clientes',
            'defaultClientKind' => $initialQuickFilter === 'eventual' ? 'eventual' : 'regular',
            'requiredPermission' => $isEventualPath ? 'eventual-clients' : 'clients',
            'initialQuickFilter' => $initialQuickFilter,
        ];
    }

    public function paginate(Request $request): HttpResponse|ResponseFactory
    {
        $response = new dxResponse();

        try {
            $instance = $this->buildUnifiedPaginationQuery();
            $clientModuleScope = $this->clientModuleScope();
            if ($clientModuleScope !== null && Schema::hasColumn('clients', 'module_scope')) {
                $instance->where('module_scope', $clientModuleScope);
            }

            if ($request->group != null) {
                [$grouping] = $request->group;
                $selector = $grouping['selector'];
                $instance = $instance->select(DB::raw("{$selector} AS `key`"))->groupBy($selector);
            }

            if ($request->filter) {
                $instance->where(function ($query) use ($request) {
                    dxDataGrid::filter($query, $request->filter ?? [], false, null, []);
                });
            }

            if ($request->group == null) {
                if ($request->sort != null) {
                    foreach ($request->sort as $sorting) {
                        $instance->orderBy($sorting['selector'], $sorting['desc'] ? 'DESC' : 'ASC');
                    }
                } else {
                    $instance->orderBy('entity_id', 'DESC');
                }
            }

            $totalCount = 0;
            if ($request->requireTotalCount) {
                $instance4count = clone $instance;
                if ($instance4count instanceof EloquentBuilder) {
                    $instance4count->getQuery()->groups = null;
                    $instance4count->getQuery()->orders = null;
                } else {
                    $instance4count->groups = null;
                    $instance4count->orders = null;
                }

                if ($request->group != null) {
                    $totalCount = $instance4count->distinct()->count(DB::raw($selector));
                } else {
                    $totalCount = $instance4count->count();
                }
            }

            $rows = $request->isLoadingAll
                ? $instance->get()
                : $instance->skip($request->skip ?? 0)->take($request->take ?? 10)->get();

            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = $rows;
            $response->summary = [];
            $response->totalCount = $totalCount;
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage() . ' Ln.' . $th->getLine();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    private function buildUnifiedPaginationQuery()
    {
        $moduleScopeSelect = $this->clientColumnSelect('module_scope', 'NULL');
        $fiscalAddressSelect = $this->clientColumnSelect('fiscal_address', 'clients.full_address');
        $zoneCodeSelect = $this->clientColumnSelect('zone_code');
        $domicileSelect = $this->clientColumnSelect('domicile');
        $domicileConditionSelect = $this->clientColumnSelect('domicile_condition');
        $interiorSelect = $this->clientColumnSelect('interior');
        $kilometerSelect = $this->clientColumnSelect('kilometer');
        $blockSelect = $this->clientColumnSelect('block');
        $lotSelect = $this->clientColumnSelect('lot');
        $streetNameSelect = $this->clientColumnSelect('street_name');
        $streetTypeSelect = $this->clientColumnSelect('street_type');
        $addressNumberSelect = $this->clientColumnSelect('address_number');
        $zoneTypeSelect = $this->clientColumnSelect('zone_type');
        $apartmentSelect = $this->clientColumnSelect('apartment');
        $departmentSelect = $this->clientColumnSelect('department');
        $provinceSelect = $this->clientColumnSelect('province');
        $districtSelect = $this->clientColumnSelect('district');
        $taxpayerStatusSelect = $this->clientColumnSelect('taxpayer_status');
        $taxLastUpdatedAtSelect = $this->clientColumnSelect('tax_last_updated_at');
        $birthDateSelect = $this->clientColumnSelect('birth_date');
        $secondaryPhoneSelect = $this->clientColumnSelect('secondary_phone');
        $companyRucSelect = $this->clientColumnSelect('company_ruc');
        $positionSelect = $this->clientColumnSelect('position');
        $sexSelect = $this->clientColumnSelect('sex');

        $regularOrders = DB::table('commercial_orders')
            ->selectRaw('client_id AS customer_id, COUNT(*) AS purchase_count, MAX(issue_date) AS last_purchase_at, COALESCE(SUM(total), 0) AS purchase_total')
            ->whereNotNull('client_id')
            ->groupBy('client_id');

        $eventualOrders = DB::table('commercial_orders')
            ->selectRaw('eventual_client_id AS customer_id, COUNT(*) AS purchase_count, MAX(issue_date) AS last_purchase_at, COALESCE(SUM(total), 0) AS purchase_total')
            ->whereNotNull('eventual_client_id')
            ->groupBy('eventual_client_id');

        $storageTariffSelect = Schema::hasColumn('clients', 'storage_tariff_enabled')
            ? 'clients.storage_tariff_enabled'
            : '0';

        $regularQuery = DB::table('clients')
            ->leftJoinSub($regularOrders, 'purchase_summary', function ($join) {
                $join->on('purchase_summary.customer_id', '=', 'clients.id');
            })
            ->leftJoin('users as creator', 'creator.id', '=', 'clients.created_by')
            ->leftJoin('users as updater', 'updater.id', '=', 'clients.updated_by')
            ->whereNotNull('clients.status')
            ->selectRaw(<<<SQL
                CONCAT('client-', clients.id) AS id,
                clients.id AS entity_id,
                'client' AS data_source,
                CASE WHEN clients.client_kind = 'eventual' THEN 'eventual' ELSE 'regular' END AS client_kind,
                {$moduleScopeSelect} AS module_scope,
                clients.document_type,
                clients.document_number,
                clients.full_name,
                NULL AS business_name,
                COALESCE(clients.full_name, '') AS display_name,
                clients.has_storage_service,
                {$storageTariffSelect} AS storage_tariff_enabled,
                clients.contract_due_days,
                clients.commercial_channel,
                clients.segment,
                clients.email,
                clients.billing_email,
                clients.primary_contact,
                clients.primary_contact_phone,
                clients.phone,
                clients.phone_prefix,
                {$birthDateSelect} AS birth_date,
                {$secondaryPhoneSelect} AS secondary_phone,
                {$companyRucSelect} AS company_ruc,
                {$positionSelect} AS position,
                {$sexSelect} AS sex,
                clients.short_code,
                clients.ubigeo,
                clients.full_address,
                {$fiscalAddressSelect} AS fiscal_address,
                {$zoneCodeSelect} AS zone_code,
                {$domicileSelect} AS domicile,
                {$domicileConditionSelect} AS domicile_condition,
                {$interiorSelect} AS interior,
                {$kilometerSelect} AS kilometer,
                {$blockSelect} AS block,
                {$lotSelect} AS lot,
                {$streetNameSelect} AS street_name,
                {$streetTypeSelect} AS street_type,
                {$addressNumberSelect} AS address_number,
                {$zoneTypeSelect} AS zone_type,
                {$apartmentSelect} AS apartment,
                {$departmentSelect} AS department,
                {$provinceSelect} AS province,
                {$districtSelect} AS district,
                {$taxpayerStatusSelect} AS taxpayer_status,
                {$taxLastUpdatedAtSelect} AS tax_last_updated_at,
                clients.full_address AS address,
                clients.primary_contact AS contact_name,
                NULL AS notes,
                clients.status,
                COALESCE(purchase_summary.purchase_count, 0) AS purchase_count,
                purchase_summary.last_purchase_at,
                COALESCE(purchase_summary.purchase_total, 0) AS purchase_total,
                CASE WHEN COALESCE(purchase_summary.purchase_count, 0) >= 3 THEN 1 ELSE 0 END AS is_habitual,
                TRIM(CONCAT(COALESCE(creator.name, ''), ' ', COALESCE(creator.lastname, ''))) AS creator_label,
                TRIM(CONCAT(COALESCE(updater.name, ''), ' ', COALESCE(updater.lastname, ''))) AS updater_label
            SQL);

        $eventualQuery = DB::table('eventual_clients')
            ->leftJoinSub($eventualOrders, 'purchase_summary', function ($join) {
                $join->on('purchase_summary.customer_id', '=', 'eventual_clients.id');
            })
            ->leftJoin('users as creator', 'creator.id', '=', 'eventual_clients.created_by')
            ->leftJoin('users as updater', 'updater.id', '=', 'eventual_clients.updated_by')
            ->whereNotNull('eventual_clients.status')
            ->selectRaw(<<<SQL
                CONCAT('eventual-', eventual_clients.id) AS id,
                eventual_clients.id AS entity_id,
                'eventual_client' AS data_source,
                'eventual' AS client_kind,
                NULL AS module_scope,
                eventual_clients.document_type,
                eventual_clients.document_number,
                NULL AS full_name,
                eventual_clients.business_name,
                COALESCE(eventual_clients.business_name, '') AS display_name,
                0 AS has_storage_service,
                0 AS storage_tariff_enabled,
                NULL AS contract_due_days,
                NULL AS commercial_channel,
                NULL AS segment,
                eventual_clients.email,
                NULL AS billing_email,
                eventual_clients.contact_name AS primary_contact,
                NULL AS primary_contact_phone,
                eventual_clients.phone,
                eventual_clients.phone_prefix,
                NULL AS birth_date,
                NULL AS secondary_phone,
                NULL AS company_ruc,
                NULL AS position,
                NULL AS sex,
                NULL AS short_code,
                NULL AS ubigeo,
                eventual_clients.address AS full_address,
                eventual_clients.address AS fiscal_address,
                NULL AS zone_code,
                NULL AS domicile,
                NULL AS domicile_condition,
                NULL AS interior,
                NULL AS kilometer,
                NULL AS block,
                NULL AS lot,
                NULL AS street_name,
                NULL AS street_type,
                NULL AS address_number,
                NULL AS zone_type,
                NULL AS apartment,
                NULL AS department,
                NULL AS province,
                NULL AS district,
                NULL AS taxpayer_status,
                NULL AS tax_last_updated_at,
                eventual_clients.address,
                eventual_clients.contact_name,
                eventual_clients.notes,
                eventual_clients.status,
                COALESCE(purchase_summary.purchase_count, 0) AS purchase_count,
                purchase_summary.last_purchase_at,
                COALESCE(purchase_summary.purchase_total, 0) AS purchase_total,
                CASE WHEN COALESCE(purchase_summary.purchase_count, 0) >= 3 THEN 1 ELSE 0 END AS is_habitual,
                TRIM(CONCAT(COALESCE(creator.name, ''), ' ', COALESCE(creator.lastname, ''))) AS creator_label,
                TRIM(CONCAT(COALESCE(updater.name, ''), ' ', COALESCE(updater.lastname, ''))) AS updater_label
            SQL);

        return DB::query()->fromSub($regularQuery->unionAll($eventualQuery), 'customer_index');
    }

    private function clientColumnSelect(string $column, string $fallback = 'NULL'): string
    {
        return Schema::hasColumn('clients', $column) ? "clients.{$column}" : $fallback;
    }

    protected function clientModuleScope(): ?string
    {
        return null;
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $userId = Auth::id();
        $id = $body['id'] ?? null;

        $documentType = strtolower(trim((string)($body['document_type'] ?? '')));
        $documentNumber = preg_replace('/\D+/', '', (string)($body['document_number'] ?? ''));
        $clientKind = strtolower(trim((string)($body['client_kind'] ?? 'regular')));
        $moduleScope = Schema::hasColumn('clients', 'module_scope')
            ? (trim((string)($body['module_scope'] ?? ($this->clientModuleScope() ?? 'commercial'))) ?: 'commercial')
            : null;

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
            ->when($moduleScope !== null, fn($query) => $query->where('module_scope', $moduleScope))
            ->when($id, fn($query) => $query->where('id', '!=', $id))
            ->exists();
        if ($exists) {
            throw new \Exception('Ya existe un cliente con este tipo y numero de documento');
        }

        if (!isset($body['id']) || !$body['id']) {
            $body['created_by'] = $userId;
            $body['status'] = $this->toBoolean($body['status'] ?? true);
        }
        if (array_key_exists('status', $body)) {
            $body['status'] = $this->toBoolean($body['status']);
        }
        $body['updated_by'] = $userId;

        $body['document_type'] = $documentType;
        $body['document_number'] = $documentNumber;
        $body['client_kind'] = $clientKind;
        if ($moduleScope !== null) {
            $body['module_scope'] = $moduleScope;
        } else {
            unset($body['module_scope']);
        }
        $body['full_name'] = $fullName !== '' ? $fullName : null;
        $body['has_storage_service'] = $this->toBoolean($body['has_storage_service'] ?? false);
        if (Schema::hasColumn('clients', 'storage_tariff_enabled')) {
            $body['storage_tariff_enabled'] = $this->toBoolean($body['storage_tariff_enabled'] ?? false);
        } else {
            unset($body['storage_tariff_enabled']);
        }
        $body['contract_due_days'] = $this->toNullableInt($body['contract_due_days'] ?? null);
        $body['commercial_channel'] = trim((string)($body['commercial_channel'] ?? '')) ?: null;
        $body['segment'] = trim((string)($body['segment'] ?? '')) ?: null;
        $body['email'] = $this->normalizeEmailList($body['email'] ?? null, 'Correo principal');
        $body['billing_email'] = $this->normalizeEmailList($body['billing_email'] ?? null, 'Correo facturacion');
        $body['primary_contact'] = trim((string)($body['primary_contact'] ?? '')) ?: null;
        $body['primary_contact_phone'] = trim((string)($body['primary_contact_phone'] ?? '')) ?: null;
        $body['phone'] = trim((string)($body['phone'] ?? '')) ?: null;
        $body['phone_prefix'] = trim((string)($body['phone_prefix'] ?? '')) ?: null;
        $patientFields = [
            'birth_date' => trim((string)($body['birth_date'] ?? '')) ?: null,
            'secondary_phone' => trim((string)($body['secondary_phone'] ?? '')) ?: null,
            'company_ruc' => preg_replace('/\D+/', '', (string)($body['company_ruc'] ?? '')) ?: null,
            'position' => trim((string)($body['position'] ?? '')) ?: null,
            'sex' => trim((string)($body['sex'] ?? '')) ?: null,
        ];
        if ($patientFields['birth_date'] !== null && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $patientFields['birth_date'])) {
            throw new \Exception('La fecha de nacimiento no es valida');
        }
        foreach ($patientFields as $field => $value) {
            if (Schema::hasColumn('clients', $field)) {
                $body[$field] = $value;
            } else {
                unset($body[$field]);
            }
        }
        $body['short_code'] = trim((string)($body['short_code'] ?? '')) ?: null;
        $body['ubigeo'] = trim((string)($body['ubigeo'] ?? '')) ?: null;
        $body['full_address'] = trim((string)($body['full_address'] ?? ($body['fiscal_address'] ?? ''))) ?: null;

        foreach ([
            'fiscal_address',
            'zone_code',
            'domicile',
            'domicile_condition',
            'interior',
            'kilometer',
            'block',
            'lot',
            'street_name',
            'street_type',
            'address_number',
            'zone_type',
            'apartment',
            'department',
            'province',
            'district',
            'taxpayer_status',
            'tax_last_updated_at',
        ] as $taxField) {
            if (Schema::hasColumn('clients', $taxField)) {
                $body[$taxField] = trim((string)($body[$taxField] ?? '')) ?: null;
            } else {
                unset($body[$taxField]);
            }
        }

        return $body;
    }

    private function normalizeEmailList(mixed $value, string $label): ?string
    {
        $parts = is_array($value)
            ? $value
            : preg_split('/[,\n;]+/', (string)($value ?? ''));

        $emails = [];
        $seen = [];
        foreach ($parts ?: [] as $part) {
            $email = trim((string)$part);
            if ($email === '') {
                continue;
            }
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw new \Exception("{$label} contiene un correo invalido: {$email}");
            }
            $key = strtolower($email);
            if (isset($seen[$key])) {
                continue;
            }
            $seen[$key] = true;
            $emails[] = $email;
        }

        return count($emails) ? implode(', ', $emails) : null;
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
                ->when(
                    Schema::hasColumn('clients', 'module_scope') && $this->clientModuleScope() !== null,
                    fn($query) => $query->where('module_scope', $this->clientModuleScope())
                )
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
            $department = trim((string)($person['department'] ?? $person['departamento'] ?? '')) ?: null;
            $province = trim((string)($person['province'] ?? $person['provincia'] ?? '')) ?: null;
            $district = trim((string)($person['district'] ?? $person['distrito'] ?? '')) ?: null;

            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = [
                'found' => true,
                'client' => [
                    'document_type' => $documentType,
                    'document_number' => $documentNumber,
                    'full_name' => $fullName,
                    'full_address' => $address,
                    'fiscal_address' => trim((string)($person['fiscal_address'] ?? $person['direccion_fiscal'] ?? '')) ?: $address,
                    'zone_code' => trim((string)($person['zone_code'] ?? $person['codigo_zona'] ?? '')) ?: null,
                    'domicile' => trim((string)($person['domicile'] ?? $person['domicilio'] ?? '')) ?: null,
                    'domicile_condition' => trim((string)($person['domicile_condition'] ?? $person['condicion_domicilio'] ?? '')) ?: null,
                    'interior' => trim((string)($person['interior'] ?? '')) ?: null,
                    'kilometer' => trim((string)($person['kilometer'] ?? $person['kilometro'] ?? '')) ?: null,
                    'block' => trim((string)($person['block'] ?? $person['manzana'] ?? '')) ?: null,
                    'lot' => trim((string)($person['lot'] ?? $person['lote'] ?? '')) ?: null,
                    'street_name' => trim((string)($person['street_name'] ?? $person['nombre_via'] ?? '')) ?: null,
                    'street_type' => trim((string)($person['street_type'] ?? $person['tipo_via'] ?? '')) ?: null,
                    'address_number' => trim((string)($person['address_number'] ?? $person['numero'] ?? '')) ?: null,
                    'zone_type' => trim((string)($person['zone_type'] ?? $person['tipo_zona'] ?? '')) ?: null,
                    'apartment' => trim((string)($person['apartment'] ?? $person['dpto'] ?? '')) ?: null,
                    'department' => $department,
                    'province' => $province,
                    'district' => $district,
                    'taxpayer_status' => trim((string)($person['taxpayer_status'] ?? $person['estado_contribuyente'] ?? '')) ?: null,
                    'tax_last_updated_at' => trim((string)($person['tax_last_updated_at'] ?? $person['ultima_actualizacion'] ?? '')) ?: null,
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

    private function toBoolean($value): bool
    {
        if (is_bool($value)) return $value;
        if (is_numeric($value)) return (int)$value !== 0;

        $normalized = mb_strtolower(trim((string)$value));
        return in_array($normalized, ['1', 'true', 'si', 'yes', 'y', 'activo', 'activa', 'on'], true);
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
