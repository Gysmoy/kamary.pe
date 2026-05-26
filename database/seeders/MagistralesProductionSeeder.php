<?php

namespace Database\Seeders;

use App\Models\Article;
use App\Models\Business;
use App\Models\BusinessBranch;
use App\Models\MagistralCategory;
use App\Models\MagistralFormula;
use App\Models\MagistralFormulaItem;
use App\Models\MagistralFormat;
use App\Models\MagistralInventoryCount;
use App\Models\MagistralInventoryCountItem;
use App\Models\MagistralLaboratory;
use App\Models\MagistralResponsible;
use App\Models\MagistralSubcategory;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use App\Support\BusinessScope;
use App\Support\MagistralesStock;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class MagistralesProductionSeeder extends Seeder
{
    private ?int $userId = null;

    public function run(): void
    {
        if (!Schema::hasTable('magistral_categories')) {
            return;
        }

        $this->userId = User::query()->orderBy('id')->value('id');

        DB::transaction(function () {
            $business = $this->ensureBusiness();
            $branch = $this->ensureBranch($business);
            $warehouse = $this->ensureWarehouse($branch);

            $this->ensureBaseCatalog($business, $warehouse);
        });
    }

    private function ensureBusiness(): Business
    {
        return Business::query()->updateOrCreate(
            ['business_key' => BusinessScope::KAMARY_MEDICALS],
            [
                'name' => 'Kamary Medicals',
                'trade_name' => 'Kamary Medicals',
                'description' => 'Unidad operativa para formulas magistrales.',
                'facturador_sync_status' => 'pending',
                'facturador_sync_message' => 'Completar configuracion fiscal antes de emitir comprobantes magistrales.',
                'status' => true,
                'updated_by' => $this->userId,
            ]
        );
    }

    private function ensureBranch(Business $business): BusinessBranch
    {
        return BusinessBranch::query()->updateOrCreate(
            [
                'business_id' => $business->id,
                'name' => 'Principal Magistrales',
            ],
            [
                'establishment_code' => '0000',
                'ubigeo' => '150101',
                'address' => 'Calle Leoncio Prado 830, Urb. La Vina, San Luis, Lima',
                'email' => 'magistrales@kamarymedicals.pe',
                'telephone' => '014856320',
                'facturador_sync_status' => 'pending',
                'facturador_sync_message' => 'Sede base del modulo Magistrales.',
                'series_factura' => 'FM01',
                'series_boleta' => 'BM01',
                'series_nota_credito' => 'FCM1',
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]
        );
    }

    private function ensureWarehouse(BusinessBranch $branch): Warehouse
    {
        return Warehouse::query()->updateOrCreate(
            [
                'business_branch_id' => $branch->id,
                'name' => 'Almacen Magistrales Principal',
            ],
            [
                'description' => 'Almacen fijo del modulo Magistrales.',
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]
        );
    }

    private function ensureBaseCatalog(Business $business, Warehouse $warehouse): void
    {
        $units = $this->ensureUnits();
        $categories = $this->ensureCategories($warehouse);
        $subcategories = $this->ensureSubcategories($categories);
        $formats = $this->ensureFormats();
        $laboratory = $this->ensureLaboratory();

        $this->ensureResponsible();
        $this->ensureSupplier();

        $articles = $this->ensureArticles($business, $units, $categories, $subcategories, $formats, $laboratory);
        $this->ensureFormula($articles, $units);
        $this->ensureInitialInventoryCount($warehouse, $articles);
    }

    /**
     * Unit symbols are globally unique, so Magistrales uses its own symbols
     * instead of reclassifying shared commercial units.
     */
    private function ensureUnits(): array
    {
        return [
            'UND' => Unit::query()->updateOrCreate(
                ['symbol' => 'MAG-UND'],
                [
                    'module_scope' => 'magistrales',
                    'name' => 'Unidad Magistral',
                    'status' => true,
                    'created_by' => $this->userId,
                    'updated_by' => $this->userId,
                ]
            ),
            'G' => Unit::query()->updateOrCreate(
                ['symbol' => 'MAG-G'],
                [
                    'module_scope' => 'magistrales',
                    'name' => 'Gramo Magistral',
                    'status' => true,
                    'created_by' => $this->userId,
                    'updated_by' => $this->userId,
                ]
            ),
            'ML' => Unit::query()->updateOrCreate(
                ['symbol' => 'MAG-ML'],
                [
                    'module_scope' => 'magistrales',
                    'name' => 'Mililitro Magistral',
                    'status' => true,
                    'created_by' => $this->userId,
                    'updated_by' => $this->userId,
                ]
            ),
        ];
    }

    private function ensureCategories(Warehouse $warehouse): array
    {
        $categories = [];
        $activeIds = [];

        foreach ([
            ['code' => 'MAG-CAT-001', 'description' => 'GINECOLOGIA'],
            ['code' => 'MAG-CAT-002', 'description' => 'INSUMOS'],
            ['code' => 'MAG-CAT-003', 'description' => 'ANDROLOGIA'],
        ] as $category) {
            $categories[$category['description']] = MagistralCategory::query()->updateOrCreate(
                ['code' => $category['code']],
                [
                    'description' => $category['description'],
                    'warehouse_id' => $warehouse->id,
                    'sale_material' => $category['description'] !== 'INSUMOS',
                    'status' => true,
                    'created_by' => $this->userId,
                    'updated_by' => $this->userId,
                ]
            );
            $activeIds[] = $categories[$category['description']]->id;
        }

        if (count($activeIds) > 0) {
            MagistralCategory::query()
                ->whereNotIn('id', $activeIds)
                ->update([
                    'status' => null,
                    'updated_by' => $this->userId,
                    'updated_at' => now(),
                ]);
        }

        return $categories;
    }

    private function ensureSubcategories(array $categories): array
    {
        $map = [
            'GINECOLOGIA' => ['Hormonal', 'Ovulos', 'Gel'],
            'INSUMOS' => ['Activos', 'Excipientes', 'Envases'],
            'ANDROLOGIA' => ['Capsulas', 'Soluciones'],
        ];

        $subcategories = [];

        foreach ($map as $categoryName => $items) {
            $category = $categories[$categoryName] ?? null;
            if (!$category) continue;

            foreach ($items as $description) {
                $subcategories[$categoryName][$description] = MagistralSubcategory::query()->updateOrCreate(
                    [
                        'magistral_category_id' => $category->id,
                        'description' => $description,
                    ],
                    [
                        'status' => true,
                        'created_by' => $this->userId,
                        'updated_by' => $this->userId,
                    ]
                );
            }
        }

        return $subcategories;
    }

    private function ensureFormats(): array
    {
        $formats = [];

        foreach ([
            ['description' => 'Capsulas x 30', 'quantity' => 30],
            ['description' => 'Crema 30 g', 'quantity' => 30],
            ['description' => 'Solucion 100 ml', 'quantity' => 100],
        ] as $format) {
            $formats[$format['description']] = MagistralFormat::query()->updateOrCreate(
                ['description' => $format['description']],
                [
                    'quantity' => $format['quantity'],
                    'status' => true,
                    'created_by' => $this->userId,
                    'updated_by' => $this->userId,
                ]
            );
        }

        return $formats;
    }

    private function ensureLaboratory(): MagistralLaboratory
    {
        return MagistralLaboratory::query()->updateOrCreate(
            ['code' => 'MAGLAB-001'],
            [
                'description' => 'Laboratorio Magistral Kamary',
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]
        );
    }

    private function ensureResponsible(): MagistralResponsible
    {
        return MagistralResponsible::query()->updateOrCreate(
            ['document_number' => 'MAG-RESP-001'],
            [
                'name' => 'Responsable Magistrales',
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]
        );
    }

    private function ensureSupplier(): Supplier
    {
        return Supplier::query()->updateOrCreate(
            ['ruc' => '20600000001'],
            [
                'module_scope' => 'magistrales',
                'business_name' => 'Proveedor Magistral Base',
                'trade_name' => 'Proveedor Magistral Base',
                'business_line' => 'Insumos magistrales',
                'billing_type' => 'contado',
                'credit_type' => 'sin_credito',
                'payment_condition' => 'contado',
                'payment_term_days' => 0,
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]
        );
    }

    private function ensureArticles(
        Business $business,
        array $units,
        array $categories,
        array $subcategories,
        array $formats,
        MagistralLaboratory $laboratory
    ): array {
        $articles = [];

        $baseData = [
            'module_scope' => 'magistrales',
            'business_id' => $business->id,
            'status' => true,
            'magistral_status' => 'active',
            'currency' => 'PEN',
            'stock_has_expiration' => true,
            'stock_has_lot' => true,
            'magistral_laboratory_id' => $laboratory->id,
            'created_by' => $this->userId,
            'updated_by' => $this->userId,
        ];

        $articles['base'] = Article::query()->updateOrCreate(
            ['module_scope' => 'magistrales', 'code' => 'MAG-INS-001'],
            array_merge($baseData, [
                'name' => 'Base excipiente magistral',
                'composition' => 'Excipiente base para preparaciones magistrales.',
                'article_type' => 'INSUMO',
                'magistral_category_id' => $categories['INSUMOS']->id ?? null,
                'sub_category' => optional($subcategories['INSUMOS']['Excipientes'] ?? null)->description,
                'magistral_presentation' => 'POLVO',
                'unit_id' => $units['G']->id,
                'stock_min' => 100,
                'stock_max' => 5000,
                'cost_price' => 1.50,
                'sale_price' => 2.10,
                'purchase_price_national' => 1.50,
                'sale_price_national' => 2.10,
            ])
        );

        $articles['active'] = Article::query()->updateOrCreate(
            ['module_scope' => 'magistrales', 'code' => 'MAG-INS-002'],
            array_merge($baseData, [
                'name' => 'Activo magistral demo',
                'composition' => 'Activo referencial para formulas magistrales.',
                'article_type' => 'INSUMO',
                'magistral_category_id' => $categories['INSUMOS']->id ?? null,
                'sub_category' => optional($subcategories['INSUMOS']['Activos'] ?? null)->description,
                'magistral_presentation' => 'POLVO',
                'unit_id' => $units['G']->id,
                'stock_min' => 10,
                'stock_max' => 500,
                'cost_price' => 8.00,
                'sale_price' => 12.00,
                'purchase_price_national' => 8.00,
                'sale_price_national' => 12.00,
            ])
        );

        $articles['formula'] = Article::query()->updateOrCreate(
            ['module_scope' => 'magistrales', 'code' => 'MAG-FRM-001'],
            array_merge($baseData, [
                'name' => 'Formula magistral base',
                'composition' => 'Producto base para validar recetas magistrales.',
                'article_type' => 'FORMULA',
                'magistral_category_id' => $categories['GINECOLOGIA']->id ?? null,
                'sub_category' => optional($subcategories['GINECOLOGIA']['Hormonal'] ?? null)->description,
                'magistral_presentation' => 'UNIDAD',
                'magistral_format_id' => $formats['Capsulas x 30']->id ?? null,
                'unit_id' => $units['UND']->id,
                'stock_min' => 1,
                'stock_max' => 100,
                'cost_price' => 25.00,
                'sale_price' => 45.00,
                'purchase_price_national' => 25.00,
                'sale_price_national' => 45.00,
            ])
        );

        return $articles;
    }

    private function ensureFormula(array $articles, array $units): void
    {
        $formulaArticle = $articles['formula'] ?? null;
        if (!$formulaArticle) return;

        $formula = MagistralFormula::query()->firstOrCreate(
            ['article_id' => $formulaArticle->id],
            [
                'detail' => 'Formula base creada para habilitar el flujo inicial de Magistrales.',
                'preparation_instructions' => 'Validar receta, pesar insumos y registrar lote antes de dispensar.',
                'preparation_method' => 'Mezcla y encapsulado segun indicacion tecnica.',
                'conservation' => 'Conservar en lugar fresco y seco.',
                'stability' => 'Segun criterio del responsable tecnico.',
                'usage' => 'Uso segun receta.',
                'last_edited_by' => $this->userId,
                'last_edited_at' => now(),
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]
        );

        if ($formula->items()->exists()) {
            return;
        }

        foreach ([
            ['article' => $articles['base'] ?? null, 'quantity' => 29.5, 'unit_price' => 1.50],
            ['article' => $articles['active'] ?? null, 'quantity' => 0.5, 'unit_price' => 8.00],
        ] as $item) {
            $article = $item['article'];
            if (!$article) continue;

            MagistralFormulaItem::query()->create([
                'magistral_formula_id' => $formula->id,
                'article_id' => $article->id,
                'total_units' => 30,
                'code' => $article->code,
                'description' => $article->name,
                'quantity' => $item['quantity'],
                'presentation' => optional($units['G'] ?? null)->symbol,
                'total_quantity' => $item['quantity'] * 30,
                'unit_price' => $item['unit_price'],
                'subtotal' => $item['quantity'] * $item['unit_price'],
                'status' => true,
            ]);
        }
    }

    private function ensureInitialInventoryCount(Warehouse $warehouse, array $articles): void
    {
        if (MagistralInventoryCount::query()->exists()) {
            return;
        }

        $articleRows = collect($articles)->filter()->values();
        if ($articleRows->isEmpty()) {
            return;
        }

        $count = MagistralInventoryCount::query()->create([
            'code' => $this->nextInventoryCode(),
            'business_branch_id' => $warehouse->business_branch_id,
            'warehouse_id' => $warehouse->id,
            'count_date' => now()->toDateString(),
            'observations' => 'Inventario inicial automatico para habilitar el modulo Magistrales.',
            'status' => true,
            'created_by' => $this->userId,
            'updated_by' => $this->userId,
        ]);

        foreach ($articleRows as $article) {
            $stock = MagistralesStock::stock((int) $article->id, (int) $warehouse->id);

            MagistralInventoryCountItem::query()->create([
                'magistral_inventory_count_id' => $count->id,
                'article_id' => $article->id,
                'lot' => null,
                'expiration_date' => null,
                'system_stock' => $stock,
                'real_stock' => $stock,
                'difference' => 0,
                'status' => true,
            ]);
        }
    }

    private function nextInventoryCode(): string
    {
        $next = 1;
        $latest = MagistralInventoryCount::query()->latest('id')->value('code');
        if ($latest && preg_match('/(\d+)$/', (string) $latest, $matches)) {
            $next = ((int) $matches[1]) + 1;
        }

        do {
            $code = 'INV-MAG-' . str_pad((string) $next, 6, '0', STR_PAD_LEFT);
            $next++;
        } while (MagistralInventoryCount::query()->where('code', $code)->exists());

        return $code;
    }
}
