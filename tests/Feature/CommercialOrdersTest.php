<?php

namespace Tests\Feature;

use App\Models\ActivePrinciple;
use App\Models\Article;
use App\Models\Business;
use App\Models\Client;
use App\Models\ClientDeliveryAddress;
use App\Models\ClientDistributionNetwork;
use App\Models\EntryNote;
use App\Models\EntryNoteItem;
use App\Models\Laboratory;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CommercialOrdersTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(): User
    {
        return User::create([
            'name' => 'Commercial',
            'lastname' => 'Tester',
            'fullname' => 'Commercial Tester',
            'username' => 'commercial_' . uniqid(),
            'email' => 'commercial_' . uniqid() . '@mail.com',
            'password' => Hash::make('secret'),
            'status' => true,
        ]);
    }

    public function test_can_create_regular_client_commercial_order(): void
    {
        $user = $this->makeUser();
        $business = Business::where('business_key', 'kamary_peru')->firstOrFail();
        $branch = $business->branches()->create([
            'name' => 'Sede Pedido QA',
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        $warehouse = Warehouse::create([
            'name' => 'Almacen Pedido QA',
            'business_branch_id' => $branch->id,
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        $client = Client::create([
            'document_type' => 'RUC',
            'document_number' => '20600000001',
            'client_kind' => 'regular',
            'full_name' => 'Cliente Pedido QA',
            'commercial_channel' => 'Farmacia',
            'segment' => 'Regular',
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        $network = ClientDistributionNetwork::create([
            'client_id' => $client->id,
            'code' => 'NET-QA-001',
            'name' => 'Red Pedido QA',
            'commercial_channel' => 'Farmacia',
            'segment' => 'Regular',
            'is_default' => true,
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        $address = ClientDeliveryAddress::create([
            'client_distribution_network_id' => $network->id,
            'client_id' => $client->id,
            'code' => 'DIR-QA-001',
            'name' => 'Direccion Pedido QA',
            'ubigeo' => '150101',
            'address' => 'Av. QA 123',
            'reference' => 'Referencia QA',
            'contact_name' => 'Contacto QA',
            'contact_phone' => '999999999',
            'is_default' => true,
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        $unit = Unit::create([
            'name' => 'Unidad',
            'symbol' => 'UND',
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        $lab = Laboratory::create([
            'name' => 'Lab Pedido QA',
            'code' => 'LPEDQA',
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        $principle = ActivePrinciple::create([
            'laboratory_id' => $lab->id,
            'name' => 'Principio Pedido QA',
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        $article = Article::create([
            'code' => 'PED-QA-001',
            'name' => 'Articulo Pedido QA',
            'laboratory_id' => $lab->id,
            'active_principle_id' => $principle->id,
            'unit_id' => $unit->id,
            'status' => true,
            'margin_rule' => false,
            'igv_rule' => false,
            'units_per_article' => 1,
            'sale_price' => 50,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);

        $entry = EntryNote::create([
            'business_id' => $business->id,
            'business_branch_id' => $branch->id,
            'warehouse_id' => $warehouse->id,
            'document_type' => 'Factura',
            'currency' => 'PEN',
            'entry_status' => 'approved',
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        EntryNoteItem::create([
            'entry_note_id' => $entry->id,
            'batch_code' => 'PED-LOTE-001',
            'article_id' => $article->id,
            'warehouse_id' => $warehouse->id,
            'stock' => 20,
            'cost_unit' => 20,
            'quantity' => 20,
            'total' => 400,
            'status' => true,
        ]);

        $this->actingAs($user);

        $response = $this->post('/api/admin/commercial-orders', [
            'business_id' => $business->id,
            'business_branch_id' => $branch->id,
            'warehouse_id' => $warehouse->id,
            'client_id' => $client->id,
            'client_distribution_network_id' => $network->id,
            'client_delivery_address_id' => $address->id,
            'document_type' => 'Factura',
            'currency' => 'PEN',
            'payment_condition' => 'Contado',
            'payment_method' => 'Transferencia',
            'order_status' => 'confirmed',
            'dispatch_status' => 'pending',
            'billing_status' => 'pending',
            'issue_date' => '2026-05-22',
            'promised_delivery_at' => '2026-05-24',
            'installments' => 1,
            'first_due_date' => '2026-05-22',
            'delivery_address' => 'Av. QA 123',
            'delivery_reference' => 'Referencia QA',
            'ubigeo' => '150101',
            'dispatch_contact_name' => 'Contacto QA',
            'dispatch_contact_phone' => '999999999',
            'items' => [
                [
                    'article_id' => $article->id,
                    'warehouse_id' => $warehouse->id,
                    'price_unit' => 50,
                    'quantity' => 1,
                    'total' => 50,
                ],
            ],
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('commercial_orders', [
            'business_id' => $business->id,
            'warehouse_id' => $warehouse->id,
            'client_id' => $client->id,
            'order_status' => 'confirmed',
            'total' => 50,
        ]);
        $this->assertDatabaseHas('commercial_order_items', [
            'article_id' => $article->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => 1,
            'total' => 50,
        ]);
        $this->assertDatabaseHas('accounts_receivable', [
            'source_type' => 'commercial_order',
            'client_id' => $client->id,
            'total' => 50,
        ]);
    }
}
