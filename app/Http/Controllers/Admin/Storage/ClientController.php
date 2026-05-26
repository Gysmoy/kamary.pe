<?php

namespace App\Http\Controllers\Admin\Storage;

use App\Http\Controllers\Admin\ClientController as BaseClientController;
use App\Http\Classes\dxResponse;
use App\Models\MailingTemplate;
use App\Models\dxDataGrid;
use App\Support\StorageScope;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use SoDe\Extend\Response;

class ClientController extends BaseClientController
{
    protected function clientModuleScope(): ?string
    {
        return 'storage';
    }

    public function setReactViewProperties(Request $request)
    {
        return array_merge(parent::setReactViewProperties($request), [
            'sectionTitle' => 'Clientes de almacenamiento',
            'requiredPermission' => 'storage-clients',
            'defaultClientKind' => 'regular',
            'initialQuickFilter' => 'all',
            'storageContext' => true,
            'storageNotificationOptions' => $this->notificationOptions(),
        ]);
    }

    public function beforeSave(Request $request)
    {
        $request->merge([
            'client_kind' => 'regular',
            'module_scope' => 'storage',
            'has_storage_service' => true,
        ]);

        return parent::beforeSave($request);
    }

    public function paginate(Request $request): HttpResponse|ResponseFactory
    {
        $response = new dxResponse();

        try {
            $instance = $this->buildStorageClientsQuery();

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
                $instance4count->groups = null;
                $instance4count->orders = null;

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

    public function boolean(Request $request)
    {
        $response = new Response();
        try {
            $data = [];
            $data[$request->field] = $request->value;
            $data['updated_by'] = Auth::id();

            $updated = $this->storageClientMutationQuery($request->id)->update($data);
            if (!$updated) throw new \Exception('Cliente no encontrado en almacenamiento');

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
            $updated = $this->storageClientMutationQuery($request->id)->update([
                'status' => $request->status ? 0 : 1,
                'updated_by' => Auth::id(),
            ]);
            if (!$updated) throw new \Exception('Cliente no encontrado en almacenamiento');

            $response->status = 200;
            $response->message = 'Operacion correcta';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function delete(Request $request, string $id)
    {
        $response = new Response();
        try {
            $updated = $this->storageClientMutationQuery($id)->update([
                'status' => null,
                'updated_by' => Auth::id(),
            ]);
            if (!$updated) throw new \Exception('No se ha eliminado ningun registro');

            $response->status = 200;
            $response->message = 'Operacion correcta';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    private function storageClientMutationQuery($id)
    {
        return StorageScope::clientQuery()->where($this->identifier, $id);
    }

    private function buildStorageClientsQuery()
    {
        $moduleScopeSelect = $this->clientColumnSelect('module_scope', "'storage'");
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
        $storageTariffSelect = $this->clientColumnSelect('storage_tariff_enabled', '0');

        $clients = DB::table('clients')
            ->leftJoin('users as creator', 'creator.id', '=', 'clients.created_by')
            ->leftJoin('users as updater', 'updater.id', '=', 'clients.updated_by')
            ->whereNotNull('clients.status')
            ->when(Schema::hasColumn('clients', 'module_scope'), function ($query) {
                $query->where('clients.module_scope', 'storage');
            }, function ($query) {
                if (Schema::hasColumn('clients', 'has_storage_service')) {
                    $query->where('clients.has_storage_service', true);
                }
            })
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
                clients.is_platform,
                1 AS has_storage_service,
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
                0 AS purchase_count,
                NULL AS last_purchase_at,
                0 AS purchase_total,
                0 AS is_habitual,
                TRIM(CONCAT(COALESCE(creator.name, ''), ' ', COALESCE(creator.lastname, ''))) AS creator_label,
                TRIM(CONCAT(COALESCE(updater.name, ''), ' ', COALESCE(updater.lastname, ''))) AS updater_label
            SQL);

        return DB::query()->fromSub($clients, 'storage_clients');
    }

    private function clientColumnSelect(string $column, string $fallback = 'NULL'): string
    {
        return Schema::hasColumn('clients', $column) ? "clients.{$column}" : $fallback;
    }

    private function notificationOptions(): array
    {
        $options = [
            [
                'value' => 'storage_invoice_notification',
                'label' => 'Notificación de Envío de Facturas a los Clientes - Kamary medical',
            ],
            [
                'value' => 'storage_sample_order_registration',
                'label' => 'Notificación de registro de pedidos muestra',
            ],
        ];

        if (!Schema::hasTable('mailing_templates')) {
            return $options;
        }

        $templates = MailingTemplate::query()
            ->where('status', true)
            ->orderBy('name')
            ->get(['id', 'name', 'caption']);

        $labels = collect($options)->pluck('label')->map(fn($label) => strtolower($label))->all();

        foreach ($templates as $template) {
            $label = $template->caption ?: $template->name;
            if (!$label || in_array(strtolower($label), $labels, true)) {
                continue;
            }

            $options[] = [
                'value' => $template->id,
                'label' => $label,
            ];
            $labels[] = strtolower($label);
        }

        return $options;
    }
}
