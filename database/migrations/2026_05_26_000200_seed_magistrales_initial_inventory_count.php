<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private string $businessKey = 'kamary_medicals';
    private string $branchName = 'Principal Magistrales';
    private string $warehouseName = 'Almacen Magistrales Principal';

    public function up(): void
    {
        if (
            !Schema::hasTable('magistral_inventory_counts')
            || !Schema::hasTable('magistral_inventory_count_items')
            || !Schema::hasTable('articles')
        ) {
            return;
        }

        if (DB::table('magistral_inventory_counts')->exists()) {
            return;
        }

        $warehouse = $this->fixedWarehouse();
        if (!$warehouse) {
            return;
        }

        $articles = DB::table('articles')
            ->when(Schema::hasColumn('articles', 'module_scope'), fn($query) => $query->where('module_scope', 'magistrales'))
            ->whereNotNull('status')
            ->orderBy('id')
            ->get(['id']);

        if ($articles->isEmpty()) {
            return;
        }

        $userId = Schema::hasTable('users') ? DB::table('users')->orderBy('id')->value('id') : null;
        $now = now();

        $countId = DB::table('magistral_inventory_counts')->insertGetId($this->payload('magistral_inventory_counts', [
            'code' => $this->nextInventoryCode(),
            'business_branch_id' => $warehouse->business_branch_id ?? null,
            'warehouse_id' => $warehouse->id,
            'count_date' => $now->toDateString(),
            'observations' => 'Inventario inicial automatico para habilitar el modulo Magistrales.',
            'status' => true,
            'created_by' => $userId,
            'updated_by' => $userId,
            'created_at' => $now,
            'updated_at' => $now,
        ]));

        foreach ($articles as $article) {
            $stock = $this->currentStock((int) $article->id, (int) $warehouse->id);

            DB::table('magistral_inventory_count_items')->insert($this->payload('magistral_inventory_count_items', [
                'magistral_inventory_count_id' => $countId,
                'article_id' => $article->id,
                'lot' => null,
                'expiration_date' => null,
                'system_stock' => $stock,
                'real_stock' => $stock,
                'difference' => 0,
                'status' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]));
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('magistral_inventory_counts')) {
            return;
        }

        $countIds = DB::table('magistral_inventory_counts')
            ->where('observations', 'Inventario inicial automatico para habilitar el modulo Magistrales.')
            ->pluck('id');

        if ($countIds->isEmpty()) {
            return;
        }

        if (Schema::hasTable('magistral_inventory_count_items')) {
            DB::table('magistral_inventory_count_items')
                ->whereIn('magistral_inventory_count_id', $countIds)
                ->delete();
        }

        DB::table('magistral_inventory_counts')
            ->whereIn('id', $countIds)
            ->delete();
    }

    private function fixedWarehouse(): ?object
    {
        if (!Schema::hasTable('warehouses')) {
            return null;
        }

        $query = DB::table('warehouses')
            ->select('warehouses.id', 'warehouses.business_branch_id')
            ->where('warehouses.name', $this->warehouseName)
            ->whereNotNull('warehouses.status');

        if (
            Schema::hasTable('business_branches')
            && Schema::hasTable('businesses')
            && Schema::hasColumn('businesses', 'business_key')
        ) {
            $query
                ->join('business_branches as branch', 'branch.id', '=', 'warehouses.business_branch_id')
                ->join('businesses as business', 'business.id', '=', 'branch.business_id')
                ->where('branch.name', $this->branchName)
                ->where('business.business_key', $this->businessKey)
                ->whereNotNull('branch.status')
                ->whereNotNull('business.status');
        }

        return $query->orderBy('warehouses.id')->first();
    }

    private function nextInventoryCode(): string
    {
        $next = 1;
        $latest = DB::table('magistral_inventory_counts')->latest('id')->value('code');
        if ($latest && preg_match('/(\d+)$/', (string) $latest, $matches)) {
            $next = ((int) $matches[1]) + 1;
        }

        do {
            $code = 'INV-MAG-' . str_pad((string) $next, 6, '0', STR_PAD_LEFT);
            $next++;
        } while (DB::table('magistral_inventory_counts')->where('code', $code)->exists());

        return $code;
    }

    private function currentStock(int $articleId, int $warehouseId): float
    {
        $in = $this->sumIncomes($articleId, $warehouseId);
        $production = $this->sumProduction($articleId, $warehouseId);
        $out = $this->sumOutputs($articleId, $warehouseId);
        $sales = $this->sumSales($articleId, $warehouseId);
        $consumption = $this->sumProductionConsumption($articleId, $warehouseId);

        return round($in + $production - $out - $sales - $consumption, 3);
    }

    private function sumIncomes(int $articleId, int $warehouseId): float
    {
        if (!Schema::hasTable('magistral_income_items') || !Schema::hasTable('magistral_incomes')) {
            return 0;
        }

        return (float) DB::table('magistral_income_items as item')
            ->join('magistral_incomes as income', 'income.id', '=', 'item.magistral_income_id')
            ->where('item.article_id', $articleId)
            ->where('income.warehouse_id', $warehouseId)
            ->whereNotNull('income.status')
            ->whereNotNull('item.status')
            ->sum('item.quantity');
    }

    private function sumOutputs(int $articleId, int $warehouseId): float
    {
        if (!Schema::hasTable('magistral_output_items') || !Schema::hasTable('magistral_outputs')) {
            return 0;
        }

        return (float) DB::table('magistral_output_items as item')
            ->join('magistral_outputs as output', 'output.id', '=', 'item.magistral_output_id')
            ->where('item.article_id', $articleId)
            ->where('output.origin_warehouse_id', $warehouseId)
            ->whereNotNull('output.status')
            ->whereNotNull('item.status')
            ->sum('item.quantity');
    }

    private function sumSales(int $articleId, int $warehouseId): float
    {
        if (!Schema::hasTable('magistral_sale_items') || !Schema::hasTable('magistral_sales')) {
            return 0;
        }

        return (float) DB::table('magistral_sale_items as item')
            ->join('magistral_sales as sale', 'sale.id', '=', 'item.magistral_sale_id')
            ->where('item.article_id', $articleId)
            ->where('item.warehouse_id', $warehouseId)
            ->whereNotNull('sale.status')
            ->whereNotNull('item.status')
            ->when(Schema::hasColumn('magistral_sales', 'is_quote'), fn($query) => $query->where('sale.is_quote', false))
            ->sum('item.quantity');
    }

    private function sumProduction(int $articleId, int $warehouseId): float
    {
        if (!Schema::hasTable('magistral_production_orders')) {
            return 0;
        }

        return (float) DB::table('magistral_production_orders')
            ->where('article_id', $articleId)
            ->where('order_status', 'finished')
            ->whereNotNull('status')
            ->when(Schema::hasColumn('magistral_production_orders', 'destination_warehouse_id'), fn($query) => $query->where('destination_warehouse_id', $warehouseId))
            ->sum('quantity');
    }

    private function sumProductionConsumption(int $articleId, int $warehouseId): float
    {
        if (!Schema::hasTable('magistral_production_order_items') || !Schema::hasTable('magistral_production_orders')) {
            return 0;
        }

        return (float) DB::table('magistral_production_order_items as item')
            ->join('magistral_production_orders as production', 'production.id', '=', 'item.magistral_production_order_id')
            ->where('item.article_id', $articleId)
            ->where('production.order_status', 'finished')
            ->whereNotNull('production.status')
            ->whereNotNull('item.status')
            ->when(Schema::hasColumn('magistral_production_orders', 'destination_warehouse_id'), fn($query) => $query->where('production.destination_warehouse_id', $warehouseId))
            ->sum(DB::raw('COALESCE(item.total, item.quantity)'));
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
