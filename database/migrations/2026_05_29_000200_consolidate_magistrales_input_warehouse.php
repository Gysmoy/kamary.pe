<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private string $businessKey = 'kamary_medicals';
    private string $branchName = 'Principal Magistrales';
    private string $principalWarehouseName = 'Almacen Magistrales Principal';
    private string $extraWarehouseName = 'Almacen Magistrales Insumos';

    public function up(): void
    {
        if (!Schema::hasTable('warehouses') || !Schema::hasTable('business_branches') || !Schema::hasTable('businesses')) {
            return;
        }

        $branchId = DB::table('business_branches as branch')
            ->join('businesses as business', 'business.id', '=', 'branch.business_id')
            ->where('business.business_key', $this->businessKey)
            ->where('branch.name', $this->branchName)
            ->value('branch.id');
        if (!$branchId) return;

        $principalName = trim((string) config('magistrales.default_warehouse_name', $this->principalWarehouseName));
        if ($principalName === '') $principalName = $this->principalWarehouseName;

        $principalWarehouseId = DB::table('warehouses')
            ->where('business_branch_id', $branchId)
            ->where('name', $principalName)
            ->value('id');
        if (!$principalWarehouseId) return;

        $extraWarehouseId = DB::table('warehouses')
            ->where('business_branch_id', $branchId)
            ->where('name', $this->extraWarehouseName)
            ->value('id');
        if (!$extraWarehouseId || (int) $extraWarehouseId === (int) $principalWarehouseId) return;

        $this->moveReferences((int) $extraWarehouseId, (int) $principalWarehouseId);

        DB::table('warehouses')
            ->where('id', $extraWarehouseId)
            ->update($this->payload('warehouses', [
                'status' => null,
                'updated_at' => now(),
            ]));
    }

    public function down(): void
    {
        //
    }

    private function moveReferences(int $fromWarehouseId, int $toWarehouseId): void
    {
        $updates = [
            ['purchase_orders', 'warehouse_id'],
            ['magistral_incomes', 'warehouse_id'],
            ['magistral_outputs', 'origin_warehouse_id'],
            ['magistral_outputs', 'destination_warehouse_id'],
            ['magistral_inventory_counts', 'warehouse_id'],
            ['magistral_production_orders', 'source_warehouse_id'],
        ];

        foreach ($updates as [$table, $column]) {
            if (!Schema::hasTable($table) || !Schema::hasColumn($table, $column)) continue;

            DB::table($table)
                ->where($column, $fromWarehouseId)
                ->update($this->payload($table, [
                    $column => $toWarehouseId,
                    'updated_at' => now(),
                ]));
        }
    }

    private function payload(string $table, array $payload): array
    {
        return array_filter(
            $payload,
            fn($value, string $column) => Schema::hasColumn($table, $column),
            ARRAY_FILTER_USE_BOTH
        );
    }
};
