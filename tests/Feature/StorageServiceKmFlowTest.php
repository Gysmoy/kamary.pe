<?php

namespace Tests\Feature;

use App\Http\Controllers\Admin\Storage\BillingControlController;
use App\Models\BillingDocument;
use App\Models\Business;
use App\Models\BusinessBranch;
use App\Models\Client;
use App\Models\ServiceOrder;
use App\Models\StorageInventoryCount;
use App\Models\StorageInventoryCountItem;
use App\Models\StorageLocation;
use App\Models\User;
use App\Models\Warehouse;
use App\Support\BusinessScope;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class StorageServiceKmFlowTest extends TestCase
{
    use RefreshDatabase;

    private function user(): User
    {
        return User::create([
            'name' => 'Storage',
            'lastname' => 'Tester',
            'fullname' => 'Storage Tester',
            'username' => 'storage_' . uniqid(),
            'email' => 'storage_' . uniqid() . '@mail.com',
            'password' => Hash::make('secret'),
            'status' => true,
        ]);
    }

    private function storageContext(User $user): array
    {
        $business = Business::updateOrCreate(
            ['business_key' => BusinessScope::KAMARY_MEDICALS],
            [
                'name' => 'Kamary Medical',
                'description' => null,
                'status' => true,
                'created_by' => $user->id,
                'updated_by' => $user->id,
            ]
        );

        $branch = BusinessBranch::create([
            'business_id' => $business->id,
            'name' => 'Almacenamiento',
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);

        $warehouse = Warehouse::create([
            'business_branch_id' => $branch->id,
            'name' => 'Camara 01',
            'description' => null,
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);

        $clientA = Client::create([
            'document_type' => 'RUC',
            'document_number' => '20' . str_pad((string) $user->id, 9, '0', STR_PAD_LEFT),
            'client_kind' => 'regular',
            'module_scope' => 'storage',
            'full_name' => 'Cliente Storage A',
            'has_storage_service' => true,
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);

        $clientB = Client::create([
            'document_type' => 'RUC',
            'document_number' => '21' . str_pad((string) $user->id, 9, '0', STR_PAD_LEFT),
            'client_kind' => 'regular',
            'module_scope' => 'storage',
            'full_name' => 'Cliente Storage B',
            'has_storage_service' => true,
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);

        return compact('business', 'branch', 'warehouse', 'clientA', 'clientB');
    }

    public function test_storage_location_is_assigned_to_one_storage_client(): void
    {
        $user = $this->user();
        $context = $this->storageContext($user);

        $this->actingAs($user)->withoutMiddleware();

        $response = $this->post('/api/admin/storage/kardex/locations', [
            'warehouse_id' => $context['warehouse']->id,
            'client_id' => $context['clientA']->id,
            'code' => 'A-01',
            'temperature_range' => '2°C a 8°C',
            'status' => true,
        ]);

        $response->assertStatus(200)->assertJson(['status' => 200]);
        $this->assertDatabaseHas('storage_locations', [
            'warehouse_id' => $context['warehouse']->id,
            'client_id' => $context['clientA']->id,
            'code' => 'A-01',
        ]);

        $location = StorageLocation::firstWhere('code', 'A-01');
        $response = $this->post('/api/admin/storage/kardex/locations', [
            'id' => $location->id,
            'warehouse_id' => $context['warehouse']->id,
            'client_id' => $context['clientB']->id,
            'code' => 'A-01',
            'temperature_range' => '2°C a 8°C',
            'status' => true,
        ]);

        $response->assertStatus(400);
        $this->assertEquals($context['clientA']->id, $location->fresh()->client_id);
    }

    public function test_storage_inventory_rejects_location_from_another_client(): void
    {
        $user = $this->user();
        $context = $this->storageContext($user);

        StorageLocation::create([
            'warehouse_id' => $context['warehouse']->id,
            'client_id' => $context['clientA']->id,
            'code' => 'A-01',
            'temperature_range' => '2°C a 8°C',
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);

        $this->actingAs($user)->withoutMiddleware();

        $this->post('/api/admin/storage/inventory/preview', [
            'warehouse_id' => $context['warehouse']->id,
            'client_id' => $context['clientB']->id,
            'location' => 'A-01',
        ])->assertStatus(400);
    }

    public function test_storage_billing_control_excludes_general_service_orders(): void
    {
        $user = $this->user();
        $context = $this->storageContext($user);

        $storageOrder = $this->serviceOrder($context, $user, 'storage_service', 'OSA-001');
        $generalOrder = $this->serviceOrder($context, $user, 'storage_general', 'OSG-001');

        $this->billingDocument($context, $user, $storageOrder, 'PRE-001');
        $this->billingDocument($context, $user, $generalOrder, 'PRE-002');

        $codes = (new BillingControlController())
            ->setPaginationInstance(BillingDocument::class)
            ->pluck('billing_documents.code')
            ->all();

        $this->assertContains('PRE-001', $codes);
        $this->assertNotContains('PRE-002', $codes);
    }

    public function test_storage_inventory_imports_km_adjustment_format(): void
    {
        $user = $this->user();
        $context = $this->storageContext($user);

        $count = StorageInventoryCount::create([
            'code' => 'INV-KM-001',
            'business_branch_id' => $context['branch']->id,
            'warehouse_id' => $context['warehouse']->id,
            'client_id' => $context['clientA']->id,
            'location' => 'A-01',
            'count_date' => now()->toDateString(),
            'inventory_status' => 'En espera',
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);

        $item = StorageInventoryCountItem::create([
            'storage_inventory_count_id' => $count->id,
            'warehouse_id' => $context['warehouse']->id,
            'lot' => 'L001',
            'expiration_date' => '2027-11-30',
            'article_name' => 'Producto KM',
            'client_name' => $context['clientA']->full_name,
            'unit_label' => 'UNIDAD',
            'location' => 'A-01',
            'temperature_range' => '15°C a 25°C',
            'system_stock' => 10,
            'real_stock' => 0,
            'difference' => -10,
            'status' => true,
        ]);

        $csv = implode("\n", [
            'Formato de ajuste de inventario - Camara 01',
            '',
            'ID,LOTE,F. VENCIMIENTO,ARTÍCULO,CLIENTE,U. MEDIDA,UBICACION,TEMPERATURA,STOCK SISTEMA,STOCK REAL',
            "{$item->id},L001,2027-11-30,Producto KM,{$context['clientA']->full_name},UNIDAD,A-01,15°C a 25°C,10,12.5",
        ]);
        $path = tempnam(sys_get_temp_dir(), 'km_inventory_');
        file_put_contents($path, "\xEF\xBB\xBF" . $csv);

        $this->actingAs($user)->withoutMiddleware()
            ->post("/api/admin/storage/inventory/{$count->id}/import", [
                'format_file' => new UploadedFile($path, 'formato_km.csv', 'text/csv', null, true),
            ])
            ->assertStatus(200)
            ->assertJson(['status' => 200]);

        $item->refresh();
        $this->assertEquals(12.5, (float) $item->real_stock);
        $this->assertEquals(2.5, (float) $item->difference);
        $this->assertEquals('Con diferencias', $count->fresh()->inventory_status);
    }

    private function serviceOrder(array $context, User $user, string $orderType, string $code): ServiceOrder
    {
        return ServiceOrder::create([
            'code' => $code,
            'order_type' => $orderType,
            'business_id' => $context['business']->id,
            'business_branch_id' => $context['branch']->id,
            'client_id' => $context['clientA']->id,
            'seller_id' => $user->id,
            'expected_document_type' => 'Factura',
            'currency' => 'PEN',
            'payment_condition' => 'Contado',
            'installments' => 1,
            'issue_date' => now()->toDateString(),
            'order_status' => 'prefactured',
            'billing_status' => 'pending',
            'payment_status' => 'pending',
            'subtotal' => 100,
            'tax_amount' => 0,
            'total' => 100,
            'paid_amount' => 0,
            'balance_amount' => 100,
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
    }

    private function billingDocument(array $context, User $user, ServiceOrder $order, string $code): BillingDocument
    {
        return BillingDocument::create([
            'code' => $code,
            'source_type' => 'service_order',
            'source_id' => $order->id,
            'service_order_id' => $order->id,
            'business_id' => $context['business']->id,
            'business_branch_id' => $context['branch']->id,
            'client_id' => $context['clientA']->id,
            'provider' => 'facturadorpro5',
            'document_type' => 'Factura',
            'issue_date' => now()->toDateString(),
            'due_date' => now()->toDateString(),
            'currency' => 'PEN',
            'payment_condition' => 'Contado',
            'provider_mode' => 'demo',
            'subtotal' => 100,
            'tax_amount' => 0,
            'total' => 100,
            'local_status' => 'pending',
            'external_status' => 'draft',
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
    }
}
