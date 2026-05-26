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
            !Schema::hasTable('purchase_orders')
            || !Schema::hasTable('purchase_order_items')
            || !Schema::hasTable('articles')
            || !Schema::hasTable('suppliers')
        ) {
            return;
        }

        if (Schema::hasColumn('purchase_orders', 'module_scope')) {
            $hasMagistralesOrder = DB::table('purchase_orders')
                ->where('module_scope', 'magistrales')
                ->exists();

            if ($hasMagistralesOrder) {
                return;
            }
        }

        $warehouse = $this->fixedWarehouse();
        if (!$warehouse) {
            return;
        }

        $supplierId = DB::table('suppliers')
            ->when(Schema::hasColumn('suppliers', 'module_scope'), fn($query) => $query->where('module_scope', 'magistrales'))
            ->whereNotNull('status')
            ->orderBy('id')
            ->value('id');

        $article = DB::table('articles')
            ->when(Schema::hasColumn('articles', 'module_scope'), fn($query) => $query->where('module_scope', 'magistrales'))
            ->whereNotNull('status')
            ->orderByRaw("CASE WHEN code = 'MAG-INS-001' THEN 0 ELSE 1 END")
            ->orderBy('id')
            ->first();

        if (!$supplierId || !$article) {
            return;
        }

        $userId = Schema::hasTable('users') ? DB::table('users')->orderBy('id')->value('id') : null;
        $now = now();
        $price = $this->articleCost($article);
        $quantity = 1;
        $total = round($quantity * $price, 2);

        $orderId = DB::table('purchase_orders')->insertGetId($this->payload('purchase_orders', [
            'business_id' => $warehouse->business_id,
            'module_scope' => 'magistrales',
            'business_branch_id' => $warehouse->business_branch_id,
            'warehouse_id' => $warehouse->id,
            'supplier_id' => $supplierId,
            'buyer_name' => 'Admin Kamary',
            'article_type' => $article->article_type ?? 'INSUMO',
            'code' => $this->nextPurchaseOrderCode(),
            'issue_date' => $now->toDateString(),
            'expected_date' => $now->copy()->addDays(7)->toDateString(),
            'max_delivery_date' => $now->copy()->addDays(15)->toDateString(),
            'delivery_place' => $this->warehouseName,
            'currency' => $article->currency ?? 'PEN',
            'payment_condition' => 'Contado',
            'payment_method' => 'Transferencia',
            'document_type' => 'Orden compra',
            'affects_igv' => false,
            'order_status' => 'draft',
            'approval_status' => 'pending',
            'observations' => 'Orden inicial automatica para habilitar el modulo Magistrales. Puede anularse o reemplazarse.',
            'subtotal' => $total,
            'tax_amount' => 0,
            'total' => $total,
            'status' => true,
            'created_by' => $userId,
            'updated_by' => $userId,
            'created_at' => $now,
            'updated_at' => $now,
        ]));

        DB::table('purchase_order_items')->insert($this->payload('purchase_order_items', [
            'purchase_order_id' => $orderId,
            'article_id' => $article->id,
            'presentation_id' => null,
            'presentation_label' => $article->magistral_presentation ?? null,
            'presentation_units' => 1,
            'last_price' => $price,
            'requested_quantity' => $quantity,
            'received_quantity' => 0,
            'price_unit' => $price,
            'total' => $total,
            'status' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]));
    }

    public function down(): void
    {
        if (!Schema::hasTable('purchase_orders')) {
            return;
        }

        $orderIds = DB::table('purchase_orders')
            ->where('observations', 'Orden inicial automatica para habilitar el modulo Magistrales. Puede anularse o reemplazarse.')
            ->pluck('id');

        if ($orderIds->isEmpty()) {
            return;
        }

        if (Schema::hasTable('purchase_order_items')) {
            DB::table('purchase_order_items')->whereIn('purchase_order_id', $orderIds)->delete();
        }

        DB::table('purchase_orders')->whereIn('id', $orderIds)->delete();
    }

    private function fixedWarehouse(): ?object
    {
        if (
            !Schema::hasTable('warehouses')
            || !Schema::hasTable('business_branches')
            || !Schema::hasTable('businesses')
            || !Schema::hasColumn('businesses', 'business_key')
        ) {
            return null;
        }

        return DB::table('warehouses')
            ->select(
                'warehouses.id',
                'warehouses.business_branch_id',
                'branch.business_id'
            )
            ->join('business_branches as branch', 'branch.id', '=', 'warehouses.business_branch_id')
            ->join('businesses as business', 'business.id', '=', 'branch.business_id')
            ->where('warehouses.name', $this->warehouseName)
            ->where('branch.name', $this->branchName)
            ->where('business.business_key', $this->businessKey)
            ->whereNotNull('warehouses.status')
            ->whereNotNull('branch.status')
            ->whereNotNull('business.status')
            ->orderBy('warehouses.id')
            ->first();
    }

    private function nextPurchaseOrderCode(): string
    {
        $next = 1;

        do {
            $code = 'OC-MAG-' . str_pad((string) $next, 6, '0', STR_PAD_LEFT);
            $next++;
        } while (DB::table('purchase_orders')->where('code', $code)->exists());

        return $code;
    }

    private function articleCost(object $article): float
    {
        foreach (['purchase_price_national', 'cost_price', 'sale_price'] as $field) {
            $value = $article->{$field} ?? null;
            if (is_numeric($value) && (float) $value > 0) {
                return round((float) $value, 4);
            }
        }

        return 0;
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
