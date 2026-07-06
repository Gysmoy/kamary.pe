<?php

namespace Tests\Feature;

use App\Models\ActivePrinciple;
use App\Models\Article;
use App\Models\Business;
use App\Models\InventoryCountItem;
use App\Models\Laboratory;
use App\Models\Unit;
use App\Models\User;
use App\Support\BusinessScope;
use App\Support\MagistralesStock;
use App\Support\MagistralesWarehouse;
use Database\Seeders\ModulePermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class MagistralesStockFlowsTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(): User
    {
        $this->seed(ModulePermissionsSeeder::class);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $user = User::create([
            'name' => 'Magistrales',
            'lastname' => 'Tester',
            'fullname' => 'Magistrales Tester',
            'username' => 'mag_' . uniqid(),
            'email' => 'mag_' . uniqid() . '@mail.com',
            'password' => Hash::make('secret'),
            'status' => true,
        ]);
        $user->assignRole('Admin');

        return $user;
    }

    private function makeArticle(User $user): array
    {
        $business = Business::firstOrCreate(
            ['business_key' => BusinessScope::KAMARY_MEDICALS],
            [
                'name' => 'Kamary Medicals QA',
                'description' => 'Empresa magistrales QA',
                'status' => true,
                'created_by' => $user->id,
                'updated_by' => $user->id,
            ]
        );
        $business->branches()->firstOrCreate([
            'name' => 'Sede Magistrales QA',
        ], [
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        // Almacen magistral: unificado con el almacen general (Magistrales = almacen 11 de Kamary Peru).
        $warehouse = MagistralesWarehouse::warehouse();
        $unit = Unit::create([
            'module_scope' => 'magistrales',
            'name' => 'Unidad Magistral',
            'symbol' => 'UND',
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        $lab = Laboratory::create([
            'name' => 'Lab Magistral QA',
            'code' => 'LABMAGQA',
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        $principle = ActivePrinciple::create([
            'laboratory_id' => $lab->id,
            'name' => 'Principio Magistral QA',
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        $article = Article::create([
            'module_scope' => 'magistrales',
            'code' => 'MAG-QA-001',
            'name' => 'Articulo Magistral QA',
            'article_type' => 'INSUMO',
            'magistral_presentation' => 'POLVO',
            'laboratory_id' => $lab->id,
            'active_principle_id' => $principle->id,
            'unit_id' => $unit->id,
            'status' => true,
            'margin_rule' => false,
            'igv_rule' => false,
            'units_per_article' => 1,
            'cost_price' => 8,
            'sale_price' => 12,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);

        return [$article, $warehouse];
    }

    public function test_magistrales_stock_flows_and_blocks_negative_stock(): void
    {
        $user = $this->makeUser();
        [$article, $warehouse] = $this->makeArticle($user);
        $finishedProduct = Article::create([
            'module_scope' => 'magistrales',
            'code' => 'MAG-QA-002',
            'name' => 'Producto Terminado Magistral QA',
            'article_type' => 'FORMULA',
            'magistral_presentation' => 'UNIDAD',
            'laboratory_id' => $article->laboratory_id,
            'active_principle_id' => $article->active_principle_id,
            'unit_id' => $article->unit_id,
            'status' => true,
            'margin_rule' => false,
            'igv_rule' => false,
            'units_per_article' => 1,
            'cost_price' => 10,
            'sale_price' => 15,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        $this->actingAs($user);

        // Entrada: Magistrales ahora usa la nota de entrada GENERAL apuntando al almacen magistral.
        Carbon::setTestNow('2026-05-10 10:00:00');
        $income = $this->post('/api/admin/entry-notes', [
            'warehouse_id' => $warehouse->id,
            'items' => [[
                'article_id' => $article->id,
                'quantity' => 5,
                'cost_unit' => 8,
            ]],
        ]);
        $income->assertStatus(200);
        $this->assertEquals(5.0, MagistralesStock::stock($article->id, $warehouse->id));

        // Salida: nota de salida GENERAL apuntando al almacen magistral.
        Carbon::setTestNow('2026-05-11 10:00:00');
        $output = $this->post('/api/admin/exit-notes', [
            'warehouse_id' => $warehouse->id,
            'items' => [[
                'article_id' => $article->id,
                'quantity' => 4,
            ]],
        ]);
        $output->assertStatus(200);
        $this->assertEquals(1.0, MagistralesStock::stock($article->id, $warehouse->id));

        // Produccion sigue en su propio endpoint de Magistrales (sin cambios).
        Carbon::setTestNow('2026-05-12 10:00:00');
        $production = $this->post('/api/admin/magistrales/production-orders', [
            'order_status' => 'finished',
            'destination_warehouse_id' => $warehouse->id,
            'article_id' => $finishedProduct->id,
            'quantity' => 2,
            'registration_date' => now()->toDateString(),
            'items' => [[
                'article_id' => $article->id,
                'quantity' => 1,
                'total' => 1,
            ]],
        ]);
        $production->assertStatus(200);
        $this->assertEquals(0.0, MagistralesStock::stock($article->id, $warehouse->id));
        $this->assertEquals(2.0, MagistralesStock::stock($finishedProduct->id, $warehouse->id));

        Carbon::setTestNow('2026-05-13 10:00:00');
        $blockedOutput = $this->post('/api/admin/exit-notes', [
            'warehouse_id' => $warehouse->id,
            'items' => [[
                'article_id' => $article->id,
                'quantity' => 2,
            ]],
        ]);
        $blockedOutput->assertStatus(400);
        $this->assertStringContainsString('Stock insuficiente', $blockedOutput->json('message'));

        // Ventas siguen en su propio endpoint de Magistrales (sin cambios).
        $quote = $this->post('/api/admin/magistrales/sales', [
            'payment_status' => 'pending',
            'patient' => 'Paciente QA',
            'is_quote' => true,
            'items' => [[
                'article_id' => $article->id,
                'warehouse_id' => $warehouse->id,
                'quantity' => 10,
                'unit_price' => 12,
            ]],
        ]);
        $quote->assertStatus(200);
        $this->assertEquals(0.0, MagistralesStock::stock($article->id, $warehouse->id));

        $blockedSale = $this->post('/api/admin/magistrales/sales', [
            'payment_status' => 'pending',
            'patient' => 'Paciente QA',
            'is_quote' => false,
            'items' => [[
                'article_id' => $article->id,
                'warehouse_id' => $warehouse->id,
                'quantity' => 2,
                'unit_price' => 12,
            ]],
        ]);
        $blockedSale->assertStatus(400);
        $this->assertStringContainsString('Stock insuficiente', $blockedSale->json('message'));

        Carbon::setTestNow('2026-05-14 10:00:00');
        $replenishment = $this->post('/api/admin/entry-notes', [
            'warehouse_id' => $warehouse->id,
            'items' => [[
                'article_id' => $article->id,
                'quantity' => 1,
                'cost_unit' => 8,
            ]],
        ]);
        $replenishment->assertStatus(200);

        Carbon::setTestNow('2026-05-15 10:00:00');
        $sale = $this->post('/api/admin/magistrales/sales', [
            'payment_status' => 'paid',
            'patient' => 'Paciente QA',
            'is_quote' => false,
            'items' => [[
                'article_id' => $article->id,
                'warehouse_id' => $warehouse->id,
                'quantity' => 1,
                'unit_price' => 12,
            ]],
        ]);
        $sale->assertStatus(200);
        $this->assertEquals(0.0, MagistralesStock::stock($article->id, $warehouse->id));

        // Kardex: endpoint GENERAL. Cada movimiento se registro en un dia distinto para que el
        // orden cronologico del reporte no dependa del desempate alfabetico interno del kardex
        // general (entry-N/exit-N) cuando dos movimientos comparten la misma fecha.
        $movements = $this->post('/api/admin/kardex/movements', [
            'article_id' => $article->id,
            'warehouse_id' => $warehouse->id,
        ]);
        $movements->assertStatus(200);

        $rows = collect($movements->json('data'));
        // El kardex general solo distingue Entrada/Salida (no "Consumo produccion" ni "Venta"
        // como el kardex especifico de Magistrales que fue removido); el consumo de produccion
        // y la venta se reflejan como salidas mediante el mirror del ledger general.
        $this->assertSame(['Entrada', 'Salida', 'Salida', 'Entrada', 'Salida'], $rows->pluck('operation')->values()->all());
        $this->assertEquals([5.0, 1.0, 0.0, 1.0, 0.0], $rows->pluck('balance')->map(fn($value) => (float)$value)->values()->all());

        $productMovements = $this->post('/api/admin/kardex/movements', [
            'article_id' => $finishedProduct->id,
            'warehouse_id' => $warehouse->id,
        ]);
        $productMovements->assertStatus(200);
        $productRows = collect($productMovements->json('data'));
        $this->assertSame(['Entrada'], $productRows->pluck('operation')->values()->all());
        $this->assertEquals([2.0], $productRows->pluck('balance')->map(fn($value) => (float)$value)->values()->all());
        Carbon::setTestNow();
    }

    public function test_magistrales_stock_and_inventory_use_lot_and_expiration(): void
    {
        $user = $this->makeUser();
        [$article, $warehouse] = $this->makeArticle($user);
        $this->actingAs($user);

        Carbon::setTestNow('2026-05-10 11:00:00');
        $income = $this->post('/api/admin/entry-notes', [
            'warehouse_id' => $warehouse->id,
            'items' => [
                [
                    'article_id' => $article->id,
                    'quantity' => 2,
                    'expiration_date' => '2027-01-31',
                    'lot' => 'L-001',
                    'cost_unit' => 8,
                ],
                [
                    'article_id' => $article->id,
                    'quantity' => 3,
                    'expiration_date' => '2027-02-28',
                    'lot' => 'L-002',
                    'cost_unit' => 8,
                ],
            ],
        ]);
        $income->assertStatus(200);

        $this->assertEquals(5.0, MagistralesStock::stock($article->id, $warehouse->id));
        $this->assertEquals(2.0, MagistralesStock::stock($article->id, $warehouse->id, 'L-001', '2027-01-31'));
        $this->assertEquals(3.0, MagistralesStock::stock($article->id, $warehouse->id, 'L-002', '2027-02-28'));

        $blockedOutput = $this->post('/api/admin/exit-notes', [
            'warehouse_id' => $warehouse->id,
            'items' => [[
                'article_id' => $article->id,
                'lot' => 'L-001',
                'expiration_date' => '2027-01-31',
                'quantity' => 3,
            ]],
        ]);
        $blockedOutput->assertStatus(400);
        $this->assertStringContainsString('Stock insuficiente', $blockedOutput->json('message'));

        $output = $this->post('/api/admin/exit-notes', [
            'warehouse_id' => $warehouse->id,
            'items' => [[
                'article_id' => $article->id,
                'lot' => 'L-001',
                'expiration_date' => '2027-01-31',
                'quantity' => 1,
            ]],
        ]);
        $output->assertStatus(200);

        $this->assertEquals(4.0, MagistralesStock::stock($article->id, $warehouse->id));
        $this->assertEquals(1.0, MagistralesStock::stock($article->id, $warehouse->id, 'L-001', '2027-01-31'));

        // Inventario: endpoints GENERALES de Admin\InventoryController. El endpoint dedicado
        // "/magistrales/inventory/stock" (lookup puntual por lote) fue removido y no tiene
        // equivalente general por HTTP; el stock por lote ya se valido arriba directamente via
        // MagistralesStock::stock(), que es la misma fuente que usa el inventario general.
        $inventory = $this->post('/api/admin/inventory', [
            'warehouse_id' => $warehouse->id,
        ]);
        $inventory->assertStatus(200);

        $items = collect($inventory->json('data.items'));
        $lotItem = $items->firstWhere('lot', 'L-001');
        $this->assertNotNull($lotItem);
        $this->assertEquals(1.0, (float)$lotItem['system_stock']);

        // El inventario general no acepta "real_stock" inline al crear el conteo (siempre nace
        // en 0 para todo lo que tenga stock); el stock real se carga mediante importacion CSV.
        $countId = $inventory->json('data.id');
        $csvRows = [
            ['ID', 'CODIGO LOTE', 'NOMBRE', 'LABORATORIO', 'UBICACION', 'STOCK SISTEMA', 'STOCK REAL'],
            [$lotItem['id'], 'L-001', $lotItem['article_name'], $lotItem['laboratory_name'], '', '1.000', '0.5'],
        ];
        $csv = implode("\n", array_map(fn($row) => implode(',', $row), $csvRows)) . "\n";
        $file = UploadedFile::fake()->createWithContent('formato.csv', $csv);

        $import = $this->post("/api/admin/inventory/{$countId}/import", [
            'format_file' => $file,
        ]);
        $import->assertStatus(200);

        $inventoryItem = InventoryCountItem::query()->find($lotItem['id']);
        $this->assertNotNull($inventoryItem);
        $this->assertEquals(1.0, (float)$inventoryItem->system_stock);
        $this->assertEquals(0.5, (float)$inventoryItem->real_stock);
        $this->assertEquals(-0.5, (float)$inventoryItem->difference);
        Carbon::setTestNow();
    }
}
