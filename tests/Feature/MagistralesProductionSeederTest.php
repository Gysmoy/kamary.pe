<?php

namespace Tests\Feature;

use App\Models\ActivePrinciple;
use App\Models\Article;
use App\Models\Laboratory;
use App\Models\MagistralCategory;
use App\Models\MagistralFormat;
use App\Models\MagistralFormula;
use App\Models\MagistralFormulaItem;
use App\Models\MagistralIncome;
use App\Models\MagistralIncomeItem;
use App\Models\MagistralInventoryCount;
use App\Models\MagistralInventoryCountItem;
use App\Models\MagistralOutput;
use App\Models\MagistralOutputItem;
use App\Models\MagistralProductionOrder;
use App\Models\MagistralProductionOrderItem;
use App\Models\MagistralResponsible;
use App\Models\MagistralSale;
use App\Models\MagistralSaleItem;
use App\Models\MagistralSubcategory;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\Supplier;
use App\Models\Unit;
use App\Support\MagistralesStock;
use Database\Seeders\MagistralesProductionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MagistralesProductionSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_magistrales_production_seeder_populates_operational_modules(): void
    {
        $this->seed(MagistralesProductionSeeder::class);

        $this->assertSame(10, Unit::where('module_scope', 'magistrales')->where('symbol', 'like', 'MAG%')->count());
        $this->assertSame(10, Laboratory::where('code', 'like', 'MAGLAB-%')->count());
        $this->assertSame(10, ActivePrinciple::where('name', 'like', 'Principio Activo Magistral %')->count());
        $this->assertSame(10, MagistralCategory::where('code', 'like', 'MAG-CAT-%')->count());
        $this->assertSame(10, MagistralSubcategory::where('description', 'like', 'Subcategoria Magistral %')->count());
        $this->assertSame(10, MagistralFormat::whereIn('description', $this->formatDescriptions())->count());
        $this->assertSame(10, Supplier::where('module_scope', 'magistrales')->where('ruc', 'like', '99000%')->count());
        $this->assertSame(10, MagistralResponsible::where('document_number', 'like', 'MAGRESP%')->count());
        $this->assertSame(10, Article::where('module_scope', 'magistrales')->where('code', 'like', 'MAG-ART-%')->count());
        $this->assertSame(10, MagistralFormula::whereHas('article', fn($query) => $query->where('code', 'like', 'MAG-ART-%'))->count());
        $this->assertSame(20, MagistralFormulaItem::whereHas('formula.article', fn($query) => $query->where('code', 'like', 'MAG-ART-%'))->count());
        $this->assertSame(10, PurchaseOrder::where('module_scope', 'magistrales')->where('code', 'like', 'MAG-OC-%')->count());
        $this->assertSame(10, MagistralIncome::where('code', 'like', 'MAG-ING-%')->count());
        $this->assertSame(10, MagistralProductionOrder::where('code', 'like', 'MAG-OP-%')->count());
        $this->assertSame(10, MagistralOutput::where('code', 'like', 'MAG-SAL-%')->count());
        $this->assertSame(10, MagistralSale::where('code', 'like', 'MAG-VTA-%')->count());
        $this->assertSame(10, MagistralInventoryCount::where('code', 'like', 'MAG-INV-%')->count());

        $article = Article::where('code', 'MAG-ART-001')->firstOrFail();
        $this->assertGreaterThan(0, MagistralesStock::stock($article->id));
        $this->assertGreaterThanOrEqual(3, MagistralesStock::movementRows($article->id)->count());
        $valuationRows = MagistralesStock::valuationRows()
            ->filter(fn(array $row) => str_starts_with((string)$row['article_code'], 'MAG-ART-'));
        $this->assertSame(10, $valuationRows->count());
        $this->assertSame(5, MagistralSale::where('code', 'like', 'MAG-VTA-%')->where('is_quote', true)->count());
        $this->assertSame(5, MagistralSale::where('code', 'like', 'MAG-VTA-%')->where('is_quote', false)->count());
    }

    public function test_magistrales_production_seeder_is_idempotent(): void
    {
        $this->seed(MagistralesProductionSeeder::class);
        $firstCounts = $this->seededCounts();

        $this->seed(MagistralesProductionSeeder::class);

        $this->assertSame($firstCounts, $this->seededCounts());
    }

    private function seededCounts(): array
    {
        return [
            'categories' => MagistralCategory::where('code', 'like', 'MAG-CAT-%')->count(),
            'formats' => MagistralFormat::whereIn('description', $this->formatDescriptions())->count(),
            'articles' => Article::where('module_scope', 'magistrales')->where('code', 'like', 'MAG-ART-%')->count(),
            'formulas' => MagistralFormula::whereHas('article', fn($query) => $query->where('code', 'like', 'MAG-ART-%'))->count(),
            'formula_items' => MagistralFormulaItem::whereHas('formula.article', fn($query) => $query->where('code', 'like', 'MAG-ART-%'))->count(),
            'purchase_orders' => PurchaseOrder::where('module_scope', 'magistrales')->where('code', 'like', 'MAG-OC-%')->count(),
            'purchase_order_items' => PurchaseOrderItem::whereHas('purchaseOrder', fn($query) => $query->where('code', 'like', 'MAG-OC-%'))->count(),
            'incomes' => MagistralIncome::where('code', 'like', 'MAG-ING-%')->count(),
            'income_items' => MagistralIncomeItem::whereHas('income', fn($query) => $query->where('code', 'like', 'MAG-ING-%'))->count(),
            'production_orders' => MagistralProductionOrder::where('code', 'like', 'MAG-OP-%')->count(),
            'production_order_items' => MagistralProductionOrderItem::whereHas('productionOrder', fn($query) => $query->where('code', 'like', 'MAG-OP-%'))->count(),
            'outputs' => MagistralOutput::where('code', 'like', 'MAG-SAL-%')->count(),
            'output_items' => MagistralOutputItem::whereHas('output', fn($query) => $query->where('code', 'like', 'MAG-SAL-%'))->count(),
            'sales' => MagistralSale::where('code', 'like', 'MAG-VTA-%')->count(),
            'sale_items' => MagistralSaleItem::whereHas('sale', fn($query) => $query->where('code', 'like', 'MAG-VTA-%'))->count(),
            'inventory_counts' => MagistralInventoryCount::where('code', 'like', 'MAG-INV-%')->count(),
            'inventory_count_items' => MagistralInventoryCountItem::whereHas('inventoryCount', fn($query) => $query->where('code', 'like', 'MAG-INV-%'))->count(),
        ];
    }

    private function formatDescriptions(): array
    {
        return [
            'Capsulas x 30',
            'Capsulas x 60',
            'Jarabe 120 ml',
            'Crema 30 g',
            'Crema 60 g',
            'Gel 50 g',
            'Solucion 100 ml',
            'Suspension 150 ml',
            'Gotas 30 ml',
            'Pote 100 g',
        ];
    }
}
