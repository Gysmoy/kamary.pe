<?php

namespace Database\Seeders;

use App\Support\BusinessScope;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class KamaryOrderObservationsDemoSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $now = now();
            $userId = DB::table('users')->orderBy('id')->value('id');
            if (!$userId) {
                throw new \RuntimeException('No hay usuarios para auditar los datos demo.');
            }

            $business = DB::table('businesses')
                ->where('business_key', BusinessScope::KAMARY_PERU)
                ->whereNotNull('status')
                ->first();
            if (!$business) {
                throw new \RuntimeException('No existe empresa Kamary Peru activa.');
            }

            $branch = DB::table('business_branches')
                ->where('business_id', $business->id)
                ->whereNotNull('status')
                ->orderBy('id')
                ->first();
            if (!$branch) {
                throw new \RuntimeException('No existe sede activa para Kamary Peru.');
            }

            $warehouseIds = $this->ensureWarehouses((int) $branch->id, $userId, $now);
            $zoneId = DB::table('zones')->where('code', 'ZON-LIM-CENTRO')->value('id')
                ?: DB::table('zones')->where('name', 'Lima Centro')->value('id');
            $unitId = $this->ensureUnit($userId, $now);
            $laboratoryId = $this->ensureLaboratory($userId, $now);
            $articleIds = $this->ensureArticles($unitId, $laboratoryId, $userId, $now);
            $this->ensureStock((int) $business->id, (int) $branch->id, $warehouseIds, $articleIds, $userId, $now);

            $clientId = $this->ensureClient($userId, $now);
            [$networkId, $addressId] = $this->ensureClientDelivery($clientId, $userId, $now);
            $this->ensureDriverAndVehicle((int) $business->id, $zoneId ? (int) $zoneId : null, $userId, $now);
            $this->ensureOrders(
                (int) $business->id,
                (int) $branch->id,
                (int) ($warehouseIds['Almacen A'] ?? reset($warehouseIds)),
                $clientId,
                $networkId,
                $addressId,
                $articleIds,
                $userId,
                $now
            );
        });
    }

    private function ensureWarehouses(int $branchId, int $userId, $now): array
    {
        $ids = [];
        foreach (['Almacen A', 'Almacen B', 'Almacen C', 'Almacen D'] as $name) {
            DB::table('warehouses')->updateOrInsert([
                'business_branch_id' => $branchId,
                'name' => $name,
            ], [
                'description' => "Almacen demo {$name} para pruebas de pedidos.",
                'status' => true,
                'created_by' => $userId,
                'updated_by' => $userId,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            $ids[$name] = (int) DB::table('warehouses')
                ->where('business_branch_id', $branchId)
                ->where('name', $name)
                ->value('id');
        }

        return $ids;
    }

    private function ensureUnit(int $userId, $now): int
    {
        DB::table('units')->updateOrInsert([
            'symbol' => 'UND',
        ], [
            'name' => 'Unidad',
            'status' => true,
            'created_by' => $userId,
            'updated_by' => $userId,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        return (int) DB::table('units')->where('symbol', 'UND')->value('id');
    }

    private function ensureLaboratory(int $userId, $now): int
    {
        DB::table('laboratories')->updateOrInsert([
            'code' => 'LAB-DEMO-PED',
        ], [
            'name' => 'Laboratorio Demo Pedidos',
            'status' => true,
            'created_by' => $userId,
            'updated_by' => $userId,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        return (int) DB::table('laboratories')->where('code', 'LAB-DEMO-PED')->value('id');
    }

    private function ensureArticles(int $unitId, int $laboratoryId, int $userId, $now): array
    {
        $articles = [
            'DEMO-PED-001' => ['name' => 'Producto Demo Flujo 001', 'price' => 59.00, 'cost' => 30.00, 'weight' => 0.25],
            'DEMO-PED-002' => ['name' => 'Producto Demo Flujo 002', 'price' => 118.00, 'cost' => 60.00, 'weight' => 0.50],
        ];

        $ids = [];
        foreach ($articles as $code => $article) {
            DB::table('articles')->updateOrInsert([
                'code' => $code,
            ], [
                'module_scope' => 'standard',
                'name' => $article['name'],
                'laboratory_id' => $laboratoryId,
                'unit_id' => $unitId,
                'unit_weight' => $article['weight'],
                'cost_price' => $article['cost'],
                'sale_price' => $article['price'],
                'status' => true,
                'created_by' => $userId,
                'updated_by' => $userId,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $articleId = (int) DB::table('articles')->where('code', $code)->value('id');
            DB::table('article_presentations')->updateOrInsert([
                'article_id' => $articleId,
                'name' => 'Unidad',
            ], [
                'units' => 1,
                'price' => $article['price'],
                'sort_order' => 1,
                'status' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $ids[$code] = $articleId;
        }

        return $ids;
    }

    private function ensureStock(int $businessId, int $branchId, array $warehouseIds, array $articleIds, int $userId, $now): void
    {
        foreach ($warehouseIds as $warehouseName => $warehouseId) {
            $code = 'ENT-DEMO-' . str_replace(' ', '-', strtoupper($warehouseName));
            DB::table('entry_notes')->updateOrInsert([
                'code' => $code,
            ], [
                'business_id' => $businessId,
                'business_branch_id' => $branchId,
                'warehouse_id' => $warehouseId,
                'entry_date' => now()->toDateString(),
                'document_type' => 'Nota de ingreso',
                'document_series' => 'DEMO',
                'document_sequence' => str_pad((string) $warehouseId, 4, '0', STR_PAD_LEFT),
                'document_date' => now()->toDateString(),
                'currency' => 'PEN',
                'observations' => 'Stock demo para validar flujo de pedidos, picking y despacho.',
                'status' => true,
                'entry_status' => 'approved',
                'created_by' => $userId,
                'updated_by' => $userId,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $entryNoteId = (int) DB::table('entry_notes')->where('code', $code)->value('id');
            foreach ($articleIds as $articleCode => $articleId) {
                $qty = $articleCode === 'DEMO-PED-001' ? 100 : 50;
                $cost = $articleCode === 'DEMO-PED-001' ? 30 : 60;
                DB::table('entry_note_items')->updateOrInsert([
                    'entry_note_id' => $entryNoteId,
                    'article_id' => $articleId,
                    'warehouse_id' => $warehouseId,
                    'batch_code' => "LOT-{$articleCode}",
                ], [
                    'lot' => "LOT-{$articleCode}",
                    'expiration_date' => now()->addYear()->toDateString(),
                    'storage_condition' => 'Ambiente',
                    'stock' => $qty,
                    'cost_unit' => $cost,
                    'location' => 'DEMO',
                    'requested_quantity' => $qty,
                    'received_quantity' => $qty,
                    'quantity' => $qty,
                    'total' => $qty * $cost,
                    'status' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }

    private function ensureClient(int $userId, $now): int
    {
        DB::table('clients')->updateOrInsert([
            'document_type' => 'RUC',
            'document_number' => '20600000001',
        ], [
            'client_kind' => 'regular',
            'module_scope' => 'standard',
            'full_name' => 'Cliente Demo Observaciones SAC',
            'email' => 'cliente.demo@kamary.pe',
            'billing_email' => 'facturacion.demo@kamary.pe',
            'phone' => '999888777',
            'primary_contact' => 'Recepcion Demo',
            'primary_contact_phone' => '999888777',
            'commercial_channel' => 'Directo',
            'segment' => 'Demo',
            'ubigeo' => '150131',
            'full_address' => 'Av. Javier Prado Este 1234, San Isidro, Lima',
            'fiscal_address' => 'Av. Javier Prado Este 1234, San Isidro, Lima',
            'department' => 'Lima',
            'province' => 'Lima',
            'district' => 'San Isidro',
            'status' => true,
            'created_by' => $userId,
            'updated_by' => $userId,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        return (int) DB::table('clients')
            ->where('document_type', 'RUC')
            ->where('document_number', '20600000001')
            ->value('id');
    }

    private function ensureClientDelivery(int $clientId, int $userId, $now): array
    {
        DB::table('client_distribution_networks')->updateOrInsert([
            'code' => 'RED-DEMO-PED',
        ], [
            'client_id' => $clientId,
            'name' => 'Red Demo Pedidos',
            'commercial_channel' => 'Directo',
            'segment' => 'Demo',
            'contact_name' => 'Recepcion Demo',
            'contact_phone' => '999888777',
            'is_default' => true,
            'status' => true,
            'created_by' => $userId,
            'updated_by' => $userId,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $networkId = (int) DB::table('client_distribution_networks')->where('code', 'RED-DEMO-PED')->value('id');

        DB::table('client_delivery_addresses')->updateOrInsert([
            'client_distribution_network_id' => $networkId,
            'code' => 'DIR-DEMO-LIMA',
        ], [
            'client_id' => $clientId,
            'name' => 'Direccion Demo Lima Centro',
            'ubigeo' => '150131',
            'department' => 'Lima',
            'province' => 'Lima',
            'district' => 'San Isidro',
            'address' => 'Av. Javier Prado Este 1234, San Isidro, Lima',
            'reference' => 'Frente a centro financiero demo',
            'latitude' => -12.0914000,
            'longitude' => -77.0219000,
            'contact_name' => 'Recepcion Demo',
            'contact_phone' => '999888777',
            'is_default' => true,
            'status' => true,
            'created_by' => $userId,
            'updated_by' => $userId,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $addressId = (int) DB::table('client_delivery_addresses')
            ->where('client_distribution_network_id', $networkId)
            ->where('code', 'DIR-DEMO-LIMA')
            ->value('id');

        return [$networkId, $addressId];
    }

    private function ensureDriverAndVehicle(int $businessId, ?int $zoneId, int $userId, $now): void
    {
        DB::table('drivers')->updateOrInsert([
            'code' => 'DRV-DEMO-001',
        ], [
            'business_id' => $businessId,
            'full_name' => 'Conductor Demo Kamary',
            'document_type' => 'DNI',
            'document_number' => '70000001',
            'license_number' => 'Q70000001',
            'phone' => '988777666',
            'email' => 'conductor.demo@kamary.pe',
            'status' => true,
            'created_by' => $userId,
            'updated_by' => $userId,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $vehiclePayload = [
            'business_id' => $businessId,
            'zone_id' => $zoneId,
            'code' => 'VEH-DEMO-001',
            'label' => 'Unidad Demo Lima',
            'brand' => 'Demo',
            'model' => 'Furgon',
            'color' => 'Blanco',
            'vehicle_type' => 'Furgon',
            'capacity' => 800,
            'gross_weight' => 1200,
            'status' => true,
            'created_by' => $userId,
            'updated_by' => $userId,
            'created_at' => $now,
            'updated_at' => $now,
        ];
        $vehicleId = DB::table('vehicles')->where('code', 'VEH-DEMO-001')->value('id')
            ?: DB::table('vehicles')->where('plate', 'DEM-001')->value('id');

        if ($vehicleId) {
            DB::table('vehicles')->where('id', $vehicleId)->update($vehiclePayload + ['plate' => 'DEM-001']);
        } else {
            DB::table('vehicles')->insert($vehiclePayload + ['plate' => 'DEM-001']);
        }
    }

    private function ensureOrders(
        int $businessId,
        int $branchId,
        int $warehouseId,
        int $clientId,
        int $networkId,
        int $addressId,
        array $articleIds,
        int $userId,
        $now
    ): void {
        $orders = [
            'PED-DEMO-FLUJO-001' => ['dispatch_status' => 'pending', 'order_status' => 'pending', 'qty' => 2, 'article' => 'DEMO-PED-001', 'document_type' => 'Factura'],
            'PED-DEMO-DESPACHO-001' => ['dispatch_status' => 'dispatched', 'order_status' => 'dispatched', 'qty' => 1, 'article' => 'DEMO-PED-002', 'document_type' => 'Boleta'],
        ];

        foreach ($orders as $code => $config) {
            $articleId = (int) $articleIds[$config['article']];
            $price = $config['article'] === 'DEMO-PED-001' ? 59.00 : 118.00;
            $total = round($price * $config['qty'], 2);
            $subtotal = round($total / 1.18, 2);

            DB::table('commercial_orders')->updateOrInsert([
                'code' => $code,
            ], [
                'business_id' => $businessId,
                'business_branch_id' => $branchId,
                'warehouse_id' => $warehouseId,
                'client_id' => $clientId,
                'eventual_client_id' => null,
                'client_distribution_network_id' => $networkId,
                'client_delivery_address_id' => $addressId,
                'seller_id' => $userId,
                'document_type' => $config['document_type'],
                'currency' => 'PEN',
                'payment_condition' => 'Contado',
                'payment_method' => 'Transferencia',
                'commercial_channel' => 'Directo',
                'segment' => 'Demo',
                'order_status' => $config['order_status'],
                'payment_status' => 'pending',
                'dispatch_status' => $config['dispatch_status'],
                'billing_status' => 'pending',
                'issue_date' => now()->toDateString(),
                'promised_delivery_at' => now()->addDay()->toDateString(),
                'installments' => 1,
                'delivery_address' => 'Av. Javier Prado Este 1234, San Isidro, Lima',
                'delivery_reference' => 'Frente a centro financiero demo',
                'ubigeo' => '150131',
                'map_lat' => -12.0914000,
                'map_lng' => -77.0219000,
                'dispatch_contact_name' => 'Recepcion Demo',
                'dispatch_contact_phone' => '999888777',
                'subtotal' => $subtotal,
                'tax_amount' => round($total - $subtotal, 2),
                'total' => $total,
                'paid_amount' => 0,
                'balance_amount' => $total,
                'observations' => 'Pedido demo para validar observaciones del modulo de pedidos.',
                'approved_at' => $config['order_status'] === 'pending' ? null : $now,
                'status' => true,
                'created_by' => $userId,
                'updated_by' => $userId,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $orderId = (int) DB::table('commercial_orders')->where('code', $code)->value('id');
            DB::table('commercial_order_items')->updateOrInsert([
                'commercial_order_id' => $orderId,
                'article_id' => $articleId,
            ], [
                'presentation_id' => DB::table('article_presentations')->where('article_id', $articleId)->where('name', 'Unidad')->value('id'),
                'warehouse_id' => $warehouseId,
                'stock_available' => $config['article'] === 'DEMO-PED-001' ? 100 : 50,
                'cost_unit' => $config['article'] === 'DEMO-PED-001' ? 30 : 60,
                'price_unit' => $price,
                'presentation_units' => 1,
                'quantity' => $config['qty'],
                'total' => $total,
                'price_source' => 'demo',
                'status' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }
}
