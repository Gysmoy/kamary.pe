<?php

namespace Database\Seeders;

use App\Models\ActivePrinciple;
use App\Models\Article;
use App\Models\Business;
use App\Models\BusinessBranch;
use App\Models\Laboratory;
use App\Models\MagistralCategory;
use App\Models\MagistralFormat;
use App\Models\MagistralFormula;
use App\Models\MagistralFormulaHistory;
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
use App\Models\User;
use App\Models\Warehouse;
use App\Support\BusinessScope;
use App\Support\MagistralesStock;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
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
            $units = $this->ensureUnits();
            $laboratories = $this->ensureLaboratories();
            $principles = $this->ensureActivePrinciples($laboratories);
            $categories = $this->ensureCategories($warehouse);
            $subcategories = $this->ensureSubcategories($categories);
            $formats = $this->ensureFormats();
            $suppliers = $this->ensureSuppliers();
            $responsibles = $this->ensureResponsibles();
            $articles = $this->ensureArticles($units, $laboratories, $principles, $categories, $subcategories, $formats);
            $formulas = $this->ensureFormulas($articles);
            $purchaseOrders = $this->ensurePurchaseOrders($business, $branch, $warehouse, $suppliers, $articles);
            $this->ensureIncomes($business, $warehouse, $suppliers, $purchaseOrders, $articles);
            $this->ensureProductionOrders($warehouse, $responsibles, $formats, $articles, $formulas);
            $this->ensureOutputs($warehouse, $articles);
            $this->ensureSales($business, $warehouse, $articles);
            $this->ensureInventoryCounts($branch, $warehouse, $articles);
        });
    }

    private function ensureBusiness(): Business
    {
        return Business::query()->updateOrCreate(
            ['business_key' => BusinessScope::KAMARY_MEDICALS],
            [
                'name' => 'Kamary Medicals',
                'trade_name' => 'Kamary Medicals',
                'description' => 'Empresa base para operacion Magistrales',
                'facturador_sync_status' => 'pending',
                'facturador_sync_message' => 'Completar configuracion fiscal antes de emitir comprobantes.',
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
                'address' => 'Direccion fiscal pendiente de completar',
                'email' => 'magistrales@example.test',
                'telephone' => '000000000',
                'facturador_sync_status' => 'pending',
                'facturador_sync_message' => 'Sede creada por seeder Magistrales.',
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
                'description' => 'Almacen inicial para formulas magistrales',
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]
        );
    }

    private function ensureUnits(): Collection
    {
        $units = [
            ['Unidad', 'MAGU1'],
            ['Gramo', 'MAGG'],
            ['Miligramo', 'MAGMG'],
            ['Mililitro', 'MAGML'],
            ['Frasco', 'MAGFCO'],
            ['Capsula', 'MAGCAP'],
            ['Sobre', 'MAGSOB'],
            ['Pote', 'MAGPOT'],
            ['Tubo', 'MAGTUB'],
            ['Gota', 'MAGGTA'],
        ];

        foreach ($units as $row) {
            Unit::query()->updateOrCreate(
                ['symbol' => $row[1]],
                [
                    'module_scope' => 'magistrales',
                    'name' => $row[0],
                    'status' => true,
                    'created_by' => $this->userId,
                    'updated_by' => $this->userId,
                ]
            );
        }

        return Unit::query()
            ->where('module_scope', 'magistrales')
            ->whereIn('symbol', array_column($units, 1))
            ->orderBy('id')
            ->get();
    }

    private function ensureLaboratories(): Collection
    {
        for ($i = 1; $i <= 10; $i++) {
            Laboratory::query()->updateOrCreate(
                ['code' => 'MAGLAB-' . str_pad((string)$i, 3, '0', STR_PAD_LEFT)],
                [
                    'name' => 'Laboratorio Magistral ' . $i,
                    'status' => true,
                    'created_by' => $this->userId,
                    'updated_by' => $this->userId,
                ]
            );
        }

        return Laboratory::query()
            ->where('code', 'like', 'MAGLAB-%')
            ->orderBy('code')
            ->get();
    }

    private function ensureActivePrinciples(Collection $laboratories): Collection
    {
        foreach ($laboratories->values() as $index => $laboratory) {
            ActivePrinciple::query()->updateOrCreate(
                [
                    'laboratory_id' => $laboratory->id,
                    'name' => 'Principio Activo Magistral ' . ($index + 1),
                ],
                [
                    'status' => true,
                    'created_by' => $this->userId,
                    'updated_by' => $this->userId,
                ]
            );
        }

        return ActivePrinciple::query()
            ->whereIn('laboratory_id', $laboratories->pluck('id'))
            ->orderBy('id')
            ->get();
    }

    private function ensureCategories(Warehouse $warehouse): Collection
    {
        $names = ['Dermatologia', 'Pediatria', 'Gastroenterologia', 'Dolor', 'Cosmetica', 'Vitaminas', 'Respiratorio', 'Topicos', 'Capsulas', 'Soluciones'];

        foreach ($names as $index => $name) {
            MagistralCategory::query()->updateOrCreate(
                ['code' => 'MAG-CAT-' . str_pad((string)($index + 1), 3, '0', STR_PAD_LEFT)],
                [
                    'description' => $name,
                    'warehouse_id' => $warehouse->id,
                    'sale_material' => $index % 2 === 0,
                    'status' => true,
                    'created_by' => $this->userId,
                    'updated_by' => $this->userId,
                ]
            );
        }

        return MagistralCategory::query()
            ->where('code', 'like', 'MAG-CAT-%')
            ->orderBy('code')
            ->get();
    }

    private function ensureSubcategories(Collection $categories): Collection
    {
        foreach ($categories->values() as $index => $category) {
            MagistralSubcategory::query()->updateOrCreate(
                [
                    'magistral_category_id' => $category->id,
                    'description' => 'Subcategoria Magistral ' . ($index + 1),
                ],
                [
                    'status' => true,
                    'created_by' => $this->userId,
                    'updated_by' => $this->userId,
                ]
            );
        }

        return MagistralSubcategory::query()
            ->whereIn('magistral_category_id', $categories->pluck('id'))
            ->orderBy('id')
            ->get();
    }

    private function ensureFormats(): Collection
    {
        $formats = [
            ['Capsulas x 30', 30],
            ['Capsulas x 60', 60],
            ['Jarabe 120 ml', 120],
            ['Crema 30 g', 30],
            ['Crema 60 g', 60],
            ['Gel 50 g', 50],
            ['Solucion 100 ml', 100],
            ['Suspension 150 ml', 150],
            ['Gotas 30 ml', 30],
            ['Pote 100 g', 100],
        ];

        foreach ($formats as $row) {
            MagistralFormat::query()->updateOrCreate(
                ['description' => $row[0]],
                [
                    'quantity' => $row[1],
                    'status' => true,
                    'created_by' => $this->userId,
                    'updated_by' => $this->userId,
                ]
            );
        }

        return MagistralFormat::query()
            ->whereIn('description', array_column($formats, 0))
            ->orderBy('id')
            ->get();
    }

    private function ensureSuppliers(): Collection
    {
        for ($i = 1; $i <= 10; $i++) {
            Supplier::query()->updateOrCreate(
                ['ruc' => '99000' . str_pad((string)$i, 6, '0', STR_PAD_LEFT)],
                [
                    'module_scope' => 'magistrales',
                    'business_name' => 'Proveedor Magistral ' . $i,
                    'trade_name' => 'Proveedor MAG ' . $i,
                    'address' => 'Av. Insumos Magistrales ' . $i,
                    'phone' => '01000' . str_pad((string)$i, 4, '0', STR_PAD_LEFT),
                    'mobile' => '9900000' . str_pad((string)$i, 2, '0', STR_PAD_LEFT),
                    'contact_name' => 'Contacto Magistral ' . $i,
                    'contact_position' => 'Ventas',
                    'contact_phone' => '9910000' . str_pad((string)$i, 2, '0', STR_PAD_LEFT),
                    'contact_email' => 'proveedor.mag' . $i . '@example.test',
                    'email_1' => 'proveedor.mag' . $i . '@example.test',
                    'business_line' => 'Insumos magistrales',
                    'billing_type' => 'Factura',
                    'credit_type' => $i % 3 === 0 ? 'Credito' : 'Contado',
                    'payment_condition' => $i % 3 === 0 ? '30 dias' : 'Contado',
                    'bank' => 'BCP',
                    'bank_account_cci' => '0020000000000000' . str_pad((string)$i, 4, '0', STR_PAD_LEFT),
                    'payment_system' => 'Transferencia',
                    'payment_term_days' => $i % 3 === 0 ? 30 : 0,
                    'evaluation' => 'Proveedor inicial Magistrales',
                    'status' => true,
                    'created_by' => $this->userId,
                    'updated_by' => $this->userId,
                ]
            );
        }

        return Supplier::query()
            ->where('module_scope', 'magistrales')
            ->where('ruc', 'like', '99000%')
            ->orderBy('ruc')
            ->get();
    }

    private function ensureResponsibles(): Collection
    {
        for ($i = 1; $i <= 10; $i++) {
            MagistralResponsible::query()->updateOrCreate(
                ['document_number' => 'MAGRESP' . str_pad((string)$i, 4, '0', STR_PAD_LEFT)],
                [
                    'name' => 'Responsable Magistral ' . $i,
                    'status' => true,
                    'created_by' => $this->userId,
                    'updated_by' => $this->userId,
                ]
            );
        }

        return MagistralResponsible::query()
            ->where('document_number', 'like', 'MAGRESP%')
            ->orderBy('document_number')
            ->get();
    }

    private function ensureArticles(Collection $units, Collection $laboratories, Collection $principles, Collection $categories, Collection $subcategories, Collection $formats): Collection
    {
        for ($i = 1; $i <= 10; $i++) {
            $category = $categories->get(($i - 1) % max(1, $categories->count()));
            $subcategory = $subcategories->get(($i - 1) % max(1, $subcategories->count()));
            $format = $formats->get(($i - 1) % max(1, $formats->count()));
            $laboratory = $laboratories->get(($i - 1) % max(1, $laboratories->count()));
            $principle = $principles->where('laboratory_id', $laboratory?->id)->first() ?: $principles->first();
            $unit = $units->get(($i - 1) % max(1, $units->count()));

            Article::query()->updateOrCreate(
                [
                    'module_scope' => 'magistrales',
                    'code' => 'MAG-ART-' . str_pad((string)$i, 3, '0', STR_PAD_LEFT),
                ],
                [
                    'name' => 'Articulo Magistral ' . $i,
                    'composition' => 'Composicion base magistral ' . $i,
                    'article_type' => $i % 2 === 0 ? 'Insumo' : 'Formula',
                    'administration_route' => $i % 2 === 0 ? 'Topica' : 'Oral',
                    'magistral_category_id' => $category?->id,
                    'sub_category' => $subcategory?->description,
                    'magistral_format_id' => $format?->id,
                    'health_registration' => 'NSO-MAG-' . str_pad((string)$i, 4, '0', STR_PAD_LEFT),
                    'laboratory_id' => $laboratory?->id,
                    'active_principle_id' => $principle?->id,
                    'unit_id' => $unit?->id,
                    'volume' => 1,
                    'margin_rule' => false,
                    'igv_rule' => $i % 4 !== 0,
                    'units_per_article' => 1,
                    'unit_weight' => 0.1 * $i,
                    'default_lot' => 'MAG-LOTE-' . str_pad((string)$i, 3, '0', STR_PAD_LEFT),
                    'default_expiration_date' => now()->addMonths(12 + $i)->toDateString(),
                    'stock_min' => 10,
                    'stock_max' => 500,
                    'currency' => 'PEN',
                    'stock_has_expiration' => true,
                    'stock_has_lot' => true,
                    'cost_price' => 8 + $i,
                    'sale_price' => 16 + $i,
                    'equivalence_exchange_rate' => 1,
                    'equivalence_quantity' => 1,
                    'equivalence_unit_id' => $unit?->id,
                    'sale_price_national' => 16 + $i,
                    'purchase_price_national' => 8 + $i,
                    'purchase_price_foreign' => 0,
                    'notes' => 'Registro inicial Magistrales',
                    'status' => true,
                    'created_by' => $this->userId,
                    'updated_by' => $this->userId,
                ]
            );
        }

        return Article::query()
            ->where('module_scope', 'magistrales')
            ->where('code', 'like', 'MAG-ART-%')
            ->orderBy('code')
            ->get();
    }

    private function ensureFormulas(Collection $articles): Collection
    {
        foreach ($articles->values() as $index => $article) {
            $formula = MagistralFormula::query()->updateOrCreate(
                ['article_id' => $article->id],
                [
                    'detail' => 'Formula magistral inicial para ' . $article->name,
                    'special_preparation_conditions' => 'Usar area limpia y material seco.',
                    'specialized_equipment' => 'Balanza calibrada, mortero y espatula.',
                    'preparation_instructions' => 'Pesar, mezclar y acondicionar segun formato.',
                    'preparation_method' => 'Mezcla geometrica hasta homogeneidad.',
                    'conservation' => 'Conservar a temperatura ambiente controlada.',
                    'stability' => 'Estabilidad referencial 90 dias.',
                    'usage' => 'Uso segun indicacion profesional.',
                    'others' => 'Datos iniciales para arranque operativo.',
                    'last_edited_by' => $this->userId,
                    'last_edited_at' => now(),
                    'status' => true,
                    'created_by' => $this->userId,
                    'updated_by' => $this->userId,
                ]
            );

            MagistralFormulaItem::query()->where('magistral_formula_id', $formula->id)->delete();
            $itemsSnapshot = [];
            for ($line = 1; $line <= 2; $line++) {
                $ingredient = $articles->get(($index + $line) % max(1, $articles->count()));
                $quantity = 1 + $line;
                $unitPrice = (float)($ingredient?->cost_price ?? 10);
                $item = MagistralFormulaItem::create([
                    'magistral_formula_id' => $formula->id,
                    'article_id' => $ingredient?->id,
                    'total_units' => 1,
                    'code' => $ingredient?->code,
                    'description' => $ingredient?->name,
                    'quantity' => $quantity,
                    'presentation' => $ingredient?->unit?->symbol ?: 'UND',
                    'total_quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'subtotal' => round($quantity * $unitPrice, 2),
                    'status' => true,
                ]);
                $itemsSnapshot[] = $item->only(['article_id', 'code', 'description', 'quantity', 'presentation', 'total_quantity', 'unit_price', 'subtotal']);
            }

            MagistralFormulaHistory::query()->updateOrCreate(
                [
                    'magistral_formula_id' => $formula->id,
                    'change_reason' => 'Carga inicial',
                ],
                [
                    'article_id' => $article->id,
                    'detail' => $formula->detail,
                    'special_preparation_conditions' => $formula->special_preparation_conditions,
                    'specialized_equipment' => $formula->specialized_equipment,
                    'preparation_instructions' => $formula->preparation_instructions,
                    'preparation_method' => $formula->preparation_method,
                    'conservation' => $formula->conservation,
                    'stability' => $formula->stability,
                    'usage' => $formula->usage,
                    'others' => $formula->others,
                    'items_snapshot' => $itemsSnapshot,
                    'edited_by' => $this->userId,
                ]
            );
        }

        return MagistralFormula::query()
            ->whereIn('article_id', $articles->pluck('id'))
            ->orderBy('id')
            ->get();
    }

    private function ensurePurchaseOrders(Business $business, BusinessBranch $branch, Warehouse $warehouse, Collection $suppliers, Collection $articles): Collection
    {
        for ($i = 1; $i <= 10; $i++) {
            $supplier = $suppliers->get(($i - 1) % max(1, $suppliers->count()));
            $article = $articles->get(($i - 1) % max(1, $articles->count()));
            $quantity = 20 + $i;
            $price = (float)($article?->cost_price ?? 10);
            $subtotal = round($quantity * $price, 2);

            $order = PurchaseOrder::query()->updateOrCreate(
                ['code' => 'MAG-OC-' . str_pad((string)$i, 6, '0', STR_PAD_LEFT)],
                [
                    'business_id' => $business->id,
                    'module_scope' => 'magistrales',
                    'business_branch_id' => $branch->id,
                    'warehouse_id' => $warehouse->id,
                    'supplier_id' => $supplier?->id,
                    'buyer_name' => 'Comprador Magistral ' . $i,
                    'issue_date' => now()->subDays(20 - $i)->toDateString(),
                    'expected_date' => now()->addDays($i)->toDateString(),
                    'currency' => 'PEN',
                    'payment_condition' => $i % 3 === 0 ? 'Credito 30 dias' : 'Contado',
                    'order_status' => $i % 4 === 0 ? 'completed' : 'pending',
                    'approval_status' => $i % 2 === 0 ? 'approved' : 'pending',
                    'observations' => 'Orden de compra inicial Magistrales',
                    'subtotal' => $subtotal,
                    'tax_amount' => 0,
                    'total' => $subtotal,
                    'status' => true,
                    'created_by' => $this->userId,
                    'updated_by' => $this->userId,
                ]
            );

            $order->items()->delete();
            PurchaseOrderItem::create([
                'purchase_order_id' => $order->id,
                'article_id' => $article?->id,
                'requested_quantity' => $quantity,
                'received_quantity' => $i % 4 === 0 ? $quantity : 0,
                'price_unit' => $price,
                'total' => $subtotal,
                'status' => true,
            ]);
        }

        return PurchaseOrder::query()
            ->where('module_scope', 'magistrales')
            ->where('code', 'like', 'MAG-OC-%')
            ->orderBy('code')
            ->get();
    }

    private function ensureIncomes(Business $business, Warehouse $warehouse, Collection $suppliers, Collection $purchaseOrders, Collection $articles): Collection
    {
        for ($i = 1; $i <= 10; $i++) {
            $article = $articles->get(($i - 1) % max(1, $articles->count()));
            $supplier = $suppliers->get(($i - 1) % max(1, $suppliers->count()));
            $purchaseOrder = $purchaseOrders->get(($i - 1) % max(1, $purchaseOrders->count()));
            $quantity = 100 + ($i * 5);
            $price = (float)($article?->cost_price ?? 10);
            $subtotal = round($quantity * $price, 2);

            $income = MagistralIncome::query()->updateOrCreate(
                ['code' => 'MAG-ING-' . str_pad((string)$i, 6, '0', STR_PAD_LEFT)],
                [
                    'purchase_order_code' => $purchaseOrder?->code,
                    'document_type' => 'Factura',
                    'document_series' => 'FMI' . str_pad((string)$i, 2, '0', STR_PAD_LEFT),
                    'document_sequence' => str_pad((string)$i, 8, '0', STR_PAD_LEFT),
                    'guide_number' => 'GR-MAG-' . str_pad((string)$i, 6, '0', STR_PAD_LEFT),
                    'guide_series' => 'TMI' . str_pad((string)$i, 2, '0', STR_PAD_LEFT),
                    'guide_sequence' => str_pad((string)$i, 8, '0', STR_PAD_LEFT),
                    'guide_ruc' => $supplier?->ruc,
                    'business_id' => $business->id,
                    'warehouse_id' => $warehouse->id,
                    'supplier_id' => $supplier?->id,
                    'payment_method' => 'Transferencia',
                    'origin' => 'Carga inicial Magistrales',
                    'currency' => 'PEN',
                    'affects_igv' => false,
                    'issue_date' => now()->subDays(15 - $i)->toDateString(),
                    'observations' => 'Ingreso inicial de stock Magistrales',
                    'subtotal' => $subtotal,
                    'igv' => 0,
                    'total' => $subtotal,
                    'status' => true,
                    'created_by' => $this->userId,
                    'updated_by' => $this->userId,
                ]
            );

            $income->items()->delete();
            MagistralIncomeItem::create([
                'magistral_income_id' => $income->id,
                'article_id' => $article?->id,
                'description' => $article?->name,
                'quantity' => $quantity,
                'presentation' => $article?->unit?->symbol ?: 'UND',
                'expiration_date' => now()->addMonths(12 + $i)->toDateString(),
                'lot' => 'MAG-LOTE-' . str_pad((string)$i, 3, '0', STR_PAD_LEFT),
                'price_without_igv' => $price,
                'price_with_igv' => $price,
                'subtotal' => $subtotal,
                'status' => true,
            ]);
        }

        return MagistralIncome::query()
            ->where('code', 'like', 'MAG-ING-%')
            ->orderBy('code')
            ->get();
    }

    private function ensureProductionOrders(Warehouse $warehouse, Collection $responsibles, Collection $formats, Collection $articles, Collection $formulas): Collection
    {
        for ($i = 1; $i <= 10; $i++) {
            $article = $articles->get(($i - 1) % max(1, $articles->count()));
            $ingredient = $articles->get($i % max(1, $articles->count()));
            $formula = $formulas->firstWhere('article_id', $article?->id) ?: $formulas->first();
            $responsible = $responsibles->get(($i - 1) % max(1, $responsibles->count()));
            $format = $formats->get(($i - 1) % max(1, $formats->count()));

            $order = MagistralProductionOrder::query()->updateOrCreate(
                ['code' => 'MAG-OP-' . str_pad((string)$i, 6, '0', STR_PAD_LEFT)],
                [
                    'order_status' => 'finished',
                    'responsible_id' => $responsible?->id,
                    'destination' => 'Almacen Magistrales Principal',
                    'destination_warehouse_id' => $warehouse->id,
                    'article_id' => $article?->id,
                    'format_id' => $format?->id,
                    'batch_quantity' => 1,
                    'quantity' => 5 + $i,
                    'delivery_date' => now()->addDays($i)->toDateString(),
                    'registration_date' => now()->subDays(10 - $i)->toDateString(),
                    'observations' => 'Orden de produccion inicial Magistrales',
                    'status' => true,
                    'created_by' => $this->userId,
                    'updated_by' => $this->userId,
                ]
            );

            $order->items()->delete();
            MagistralProductionOrderItem::create([
                'magistral_production_order_id' => $order->id,
                'article_id' => $ingredient?->id,
                'description' => $ingredient?->name,
                'expiration_date' => now()->addMonths(12 + $i)->toDateString(),
                'quantity' => 1,
                'magistral_formula_id' => $formula?->id,
                'total' => 1,
                'status' => true,
            ]);
        }

        return MagistralProductionOrder::query()
            ->where('code', 'like', 'MAG-OP-%')
            ->orderBy('code')
            ->get();
    }

    private function ensureOutputs(Warehouse $warehouse, Collection $articles): Collection
    {
        for ($i = 1; $i <= 10; $i++) {
            $article = $articles->get(($i - 1) % max(1, $articles->count()));
            $lot = 'MAG-LOTE-' . str_pad((string)$i, 3, '0', STR_PAD_LEFT);
            $expirationDate = now()->addMonths(12 + $i)->toDateString();

            $output = MagistralOutput::query()->updateOrCreate(
                ['code' => 'MAG-SAL-' . str_pad((string)$i, 6, '0', STR_PAD_LEFT)],
                [
                    'origin_warehouse_id' => $warehouse->id,
                    'destination' => 'Uso interno Magistrales',
                    'reason' => 'Ajuste operativo inicial',
                    'observations' => 'Salida inicial Magistrales',
                    'output_date' => now()->subDays(5 - min($i, 5))->toDateString(),
                    'status' => true,
                    'created_by' => $this->userId,
                    'updated_by' => $this->userId,
                ]
            );

            $output->items()->delete();
            $stock = MagistralesStock::stock($article?->id, $warehouse->id, $lot, $expirationDate);

            MagistralOutputItem::create([
                'magistral_output_id' => $output->id,
                'article_id' => $article?->id,
                'code' => $article?->code,
                'name' => $article?->name,
                'lot' => $lot,
                'expiration_date' => $expirationDate,
                'stock' => $stock,
                'unit_label' => $article?->unit?->symbol ?: 'UND',
                'quantity' => 2,
                'total' => 2,
                'status' => true,
            ]);
        }

        return MagistralOutput::query()
            ->where('code', 'like', 'MAG-SAL-%')
            ->orderBy('code')
            ->get();
    }

    private function ensureSales(Business $business, Warehouse $warehouse, Collection $articles): Collection
    {
        for ($i = 1; $i <= 10; $i++) {
            $article = $articles->get(($i - 1) % max(1, $articles->count()));
            $unitPrice = (float)($article?->sale_price ?? 20);
            $quantity = 1;
            $discount = $i % 5 === 0 ? 1 : 0;
            $total = round(($quantity * $unitPrice) - $discount, 2);
            $taxable = round($total / 1.18, 2);
            $igv = round($total - $taxable, 2);

            $sale = MagistralSale::query()->updateOrCreate(
                ['code' => 'MAG-VTA-' . str_pad((string)$i, 6, '0', STR_PAD_LEFT)],
                [
                    'pharmacy' => 'Farmacia Magistrales',
                    'business_id' => $business->id,
                    'payment_status' => $i % 3 === 0 ? 'paid' : 'pending',
                    'document_type' => $i % 2 === 0 ? 'Boleta' : 'Cotizacion',
                    'document_number' => 'DOC-MAG-' . str_pad((string)$i, 6, '0', STR_PAD_LEFT),
                    'patient' => 'Paciente Inicial ' . $i,
                    'doctor' => 'Medico Inicial ' . $i,
                    'discount_policy' => $discount > 0 ? 'Descuento inicial' : null,
                    'sale_type' => $i % 2 === 0 ? 'venta' : 'cotizacion',
                    'allergy' => false,
                    'intolerance' => false,
                    'taxable_amount' => $taxable,
                    'unaffected_amount' => 0,
                    'discount_total' => $discount,
                    'subtotal' => $total,
                    'igv' => $igv,
                    'total' => $total,
                    'is_quote' => $i % 2 !== 0,
                    'sale_date' => now()->subDays(10 - $i)->toDateString(),
                    'status' => true,
                    'created_by' => $this->userId,
                    'updated_by' => $this->userId,
                ]
            );

            $sale->items()->delete();
            $stock = MagistralesStock::stock($article?->id, $warehouse->id);

            MagistralSaleItem::create([
                'magistral_sale_id' => $sale->id,
                'article_id' => $article?->id,
                'warehouse_id' => $warehouse->id,
                'description' => $article?->name,
                'stock' => $stock,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'discount' => $discount,
                'subtotal' => $total,
                'status' => true,
            ]);
        }

        return MagistralSale::query()
            ->where('code', 'like', 'MAG-VTA-%')
            ->orderBy('code')
            ->get();
    }

    private function ensureInventoryCounts(BusinessBranch $branch, Warehouse $warehouse, Collection $articles): Collection
    {
        for ($i = 1; $i <= 10; $i++) {
            $article = $articles->get(($i - 1) % max(1, $articles->count()));
            $lot = 'MAG-LOTE-' . str_pad((string)$i, 3, '0', STR_PAD_LEFT);
            $expirationDate = now()->addMonths(12 + $i)->toDateString();
            $systemStock = MagistralesStock::stock($article?->id, $warehouse->id, $lot, $expirationDate);
            $realStock = max(0, $systemStock - ($i % 3));

            $inventory = MagistralInventoryCount::query()->updateOrCreate(
                ['code' => 'MAG-INV-' . str_pad((string)$i, 6, '0', STR_PAD_LEFT)],
                [
                    'business_branch_id' => $branch->id,
                    'warehouse_id' => $warehouse->id,
                    'count_date' => now()->toDateString(),
                    'observations' => 'Conteo inicial Magistrales',
                    'status' => true,
                    'created_by' => $this->userId,
                    'updated_by' => $this->userId,
                ]
            );

            $inventory->items()->delete();
            MagistralInventoryCountItem::create([
                'magistral_inventory_count_id' => $inventory->id,
                'article_id' => $article?->id,
                'lot' => $lot,
                'expiration_date' => $expirationDate,
                'system_stock' => $systemStock,
                'real_stock' => $realStock,
                'difference' => round($realStock - $systemStock, 3),
                'status' => true,
            ]);
        }

        return MagistralInventoryCount::query()
            ->where('code', 'like', 'MAG-INV-%')
            ->orderBy('code')
            ->get();
    }
}
