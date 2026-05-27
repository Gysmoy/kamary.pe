<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!$this->hasRequiredTables()) {
            return;
        }

        $userId = DB::table('users')->whereNotNull('status')->orderBy('id')->value('id')
            ?: DB::table('users')->orderBy('id')->value('id');
        if (!$userId) {
            return;
        }

        $businessId = $this->businessId();
        if (!$businessId) {
            return;
        }

        $branchId = $this->branchId($businessId, $userId);
        $warehouseId = $this->warehouseId($branchId, $userId);
        if (!$branchId || !$warehouseId) {
            return;
        }

        $clients = DB::table('eventual_clients')
            ->whereNotNull('status')
            ->orderByDesc('id')
            ->limit(12)
            ->get();

        $now = now();
        $statuses = ['draft', 'confirmed', 'preparing', 'delivered'];
        $payments = ['Efectivo', 'Transferencia', 'Yape', 'POS'];

        foreach ($clients as $index => $client) {
            if ($this->hasOrderHistory((int) $client->id)) {
                continue;
            }

            $number = $index + 1;
            $code = 'TPE-EV-' . str_pad((string) $client->id, 6, '0', STR_PAD_LEFT);
            $issueDate = now()->subDays($number)->toDateString();
            $total = 65 + ($number * 11.5);
            $documentType = strtolower((string) $client->document_type) === 'ruc' ? 'Factura' : 'Boleta';

            DB::table('take_orders')->updateOrInsert(['code' => $code], $this->payload('take_orders', [
                'code' => $code,
                'order_profile' => 'micro',
                'business_id' => $businessId,
                'business_branch_id' => $branchId,
                'warehouse_id' => $warehouseId,
                'client_id' => null,
                'eventual_client_id' => $client->id,
                'client_distribution_network_id' => null,
                'client_delivery_address_id' => null,
                'seller_id' => $userId,
                'price_list_id' => null,
                'document_type' => $documentType,
                'currency' => 'PEN',
                'payment_condition' => 'Contado',
                'payment_method' => $payments[$index % count($payments)],
                'commercial_channel' => 'Cliente eventual',
                'segment' => 'Mostrador',
                'order_status' => $statuses[$index % count($statuses)],
                'payment_status' => $index % 3 === 0 ? 'paid' : 'pending',
                'dispatch_status' => $index % 4 === 3 ? 'delivered' : 'pending',
                'billing_status' => $index % 2 === 0 ? 'pending' : 'billed',
                'issue_date' => $issueDate,
                'promised_delivery_at' => now()->subDays(max(0, $number - 2))->toDateString(),
                'installments' => 1,
                'first_due_date' => $issueDate,
                'delivery_address' => $client->address ?: 'Recojo en tienda',
                'delivery_reference' => 'Pedido inicial para historial de cliente eventual',
                'ubigeo' => null,
                'map_lat' => null,
                'map_lng' => null,
                'dispatch_contact_name' => $client->business_name,
                'dispatch_contact_phone' => $client->phone ?? null,
                'purchase_order' => null,
                'referral_guide' => null,
                'subtotal' => round($total / 1.18, 2),
                'tax_amount' => round($total - ($total / 1.18), 2),
                'total' => round($total, 2),
                'observations' => 'Pedido de referencia para historial del cliente eventual.',
                'approved_at' => in_array($statuses[$index % count($statuses)], ['confirmed', 'preparing', 'delivered'], true) ? $now : null,
                'status' => true,
                'created_by' => $userId,
                'updated_by' => $userId,
                'created_at' => now()->subDays($number),
                'updated_at' => $now,
            ]));
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('take_orders')) {
            return;
        }

        DB::table('take_orders')
            ->where('code', 'like', 'TPE-EV-%')
            ->delete();
    }

    private function hasRequiredTables(): bool
    {
        foreach (['eventual_clients', 'take_orders', 'businesses', 'business_branches', 'warehouses', 'users'] as $table) {
            if (!Schema::hasTable($table)) {
                return false;
            }
        }

        return true;
    }

    private function businessId(): ?int
    {
        $query = DB::table('businesses')->whereNotNull('status');
        if (Schema::hasColumn('businesses', 'business_key')) {
            $id = (clone $query)->where('business_key', 'kamary_peru')->value('id');
            if ($id) {
                return (int) $id;
            }
        }

        return ($id = $query->orderBy('id')->value('id')) ? (int) $id : null;
    }

    private function branchId(int $businessId, int $userId): ?int
    {
        $id = DB::table('business_branches')
            ->where('business_id', $businessId)
            ->whereNotNull('status')
            ->orderBy('id')
            ->value('id');

        if ($id) {
            return (int) $id;
        }

        return (int) DB::table('business_branches')->insertGetId($this->payload('business_branches', [
            'business_id' => $businessId,
            'name' => 'Sede Comercial Principal',
            'status' => true,
            'created_by' => $userId,
            'updated_by' => $userId,
            'created_at' => now(),
            'updated_at' => now(),
        ]));
    }

    private function warehouseId(int $branchId, int $userId): ?int
    {
        $query = DB::table('warehouses')->whereNotNull('status')->orderBy('id');
        if (Schema::hasColumn('warehouses', 'business_branch_id')) {
            $id = (clone $query)->where('business_branch_id', $branchId)->value('id');
            if ($id) {
                return (int) $id;
            }
        }

        return (int) DB::table('warehouses')->insertGetId($this->payload('warehouses', [
            'business_branch_id' => Schema::hasColumn('warehouses', 'business_branch_id') ? $branchId : null,
            'name' => 'Almacen Comercial Principal',
            'description' => 'Almacen para pedidos comerciales de clientes eventuales.',
            'status' => true,
            'created_by' => $userId,
            'updated_by' => $userId,
            'created_at' => now(),
            'updated_at' => now(),
        ]));
    }

    private function hasOrderHistory(int $eventualClientId): bool
    {
        $hasTakeOrder = DB::table('take_orders')
            ->where('eventual_client_id', $eventualClientId)
            ->whereNotNull('status')
            ->exists();

        if ($hasTakeOrder) {
            return true;
        }

        if (!Schema::hasTable('commercial_orders')) {
            return false;
        }

        return DB::table('commercial_orders')
            ->where('eventual_client_id', $eventualClientId)
            ->whereNotNull('status')
            ->exists();
    }

    private function payload(string $table, array $data): array
    {
        return array_filter(
            $data,
            fn ($value, $column) => Schema::hasColumn($table, $column),
            ARRAY_FILTER_USE_BOTH
        );
    }
};
