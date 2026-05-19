<?php

namespace Database\Seeders;

use App\Models\Article;
use App\Models\ArticlePresentation;
use App\Models\AccountsPayable;
use App\Models\Business;
use App\Models\BusinessBranch;
use App\Models\MagistralCategory;
use App\Models\MagistralFormat;
use App\Models\MagistralFormula;
use App\Models\MagistralFormulaHistory;
use App\Models\MagistralFormulaItem;
use App\Models\MagistralIncome;
use App\Models\MagistralIncomeItem;
use App\Models\MagistralInventoryCount;
use App\Models\MagistralInventoryCountItem;
use App\Models\MagistralLaboratory;
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
use App\Models\PurchaseReceipt;
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
            $this->purgeExistingMagistralesData();

            $business = $this->ensureBusiness();
            $branch = $this->ensureBranch($business);
            $warehouse = $this->ensureWarehouse($branch);
            $units = $this->ensureUnits();
            $laboratories = $this->ensureLaboratories();
            $categories = $this->ensureCategories($warehouse);
            $subcategories = $this->ensureSubcategories($categories);
            $formats = $this->ensureFormats();
            $suppliers = $this->ensureSuppliers();
            $responsibles = $this->ensureResponsibles();
            $articles = $this->ensureArticles($units, $laboratories, $categories, $subcategories);
            $formulas = $this->ensureFormulas($articles);
            $purchaseOrders = $this->ensurePurchaseOrders($business, $branch, $warehouse, $suppliers, $articles);
            $this->ensureIncomes($business, $warehouse, $suppliers, $purchaseOrders, $articles);
            $this->ensureProductionOrders($warehouse, $responsibles, $formats, $articles, $formulas);
            $this->ensureOutputs($warehouse, $articles);
            $this->ensureSales($business, $warehouse, $articles);
            $this->ensureInventoryCounts($branch, $warehouse, $articles);
        });
    }

    private function purgeExistingMagistralesData(): void
    {
        MagistralInventoryCount::query()->delete();
        MagistralSale::query()->delete();
        MagistralOutput::query()->delete();
        MagistralProductionOrder::query()->delete();
        MagistralIncome::query()->delete();

        $purchaseOrderIds = PurchaseOrder::query()
            ->where('module_scope', 'magistrales')
            ->pluck('id');
        if ($purchaseOrderIds->isNotEmpty()) {
            AccountsPayable::query()
                ->where('source_type', 'purchase_order')
                ->whereIn('source_id', $purchaseOrderIds)
                ->delete();
            PurchaseOrder::query()->whereIn('id', $purchaseOrderIds)->delete();
        }

        $articleIds = Article::query()
            ->where('module_scope', 'magistrales')
            ->pluck('id');
        if ($articleIds->isNotEmpty()) {
            Article::query()->whereIn('id', $articleIds)->delete();
        }

        $supplierIds = Supplier::query()
            ->where('module_scope', 'magistrales')
            ->pluck('id');
        if ($supplierIds->isNotEmpty()) {
            $purchaseReceiptIds = PurchaseReceipt::query()
                ->whereIn('supplier_id', $supplierIds)
                ->pluck('id');
            if ($purchaseReceiptIds->isNotEmpty()) {
                AccountsPayable::query()
                    ->where('source_type', 'purchase_receipt')
                    ->whereIn('source_id', $purchaseReceiptIds)
                    ->delete();
                PurchaseReceipt::query()->whereIn('id', $purchaseReceiptIds)->delete();
            }

            $supplierPurchaseOrderIds = PurchaseOrder::query()
                ->whereIn('supplier_id', $supplierIds)
                ->pluck('id');
            if ($supplierPurchaseOrderIds->isNotEmpty()) {
                AccountsPayable::query()
                    ->where('source_type', 'purchase_order')
                    ->whereIn('source_id', $supplierPurchaseOrderIds)
                    ->delete();
                PurchaseOrder::query()->whereIn('id', $supplierPurchaseOrderIds)->delete();
            }

            AccountsPayable::query()->whereIn('supplier_id', $supplierIds)->delete();
        }

        Supplier::query()->where('module_scope', 'magistrales')->delete();
        MagistralResponsible::query()->delete();
        MagistralFormat::query()->delete();
        MagistralSubcategory::query()->delete();
        MagistralCategory::query()->delete();
        MagistralLaboratory::query()->delete();
        Unit::query()->where('module_scope', 'magistrales')->delete();
    }

    private function ensureBusiness(): Business
    {
        return Business::query()->updateOrCreate(
            ['business_key' => BusinessScope::KAMARY_MEDICALS],
            [
                'name' => 'Kamary Medicals',
                'trade_name' => 'Kamary Medicals',
                'description' => 'Unidad operativa para formulas magistrales y control de stock sanitario.',
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
                'address' => 'Calle Leoncio Prado 830, Urb. La Viña, San Luis, Lima',
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
                'description' => 'Almacen fijo del modulo Magistrales para insumos, envases y productos terminados.',
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]
        );
    }

    private function ensureUnits(): Collection
    {
        $units = [
            ['Unidad', 'UND'],
            ['Kilogramo', 'KG'],
            ['Gramo', 'G'],
            ['Miligramo', 'MG'],
            ['Mililitro', 'ML'],
            ['Litro', 'L'],
            ['Frasco', 'FCO'],
            ['Pote', 'POT'],
            ['Tubo', 'TUB'],
            ['Capsula', 'CAP'],
        ];

        foreach ($units as [$name, $symbol]) {
            Unit::query()->create([
                'module_scope' => 'magistrales',
                'name' => $name,
                'symbol' => $symbol,
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);
        }

        return Unit::query()
            ->where('module_scope', 'magistrales')
            ->whereIn('symbol', array_column($units, 1))
            ->orderBy('id')
            ->get();
    }

    private function ensureLaboratories(): Collection
    {
        $labs = [
            ['MAGLAB-001', 'BASF Care Chemicals'],
            ['MAGLAB-002', 'Ashland Specialty Ingredients'],
            ['MAGLAB-003', 'Merck Life Science'],
            ['MAGLAB-004', 'Fagron Latam'],
            ['MAGLAB-005', 'Quimtia Peru'],
            ['MAGLAB-006', 'Medifarma Magistral'],
        ];

        foreach ($labs as [$code, $description]) {
            MagistralLaboratory::query()->create([
                'code' => $code,
                'description' => $description,
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);
        }

        return MagistralLaboratory::query()
            ->whereIn('code', array_column($labs, 0))
            ->orderBy('code')
            ->get();
    }

    private function ensureCategories(Warehouse $warehouse): Collection
    {
        $meta = [
            'GINECOLOGIA' => true,
            'INSUMOS' => false,
            'ANDROLOGIA' => true,
        ];
        $activeIds = [];

        foreach (MagistralCategory::ALLOWED_DESCRIPTIONS as $index => $description) {
            $category = MagistralCategory::query()->create([
                'code' => 'MAG-CAT-' . str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT),
                'description' => $description,
                'warehouse_id' => $warehouse->id,
                'sale_material' => $meta[$description] ?? false,
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);
            $activeIds[] = $category->id;
        }

        return MagistralCategory::query()
            ->whereIn('id', $activeIds)
            ->orderBy('code')
            ->get();
    }

    private function ensureSubcategories(Collection $categories): Collection
    {
        $map = [
            'GINECOLOGIA' => [
                'Geles vaginales',
                'Ovulos vaginales',
            ],
            'INSUMOS' => [
                'Activos',
                'Excipientes',
                'Conservantes',
                'Envases',
            ],
            'ANDROLOGIA' => [
                'Soluciones capilares',
                'Geles transdermicos',
            ],
        ];

        foreach ($categories as $category) {
            foreach ($map[$category->description] ?? [] as $description) {
                MagistralSubcategory::query()->create([
                    'magistral_category_id' => $category->id,
                    'description' => $description,
                    'status' => true,
                    'created_by' => $this->userId,
                    'updated_by' => $this->userId,
                ]);
            }
        }

        return MagistralSubcategory::query()
            ->whereIn('magistral_category_id', $categories->pluck('id'))
            ->orderBy('id')
            ->get();
    }

    private function ensureFormats(): Collection
    {
        $formats = [
            ['Tubo x 60 g', 60],
            ['Pote x 100 g', 100],
            ['Frasco ambar x 60 ml', 60],
            ['Frasco gotero x 30 ml', 30],
            ['Bolsa x 1 kg', 1000],
            ['Bidon x 1 L', 1000],
        ];

        foreach ($formats as [$description, $quantity]) {
            MagistralFormat::query()->create([
                'description' => $description,
                'quantity' => $quantity,
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);
        }

        return MagistralFormat::query()->orderBy('id')->get();
    }

    private function ensureSuppliers(): Collection
    {
        $suppliers = [
            [
                'ruc' => '20602202411',
                'business_name' => 'Importaciones Levano E.I.R.L.',
                'trade_name' => 'Importaciones Levano',
                'address' => 'Av. Nicolas Ayllon 1520, Ate, Lima',
                'phone' => '013481250',
                'mobile' => '986215430',
                'contact_name' => 'Rocio Fernandez',
                'contact_position' => 'Ejecutiva de ventas',
                'contact_phone' => '986215430',
                'contact_email' => 'ventas@levano.pe',
                'business_line' => 'Activos y excipientes farmaceuticos',
                'credit_type' => 'Credito',
                'payment_condition' => '30 dias',
                'bank' => 'BCP',
                'bank_account_cci' => '00219400000020602202411',
                'payment_system' => 'Transferencia',
                'payment_term_days' => 30,
            ],
            [
                'ruc' => '20508974562',
                'business_name' => 'Quimtia del Peru S.A.',
                'trade_name' => 'Quimtia Peru',
                'address' => 'Av. Argentina 4893, Callao',
                'phone' => '017128500',
                'mobile' => '975420118',
                'contact_name' => 'Carlos Medina',
                'contact_position' => 'Asesor tecnico comercial',
                'contact_phone' => '975420118',
                'contact_email' => 'farmacia@quimtia.pe',
                'business_line' => 'Quimicos, tensoactivos y materias primas',
                'credit_type' => 'Contado',
                'payment_condition' => 'Contado',
                'bank' => 'BBVA',
                'bank_account_cci' => '01125800000020508974562',
                'payment_system' => 'Transferencia',
                'payment_term_days' => 0,
            ],
            [
                'ruc' => '20604135890',
                'business_name' => 'Drogueria Alkofarma S.A.C.',
                'trade_name' => 'Alkofarma',
                'address' => 'Jr. Paruro 1198, Cercado de Lima',
                'phone' => '014286310',
                'mobile' => '989654220',
                'contact_name' => 'Lucia Campos',
                'contact_position' => 'Ventas institucionales',
                'contact_phone' => '989654220',
                'contact_email' => 'institucional@alkofarma.pe',
                'business_line' => 'Drogueria y abastecimiento magistral',
                'credit_type' => 'Credito',
                'payment_condition' => '15 dias',
                'bank' => 'Interbank',
                'bank_account_cci' => '00354200000020604135890',
                'payment_system' => 'Transferencia',
                'payment_term_days' => 15,
            ],
            [
                'ruc' => '20607511428',
                'business_name' => 'Envases Farmaceuticos del Peru S.A.C.',
                'trade_name' => 'Envafarma Peru',
                'address' => 'Av. Industrial 3350, Independencia, Lima',
                'phone' => '015338420',
                'mobile' => '988742155',
                'contact_name' => 'Daniela Cespedes',
                'contact_position' => 'Ejecutiva de cuentas',
                'contact_phone' => '988742155',
                'contact_email' => 'cotizaciones@envafarma.pe',
                'business_line' => 'Envases y material de empaque',
                'credit_type' => 'Contado',
                'payment_condition' => 'Contado',
                'bank' => 'Scotiabank',
                'bank_account_cci' => '00987600000020607511428',
                'payment_system' => 'Depositos',
                'payment_term_days' => 0,
            ],
            [
                'ruc' => '20601984537',
                'business_name' => 'Quimicos Goicochea S.A.C.',
                'trade_name' => 'Goicochea Quimicos',
                'address' => 'Av. Materiales 2651, Cercado de Lima',
                'phone' => '014582770',
                'mobile' => '981123477',
                'contact_name' => 'Javier Torres',
                'contact_position' => 'Representante comercial',
                'contact_phone' => '981123477',
                'contact_email' => 'comercial@goicochea.pe',
                'business_line' => 'Aditivos, tensoactivos y fragancias',
                'credit_type' => 'Credito',
                'payment_condition' => '21 dias',
                'bank' => 'BCP',
                'bank_account_cci' => '00287700000020601984537',
                'payment_system' => 'Transferencia',
                'payment_term_days' => 21,
            ],
        ];

        foreach ($suppliers as $supplier) {
            Supplier::query()->create([
                'ruc' => $supplier['ruc'],
                'module_scope' => 'magistrales',
                'business_name' => $supplier['business_name'],
                'trade_name' => $supplier['trade_name'],
                'address' => $supplier['address'],
                'phone' => $supplier['phone'],
                'mobile' => $supplier['mobile'],
                'contact_name' => $supplier['contact_name'],
                'contact_position' => $supplier['contact_position'],
                'contact_phone' => $supplier['contact_phone'],
                'contact_email' => $supplier['contact_email'],
                'email_1' => $supplier['contact_email'],
                'business_line' => $supplier['business_line'],
                'billing_type' => 'Factura',
                'credit_type' => $supplier['credit_type'],
                'payment_condition' => $supplier['payment_condition'],
                'bank' => $supplier['bank'],
                'bank_account_cci' => $supplier['bank_account_cci'],
                'payment_system' => $supplier['payment_system'],
                'payment_term_days' => $supplier['payment_term_days'],
                'evaluation' => 'Proveedor validado para abastecimiento magistral.',
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);
        }

        return Supplier::query()
            ->where('module_scope', 'magistrales')
            ->orderBy('business_name')
            ->get();
    }

    private function ensureResponsibles(): Collection
    {
        $responsibles = [
            ['74125836', 'Q.F. Andrea Salazar Huaman'],
            ['46891257', 'Tec. Fabiola Rojas Vera'],
            ['42136795', 'Q.F. Jorge Mendieta Leon'],
            ['73514928', 'Tec. Rocio Paredes Soto'],
        ];

        foreach ($responsibles as [$document, $name]) {
            MagistralResponsible::query()->create([
                'document_number' => $document,
                'name' => $name,
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);
        }

        return MagistralResponsible::query()->orderBy('name')->get();
    }

    private function ensureArticles(Collection $units, Collection $laboratories, Collection $categories, Collection $subcategories): Collection
    {
        $unitBySymbol = $units->keyBy('symbol');
        $laboratoryByCode = $laboratories->keyBy('code');
        $categoryByName = $categories->keyBy('description');

        $articleCatalog = $this->articleCatalog();

        foreach ($articleCatalog as $article) {
            $category = $categoryByName->get($article['category']);
            $subcategory = $subcategories
                ->firstWhere('description', $article['subcategory']);

            $record = Article::query()->create([
                'module_scope' => 'magistrales',
                'code' => $article['code'],
                'name' => $article['name'],
                'composition' => $article['composition'],
                'article_type' => $article['article_type'],
                'administration_route' => $article['administration_route'],
                'magistral_category_id' => $category?->id,
                'sub_category' => $subcategory?->description,
                'magistral_presentation' => $article['magistral_presentation'],
                'magistral_format_id' => null,
                'health_registration' => $article['health_registration'],
                'laboratory_id' => null,
                'magistral_laboratory_id' => $laboratoryByCode->get($article['laboratory_code'])?->id,
                'active_principle_id' => null,
                'unit_id' => $unitBySymbol->get($article['unit_symbol'])?->id,
                'volume' => $article['volume'],
                'status' => true,
                'magistral_status' => 'vigente',
                'margin_rule' => false,
                'igv_rule' => $article['igv_rule'],
                'units_per_article' => $article['units_per_article'],
                'unit_weight' => $article['unit_weight'],
                'default_lot' => $article['default_lot'],
                'default_expiration_date' => $article['default_expiration_date'],
                'stock_min' => $article['stock_min'],
                'stock_max' => $article['stock_max'],
                'currency' => $article['currency'],
                'stock_has_expiration' => $article['stock_has_expiration'],
                'stock_has_lot' => $article['stock_has_lot'],
                'cost_price' => $article['cost_price'],
                'sale_price' => $article['sale_price'],
                'equivalence_exchange_rate' => 1,
                'equivalence_quantity' => 1,
                'equivalence_unit_id' => $unitBySymbol->get($article['unit_symbol'])?->id,
                'sale_price_national' => $article['sale_price'],
                'purchase_price_national' => $article['purchase_price_national'],
                'purchase_price_foreign' => $article['purchase_price_foreign'],
                'notes' => $article['notes'],
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);

            foreach ($article['presentations'] as $index => $presentation) {
                ArticlePresentation::query()->create([
                    'article_id' => $record->id,
                    'name' => $presentation['name'],
                    'units' => $presentation['units'],
                    'price' => $presentation['price'],
                    'purchase_price_national' => $presentation['purchase_price_national'],
                    'purchase_price_foreign' => $presentation['purchase_price_foreign'],
                    'sort_order' => $index,
                    'status' => true,
                ]);
            }
        }

        return Article::query()
            ->where('module_scope', 'magistrales')
            ->with(['unit:id,name,symbol', 'presentations:id,article_id,name,units,price,purchase_price_national,purchase_price_foreign,sort_order,status'])
            ->orderBy('code')
            ->get();
    }

    private function ensureFormulas(Collection $articles): Collection
    {
        $articleByCode = $articles->keyBy('code');
        $formulaCatalog = [
            'PT-01' => [
                'detail' => 'Gel vaginal hidratante con acido hialuronico al 1% para apoyo en resequedad vaginal y cuidado de mucosa.',
                'special_preparation_conditions' => 'Preparar en area clase D, con utensilios secos y sanitizados.',
                'specialized_equipment' => 'Balanza de precision, agitador de paletas, viscosimetro Brookfield y selladora de tubos.',
                'preparation_instructions' => 'Dispersar el carbopol, incorporar humectantes, homogenizar el activo y ajustar viscosidad antes del envasado.',
                'preparation_method' => 'Mezcla gradual con hidratacion controlada y desaireacion previa al llenado.',
                'conservation' => 'Conservar a temperatura ambiente controlada entre 15 C y 25 C.',
                'stability' => 'Estabilidad referencial 90 dias en envase cerrado.',
                'usage' => 'Uso intravaginal externo segun indicacion profesional.',
                'others' => 'Lote piloto para linea ginecologica.',
                'items' => [
                    ['code' => 'INS-22', 'quantity' => 80, 'presentation' => 'ML'],
                    ['code' => 'INS-23', 'quantity' => 120, 'presentation' => 'G'],
                    ['code' => 'INS-24', 'quantity' => 400, 'presentation' => 'ML'],
                    ['code' => 'INS-26', 'quantity' => 32, 'presentation' => 'ML'],
                    ['code' => 'INS-25', 'quantity' => 20, 'presentation' => 'G'],
                    ['code' => 'ENV-03', 'quantity' => 40, 'presentation' => 'UND'],
                ],
            ],
            'PT-02' => [
                'detail' => 'Crema hidratante de urea al 10% para zonas de resequedad intensa y descamacion leve.',
                'special_preparation_conditions' => 'Controlar temperatura de fusion y evitar incorporacion de aire en la fase final.',
                'specialized_equipment' => 'Balanza, olla de fusion, homogeneizador y llenadora semiautomatica.',
                'preparation_instructions' => 'Fundir fase oleosa, incorporar fase acuosa y agregar urea en enfriamiento controlado.',
                'preparation_method' => 'Emulsion O/W con agitación sostenida hasta homogeneidad.',
                'conservation' => 'Conservar bien tapado, protegido de luz directa.',
                'stability' => 'Estabilidad referencial 60 dias.',
                'usage' => 'Uso topico externo dos veces al dia.',
                'others' => 'Formula base para dermatologia magistral.',
                'items' => [
                    ['code' => 'INS-21', 'quantity' => 600, 'presentation' => 'G'],
                    ['code' => 'INS-24', 'quantity' => 350, 'presentation' => 'ML'],
                    ['code' => 'INS-30', 'quantity' => 200, 'presentation' => 'ML'],
                    ['code' => 'INS-23', 'quantity' => 90, 'presentation' => 'G'],
                    ['code' => 'ENV-02', 'quantity' => 60, 'presentation' => 'UND'],
                ],
            ],
            'PT-03' => [
                'detail' => 'Solucion capilar con minoxidil al 5% para uso androgenico bajo prescripcion.',
                'special_preparation_conditions' => 'Preparar con ventilacion adecuada y sin fuentes de ignicion por contenido alcoholico.',
                'specialized_equipment' => 'Balanza analitica, agitador magnetico, probetas aforadas y llenadora para frascos.',
                'preparation_instructions' => 'Disolver el activo en mezcla hidroalcoholica y estandarizar volumen final antes del filtrado.',
                'preparation_method' => 'Disolucion controlada y filtracion por malla fina.',
                'conservation' => 'Conservar hermeticamente cerrado y protegido del calor.',
                'stability' => 'Estabilidad referencial 45 dias.',
                'usage' => 'Aplicacion topica capilar una o dos veces al dia.',
                'others' => 'Producto sujeto a seguimiento de lote y trazabilidad de prescripcion.',
                'items' => [
                    ['code' => 'INS-29', 'quantity' => 90, 'presentation' => 'G'],
                    ['code' => 'INS-30', 'quantity' => 600, 'presentation' => 'ML'],
                    ['code' => 'INS-31', 'quantity' => 900, 'presentation' => 'ML'],
                    ['code' => 'INS-24', 'quantity' => 150, 'presentation' => 'ML'],
                    ['code' => 'ENV-01', 'quantity' => 30, 'presentation' => 'UND'],
                ],
            ],
        ];

        foreach ($formulaCatalog as $articleCode => $definition) {
            $article = $articleByCode->get($articleCode);
            if (!$article) {
                continue;
            }

            $formula = MagistralFormula::query()->create([
                'article_id' => $article->id,
                'detail' => $definition['detail'],
                'special_preparation_conditions' => $definition['special_preparation_conditions'],
                'specialized_equipment' => $definition['specialized_equipment'],
                'preparation_instructions' => $definition['preparation_instructions'],
                'preparation_method' => $definition['preparation_method'],
                'conservation' => $definition['conservation'],
                'stability' => $definition['stability'],
                'usage' => $definition['usage'],
                'others' => $definition['others'],
                'last_edited_by' => $this->userId,
                'last_edited_at' => now()->subDays(2),
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);

            $snapshot = [];
            foreach ($definition['items'] as $line) {
                $ingredient = $articleByCode->get($line['code']);
                if (!$ingredient) {
                    continue;
                }

                $quantity = (float) $line['quantity'];
                $unitPrice = (float) ($ingredient->cost_price ?? 0);

                $item = MagistralFormulaItem::query()->create([
                    'magistral_formula_id' => $formula->id,
                    'article_id' => $ingredient->id,
                    'total_units' => 1,
                    'code' => $ingredient->code,
                    'description' => $ingredient->name,
                    'quantity' => $quantity,
                    'presentation' => $line['presentation'],
                    'total_quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'subtotal' => round($quantity * $unitPrice, 2),
                    'status' => true,
                ]);

                $snapshot[] = $item->only([
                    'article_id',
                    'code',
                    'description',
                    'quantity',
                    'presentation',
                    'total_quantity',
                    'unit_price',
                    'subtotal',
                ]);
            }

            MagistralFormulaHistory::query()->create([
                'magistral_formula_id' => $formula->id,
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
                'change_reason' => 'Carga inicial con datos operativos',
                'items_snapshot' => $snapshot,
                'edited_by' => $this->userId,
            ]);
        }

        return MagistralFormula::query()
            ->with('items')
            ->orderBy('id')
            ->get();
    }

    private function ensurePurchaseOrders(Business $business, BusinessBranch $branch, Warehouse $warehouse, Collection $suppliers, Collection $articles): Collection
    {
        $supplierByRuc = $suppliers->keyBy('ruc');
        $articleByCode = $articles->keyBy('code');
        $orders = [
            [
                'code' => 'MAG-OC-000001',
                'supplier_ruc' => '20508974562',
                'buyer_name' => 'KAMARY PERU SAC',
                'issue_date' => now()->subDays(17)->toDateString(),
                'expected_date' => now()->subDays(12)->toDateString(),
                'max_delivery_date' => now()->subDays(10)->toDateString(),
                'currency' => 'PEN',
                'payment_condition' => 'Contado',
                'payment_method' => 'Transferencia',
                'document_type' => 'Factura',
                'article_type' => 'INSUMOS',
                'affects_igv' => true,
                'delivery_place' => 'Calle Leoncio Prado 830, San Luis - Lima',
                'order_status' => 'completed',
                'approval_status' => 'approved',
                'observations' => 'Reposicion de excipientes de alta rotacion para formulacion cremosa.',
                'items' => [
                    ['code' => 'INS-21', 'requested_quantity' => 25000, 'received_quantity' => 25000, 'price_unit' => 0.0280],
                    ['code' => 'INS-24', 'requested_quantity' => 20000, 'received_quantity' => 20000, 'price_unit' => 0.0180],
                    ['code' => 'INS-25', 'requested_quantity' => 10000, 'received_quantity' => 10000, 'price_unit' => 0.0120],
                ],
            ],
            [
                'code' => 'MAG-OC-000002',
                'supplier_ruc' => '20602202411',
                'buyer_name' => 'KAMARY PERU SAC',
                'issue_date' => now()->subDays(16)->toDateString(),
                'expected_date' => now()->subDays(9)->toDateString(),
                'max_delivery_date' => now()->subDays(7)->toDateString(),
                'currency' => 'USD',
                'payment_condition' => 'Credito 30 dias',
                'payment_method' => 'Transferencia',
                'document_type' => 'Factura',
                'article_type' => 'INSUMOS',
                'affects_igv' => true,
                'delivery_place' => 'Calle Leoncio Prado 830, San Luis - Lima',
                'order_status' => 'completed',
                'approval_status' => 'approved',
                'observations' => 'Compra de activos y conservantes importados para ginecologia y linea capilar.',
                'items' => [
                    ['code' => 'INS-22', 'requested_quantity' => 1000, 'received_quantity' => 1000, 'price_unit' => 1.4500],
                    ['code' => 'INS-23', 'requested_quantity' => 5000, 'received_quantity' => 5000, 'price_unit' => 0.0950],
                    ['code' => 'INS-26', 'requested_quantity' => 5000, 'received_quantity' => 5000, 'price_unit' => 0.0650],
                ],
            ],
            [
                'code' => 'MAG-OC-000003',
                'supplier_ruc' => '20604135890',
                'buyer_name' => 'KAMARY PERU SAC',
                'issue_date' => now()->subDays(15)->toDateString(),
                'expected_date' => now()->subDays(8)->toDateString(),
                'max_delivery_date' => now()->subDays(6)->toDateString(),
                'currency' => 'PEN',
                'payment_condition' => 'Credito 15 dias',
                'payment_method' => 'Depositos',
                'document_type' => 'Factura',
                'article_type' => 'INSUMOS',
                'affects_igv' => true,
                'delivery_place' => 'Calle Leoncio Prado 830, San Luis - Lima',
                'order_status' => 'completed',
                'approval_status' => 'approved',
                'observations' => 'Abastecimiento para formulacion capilar con minoxidil y vehiculos de solucion.',
                'items' => [
                    ['code' => 'INS-29', 'requested_quantity' => 500, 'received_quantity' => 500, 'price_unit' => 2.8000],
                    ['code' => 'INS-30', 'requested_quantity' => 10000, 'received_quantity' => 10000, 'price_unit' => 0.0240],
                    ['code' => 'INS-31', 'requested_quantity' => 20000, 'received_quantity' => 20000, 'price_unit' => 0.0130],
                ],
            ],
            [
                'code' => 'MAG-OC-000004',
                'supplier_ruc' => '20601984537',
                'buyer_name' => 'KAMARY PERU SAC',
                'issue_date' => now()->subDays(14)->toDateString(),
                'expected_date' => now()->subDays(6)->toDateString(),
                'max_delivery_date' => now()->subDays(4)->toDateString(),
                'currency' => 'PEN',
                'payment_condition' => 'Credito 21 dias',
                'payment_method' => 'Transferencia',
                'document_type' => 'Factura',
                'article_type' => 'INSUMOS',
                'affects_igv' => true,
                'delivery_place' => 'Calle Leoncio Prado 830, San Luis - Lima',
                'order_status' => 'completed',
                'approval_status' => 'approved',
                'observations' => 'Reabastecimiento de tensoactivos y coadyuvantes para formulacion de limpieza.',
                'items' => [
                    ['code' => 'INS-27', 'requested_quantity' => 15000, 'received_quantity' => 15000, 'price_unit' => 0.0220],
                    ['code' => 'INS-28', 'requested_quantity' => 8000, 'received_quantity' => 8000, 'price_unit' => 0.0280],
                ],
            ],
            [
                'code' => 'MAG-OC-000005',
                'supplier_ruc' => '20607511428',
                'buyer_name' => 'KAMARY PERU SAC',
                'issue_date' => now()->subDays(13)->toDateString(),
                'expected_date' => now()->subDays(5)->toDateString(),
                'max_delivery_date' => now()->subDays(3)->toDateString(),
                'currency' => 'PEN',
                'payment_condition' => 'Contado',
                'payment_method' => 'Transferencia',
                'document_type' => 'Factura',
                'article_type' => 'ENVASES',
                'affects_igv' => true,
                'delivery_place' => 'Calle Leoncio Prado 830, San Luis - Lima',
                'order_status' => 'completed',
                'approval_status' => 'approved',
                'observations' => 'Compra de envases primarios para productos terminados magistrales.',
                'items' => [
                    ['code' => 'ENV-01', 'requested_quantity' => 200, 'received_quantity' => 200, 'price_unit' => 3.2000],
                    ['code' => 'ENV-02', 'requested_quantity' => 150, 'received_quantity' => 150, 'price_unit' => 1.3500],
                    ['code' => 'ENV-03', 'requested_quantity' => 200, 'received_quantity' => 200, 'price_unit' => 2.1000],
                ],
            ],
        ];

        foreach ($orders as $definition) {
            $supplier = $supplierByRuc->get($definition['supplier_ruc']);
            if (!$supplier) {
                continue;
            }

            $lines = [];
            foreach ($definition['items'] as $line) {
                $article = $articleByCode->get($line['code']);
                $presentation = $article?->presentations?->first();
                if (!$article || !$presentation) {
                    continue;
                }

                $lineTotal = round($line['requested_quantity'] * $line['price_unit'], 2);
                $lines[] = [
                    'article' => $article,
                    'presentation' => $presentation,
                    'requested_quantity' => $line['requested_quantity'],
                    'received_quantity' => $line['received_quantity'],
                    'price_unit' => $line['price_unit'],
                    'total' => $lineTotal,
                ];
            }

            if (count($lines) === 0) {
                continue;
            }

            $grossSubtotal = round(collect($lines)->sum('total'), 2);
            $subtotal = $definition['affects_igv'] ? round($grossSubtotal / 1.18, 2) : $grossSubtotal;
            $taxAmount = round($grossSubtotal - $subtotal, 2);

            $order = PurchaseOrder::query()->create([
                'business_id' => $business->id,
                'module_scope' => 'magistrales',
                'business_branch_id' => $branch->id,
                'warehouse_id' => $warehouse->id,
                'supplier_id' => $supplier->id,
                'code' => $definition['code'],
                'buyer_name' => $definition['buyer_name'],
                'article_type' => $definition['article_type'],
                'issue_date' => $definition['issue_date'],
                'expected_date' => $definition['expected_date'],
                'max_delivery_date' => $definition['max_delivery_date'],
                'delivery_place' => $definition['delivery_place'],
                'currency' => $definition['currency'],
                'payment_condition' => $definition['payment_condition'],
                'payment_method' => $definition['payment_method'],
                'document_type' => $definition['document_type'],
                'affects_igv' => $definition['affects_igv'],
                'order_status' => $definition['order_status'],
                'approval_status' => $definition['approval_status'],
                'observations' => $definition['observations'],
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'total' => $grossSubtotal,
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);

            foreach ($lines as $line) {
                PurchaseOrderItem::query()->create([
                    'purchase_order_id' => $order->id,
                    'article_id' => $line['article']->id,
                    'presentation_id' => $line['presentation']->id,
                    'presentation_label' => $line['presentation']->name,
                    'presentation_units' => $line['presentation']->units,
                    'last_price' => $line['presentation']->purchase_price_national,
                    'requested_quantity' => $line['requested_quantity'],
                    'received_quantity' => $line['received_quantity'],
                    'price_unit' => $line['price_unit'],
                    'total' => $line['total'],
                    'status' => true,
                ]);
            }
        }

        return PurchaseOrder::query()
            ->where('module_scope', 'magistrales')
            ->with('items')
            ->orderBy('code')
            ->get();
    }

    private function ensureIncomes(Business $business, Warehouse $warehouse, Collection $suppliers, Collection $purchaseOrders, Collection $articles): Collection
    {
        $articleByCode = $articles->keyBy('code');
        $supplierById = $suppliers->keyBy('id');
        $incomeRows = [
            [
                'code' => 'MAG-ING-000001',
                'purchase_order_code' => 'MAG-OC-000001',
                'document_series' => 'F001',
                'document_sequence' => '00042158',
                'guide_number' => 'T001-000184',
                'guide_series' => 'T001',
                'guide_sequence' => '000184',
                'origin' => 'Recepcion programada de excipientes',
                'currency' => 'PEN',
                'payment_method' => 'Transferencia',
                'issue_date' => now()->subDays(12)->toDateString(),
                'items' => [
                    ['code' => 'INS-21', 'quantity' => 25000, 'lot' => 'UR-240501', 'expiration_date' => now()->addMonths(24)->toDateString(), 'price_without_igv' => 0.0280],
                    ['code' => 'INS-24', 'quantity' => 20000, 'lot' => 'GL-240430', 'expiration_date' => now()->addMonths(24)->toDateString(), 'price_without_igv' => 0.0180],
                    ['code' => 'INS-25', 'quantity' => 10000, 'lot' => 'CS-240428', 'expiration_date' => now()->addMonths(36)->toDateString(), 'price_without_igv' => 0.0120],
                ],
            ],
            [
                'code' => 'MAG-ING-000002',
                'purchase_order_code' => 'MAG-OC-000002',
                'document_series' => 'F201',
                'document_sequence' => '00003792',
                'guide_number' => 'T201-000092',
                'guide_series' => 'T201',
                'guide_sequence' => '000092',
                'origin' => 'Ingreso de activos importados',
                'currency' => 'USD',
                'payment_method' => 'Transferencia',
                'issue_date' => now()->subDays(9)->toDateString(),
                'items' => [
                    ['code' => 'INS-22', 'quantity' => 1000, 'lot' => 'AH-240515', 'expiration_date' => now()->addMonths(18)->toDateString(), 'price_without_igv' => 1.4500],
                    ['code' => 'INS-23', 'quantity' => 5000, 'lot' => 'CB-240512', 'expiration_date' => now()->addMonths(30)->toDateString(), 'price_without_igv' => 0.0950],
                    ['code' => 'INS-26', 'quantity' => 5000, 'lot' => 'BR-240514', 'expiration_date' => now()->addMonths(18)->toDateString(), 'price_without_igv' => 0.0650],
                ],
            ],
            [
                'code' => 'MAG-ING-000003',
                'purchase_order_code' => 'MAG-OC-000003',
                'document_series' => 'F015',
                'document_sequence' => '00061284',
                'guide_number' => 'T015-000221',
                'guide_series' => 'T015',
                'guide_sequence' => '000221',
                'origin' => 'Ingreso de linea capilar',
                'currency' => 'PEN',
                'payment_method' => 'Depositos',
                'issue_date' => now()->subDays(8)->toDateString(),
                'items' => [
                    ['code' => 'INS-29', 'quantity' => 500, 'lot' => 'MX-240516', 'expiration_date' => now()->addMonths(12)->toDateString(), 'price_without_igv' => 2.8000],
                    ['code' => 'INS-30', 'quantity' => 10000, 'lot' => 'PG-240518', 'expiration_date' => now()->addMonths(24)->toDateString(), 'price_without_igv' => 0.0240],
                    ['code' => 'INS-31', 'quantity' => 20000, 'lot' => 'AE-240519', 'expiration_date' => now()->addMonths(24)->toDateString(), 'price_without_igv' => 0.0130],
                ],
            ],
            [
                'code' => 'MAG-ING-000004',
                'purchase_order_code' => 'MAG-OC-000004',
                'document_series' => 'F084',
                'document_sequence' => '00011842',
                'guide_number' => 'T084-000077',
                'guide_series' => 'T084',
                'guide_sequence' => '000077',
                'origin' => 'Reposicion de tensoactivos',
                'currency' => 'PEN',
                'payment_method' => 'Transferencia',
                'issue_date' => now()->subDays(6)->toDateString(),
                'items' => [
                    ['code' => 'INS-27', 'quantity' => 15000, 'lot' => 'TX-240520', 'expiration_date' => now()->addMonths(24)->toDateString(), 'price_without_igv' => 0.0220],
                    ['code' => 'INS-28', 'quantity' => 8000, 'lot' => 'CK-240520', 'expiration_date' => now()->addMonths(24)->toDateString(), 'price_without_igv' => 0.0280],
                ],
            ],
            [
                'code' => 'MAG-ING-000005',
                'purchase_order_code' => 'MAG-OC-000005',
                'document_series' => 'F122',
                'document_sequence' => '00005419',
                'guide_number' => 'T122-000041',
                'guide_series' => 'T122',
                'guide_sequence' => '000041',
                'origin' => 'Ingreso de envases primarios',
                'currency' => 'PEN',
                'payment_method' => 'Transferencia',
                'issue_date' => now()->subDays(5)->toDateString(),
                'items' => [
                    ['code' => 'ENV-01', 'quantity' => 200, 'lot' => 'FA-240521', 'expiration_date' => null, 'price_without_igv' => 3.2000],
                    ['code' => 'ENV-02', 'quantity' => 150, 'lot' => 'PB-240521', 'expiration_date' => null, 'price_without_igv' => 1.3500],
                    ['code' => 'ENV-03', 'quantity' => 200, 'lot' => 'TC-240521', 'expiration_date' => null, 'price_without_igv' => 2.1000],
                ],
            ],
        ];

        foreach ($incomeRows as $definition) {
            $purchaseOrder = $purchaseOrders->firstWhere('code', $definition['purchase_order_code']);
            $supplier = $supplierById->get($purchaseOrder?->supplier_id);
            if (!$purchaseOrder || !$supplier) {
                continue;
            }

            $grossSubtotal = 0;
            $lines = [];
            foreach ($definition['items'] as $line) {
                $article = $articleByCode->get($line['code']);
                if (!$article) {
                    continue;
                }
                $priceWithIgv = round($line['price_without_igv'] * 1.18, 4);
                $lineSubtotal = round($line['quantity'] * $line['price_without_igv'], 2);
                $grossSubtotal += round($line['quantity'] * $priceWithIgv, 2);
                $lines[] = [
                    'article' => $article,
                    'description' => $article->name,
                    'quantity' => $line['quantity'],
                    'presentation' => $article->unit?->symbol ?: 'UND',
                    'expiration_date' => $line['expiration_date'],
                    'lot' => $line['lot'],
                    'price_without_igv' => $line['price_without_igv'],
                    'price_with_igv' => $priceWithIgv,
                    'subtotal' => $lineSubtotal,
                ];
            }

            if (count($lines) === 0) {
                continue;
            }

            $subtotal = round(collect($lines)->sum('subtotal'), 2);
            $igv = round($grossSubtotal - $subtotal, 2);

            $income = MagistralIncome::query()->create([
                'code' => $definition['code'],
                'purchase_order_code' => $purchaseOrder->code,
                'document_type' => 'Factura',
                'document_series' => $definition['document_series'],
                'document_sequence' => $definition['document_sequence'],
                'guide_number' => $definition['guide_number'],
                'guide_series' => $definition['guide_series'],
                'guide_sequence' => $definition['guide_sequence'],
                'guide_ruc' => $supplier->ruc,
                'business_id' => $business->id,
                'warehouse_id' => $warehouse->id,
                'supplier_id' => $supplier->id,
                'payment_method' => $definition['payment_method'],
                'origin' => $definition['origin'],
                'currency' => $definition['currency'],
                'affects_igv' => true,
                'issue_date' => $definition['issue_date'],
                'observations' => 'Ingreso registrado contra orden de compra ' . $purchaseOrder->code,
                'subtotal' => $subtotal,
                'igv' => $igv,
                'total' => round($subtotal + $igv, 2),
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);

            foreach ($lines as $line) {
                MagistralIncomeItem::query()->create([
                    'magistral_income_id' => $income->id,
                    'article_id' => $line['article']->id,
                    'description' => $line['description'],
                    'quantity' => $line['quantity'],
                    'presentation' => $line['presentation'],
                    'expiration_date' => $line['expiration_date'],
                    'lot' => $line['lot'],
                    'price_without_igv' => $line['price_without_igv'],
                    'price_with_igv' => $line['price_with_igv'],
                    'subtotal' => $line['subtotal'],
                    'status' => true,
                ]);
            }
        }

        return MagistralIncome::query()->orderBy('code')->get();
    }

    private function ensureProductionOrders(Warehouse $warehouse, Collection $responsibles, Collection $formats, Collection $articles, Collection $formulas): Collection
    {
        $articleByCode = $articles->keyBy('code');
        $formulaByArticleId = $formulas->keyBy('article_id');
        $responsibleByDocument = $responsibles->keyBy('document_number');
        $formatByDescription = $formats->keyBy('description');

        $orders = [
            [
                'code' => 'MAG-OP-000001',
                'article_code' => 'PT-01',
                'format' => 'Tubo x 60 g',
                'responsible_document' => '74125836',
                'quantity' => 40,
                'registration_date' => now()->subDays(4)->toDateString(),
                'delivery_date' => now()->subDays(3)->toDateString(),
                'observations' => 'Lote de produccion para demanda ginecologica programada.',
                'items' => [
                    ['code' => 'INS-22', 'quantity' => 80],
                    ['code' => 'INS-23', 'quantity' => 120],
                    ['code' => 'INS-24', 'quantity' => 400],
                    ['code' => 'INS-26', 'quantity' => 32],
                    ['code' => 'INS-25', 'quantity' => 20],
                    ['code' => 'ENV-03', 'quantity' => 40],
                ],
            ],
            [
                'code' => 'MAG-OP-000002',
                'article_code' => 'PT-02',
                'format' => 'Pote x 100 g',
                'responsible_document' => '42136795',
                'quantity' => 60,
                'registration_date' => now()->subDays(3)->toDateString(),
                'delivery_date' => now()->subDays(2)->toDateString(),
                'observations' => 'Produccion de crema humectante para cartera de pacientes recurrentes.',
                'items' => [
                    ['code' => 'INS-21', 'quantity' => 600],
                    ['code' => 'INS-24', 'quantity' => 350],
                    ['code' => 'INS-30', 'quantity' => 200],
                    ['code' => 'INS-23', 'quantity' => 90],
                    ['code' => 'ENV-02', 'quantity' => 60],
                ],
            ],
            [
                'code' => 'MAG-OP-000003',
                'article_code' => 'PT-03',
                'format' => 'Frasco ambar x 60 ml',
                'responsible_document' => '73514928',
                'quantity' => 30,
                'registration_date' => now()->subDays(2)->toDateString(),
                'delivery_date' => now()->subDays(1)->toDateString(),
                'observations' => 'Produccion bajo control para formulacion capilar con trazabilidad de lote.',
                'items' => [
                    ['code' => 'INS-29', 'quantity' => 90],
                    ['code' => 'INS-30', 'quantity' => 600],
                    ['code' => 'INS-31', 'quantity' => 900],
                    ['code' => 'INS-24', 'quantity' => 150],
                    ['code' => 'ENV-01', 'quantity' => 30],
                ],
            ],
        ];

        foreach ($orders as $definition) {
            $article = $articleByCode->get($definition['article_code']);
            $formula = $formulaByArticleId->get($article?->id);
            $responsible = $responsibleByDocument->get($definition['responsible_document']);
            $format = $formatByDescription->get($definition['format']);
            if (!$article || !$formula || !$responsible || !$format) {
                continue;
            }

            $order = MagistralProductionOrder::query()->create([
                'code' => $definition['code'],
                'order_status' => 'finished',
                'responsible_id' => $responsible->id,
                'destination' => 'Almacen Magistrales Principal',
                'destination_warehouse_id' => $warehouse->id,
                'article_id' => $article->id,
                'format_id' => $format->id,
                'batch_quantity' => 1,
                'quantity' => $definition['quantity'],
                'delivery_date' => $definition['delivery_date'],
                'registration_date' => $definition['registration_date'],
                'observations' => $definition['observations'],
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);

            foreach ($definition['items'] as $line) {
                $ingredient = $articleByCode->get($line['code']);
                if (!$ingredient) {
                    continue;
                }

                MagistralProductionOrderItem::query()->create([
                    'magistral_production_order_id' => $order->id,
                    'article_id' => $ingredient->id,
                    'description' => $ingredient->name,
                    'expiration_date' => $ingredient->stock_has_expiration ? now()->addMonths(12)->toDateString() : null,
                    'quantity' => $line['quantity'],
                    'magistral_formula_id' => $formula->id,
                    'total' => $line['quantity'],
                    'status' => true,
                ]);
            }
        }

        return MagistralProductionOrder::query()->orderBy('code')->get();
    }

    private function ensureOutputs(Warehouse $warehouse, Collection $articles): Collection
    {
        $articleByCode = $articles->keyBy('code');
        $outputs = [
            [
                'code' => 'MAG-SAL-000001',
                'article_code' => 'PT-01',
                'destination' => 'Muestra medica',
                'reason' => 'Entrega de muestra a ginecologia',
                'observations' => 'Salida no comercial para validacion medica.',
                'output_date' => now()->subDays(1)->toDateString(),
                'lot' => null,
                'expiration_date' => null,
                'quantity' => 1,
            ],
            [
                'code' => 'MAG-SAL-000002',
                'article_code' => 'PT-03',
                'destination' => 'Control de calidad',
                'reason' => 'Retencion de muestra por liberacion de lote',
                'observations' => 'Retencion interna para control y estabilidad.',
                'output_date' => now()->subDay()->toDateString(),
                'lot' => null,
                'expiration_date' => null,
                'quantity' => 1,
            ],
            [
                'code' => 'MAG-SAL-000003',
                'article_code' => 'INS-26',
                'destination' => 'Analisis microbiologico',
                'reason' => 'Consumo para verificacion de conservante',
                'observations' => 'Consumo interno de control microbiologico.',
                'output_date' => now()->subDay()->toDateString(),
                'lot' => 'BR-240514',
                'expiration_date' => now()->addMonths(18)->toDateString(),
                'quantity' => 5,
            ],
        ];

        foreach ($outputs as $definition) {
            $article = $articleByCode->get($definition['article_code']);
            if (!$article) {
                continue;
            }

            $stock = MagistralesStock::stock(
                $article->id,
                $warehouse->id,
                $definition['lot'],
                $definition['expiration_date']
            );

            $output = MagistralOutput::query()->create([
                'code' => $definition['code'],
                'origin_warehouse_id' => $warehouse->id,
                'destination' => $definition['destination'],
                'reason' => $definition['reason'],
                'observations' => $definition['observations'],
                'output_date' => $definition['output_date'],
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);

            MagistralOutputItem::query()->create([
                'magistral_output_id' => $output->id,
                'article_id' => $article->id,
                'code' => $article->code,
                'name' => $article->name,
                'lot' => $definition['lot'],
                'expiration_date' => $definition['expiration_date'],
                'stock' => $stock,
                'unit_label' => $article->unit?->symbol ?: 'UND',
                'quantity' => $definition['quantity'],
                'total' => $definition['quantity'],
                'status' => true,
            ]);
        }

        return MagistralOutput::query()->orderBy('code')->get();
    }

    private function ensureSales(Business $business, Warehouse $warehouse, Collection $articles): Collection
    {
        $articleByCode = $articles->keyBy('code');
        $sales = [
            [
                'code' => 'MAG-VTA-000001',
                'document_type' => 'Boleta',
                'document_number' => 'B001-00008421',
                'patient' => 'Mariana Caceres Rojas',
                'doctor' => 'Dra. Patricia Salvatierra',
                'sale_type' => 'venta',
                'payment_status' => 'paid',
                'discount_total' => 0,
                'is_quote' => false,
                'sale_date' => now()->subDays(2)->toDateString(),
                'items' => [
                    ['code' => 'PT-01', 'quantity' => 8, 'unit_price' => 48],
                ],
            ],
            [
                'code' => 'MAG-VTA-000002',
                'document_type' => 'Cotizacion',
                'document_number' => 'COT-000117',
                'patient' => 'Valeria Huaman Ortiz',
                'doctor' => 'Dra. Sandra Galarza',
                'sale_type' => 'cotizacion',
                'payment_status' => 'pending',
                'discount_total' => 0,
                'is_quote' => true,
                'sale_date' => now()->subDays(2)->toDateString(),
                'items' => [
                    ['code' => 'PT-01', 'quantity' => 2, 'unit_price' => 48],
                ],
            ],
            [
                'code' => 'MAG-VTA-000003',
                'document_type' => 'Boleta',
                'document_number' => 'B001-00008437',
                'patient' => 'Luis Enrique Bustamante',
                'doctor' => 'Dr. Roberto Mendoza',
                'sale_type' => 'venta',
                'payment_status' => 'paid',
                'discount_total' => 6,
                'is_quote' => false,
                'sale_date' => now()->subDay()->toDateString(),
                'items' => [
                    ['code' => 'PT-02', 'quantity' => 12, 'unit_price' => 32],
                ],
            ],
            [
                'code' => 'MAG-VTA-000004',
                'document_type' => 'Factura',
                'document_number' => 'F001-00002118',
                'patient' => 'Alonso Vela Paredes',
                'doctor' => 'Dr. Cesar Tueros',
                'sale_type' => 'venta',
                'payment_status' => 'paid',
                'discount_total' => 0,
                'is_quote' => false,
                'sale_date' => now()->toDateString(),
                'items' => [
                    ['code' => 'PT-03', 'quantity' => 6, 'unit_price' => 58],
                ],
            ],
        ];

        foreach ($sales as $definition) {
            $lines = [];
            $grossSubtotal = 0;
            foreach ($definition['items'] as $line) {
                $article = $articleByCode->get($line['code']);
                if (!$article) {
                    continue;
                }

                $lineSubtotal = round($line['quantity'] * $line['unit_price'], 2);
                $grossSubtotal += $lineSubtotal;
                $lines[] = [
                    'article' => $article,
                    'quantity' => $line['quantity'],
                    'unit_price' => $line['unit_price'],
                    'discount' => 0,
                    'subtotal' => $lineSubtotal,
                ];
            }

            if (count($lines) === 0) {
                continue;
            }

            $total = round($grossSubtotal - $definition['discount_total'], 2);
            $taxable = round($total / 1.18, 2);
            $igv = round($total - $taxable, 2);

            $sale = MagistralSale::query()->create([
                'code' => $definition['code'],
                'pharmacy' => 'Farmacia Magistrales',
                'business_id' => $business->id,
                'payment_status' => $definition['payment_status'],
                'document_type' => $definition['document_type'],
                'document_number' => $definition['document_number'],
                'patient' => $definition['patient'],
                'doctor' => $definition['doctor'],
                'discount_policy' => $definition['discount_total'] > 0 ? 'Descuento por paciente frecuente' : null,
                'sale_type' => $definition['sale_type'],
                'allergy' => false,
                'intolerance' => false,
                'taxable_amount' => $taxable,
                'unaffected_amount' => 0,
                'discount_total' => $definition['discount_total'],
                'subtotal' => round($grossSubtotal, 2),
                'igv' => $igv,
                'total' => $total,
                'is_quote' => $definition['is_quote'],
                'sale_date' => $definition['sale_date'],
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);

            foreach ($lines as $line) {
                MagistralSaleItem::query()->create([
                    'magistral_sale_id' => $sale->id,
                    'article_id' => $line['article']->id,
                    'warehouse_id' => $warehouse->id,
                    'description' => $line['article']->name,
                    'stock' => MagistralesStock::stock($line['article']->id, $warehouse->id),
                    'quantity' => $line['quantity'],
                    'unit_price' => $line['unit_price'],
                    'discount' => $line['discount'],
                    'subtotal' => $line['subtotal'],
                    'status' => true,
                ]);
            }
        }

        return MagistralSale::query()->orderBy('code')->get();
    }

    private function ensureInventoryCounts(BusinessBranch $branch, Warehouse $warehouse, Collection $articles): Collection
    {
        $articleByCode = $articles->keyBy('code');
        $counts = [
            ['code' => 'MAG-INV-000001', 'article_code' => 'INS-24', 'lot' => 'GL-240430', 'expiration_date' => now()->addMonths(24)->toDateString(), 'adjustment' => -2],
            ['code' => 'MAG-INV-000002', 'article_code' => 'ENV-03', 'lot' => 'TC-240521', 'expiration_date' => null, 'adjustment' => 0],
            ['code' => 'MAG-INV-000003', 'article_code' => 'PT-01', 'lot' => null, 'expiration_date' => null, 'adjustment' => -1],
            ['code' => 'MAG-INV-000004', 'article_code' => 'PT-03', 'lot' => null, 'expiration_date' => null, 'adjustment' => 0],
        ];

        foreach ($counts as $definition) {
            $article = $articleByCode->get($definition['article_code']);
            if (!$article) {
                continue;
            }

            $systemStock = MagistralesStock::stock(
                $article->id,
                $warehouse->id,
                $definition['lot'],
                $definition['expiration_date']
            );
            $realStock = max(0, $systemStock + $definition['adjustment']);

            $inventory = MagistralInventoryCount::query()->create([
                'code' => $definition['code'],
                'business_branch_id' => $branch->id,
                'warehouse_id' => $warehouse->id,
                'count_date' => now()->toDateString(),
                'observations' => 'Conteo ciclico de validacion para almacen fijo Magistrales.',
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);

            MagistralInventoryCountItem::query()->create([
                'magistral_inventory_count_id' => $inventory->id,
                'article_id' => $article->id,
                'lot' => $definition['lot'],
                'expiration_date' => $definition['expiration_date'],
                'system_stock' => $systemStock,
                'real_stock' => $realStock,
                'difference' => round($realStock - $systemStock, 3),
                'status' => true,
            ]);
        }

        return MagistralInventoryCount::query()->orderBy('code')->get();
    }

    private function articleCatalog(): array
    {
        $farDate = now()->addMonths(24)->toDateString();
        $midDate = now()->addMonths(18)->toDateString();
        $shortDate = now()->addMonths(12)->toDateString();

        return [
            [
                'code' => 'INS-21',
                'name' => 'Urea USP',
                'composition' => 'Urea farmaceutica grado USP',
                'article_type' => 'INSUMOS',
                'administration_route' => 'Topica',
                'category' => 'INSUMOS',
                'subcategory' => 'Activos',
                'magistral_presentation' => 'POLVO',
                'health_registration' => 'MAT-INS-UREA-001',
                'laboratory_code' => 'MAGLAB-003',
                'unit_symbol' => 'G',
                'volume' => 1,
                'units_per_article' => 1,
                'unit_weight' => 1,
                'default_lot' => 'UR-240501',
                'default_expiration_date' => $farDate,
                'stock_min' => 2000,
                'stock_max' => 25000,
                'currency' => 'PEN',
                'stock_has_expiration' => true,
                'stock_has_lot' => true,
                'igv_rule' => true,
                'cost_price' => 0.0280,
                'sale_price' => 0.0450,
                'purchase_price_national' => 0.0280,
                'purchase_price_foreign' => 0,
                'notes' => 'Materia prima para cremas dermatologicas.',
                'presentations' => [
                    ['name' => 'Bolsa x 25 Kg', 'units' => 25000, 'price' => 1125.00, 'purchase_price_national' => 700.00, 'purchase_price_foreign' => 0],
                ],
            ],
            [
                'code' => 'INS-22',
                'name' => 'Acido Hialuronico Liquido',
                'composition' => 'Solucion concentrada de acido hialuronico',
                'article_type' => 'INSUMOS',
                'administration_route' => 'Topica',
                'category' => 'INSUMOS',
                'subcategory' => 'Activos',
                'magistral_presentation' => 'LIQUIDO',
                'health_registration' => 'MAT-INS-AH-002',
                'laboratory_code' => 'MAGLAB-004',
                'unit_symbol' => 'ML',
                'volume' => 1,
                'units_per_article' => 1,
                'unit_weight' => 1,
                'default_lot' => 'AH-240515',
                'default_expiration_date' => $midDate,
                'stock_min' => 200,
                'stock_max' => 1500,
                'currency' => 'USD',
                'stock_has_expiration' => true,
                'stock_has_lot' => true,
                'igv_rule' => true,
                'cost_price' => 1.4500,
                'sale_price' => 1.9800,
                'purchase_price_national' => 0,
                'purchase_price_foreign' => 1.4500,
                'notes' => 'Activo de alta rotacion para linea ginecologica.',
                'presentations' => [
                    ['name' => 'Frasco x 1 L', 'units' => 1000, 'price' => 1980.00, 'purchase_price_national' => 0, 'purchase_price_foreign' => 1450.00],
                ],
            ],
            [
                'code' => 'INS-23',
                'name' => 'Carbopol 940',
                'composition' => 'Polimero gelificante grado farmaceutico',
                'article_type' => 'INSUMOS',
                'administration_route' => 'Topica',
                'category' => 'INSUMOS',
                'subcategory' => 'Excipientes',
                'magistral_presentation' => 'POLVO',
                'health_registration' => 'MAT-INS-CB-003',
                'laboratory_code' => 'MAGLAB-001',
                'unit_symbol' => 'G',
                'volume' => 1,
                'units_per_article' => 1,
                'unit_weight' => 1,
                'default_lot' => 'CB-240512',
                'default_expiration_date' => $farDate,
                'stock_min' => 500,
                'stock_max' => 6000,
                'currency' => 'PEN',
                'stock_has_expiration' => true,
                'stock_has_lot' => true,
                'igv_rule' => true,
                'cost_price' => 0.0950,
                'sale_price' => 0.1420,
                'purchase_price_national' => 0.0950,
                'purchase_price_foreign' => 0,
                'notes' => 'Gelificante para geles y cremas magistrales.',
                'presentations' => [
                    ['name' => 'Bolsa x 5 Kg', 'units' => 5000, 'price' => 710.00, 'purchase_price_national' => 475.00, 'purchase_price_foreign' => 0],
                ],
            ],
            [
                'code' => 'INS-24',
                'name' => 'Glicerina USP',
                'composition' => 'Glicerina grado USP',
                'article_type' => 'INSUMOS',
                'administration_route' => 'Topica',
                'category' => 'INSUMOS',
                'subcategory' => 'Excipientes',
                'magistral_presentation' => 'LIQUIDO',
                'health_registration' => 'MAT-INS-GL-004',
                'laboratory_code' => 'MAGLAB-005',
                'unit_symbol' => 'ML',
                'volume' => 1,
                'units_per_article' => 1,
                'unit_weight' => 1,
                'default_lot' => 'GL-240430',
                'default_expiration_date' => $farDate,
                'stock_min' => 2000,
                'stock_max' => 25000,
                'currency' => 'PEN',
                'stock_has_expiration' => true,
                'stock_has_lot' => true,
                'igv_rule' => true,
                'cost_price' => 0.0180,
                'sale_price' => 0.0310,
                'purchase_price_national' => 0.0180,
                'purchase_price_foreign' => 0,
                'notes' => 'Humectante base para formulas magistrales.',
                'presentations' => [
                    ['name' => 'Bidon x 20 L', 'units' => 20000, 'price' => 620.00, 'purchase_price_national' => 360.00, 'purchase_price_foreign' => 0],
                ],
            ],
            [
                'code' => 'INS-25',
                'name' => 'Cloruro de Sodio',
                'composition' => 'Cloruro de sodio grado farmaceutico',
                'article_type' => 'INSUMOS',
                'administration_route' => 'Topica',
                'category' => 'INSUMOS',
                'subcategory' => 'Excipientes',
                'magistral_presentation' => 'POLVO',
                'health_registration' => 'MAT-INS-CS-005',
                'laboratory_code' => 'MAGLAB-003',
                'unit_symbol' => 'G',
                'volume' => 1,
                'units_per_article' => 1,
                'unit_weight' => 1,
                'default_lot' => 'CS-240428',
                'default_expiration_date' => $farDate,
                'stock_min' => 1000,
                'stock_max' => 15000,
                'currency' => 'PEN',
                'stock_has_expiration' => true,
                'stock_has_lot' => true,
                'igv_rule' => true,
                'cost_price' => 0.0120,
                'sale_price' => 0.0200,
                'purchase_price_national' => 0.0120,
                'purchase_price_foreign' => 0,
                'notes' => 'Corrector de tonicidad y coadyuvante de formula.',
                'presentations' => [
                    ['name' => 'Bolsa x 10 Kg', 'units' => 10000, 'price' => 200.00, 'purchase_price_national' => 120.00, 'purchase_price_foreign' => 0],
                ],
            ],
            [
                'code' => 'INS-26',
                'name' => 'Bronidox L',
                'composition' => 'Conservante liquido para formulas topicas',
                'article_type' => 'INSUMOS',
                'administration_route' => 'Topica',
                'category' => 'INSUMOS',
                'subcategory' => 'Conservantes',
                'magistral_presentation' => 'LIQUIDO',
                'health_registration' => 'MAT-INS-BR-006',
                'laboratory_code' => 'MAGLAB-002',
                'unit_symbol' => 'ML',
                'volume' => 1,
                'units_per_article' => 1,
                'unit_weight' => 1,
                'default_lot' => 'BR-240514',
                'default_expiration_date' => $midDate,
                'stock_min' => 300,
                'stock_max' => 6000,
                'currency' => 'PEN',
                'stock_has_expiration' => true,
                'stock_has_lot' => true,
                'igv_rule' => true,
                'cost_price' => 0.0650,
                'sale_price' => 0.0980,
                'purchase_price_national' => 0.0650,
                'purchase_price_foreign' => 0,
                'notes' => 'Conservante usado en geles y shampoo magistral.',
                'presentations' => [
                    ['name' => 'Frasco x 5 L', 'units' => 5000, 'price' => 490.00, 'purchase_price_national' => 325.00, 'purchase_price_foreign' => 0],
                ],
            ],
            [
                'code' => 'INS-27',
                'name' => 'Texapon N70',
                'composition' => 'Tensoactivo anionico para linea dermolavante',
                'article_type' => 'INSUMOS',
                'administration_route' => 'Topica',
                'category' => 'INSUMOS',
                'subcategory' => 'Excipientes',
                'magistral_presentation' => 'LIQUIDO',
                'health_registration' => 'MAT-INS-TX-007',
                'laboratory_code' => 'MAGLAB-001',
                'unit_symbol' => 'ML',
                'volume' => 1,
                'units_per_article' => 1,
                'unit_weight' => 1,
                'default_lot' => 'TX-240520',
                'default_expiration_date' => $farDate,
                'stock_min' => 3000,
                'stock_max' => 20000,
                'currency' => 'PEN',
                'stock_has_expiration' => true,
                'stock_has_lot' => true,
                'igv_rule' => true,
                'cost_price' => 0.0220,
                'sale_price' => 0.0340,
                'purchase_price_national' => 0.0220,
                'purchase_price_foreign' => 0,
                'notes' => 'Base detergente para formulas de higiene.',
                'presentations' => [
                    ['name' => 'Bidon x 15 L', 'units' => 15000, 'price' => 510.00, 'purchase_price_national' => 330.00, 'purchase_price_foreign' => 0],
                ],
            ],
            [
                'code' => 'INS-28',
                'name' => 'Comperlan KD',
                'composition' => 'Espesante y co-tensoactivo',
                'article_type' => 'INSUMOS',
                'administration_route' => 'Topica',
                'category' => 'INSUMOS',
                'subcategory' => 'Excipientes',
                'magistral_presentation' => 'LIQUIDO',
                'health_registration' => 'MAT-INS-CK-008',
                'laboratory_code' => 'MAGLAB-001',
                'unit_symbol' => 'ML',
                'volume' => 1,
                'units_per_article' => 1,
                'unit_weight' => 1,
                'default_lot' => 'CK-240520',
                'default_expiration_date' => $farDate,
                'stock_min' => 1000,
                'stock_max' => 12000,
                'currency' => 'PEN',
                'stock_has_expiration' => true,
                'stock_has_lot' => true,
                'igv_rule' => true,
                'cost_price' => 0.0280,
                'sale_price' => 0.0410,
                'purchase_price_national' => 0.0280,
                'purchase_price_foreign' => 0,
                'notes' => 'Co-tensoactivo para ajuste de viscosidad.',
                'presentations' => [
                    ['name' => 'Bidon x 8 L', 'units' => 8000, 'price' => 328.00, 'purchase_price_national' => 224.00, 'purchase_price_foreign' => 0],
                ],
            ],
            [
                'code' => 'INS-29',
                'name' => 'Minoxidil Base',
                'composition' => 'Minoxidil micronizado',
                'article_type' => 'INSUMOS',
                'administration_route' => 'Topica',
                'category' => 'ANDROLOGIA',
                'subcategory' => 'Geles transdermicos',
                'magistral_presentation' => 'POLVO',
                'health_registration' => 'MAT-INS-MX-009',
                'laboratory_code' => 'MAGLAB-004',
                'unit_symbol' => 'G',
                'volume' => 1,
                'units_per_article' => 1,
                'unit_weight' => 1,
                'default_lot' => 'MX-240516',
                'default_expiration_date' => $shortDate,
                'stock_min' => 100,
                'stock_max' => 1000,
                'currency' => 'PEN',
                'stock_has_expiration' => true,
                'stock_has_lot' => true,
                'igv_rule' => true,
                'cost_price' => 2.8000,
                'sale_price' => 3.6500,
                'purchase_price_national' => 2.8000,
                'purchase_price_foreign' => 0,
                'notes' => 'Activo para formulacion capilar bajo prescripcion.',
                'presentations' => [
                    ['name' => 'Bolsa x 500 g', 'units' => 500, 'price' => 1825.00, 'purchase_price_national' => 1400.00, 'purchase_price_foreign' => 0],
                ],
            ],
            [
                'code' => 'INS-30',
                'name' => 'Propilenglicol USP',
                'composition' => 'Propilenglicol grado USP',
                'article_type' => 'INSUMOS',
                'administration_route' => 'Topica',
                'category' => 'ANDROLOGIA',
                'subcategory' => 'Soluciones capilares',
                'magistral_presentation' => 'LIQUIDO',
                'health_registration' => 'MAT-INS-PG-010',
                'laboratory_code' => 'MAGLAB-005',
                'unit_symbol' => 'ML',
                'volume' => 1,
                'units_per_article' => 1,
                'unit_weight' => 1,
                'default_lot' => 'PG-240518',
                'default_expiration_date' => $farDate,
                'stock_min' => 1500,
                'stock_max' => 12000,
                'currency' => 'PEN',
                'stock_has_expiration' => true,
                'stock_has_lot' => true,
                'igv_rule' => true,
                'cost_price' => 0.0240,
                'sale_price' => 0.0360,
                'purchase_price_national' => 0.0240,
                'purchase_price_foreign' => 0,
                'notes' => 'Vehiculo para soluciones capilares.',
                'presentations' => [
                    ['name' => 'Bidon x 10 L', 'units' => 10000, 'price' => 360.00, 'purchase_price_national' => 240.00, 'purchase_price_foreign' => 0],
                ],
            ],
            [
                'code' => 'INS-31',
                'name' => 'Alcohol Etilico 96',
                'composition' => 'Alcohol etilico 96 grados',
                'article_type' => 'INSUMOS',
                'administration_route' => 'Topica',
                'category' => 'ANDROLOGIA',
                'subcategory' => 'Soluciones capilares',
                'magistral_presentation' => 'LIQUIDO',
                'health_registration' => 'MAT-INS-AE-011',
                'laboratory_code' => 'MAGLAB-006',
                'unit_symbol' => 'ML',
                'volume' => 1,
                'units_per_article' => 1,
                'unit_weight' => 1,
                'default_lot' => 'AE-240519',
                'default_expiration_date' => $farDate,
                'stock_min' => 2000,
                'stock_max' => 25000,
                'currency' => 'PEN',
                'stock_has_expiration' => true,
                'stock_has_lot' => true,
                'igv_rule' => true,
                'cost_price' => 0.0130,
                'sale_price' => 0.0210,
                'purchase_price_national' => 0.0130,
                'purchase_price_foreign' => 0,
                'notes' => 'Vehiculo hidroalcoholico para soluciones externas.',
                'presentations' => [
                    ['name' => 'Bidon x 20 L', 'units' => 20000, 'price' => 420.00, 'purchase_price_national' => 260.00, 'purchase_price_foreign' => 0],
                ],
            ],
            [
                'code' => 'ENV-01',
                'name' => 'Frasco PET Ambar 60 ml',
                'composition' => 'Envase PET ambar con tapa rosca',
                'article_type' => 'ENVASES',
                'administration_route' => 'Topica',
                'category' => 'INSUMOS',
                'subcategory' => 'Envases',
                'magistral_presentation' => 'FRASCO',
                'health_registration' => 'ENV-PRIM-001',
                'laboratory_code' => 'MAGLAB-006',
                'unit_symbol' => 'UND',
                'volume' => 60,
                'units_per_article' => 1,
                'unit_weight' => 1,
                'default_lot' => 'FA-240521',
                'default_expiration_date' => null,
                'stock_min' => 50,
                'stock_max' => 500,
                'currency' => 'PEN',
                'stock_has_expiration' => false,
                'stock_has_lot' => true,
                'igv_rule' => true,
                'cost_price' => 3.2000,
                'sale_price' => 4.5000,
                'purchase_price_national' => 3.2000,
                'purchase_price_foreign' => 0,
                'notes' => 'Envase primario para linea capilar.',
                'presentations' => [
                    ['name' => 'Caja x 100 und', 'units' => 100, 'price' => 450.00, 'purchase_price_national' => 320.00, 'purchase_price_foreign' => 0],
                ],
            ],
            [
                'code' => 'ENV-02',
                'name' => 'Pote Blanco 100 g',
                'composition' => 'Pote de polipropileno con tapa liner',
                'article_type' => 'ENVASES',
                'administration_route' => 'Topica',
                'category' => 'INSUMOS',
                'subcategory' => 'Envases',
                'magistral_presentation' => 'POTE',
                'health_registration' => 'ENV-PRIM-002',
                'laboratory_code' => 'MAGLAB-006',
                'unit_symbol' => 'UND',
                'volume' => 100,
                'units_per_article' => 1,
                'unit_weight' => 1,
                'default_lot' => 'PB-240521',
                'default_expiration_date' => null,
                'stock_min' => 40,
                'stock_max' => 300,
                'currency' => 'PEN',
                'stock_has_expiration' => false,
                'stock_has_lot' => true,
                'igv_rule' => true,
                'cost_price' => 1.3500,
                'sale_price' => 2.1000,
                'purchase_price_national' => 1.3500,
                'purchase_price_foreign' => 0,
                'notes' => 'Envase primario para cremas magistrales.',
                'presentations' => [
                    ['name' => 'Caja x 150 und', 'units' => 150, 'price' => 315.00, 'purchase_price_national' => 202.50, 'purchase_price_foreign' => 0],
                ],
            ],
            [
                'code' => 'ENV-03',
                'name' => 'Tubo Colapsable 60 g',
                'composition' => 'Tubo colapsable laminado con tapa flip top',
                'article_type' => 'ENVASES',
                'administration_route' => 'Topica',
                'category' => 'INSUMOS',
                'subcategory' => 'Envases',
                'magistral_presentation' => 'TUBO',
                'health_registration' => 'ENV-PRIM-003',
                'laboratory_code' => 'MAGLAB-006',
                'unit_symbol' => 'UND',
                'volume' => 60,
                'units_per_article' => 1,
                'unit_weight' => 1,
                'default_lot' => 'TC-240521',
                'default_expiration_date' => null,
                'stock_min' => 50,
                'stock_max' => 400,
                'currency' => 'PEN',
                'stock_has_expiration' => false,
                'stock_has_lot' => true,
                'igv_rule' => true,
                'cost_price' => 2.1000,
                'sale_price' => 3.0000,
                'purchase_price_national' => 2.1000,
                'purchase_price_foreign' => 0,
                'notes' => 'Envase primario para geles vaginales.',
                'presentations' => [
                    ['name' => 'Caja x 100 und', 'units' => 100, 'price' => 300.00, 'purchase_price_national' => 210.00, 'purchase_price_foreign' => 0],
                ],
            ],
            [
                'code' => 'PT-01',
                'name' => 'Gel Vaginal Acido Hialuronico 1%',
                'composition' => 'Acido hialuronico, carbopol, glicerina y conservante',
                'article_type' => 'PRODUCTO TERMINADO',
                'administration_route' => 'Topica',
                'category' => 'GINECOLOGIA',
                'subcategory' => 'Geles vaginales',
                'magistral_presentation' => 'TUBO',
                'health_registration' => 'PT-GIN-001',
                'laboratory_code' => 'MAGLAB-004',
                'unit_symbol' => 'UND',
                'volume' => 60,
                'units_per_article' => 1,
                'unit_weight' => 60,
                'default_lot' => 'PTAH-240525',
                'default_expiration_date' => now()->addMonths(3)->toDateString(),
                'stock_min' => 10,
                'stock_max' => 120,
                'currency' => 'PEN',
                'stock_has_expiration' => false,
                'stock_has_lot' => false,
                'igv_rule' => true,
                'cost_price' => 21.5000,
                'sale_price' => 48.0000,
                'purchase_price_national' => 21.5000,
                'purchase_price_foreign' => 0,
                'notes' => 'Producto terminado de alta rotacion en ginecologia.',
                'presentations' => [
                    ['name' => 'Tubo x 60 g', 'units' => 1, 'price' => 48.00, 'purchase_price_national' => 21.50, 'purchase_price_foreign' => 0],
                ],
            ],
            [
                'code' => 'PT-02',
                'name' => 'Crema de Urea 10%',
                'composition' => 'Urea, glicerina, propilenglicol y base cremosa',
                'article_type' => 'PRODUCTO TERMINADO',
                'administration_route' => 'Topica',
                'category' => 'INSUMOS',
                'subcategory' => 'Excipientes',
                'magistral_presentation' => 'POTE',
                'health_registration' => 'PT-DER-002',
                'laboratory_code' => 'MAGLAB-005',
                'unit_symbol' => 'UND',
                'volume' => 100,
                'units_per_article' => 1,
                'unit_weight' => 100,
                'default_lot' => 'PTUR-240526',
                'default_expiration_date' => now()->addMonths(2)->toDateString(),
                'stock_min' => 12,
                'stock_max' => 150,
                'currency' => 'PEN',
                'stock_has_expiration' => false,
                'stock_has_lot' => false,
                'igv_rule' => true,
                'cost_price' => 14.8000,
                'sale_price' => 32.0000,
                'purchase_price_national' => 14.8000,
                'purchase_price_foreign' => 0,
                'notes' => 'Producto terminado para resequedad y mantenimiento dermatologico.',
                'presentations' => [
                    ['name' => 'Pote x 100 g', 'units' => 1, 'price' => 32.00, 'purchase_price_national' => 14.80, 'purchase_price_foreign' => 0],
                ],
            ],
            [
                'code' => 'PT-03',
                'name' => 'Solucion Capilar Minoxidil 5%',
                'composition' => 'Minoxidil, propilenglicol, alcohol etilico y glicerina',
                'article_type' => 'PRODUCTO TERMINADO',
                'administration_route' => 'Topica',
                'category' => 'ANDROLOGIA',
                'subcategory' => 'Soluciones capilares',
                'magistral_presentation' => 'FRASCO',
                'health_registration' => 'PT-AND-003',
                'laboratory_code' => 'MAGLAB-004',
                'unit_symbol' => 'UND',
                'volume' => 60,
                'units_per_article' => 1,
                'unit_weight' => 60,
                'default_lot' => 'PTMX-240527',
                'default_expiration_date' => now()->addMonths(2)->toDateString(),
                'stock_min' => 8,
                'stock_max' => 90,
                'currency' => 'PEN',
                'stock_has_expiration' => false,
                'stock_has_lot' => false,
                'igv_rule' => true,
                'cost_price' => 26.2000,
                'sale_price' => 58.0000,
                'purchase_price_national' => 26.2000,
                'purchase_price_foreign' => 0,
                'notes' => 'Producto terminado para tratamiento capilar bajo receta.',
                'presentations' => [
                    ['name' => 'Frasco ambar x 60 ml', 'units' => 1, 'price' => 58.00, 'purchase_price_national' => 26.20, 'purchase_price_foreign' => 0],
                ],
            ],
        ];
    }
}
