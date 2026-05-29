<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private string $businessKey = 'kamary_medicals';
    private string $businessName = 'Kamary Medicals';
    private string $branchName = 'Principal Magistrales';
    private string $warehouseName = 'Almacen Magistrales Principal';

    public function up(): void
    {
        $this->addProductionSourceWarehouseColumn();

        $businessId = $this->ensureBusiness();
        if (!$businessId) return;

        $branchId = $this->ensureBranch($businessId);
        if (!$branchId) return;

        $warehouseId = $this->ensureInputWarehouse($branchId);
        if (!$warehouseId) return;

        $this->backfillInputWarehouse($businessId, $branchId, $warehouseId);
    }

    public function down(): void
    {
        //
    }

    private function addProductionSourceWarehouseColumn(): void
    {
        if (
            !Schema::hasTable('magistral_production_orders')
            || Schema::hasColumn('magistral_production_orders', 'source_warehouse_id')
        ) {
            return;
        }

        Schema::table('magistral_production_orders', function (Blueprint $table) {
            $table->foreignId('source_warehouse_id')->nullable()->after('destination_warehouse_id')->constrained('warehouses')->nullOnDelete();
        });
    }

    private function ensureBusiness(): ?int
    {
        if (!Schema::hasTable('businesses') || !Schema::hasColumn('businesses', 'business_key')) {
            return null;
        }

        $id = DB::table('businesses')->where('business_key', $this->businessKey)->value('id');
        $payload = $this->payload('businesses', [
            'name' => $this->businessName,
            'trade_name' => $this->businessName,
            'description' => 'Unidad operativa para formulas magistrales.',
            'status' => true,
            'updated_at' => now(),
        ]);

        if ($id) {
            DB::table('businesses')->where('id', $id)->update($payload);
            return (int) $id;
        }

        return (int) DB::table('businesses')->insertGetId($this->payload('businesses', array_merge($payload, [
            'business_key' => $this->businessKey,
            'created_at' => now(),
        ])));
    }

    private function ensureBranch(int $businessId): ?int
    {
        if (!Schema::hasTable('business_branches')) return null;

        $id = DB::table('business_branches')
            ->where('business_id', $businessId)
            ->where('name', $this->branchName)
            ->value('id');

        $payload = $this->payload('business_branches', [
            'establishment_code' => '0000',
            'ubigeo' => '150101',
            'address' => 'Calle Leoncio Prado 830, Urb. La Vina, San Luis, Lima',
            'email' => 'magistrales@kamarymedicals.pe',
            'telephone' => '014856320',
            'series_factura' => 'FM01',
            'series_boleta' => 'BM01',
            'series_nota_credito' => 'FCM1',
            'status' => true,
            'updated_at' => now(),
        ]);

        if ($id) {
            DB::table('business_branches')->where('id', $id)->update($payload);
            return (int) $id;
        }

        return (int) DB::table('business_branches')->insertGetId($this->payload('business_branches', array_merge($payload, [
            'business_id' => $businessId,
            'name' => $this->branchName,
            'created_at' => now(),
        ])));
    }

    private function ensureInputWarehouse(int $branchId): ?int
    {
        if (!Schema::hasTable('warehouses')) return null;

        $name = trim((string) config('magistrales.default_warehouse_name', $this->warehouseName));
        if ($name === '') $name = $this->warehouseName;

        $id = DB::table('warehouses')
            ->where('business_branch_id', $branchId)
            ->where('name', $name)
            ->value('id');

        $payload = $this->payload('warehouses', [
            'description' => 'Almacen fijo del modulo Magistrales.',
            'status' => true,
            'updated_at' => now(),
        ]);

        if ($id) {
            DB::table('warehouses')->where('id', $id)->update($payload);
            return (int) $id;
        }

        return (int) DB::table('warehouses')->insertGetId($this->payload('warehouses', array_merge($payload, [
            'business_branch_id' => $branchId,
            'name' => $name,
            'created_at' => now(),
        ])));
    }

    private function backfillInputWarehouse(int $businessId, int $branchId, int $warehouseId): void
    {
        if (Schema::hasTable('purchase_orders') && Schema::hasColumn('purchase_orders', 'module_scope')) {
            DB::table('purchase_orders')
                ->where('module_scope', 'magistrales')
                ->where(function ($query) {
                    $query->whereRaw('LOWER(COALESCE(article_type, "")) LIKE ?', ['%insumo%'])
                        ->orWhereRaw('LOWER(COALESCE(article_type, "")) LIKE ?', ['%envase%']);
                })
                ->update($this->payload('purchase_orders', [
                    'business_id' => $businessId,
                    'business_branch_id' => $branchId,
                    'warehouse_id' => $warehouseId,
                    'updated_at' => now(),
                ]));
        }

        if (Schema::hasTable('magistral_production_orders') && Schema::hasColumn('magistral_production_orders', 'source_warehouse_id')) {
            DB::table('magistral_production_orders')
                ->whereNull('source_warehouse_id')
                ->update($this->payload('magistral_production_orders', [
                    'source_warehouse_id' => $warehouseId,
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
