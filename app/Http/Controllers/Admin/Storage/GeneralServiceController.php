<?php

namespace App\Http\Controllers\Admin\Storage;

use App\Http\Controllers\Admin\ServiceCatalogController as BaseServiceCatalogController;
use App\Models\ServiceCatalog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class GeneralServiceController extends BaseServiceCatalogController
{
    private const STORAGE_SERVICE_TYPES = [
        [
            'code' => 'STORAGE-SERVICE',
            'name' => 'Servicio de almacenamiento',
        ],
        [
            'code' => 'STORAGE-SERVICE-ADD',
            'name' => 'Servicio de almacenamiento - Adicional',
        ],
    ];

    public function setReactViewProperties(Request $request)
    {
        return [
            'moduleTitle' => 'Serv. Almacenamiento - Servicio General',
            'requiredPermission' => 'storage-general-service',
            'serviceScope' => $this->serviceScope(),
        ];
    }

    protected function serviceScope(): string
    {
        return 'storage_general';
    }

    public function setPaginationInstance(string $model)
    {
        $this->ensureStorageServiceTypes();

        $query = ServiceCatalog::query()
            ->from('services')
            ->leftJoin('users as creator', 'creator.id', '=', 'services.created_by')
            ->selectRaw("
                services.*,
                COALESCE(NULLIF(creator.fullname, ''), NULLIF(TRIM(CONCAT(COALESCE(creator.name, ''), ' ', COALESCE(creator.lastname, ''))), ''), creator.username, '') as creator_label
            ");

        if (Schema::hasColumn('services', 'service_scope')) {
            $query->where('services.service_scope', $this->serviceScope());
        }

        if (request()->boolean('storage_service_types')) {
            $query->whereIn('services.name', array_column(self::STORAGE_SERVICE_TYPES, 'name'))
                ->orderByRaw("CASE services.name WHEN 'Servicio de almacenamiento' THEN 1 WHEN 'Servicio de almacenamiento - Adicional' THEN 2 ELSE 3 END");
        }

        return $query;
    }

    public function beforeSave(Request $request)
    {
        $code = trim((string) $request->input('code'));
        if ($code === '') {
            $code = $this->nextStorageServiceCode();
        }

        $isActive = $this->toBoolean($request->input('status', true));
        $request->merge([
            'code' => $code,
            'category' => trim((string) $request->input('category', 'General')) ?: 'General',
            'subcategory' => trim((string) $request->input('subcategory', '')) ?: null,
            'service_type' => trim((string) $request->input('service_type', 'General')) ?: 'General',
            'billing_unit' => trim((string) $request->input('billing_unit', 'Servicio')) ?: 'Servicio',
            'unit_price_usd' => $request->input('unit_price_usd', 0),
            'observations' => trim((string) $request->input('observations', $request->input('description', ''))),
            'status' => $isActive,
        ]);

        $body = parent::beforeSave($request);
        $body['status'] = $isActive;

        return $body;
    }

    private function nextStorageServiceCode(): string
    {
        $next = ServiceCatalog::query()
            ->when(Schema::hasColumn('services', 'service_scope'), fn($query) => $query->where('service_scope', $this->serviceScope()))
            ->count() + 1;

        do {
            $code = 'STORAGE-SER-' . str_pad((string) $next, 6, '0', STR_PAD_LEFT);
            $next++;
        } while (ServiceCatalog::query()->where('code', $code)->exists());

        return $code;
    }

    private function toBoolean($value): bool
    {
        if (is_bool($value)) return $value;
        if (is_numeric($value)) return (int) $value !== 0;
        return in_array(mb_strtolower(trim((string) $value)), ['1', 'true', 'si', 'yes', 'on', 'activo'], true);
    }

    private function ensureStorageServiceTypes(): void
    {
        if (!Schema::hasTable('services')) return;

        $hasServiceScope = Schema::hasColumn('services', 'service_scope');

        foreach (self::STORAGE_SERVICE_TYPES as $serviceType) {
            $service = ServiceCatalog::query()
                ->where('code', $serviceType['code'])
                ->first();

            if (!$service) {
                $service = ServiceCatalog::query()
                    ->when($hasServiceScope, fn($query) => $query->where('service_scope', $this->serviceScope()))
                    ->whereRaw('LOWER(name) = ?', [mb_strtolower($serviceType['name'])])
                    ->first();
            }

            if (!$service) {
                $service = new ServiceCatalog();
                $service->code = $serviceType['code'];
            }

            if ($hasServiceScope) {
                $service->service_scope = $this->serviceScope();
            }
            $service->name = $serviceType['name'];
            $service->category = $service->category ?: 'Almacenamiento';
            $service->subcategory = $service->subcategory ?: null;
            $service->service_type = $service->service_type ?: 'Almacenamiento';
            $service->billing_unit = $service->billing_unit ?: 'Mes';
            $service->unit_price_pen = $service->unit_price_pen ?? 0;
            $service->unit_price_usd = $service->unit_price_usd ?? 0;
            $service->applicable_zone = $service->applicable_zone ?: null;
            $service->linked_vehicle_type = $service->linked_vehicle_type ?: null;
            $service->commissions_enabled = $service->commissions_enabled ?? false;
            $service->observations = $service->observations ?: 'Tipo de servicio para ordenes de almacenamiento';
            $service->status = true;
            $service->save();
        }
    }
}
