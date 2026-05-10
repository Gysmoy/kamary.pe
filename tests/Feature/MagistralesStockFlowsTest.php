<?php

namespace Tests\Feature;

use App\Models\ActivePrinciple;
use App\Models\Article;
use App\Models\Laboratory;
use App\Models\MagistralInventoryCountItem;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use App\Support\MagistralesStock;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class MagistralesStockFlowsTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(): User
    {
        return User::create([
            'name' => 'Magistrales',
            'lastname' => 'Tester',
            'fullname' => 'Magistrales Tester',
            'username' => 'mag_' . uniqid(),
            'email' => 'mag_' . uniqid() . '@mail.com',
            'password' => Hash::make('secret'),
            'status' => true,
        ]);
    }

    private function makeArticle(User $user): array
    {
        $warehouse = Warehouse::create([
            'name' => 'Almacen Magistral QA',
            'description' => null,
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
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

        Carbon::setTestNow('2026-05-10 10:00:00');
        $income = $this->post('/api/admin/magistrales/incomes', [
            'warehouse_id' => $warehouse->id,
            'document_type' => 'Boleta',
            'affects_igv' => false,
            'items' => [[
                'article_id' => $article->id,
                'quantity' => 5,
                'presentation' => 'UND',
                'price_without_igv' => 8,
                'price_with_igv' => 8,
            ]],
        ]);
        $income->assertStatus(200);
        $this->assertEquals(5.0, MagistralesStock::stock($article->id, $warehouse->id));

        Carbon::setTestNow('2026-05-10 10:00:01');
        $output = $this->post('/api/admin/magistrales/outputs', [
            'origin_warehouse_id' => $warehouse->id,
            'reason' => 'QA',
            'items' => [[
                'article_id' => $article->id,
                'quantity' => 4,
            ]],
        ]);
        $output->assertStatus(200);
        $this->assertEquals(1.0, MagistralesStock::stock($article->id, $warehouse->id));

        Carbon::setTestNow('2026-05-10 10:00:02');
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

        Carbon::setTestNow('2026-05-10 10:00:03');
        $blockedOutput = $this->post('/api/admin/magistrales/outputs', [
            'origin_warehouse_id' => $warehouse->id,
            'reason' => 'QA',
            'items' => [[
                'article_id' => $article->id,
                'quantity' => 2,
            ]],
        ]);
        $blockedOutput->assertStatus(400);
        $this->assertStringContainsString('Stock insuficiente', $blockedOutput->json('message'));

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

        Carbon::setTestNow('2026-05-10 10:00:04');
        $replenishment = $this->post('/api/admin/magistrales/incomes', [
            'warehouse_id' => $warehouse->id,
            'document_type' => 'Boleta',
            'affects_igv' => false,
            'items' => [[
                'article_id' => $article->id,
                'quantity' => 1,
                'presentation' => 'UND',
                'price_without_igv' => 8,
                'price_with_igv' => 8,
            ]],
        ]);
        $replenishment->assertStatus(200);

        Carbon::setTestNow('2026-05-10 10:00:05');
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

        $movements = $this->post('/api/admin/magistrales/kardex/movements', [
            'article_id' => $article->id,
            'warehouse_id' => $warehouse->id,
        ]);
        $movements->assertStatus(200);

        $rows = collect($movements->json('data'));
        $this->assertSame(['Ingreso', 'Salida', 'Consumo produccion', 'Ingreso', 'Venta'], $rows->pluck('operation')->values()->all());
        $this->assertEquals([5.0, 1.0, 0.0, 1.0, 0.0], $rows->pluck('balance')->map(fn($value) => (float)$value)->values()->all());

        $productMovements = $this->post('/api/admin/magistrales/kardex/movements', [
            'article_id' => $finishedProduct->id,
            'warehouse_id' => $warehouse->id,
        ]);
        $productMovements->assertStatus(200);
        $productRows = collect($productMovements->json('data'));
        $this->assertSame(['Produccion'], $productRows->pluck('operation')->values()->all());
        $this->assertEquals([2.0], $productRows->pluck('balance')->map(fn($value) => (float)$value)->values()->all());
        Carbon::setTestNow();
    }

    public function test_magistrales_stock_and_inventory_use_lot_and_expiration(): void
    {
        $user = $this->makeUser();
        [$article, $warehouse] = $this->makeArticle($user);
        $this->actingAs($user);

        Carbon::setTestNow('2026-05-10 11:00:00');
        $income = $this->post('/api/admin/magistrales/incomes', [
            'warehouse_id' => $warehouse->id,
            'document_type' => 'Boleta',
            'affects_igv' => false,
            'items' => [
                [
                    'article_id' => $article->id,
                    'quantity' => 2,
                    'presentation' => 'UND',
                    'expiration_date' => '2027-01-31',
                    'lot' => 'L-001',
                    'price_without_igv' => 8,
                    'price_with_igv' => 8,
                ],
                [
                    'article_id' => $article->id,
                    'quantity' => 3,
                    'presentation' => 'UND',
                    'expiration_date' => '2027-02-28',
                    'lot' => 'L-002',
                    'price_without_igv' => 8,
                    'price_with_igv' => 8,
                ],
            ],
        ]);
        $income->assertStatus(200);

        $this->assertEquals(5.0, MagistralesStock::stock($article->id, $warehouse->id));
        $this->assertEquals(2.0, MagistralesStock::stock($article->id, $warehouse->id, 'L-001', '2027-01-31'));
        $this->assertEquals(3.0, MagistralesStock::stock($article->id, $warehouse->id, 'L-002', '2027-02-28'));

        $blockedOutput = $this->post('/api/admin/magistrales/outputs', [
            'origin_warehouse_id' => $warehouse->id,
            'reason' => 'QA lote',
            'items' => [[
                'article_id' => $article->id,
                'lot' => 'L-001',
                'expiration_date' => '2027-01-31',
                'quantity' => 3,
            ]],
        ]);
        $blockedOutput->assertStatus(400);
        $this->assertStringContainsString('Stock insuficiente', $blockedOutput->json('message'));

        $output = $this->post('/api/admin/magistrales/outputs', [
            'origin_warehouse_id' => $warehouse->id,
            'reason' => 'QA lote',
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

        $stockLookup = $this->post('/api/admin/magistrales/inventory/stock', [
            'article_id' => $article->id,
            'warehouse_id' => $warehouse->id,
            'lot' => 'L-001',
            'expiration_date' => '2027-01-31',
        ]);
        $stockLookup->assertStatus(200);
        $this->assertEquals(1.0, (float)$stockLookup->json('data.stock'));

        $inventory = $this->post('/api/admin/magistrales/inventory', [
            'warehouse_id' => $warehouse->id,
            'count_date' => '2026-05-10',
            'items' => [[
                'article_id' => $article->id,
                'lot' => 'L-001',
                'expiration_date' => '2027-01-31',
                'system_stock' => 999,
                'real_stock' => 0.5,
            ]],
        ]);
        $inventory->assertStatus(200);

        $inventoryItem = MagistralInventoryCountItem::query()
            ->where('article_id', $article->id)
            ->where('lot', 'L-001')
            ->first();

        $this->assertNotNull($inventoryItem);
        $this->assertEquals(1.0, (float)$inventoryItem->system_stock);
        $this->assertEquals(-0.5, (float)$inventoryItem->difference);
        Carbon::setTestNow();
    }
}
