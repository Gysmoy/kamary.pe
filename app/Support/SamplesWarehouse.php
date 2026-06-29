<?php

namespace App\Support;

use App\Models\Business;
use App\Models\BusinessBranch;
use App\Models\Warehouse;
use Illuminate\Database\Eloquent\Builder;
use RuntimeException;

/**
 * Resuelve el almacen fijo del modulo Muestras (analogo a MagistralesWarehouse).
 * El modulo Muestras consume stock UNICAMENTE de este almacen.
 */
class SamplesWarehouse
{
    public const WAREHOUSE_NAME = 'Almacen Muestras';

    public static function warehouse(): Warehouse
    {
        $configuredId = self::configuredWarehouseId();
        if ($configuredId) {
            $warehouse = self::scopedQuery()->whereKey($configuredId)->first();
            if ($warehouse) return $warehouse;
        }

        $configuredName = self::configuredWarehouseName();
        if ($configuredName !== '') {
            $warehouse = self::scopedQuery()
                ->whereRaw('LOWER(warehouses.name) = ?', [mb_strtolower($configuredName)])
                ->first();
            if ($warehouse) return $warehouse;
        }

        $warehouse = self::scopedQuery()
            ->where(function (Builder $query) {
                $query
                    ->whereRaw('LOWER(warehouses.name) like ?', ['%muestra%'])
                    ->orWhereRaw("LOWER(COALESCE(warehouses.description, '')) like ?", ['%muestra%']);
            })
            ->orderBy('warehouses.id')
            ->first();
        if ($warehouse) return $warehouse;

        $warehouse = self::ensureWarehouse();
        if ($warehouse) return $warehouse;

        throw new RuntimeException(
            'No se pudo resolver el almacen fijo de Muestras. Configura SAMPLES_DEFAULT_WAREHOUSE_ID o SAMPLES_DEFAULT_WAREHOUSE_NAME.'
        );
    }

    public static function id(): int
    {
        return (int) self::warehouse()->id;
    }

    public static function idOrNull(): ?int
    {
        try {
            return self::id();
        } catch (\Throwable $th) {
            return null;
        }
    }

    public static function isFixedWarehouseId($id): bool
    {
        $warehouseId = self::idOrNull();
        if (!$warehouseId) return false;

        return (int) $id === $warehouseId;
    }

    public static function summary(): array
    {
        try {
            $warehouse = self::warehouse();
        } catch (\Throwable $th) {
            return [
                'id' => null,
                'name' => self::configuredWarehouseName() ?: self::WAREHOUSE_NAME,
            ];
        }

        return [
            'id' => (int) $warehouse->id,
            'name' => $warehouse->name,
            'description' => $warehouse->description,
            'business_branch_id' => $warehouse->business_branch_id ? (int) $warehouse->business_branch_id : null,
            'branch_name' => $warehouse->branch?->name,
        ];
    }

    private static function scopedQuery(): Builder
    {
        return Warehouse::query()
            ->select('warehouses.*')
            ->with([
                'branch:id,business_id,name',
                'branch.business:id,business_key,name,status',
            ])
            ->whereNotNull('warehouses.status')
            ->whereHas('branch.business', function (Builder $business) {
                $business
                    ->where('business_key', BusinessScope::KAMARY_PERU)
                    ->whereNotNull('status');
            });
    }

    private static function configuredWarehouseId(): ?int
    {
        $value = config('samples.default_warehouse_id');
        if (!is_numeric($value)) return null;

        $id = (int) $value;
        return $id > 0 ? $id : null;
    }

    private static function configuredWarehouseName(): string
    {
        return trim((string) config('samples.default_warehouse_name', self::WAREHOUSE_NAME));
    }

    public static function ensureWarehouse(): ?Warehouse
    {
        try {
            $business = Business::query()
                ->where('business_key', BusinessScope::KAMARY_PERU)
                ->whereNotNull('status')
                ->first();
            if (!$business) return null;

            // Primera sede activa de Kamary Peru (la Principal)
            $branch = BusinessBranch::query()
                ->where('business_id', $business->id)
                ->whereNotNull('status')
                ->orderBy('id')
                ->first();
            if (!$branch) return null;

            return Warehouse::query()->updateOrCreate(
                [
                    'business_branch_id' => $branch->id,
                    'name' => self::configuredWarehouseName() ?: self::WAREHOUSE_NAME,
                ],
                [
                    'description' => 'Almacen fijo del modulo Muestras.',
                    'status' => true,
                ]
            );
        } catch (\Throwable $th) {
            return null;
        }
    }
}
