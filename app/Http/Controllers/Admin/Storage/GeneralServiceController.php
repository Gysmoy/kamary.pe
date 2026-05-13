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

        $query = parent::setPaginationInstance($model);
        if (request()->boolean('storage_service_types')) {
            $query->whereIn('services.name', array_column(self::STORAGE_SERVICE_TYPES, 'name'))
                ->orderByRaw("CASE services.name WHEN 'Servicio de almacenamiento' THEN 1 WHEN 'Servicio de almacenamiento - Adicional' THEN 2 ELSE 3 END");
        }

        return $query;
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
