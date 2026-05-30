<?php

namespace Tests\Feature;

use App\Models\ActivePrinciple;
use App\Models\Article;
use App\Models\Business;
use App\Models\BusinessBranch;
use App\Models\EntryNote;
use App\Models\EntryNoteItem;
use App\Models\ExitNote;
use App\Models\ExitNoteItem;
use App\Models\Laboratory;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use App\Support\BusinessScope;
use Database\Seeders\ModulePermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class InventoryKardexTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(): User
    {
        $this->seed(ModulePermissionsSeeder::class);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $user = User::create([
            'name' => 'Inventory',
            'lastname' => 'Tester',
            'fullname' => 'Inventory Tester',
            'username' => 'inventory_' . uniqid(),
            'email' => 'inventory_' . uniqid() . '@mail.com',
            'password' => Hash::make('secret'),
            'status' => true,
        ]);
        $user->assignRole('Admin');

        return $user;
    }

    private function makePeruFixture(User $user): array
    {
        $business = Business::where('business_key', BusinessScope::KAMARY_PERU)->firstOrFail();
        $branch = BusinessBranch::create([
            'business_id' => $business->id,
            'name' => 'Principal Test',
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        $warehouse = Warehouse::create([
            'business_branch_id' => $branch->id,
            'name' => 'Almacen Peru Test',
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
            'name' => 'Lab Peru',
            'code' => 'LABPERU',
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        $principle = ActivePrinciple::create([
            'laboratory_id' => $lab->id,
            'name' => 'Principio Peru',
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        $article = Article::create([
            'code' => 'PER-001',
            'module_scope' => 'standard',
            'business_id' => $business->id,
            'warehouse_id' => $warehouse->id,
            'name' => 'Articulo Peru',
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

        return compact('business', 'branch', 'warehouse', 'unit', 'lab', 'principle', 'article');
    }

    private function createEntry(User $user, Business $business, BusinessBranch $branch, Warehouse $warehouse, Article $article, float $quantity): EntryNote
    {
        $entry = EntryNote::create([
            'business_id' => $business->id,
            'business_branch_id' => $branch->id,
            'warehouse_id' => $warehouse->id,
            'entry_date' => '2026-05-01',
            'document_type' => 'Boleta',
            'document_series' => 'B001',
            'document_sequence' => '1',
            'document_date' => '2026-05-01',
            'currency' => 'PEN',
            'entry_status' => 'approved',
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        EntryNoteItem::create([
            'entry_note_id' => $entry->id,
            'batch_code' => 'LOT-01',
            'lot' => 'LOT-01',
            'article_id' => $article->id,
            'warehouse_id' => $warehouse->id,
            'stock' => 0,
            'cost_unit' => 5,
            'location' => 'A-01',
            'quantity' => $quantity,
            'total' => $quantity * 5,
            'status' => true,
        ]);

        return $entry;
    }

    public function test_inventory_registers_imports_and_applies_physical_count(): void
    {
        $user = $this->makeUser();
        ['business' => $business, 'branch' => $branch, 'warehouse' => $warehouse, 'lab' => $lab, 'article' => $article] = $this->makePeruFixture($user);
        $this->createEntry($user, $business, $branch, $warehouse, $article, 10);

        $this->actingAs($user);

        $preview = $this->post('/api/admin/inventory/preview', [
            'warehouse_id' => $warehouse->id,
            'laboratory_id' => $lab->id,
        ]);
        $preview->assertStatus(200);
        $this->assertEquals(10.0, (float)$preview->json('data.0.system_stock'));
        $this->assertEquals(5.0, (float)$preview->json('data.0.cost_unit'));

        $registered = $this->post('/api/admin/inventory', [
            'warehouse_id' => $warehouse->id,
            'laboratory_id' => $lab->id,
        ]);
        $registered->assertStatus(200);
        $countId = $registered->json('data.id');
        $itemId = $registered->json('data.items.0.id');

        $csv = implode("\n", [
            'Formato de inventario fisico',
            '',
            'ID,CODIGO LOTE,NOMBRE,LABORATORIO,UBICACION,STOCK SISTEMA,STOCK REAL',
            "{$itemId},LOT-01,Articulo Peru,Lab Peru,A-01,10,12",
        ]);
        $path = tempnam(sys_get_temp_dir(), 'inventory_');
        file_put_contents($path, $csv);
        $file = new UploadedFile($path, 'inventario.csv', 'text/csv', null, true);

        $import = $this->post("/api/admin/inventory/{$countId}/import", [
            'format_file' => $file,
        ]);
        $import->assertStatus(200);
        $this->assertEquals('Con diferencias', $import->json('data.inventory_status'));
        $this->assertEquals(2.0, (float)$import->json('data.items.0.difference'));

        $apply = $this->post("/api/admin/inventory/{$countId}/apply");
        $apply->assertStatus(200);
        $this->assertEquals('Aplicado', $apply->json('data.inventory_status'));
        $this->assertDatabaseHas('entry_note_items', [
            'article_id' => $article->id,
            'warehouse_id' => $warehouse->id,
            'batch_code' => 'LOT-01',
            'quantity' => 2,
        ]);
    }

    public function test_kardex_lists_products_and_returns_movements_by_warehouse_and_dates(): void
    {
        $user = $this->makeUser();
        ['business' => $business, 'branch' => $branch, 'warehouse' => $warehouse, 'lab' => $lab, 'article' => $article] = $this->makePeruFixture($user);
        $this->createEntry($user, $business, $branch, $warehouse, $article, 5);

        $exit = ExitNote::create([
            'business_id' => $business->id,
            'business_branch_id' => $branch->id,
            'warehouse_id' => $warehouse->id,
            'client_name' => 'Cliente Kardex',
            'exit_date' => '2026-05-02',
            'document_type' => 'Salida',
            'document_series' => 'S001',
            'document_sequence' => '1',
            'document_date' => '2026-05-02',
            'exit_status' => 'approved',
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        ExitNoteItem::create([
            'exit_note_id' => $exit->id,
            'batch_code' => 'LOT-01',
            'article_id' => $article->id,
            'warehouse_id' => $warehouse->id,
            'stock' => 5,
            'location' => 'A-01',
            'quantity' => 2,
            'total' => 2,
            'status' => true,
        ]);

        $this->actingAs($user);

        $products = $this->post('/api/admin/kardex/paginate', [
            'isLoadingAll' => true,
            'take' => 100,
            'warehouse_id' => $warehouse->id,
            'laboratory_id' => $lab->id,
            'article_id' => $article->id,
            'requireTotalCount' => true,
        ]);
        $products->assertStatus(200);
        $row = collect($products->json('data'))->firstWhere('article_id', $article->id);
        $this->assertNotNull($row);
        $this->assertEquals(3.0, (float)$row['stock']);
        $this->assertEquals(15.0, (float)$row['total_cost']);

        $movements = $this->post('/api/admin/kardex/movements', [
            'article_id' => $article->id,
            'warehouse_id' => $warehouse->id,
            'start_date' => '2026-05-01',
            'end_date' => '2026-05-31',
        ]);
        $movements->assertStatus(200);
        $rows = collect($movements->json('data'));
        $this->assertCount(2, $rows);
        $this->assertEquals('Entrada', $rows[0]['operation']);
        $this->assertEquals(5.0, (float)$rows[0]['balance']);
        $this->assertEquals('Salida', $rows[1]['operation']);
        $this->assertEquals(3.0, (float)$rows[1]['balance']);
    }
}
