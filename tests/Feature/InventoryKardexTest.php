<?php

namespace Tests\Feature;

use App\Models\ActivePrinciple;
use App\Models\Article;
use App\Models\Business;
use App\Models\EntryNote;
use App\Models\EntryNoteItem;
use App\Models\ExitNote;
use App\Models\ExitNoteItem;
use App\Models\Laboratory;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class InventoryKardexTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(): User
    {
        return User::create([
            'name' => 'Inventory',
            'lastname' => 'Tester',
            'fullname' => 'Inventory Tester',
            'username' => 'inventory_' . uniqid(),
            'email' => 'inventory_' . uniqid() . '@mail.com',
            'password' => Hash::make('secret'),
            'status' => true,
        ]);
    }

    public function test_inventory_calculates_stock_from_entry_and_exit_notes(): void
    {
        $user = $this->makeUser();

        $business = Business::create([
            'name' => 'Empresa Inv',
            'description' => null,
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        $warehouse = Warehouse::create([
            'name' => 'Almacen Inv',
            'description' => null,
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
            'name' => 'Lab Inv',
            'code' => 'LABINV',
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        $principle = ActivePrinciple::create([
            'laboratory_id' => $lab->id,
            'name' => 'Principio Inv',
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        $article = Article::create([
            'code' => 'INV-001',
            'name' => 'Articulo Inventario',
            'laboratory_id' => $lab->id,
            'active_principle_id' => $principle->id,
            'unit_id' => $unit->id,
            'status' => true,
            'margin_rule' => false,
            'igv_rule' => false,
            'units_per_article' => 1,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);

        $entry = EntryNote::create([
            'business_id' => $business->id,
            'warehouse_id' => $warehouse->id,
            'document_type' => 'Boleta',
            'currency' => 'PEN',
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        EntryNoteItem::create([
            'entry_note_id' => $entry->id,
            'batch_code' => 'INV-L-01',
            'article_id' => $article->id,
            'warehouse_id' => $warehouse->id,
            'stock' => 10,
            'cost_unit' => 5,
            'quantity' => 10,
            'total' => 50,
            'status' => true,
        ]);

        $exit = ExitNote::create([
            'business_id' => $business->id,
            'warehouse_id' => $warehouse->id,
            'client_name' => 'Cliente Inv',
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        ExitNoteItem::create([
            'exit_note_id' => $exit->id,
            'batch_code' => 'INV-L-01',
            'article_id' => $article->id,
            'warehouse_id' => $warehouse->id,
            'stock' => 10,
            'quantity' => 4,
            'total' => 4,
            'status' => true,
        ]);

        $this->actingAs($user);

        $response = $this->post('/api/admin/inventory/paginate', [
            'isLoadingAll' => true,
            'take' => 100,
            'requireTotalCount' => true,
            'filter' => ['stock', '>', 0],
        ]);

        $response->assertStatus(200);
        $articleRow = collect($response->json('data'))->firstWhere('id', $article->id);
        $this->assertNotNull($articleRow);
        $this->assertEquals(10.0, (float)$articleRow['qty_in']);
        $this->assertEquals(4.0, (float)$articleRow['qty_out']);
    }

    public function test_kardex_filters_by_business_laboratory_and_article(): void
    {
        $user = $this->makeUser();

        $business = Business::create([
            'name' => 'Empresa Kardex',
            'description' => null,
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        $otherBusiness = Business::create([
            'name' => 'Empresa Other',
            'description' => null,
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        $warehouse = Warehouse::create([
            'name' => 'Almacen Kardex',
            'description' => null,
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
            'name' => 'Lab Kardex',
            'code' => 'LABKDX',
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        $principle = ActivePrinciple::create([
            'laboratory_id' => $lab->id,
            'name' => 'Principio Kardex',
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        $article = Article::create([
            'code' => 'KDX-001',
            'name' => 'Articulo Kardex',
            'laboratory_id' => $lab->id,
            'active_principle_id' => $principle->id,
            'unit_id' => $unit->id,
            'status' => true,
            'margin_rule' => false,
            'igv_rule' => false,
            'units_per_article' => 1,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);

        $entry = EntryNote::create([
            'business_id' => $business->id,
            'warehouse_id' => $warehouse->id,
            'document_type' => 'Boleta',
            'currency' => 'PEN',
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        EntryNoteItem::create([
            'entry_note_id' => $entry->id,
            'batch_code' => 'KDX-L-01',
            'article_id' => $article->id,
            'warehouse_id' => $warehouse->id,
            'stock' => 5,
            'cost_unit' => 6,
            'quantity' => 5,
            'total' => 30,
            'status' => true,
        ]);

        $exit = ExitNote::create([
            'business_id' => $business->id,
            'warehouse_id' => $warehouse->id,
            'client_name' => 'Cliente Kardex',
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        ExitNoteItem::create([
            'exit_note_id' => $exit->id,
            'batch_code' => 'KDX-L-01',
            'article_id' => $article->id,
            'warehouse_id' => $warehouse->id,
            'stock' => 5,
            'quantity' => 2,
            'total' => 2,
            'status' => true,
        ]);

        // Movimiento que no debe entrar por filtro de empresa
        $otherEntry = EntryNote::create([
            'business_id' => $otherBusiness->id,
            'warehouse_id' => $warehouse->id,
            'document_type' => 'Boleta',
            'currency' => 'PEN',
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        EntryNoteItem::create([
            'entry_note_id' => $otherEntry->id,
            'batch_code' => 'KDX-L-02',
            'article_id' => $article->id,
            'warehouse_id' => $warehouse->id,
            'stock' => 4,
            'cost_unit' => 6,
            'quantity' => 4,
            'total' => 24,
            'status' => true,
        ]);

        $this->actingAs($user);

        $response = $this->post('/api/admin/kardex/paginate', [
            'isLoadingAll' => true,
            'take' => 100,
            'business_id' => $business->id,
            'laboratory_id' => $lab->id,
            'article_id' => $article->id,
            'requireTotalCount' => true,
        ]);

        $response->assertStatus(200);
        $rows = collect($response->json('data'));
        $this->assertCount(2, $rows);
        $this->assertTrue($rows->contains(fn($row) => $row['movement_type'] === 'Entrada'));
        $this->assertTrue($rows->contains(fn($row) => $row['movement_type'] === 'Salida'));
    }
}
