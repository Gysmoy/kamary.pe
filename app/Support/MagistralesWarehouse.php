<?php

namespace App\Support;

use App\Models\Business;
use App\Models\BusinessBranch;
use App\Models\Warehouse;
use Illuminate\Database\Eloquent\Builder;
use RuntimeException;

class MagistralesWarehouse
{
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
                    ->whereRaw('LOWER(warehouses.name) like ?', ['%magistral%'])
                    ->orWhereRaw("LOWER(COALESCE(warehouses.description, '')) like ?", ['%magistral%']);
            })
            ->orderBy('warehouses.id')
            ->first();
        if ($warehouse) return $warehouse;

        $warehouses = self::scopedQuery()->orderBy('warehouses.id')->get();
        if ($warehouses->count() === 1) return $warehouses->first();

        $warehouse = self::ensureWarehouse();
        if ($warehouse) return $warehouse;

        throw new RuntimeException(
            'No se pudo resolver el almacen fijo de Magistrales. Configura MAGISTRALES_DEFAULT_WAREHOUSE_ID o MAGISTRALES_DEFAULT_WAREHOUSE_NAME.'
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
        $warehouse = self::warehouse();

        return [
            'id' => (int) $warehouse->id,
            'name' => $warehouse->name,
            'description' => $warehouse->description,
            'business_id' => $warehouse->branch?->business_id ? (int) $warehouse->branch->business_id : null,
            'business_branch_id' => $warehouse->business_branch_id ? (int) $warehouse->business_branch_id : null,
            'branch_name' => $warehouse->branch?->name,
            'business_name' => $warehouse->branch?->business?->name,
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
                    ->where('business_key', BusinessScope::KAMARY_MEDICALS)
                    ->whereNotNull('status');
            });
    }

    private static function configuredWarehouseId(): ?int
    {
        $value = config('magistrales.default_warehouse_id');
        if (!is_numeric($value)) return null;

        $id = (int) $value;
        return $id > 0 ? $id : null;
    }

    private static function configuredWarehouseName(): string
    {
        return trim((string) config('magistrales.default_warehouse_name', ''));
    }

    public static function ensureWarehouse(): ?Warehouse
    {
        try {
            $business = Business::query()->updateOrCreate(
                ['business_key' => BusinessScope::KAMARY_MEDICALS],
                [
                    'name' => 'Kamary Medicals',
                    'trade_name' => 'Kamary Medicals',
                    'description' => 'Unidad operativa para formulas magistrales.',
                    'status' => true,
                ]
            );

            $branch = BusinessBranch::query()->updateOrCreate(
                [
                    'business_id' => $business->id,
                    'name' => 'Principal Magistrales',
                ],
                [
                    'establishment_code' => '0000',
                    'ubigeo' => '150101',
                    'address' => 'Calle Leoncio Prado 830, Urb. La Vina, San Luis, Lima',
                    'email' => 'magistrales@kamarymedicals.pe',
                    'telephone' => '014856320',
                    'series_factura' => 'FM01',
                    'series_boleta' => 'BM01',
                    'series_nota_credito' => 'FCM1',
                    'status' => true,
                ]
            );

            return Warehouse::query()->updateOrCreate(
                [
                    'business_branch_id' => $branch->id,
                    'name' => self::configuredWarehouseName() ?: 'Almacen Magistrales Principal',
                ],
                [
                    'description' => 'Almacen fijo del modulo Magistrales.',
                    'status' => true,
                ]
            );
        } catch (\Throwable $th) {
            return null;
        }
    }
}
