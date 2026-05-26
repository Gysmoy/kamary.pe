<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const MIN_ROWS = 10;

    private string $businessKey = 'kamary_medicals';
    private string $businessName = 'Kamary Medicals';
    private string $branchName = 'Principal Magistrales';
    private string $warehouseName = 'Almacen Magistrales Principal';

    public function up(): void
    {
        if (
            !Schema::hasTable('businesses')
            || !Schema::hasTable('business_branches')
            || !Schema::hasTable('warehouses')
            || !Schema::hasTable('articles')
        ) {
            return;
        }

        DB::transaction(function () {
            $userId = Schema::hasTable('users') ? DB::table('users')->orderBy('id')->value('id') : null;
            $businessId = $this->ensureBusiness($userId);
            $branchId = $this->ensureBranch($businessId, $userId);
            $warehouseId = $this->ensureWarehouse($branchId, $userId);

            $units = $this->ensureUnits($userId);
            $categories = $this->ensureCategories($warehouseId, $userId);
            $this->ensureSubcategories($categories, $userId);
            $formats = $this->ensureFormats($userId);
            $laboratories = $this->ensureLaboratories($userId);
            $responsibles = $this->ensureResponsibles($userId);
            $suppliers = $this->ensureSuppliers($userId);
            $articles = $this->ensureArticles($businessId, $units, $categories, $formats, $laboratories, $userId);
            $formulas = $this->ensureFormulas($articles, $userId);

            $purchaseOrders = $this->ensurePurchaseOrders($businessId, $branchId, $warehouseId, $suppliers, $articles, $userId);
            $this->ensureIncomes($businessId, $warehouseId, $suppliers, $articles, $purchaseOrders, $userId);
            $this->ensureProductionOrders($warehouseId, $responsibles, $formats, $articles, $formulas, $userId);
            $this->ensureOutputs($warehouseId, $articles, $userId);
            $this->ensureSales($businessId, $warehouseId, $articles, $userId);
            $this->ensureInventoryCounts($branchId, $warehouseId, $articles, $userId);
        });
    }

    public function down(): void
    {
        //
    }

    private function ensureBusiness(?int $userId): int
    {
        $id = DB::table('businesses')->where('business_key', $this->businessKey)->value('id');
        $payload = [
            'business_key' => $this->businessKey,
            'name' => $this->businessName,
            'trade_name' => $this->businessName,
            'description' => 'Unidad operativa para formulas magistrales.',
            'status' => true,
            'updated_by' => $userId,
        ];

        if ($id) {
            DB::table('businesses')->where('id', $id)->update($this->payload('businesses', array_merge($payload, [
                'updated_at' => now(),
            ])));
            return (int) $id;
        }

        return $this->insertRow('businesses', array_merge($payload, [
            'created_by' => $userId,
        ]));
    }

    private function ensureBranch(int $businessId, ?int $userId): int
    {
        $id = DB::table('business_branches')
            ->where('business_id', $businessId)
            ->where('name', $this->branchName)
            ->value('id');

        $payload = [
            'business_id' => $businessId,
            'name' => $this->branchName,
            'establishment_code' => '0000',
            'ubigeo' => '150101',
            'address' => 'Calle Leoncio Prado 830, Urb. La Vina, San Luis, Lima',
            'email' => 'magistrales@kamarymedicals.pe',
            'telephone' => '014856320',
            'series_factura' => 'FM01',
            'series_boleta' => 'BM01',
            'series_nota_credito' => 'FCM1',
            'status' => true,
            'updated_by' => $userId,
        ];

        if ($id) {
            DB::table('business_branches')->where('id', $id)->update($this->payload('business_branches', array_merge($payload, [
                'updated_at' => now(),
            ])));
            return (int) $id;
        }

        return $this->insertRow('business_branches', array_merge($payload, [
            'created_by' => $userId,
        ]));
    }

    private function ensureWarehouse(int $branchId, ?int $userId): int
    {
        $id = DB::table('warehouses')
            ->where('business_branch_id', $branchId)
            ->where('name', $this->warehouseName)
            ->value('id');

        $payload = [
            'business_branch_id' => $branchId,
            'name' => $this->warehouseName,
            'description' => 'Almacen fijo del modulo Magistrales.',
            'status' => true,
            'updated_by' => $userId,
        ];

        if ($id) {
            DB::table('warehouses')->where('id', $id)->update($this->payload('warehouses', array_merge($payload, [
                'updated_at' => now(),
            ])));
            return (int) $id;
        }

        return $this->insertRow('warehouses', array_merge($payload, [
            'created_by' => $userId,
        ]));
    }

    private function ensureUnits(?int $userId): array
    {
        if (!Schema::hasTable('units')) return [];

        $rows = [
            ['key' => 'UND', 'symbol' => 'MAG-UND', 'name' => 'Unidad Magistral'],
            ['key' => 'G', 'symbol' => 'MAG-G', 'name' => 'Gramo Magistral'],
            ['key' => 'ML', 'symbol' => 'MAG-ML', 'name' => 'Mililitro Magistral'],
            ['key' => 'CAP', 'symbol' => 'MAG-CAP', 'name' => 'Capsula Magistral'],
            ['key' => 'FCO', 'symbol' => 'MAG-FCO', 'name' => 'Frasco Magistral'],
            ['key' => 'TUB', 'symbol' => 'MAG-TUB', 'name' => 'Tubo Magistral'],
            ['key' => 'POT', 'symbol' => 'MAG-POT', 'name' => 'Pote Magistral'],
            ['key' => 'BLS', 'symbol' => 'MAG-BLS', 'name' => 'Bolsa Magistral'],
            ['key' => 'CJA', 'symbol' => 'MAG-CJA', 'name' => 'Caja Magistral'],
            ['key' => 'L', 'symbol' => 'MAG-L', 'name' => 'Litro Magistral'],
        ];

        $ids = [];
        foreach ($rows as $row) {
            $ids[$row['key']] = $this->upsertBy('units', ['symbol' => $row['symbol']], [
                'module_scope' => 'magistrales',
                'name' => $row['name'],
                'status' => true,
                'created_by' => $userId,
                'updated_by' => $userId,
            ]);
        }

        return $ids;
    }

    private function ensureCategories(int $warehouseId, ?int $userId): array
    {
        if (!Schema::hasTable('magistral_categories')) return [];

        $rows = [
            ['code' => 'MAG-CAT-001', 'description' => 'GINECOLOGIA'],
            ['code' => 'MAG-CAT-002', 'description' => 'INSUMOS'],
            ['code' => 'MAG-CAT-003', 'description' => 'ANDROLOGIA'],
            ['code' => 'MAG-CAT-004', 'description' => 'DERMATOLOGIA'],
            ['code' => 'MAG-CAT-005', 'description' => 'PEDIATRIA'],
            ['code' => 'MAG-CAT-006', 'description' => 'GASTROENTEROLOGIA'],
            ['code' => 'MAG-CAT-007', 'description' => 'DOLOR'],
            ['code' => 'MAG-CAT-008', 'description' => 'COSMETICA'],
            ['code' => 'MAG-CAT-009', 'description' => 'CAPSULAS'],
            ['code' => 'MAG-CAT-010', 'description' => 'NUTRICION'],
        ];

        $ids = [];
        foreach ($rows as $row) {
            $ids[$row['description']] = $this->upsertBy('magistral_categories', ['code' => $row['code']], [
                'description' => $row['description'],
                'warehouse_id' => $warehouseId,
                'sale_material' => $row['description'] !== 'INSUMOS',
                'status' => true,
                'created_by' => $userId,
                'updated_by' => $userId,
            ]);
        }

        return $ids;
    }

    private function ensureSubcategories(array $categories, ?int $userId): void
    {
        if (!Schema::hasTable('magistral_subcategories')) return;

        foreach ($categories as $categoryName => $categoryId) {
            if (!$categoryId) continue;

            foreach (['Base', 'Especializada'] as $suffix) {
                $this->upsertBy('magistral_subcategories', [
                    'magistral_category_id' => $categoryId,
                    'description' => $categoryName . ' ' . $suffix,
                ], [
                    'status' => true,
                    'created_by' => $userId,
                    'updated_by' => $userId,
                ]);
            }
        }
    }

    private function ensureFormats(?int $userId): array
    {
        if (!Schema::hasTable('magistral_formats')) return [];

        $rows = [
            ['description' => 'Capsulas x 30', 'quantity' => 30],
            ['description' => 'Crema 30 g', 'quantity' => 30],
            ['description' => 'Solucion 100 ml', 'quantity' => 100],
            ['description' => 'Gel 60 g', 'quantity' => 60],
            ['description' => 'Jarabe 120 ml', 'quantity' => 120],
            ['description' => 'Pomada 50 g', 'quantity' => 50],
            ['description' => 'Ovulos x 10', 'quantity' => 10],
            ['description' => 'Capsulas x 60', 'quantity' => 60],
            ['description' => 'Suspension 90 ml', 'quantity' => 90],
            ['description' => 'Polvo 100 g', 'quantity' => 100],
        ];

        $ids = [];
        foreach ($rows as $row) {
            $ids[$row['description']] = $this->upsertBy('magistral_formats', ['description' => $row['description']], [
                'quantity' => $row['quantity'],
                'status' => true,
                'created_by' => $userId,
                'updated_by' => $userId,
            ]);
        }

        return $ids;
    }

    private function ensureLaboratories(?int $userId): array
    {
        if (!Schema::hasTable('magistral_laboratories')) return [];

        $ids = [];
        for ($i = 1; $i <= self::MIN_ROWS; $i++) {
            $code = 'MAGLAB-' . str_pad((string) $i, 3, '0', STR_PAD_LEFT);
            $ids[] = $this->upsertBy('magistral_laboratories', ['code' => $code], [
                'description' => 'Laboratorio Magistral ' . str_pad((string) $i, 2, '0', STR_PAD_LEFT),
                'status' => true,
                'created_by' => $userId,
                'updated_by' => $userId,
            ]);
        }

        return array_values(array_filter($ids));
    }

    private function ensureResponsibles(?int $userId): array
    {
        if (!Schema::hasTable('magistral_responsibles')) return [];

        $ids = [];
        for ($i = 1; $i <= self::MIN_ROWS; $i++) {
            $document = 'MAG-RESP-' . str_pad((string) $i, 3, '0', STR_PAD_LEFT);
            $ids[] = $this->upsertBy('magistral_responsibles', ['document_number' => $document], [
                'name' => 'Responsable Magistrales ' . str_pad((string) $i, 2, '0', STR_PAD_LEFT),
                'status' => true,
                'created_by' => $userId,
                'updated_by' => $userId,
            ]);
        }

        return array_values(array_filter($ids));
    }

    private function ensureSuppliers(?int $userId): array
    {
        if (!Schema::hasTable('suppliers')) return [];

        $ids = [];
        for ($i = 1; $i <= self::MIN_ROWS; $i++) {
            $ruc = '206000000' . str_pad((string) $i, 2, '0', STR_PAD_LEFT);
            $name = 'Proveedor Magistral ' . str_pad((string) $i, 2, '0', STR_PAD_LEFT);
            $ids[] = $this->upsertBy('suppliers', ['ruc' => $ruc], [
                'module_scope' => 'magistrales',
                'business_name' => $name,
                'trade_name' => $name,
                'address' => 'Direccion proveedor magistral ' . $i,
                'phone' => '0148563' . str_pad((string) $i, 2, '0', STR_PAD_LEFT),
                'mobile' => '999000' . str_pad((string) $i, 3, '0', STR_PAD_LEFT),
                'contact_name' => 'Contacto Magistral ' . $i,
                'contact_email' => 'proveedor.magistral.' . $i . '@kamary.pe',
                'business_line' => 'Insumos magistrales',
                'billing_type' => 'contado',
                'credit_type' => 'sin_credito',
                'payment_condition' => 'contado',
                'payment_term_days' => 0,
                'status' => true,
                'created_by' => $userId,
                'updated_by' => $userId,
            ]);
        }

        return array_values(array_filter($ids));
    }

    private function ensureArticles(
        int $businessId,
        array $units,
        array $categories,
        array $formats,
        array $laboratories,
        ?int $userId
    ): array {
        $inputNames = [
            'Base excipiente magistral',
            'Activo magistral demo',
            'Vehiculo gel magistral',
            'Base crema no ionica',
            'Conservante magistral',
            'Saborizante magistral',
            'Capsula vegetal',
            'Envase magistral frasco',
            'Solvente magistral',
            'Principio activo auxiliar',
        ];
        $formulaNames = [
            'Formula magistral base',
            'Formula dermatologica suave',
            'Formula pediatrica jarabe',
            'Formula analgesica topica',
            'Formula cosmetica gel',
            'Formula androgenica capsulas',
            'Formula ginecologica ovulos',
            'Formula nutricional polvo',
            'Formula gastro suspension',
            'Formula reparadora crema',
        ];

        $inputs = [];
        for ($i = 1; $i <= self::MIN_ROWS; $i++) {
            $code = 'MAG-INS-' . str_pad((string) $i, 3, '0', STR_PAD_LEFT);
            $inputs[] = $this->upsertArticle($code, [
                'module_scope' => 'magistrales',
                'business_id' => $businessId,
                'name' => $inputNames[$i - 1],
                'composition' => 'Insumo magistral de referencia ' . $i,
                'article_type' => 'INSUMO',
                'magistral_category_id' => $categories['INSUMOS'] ?? null,
                'sub_category' => 'INSUMOS Base',
                'magistral_presentation' => $i % 3 === 0 ? 'LIQUIDO' : 'POLVO',
                'magistral_laboratory_id' => $laboratories[($i - 1) % max(1, count($laboratories))] ?? null,
                'unit_id' => $i % 3 === 0 ? ($units['ML'] ?? null) : ($units['G'] ?? null),
                'status' => true,
                'magistral_status' => 'active',
                'stock_min' => 10,
                'stock_max' => 1000,
                'currency' => 'PEN',
                'stock_has_expiration' => true,
                'stock_has_lot' => true,
                'cost_price' => 1 + $i,
                'sale_price' => 2 + $i,
                'purchase_price_national' => 1 + $i,
                'sale_price_national' => 2 + $i,
                'created_by' => $userId,
                'updated_by' => $userId,
            ]);
        }

        $categoryKeys = array_values(array_filter(array_keys($categories), fn($key) => $key !== 'INSUMOS'));
        $formatIds = array_values(array_filter($formats));
        $formulas = [];
        for ($i = 1; $i <= self::MIN_ROWS; $i++) {
            $categoryKey = $categoryKeys[($i - 1) % max(1, count($categoryKeys))] ?? 'GINECOLOGIA';
            $code = 'MAG-FRM-' . str_pad((string) $i, 3, '0', STR_PAD_LEFT);
            $formulas[] = $this->upsertArticle($code, [
                'module_scope' => 'magistrales',
                'business_id' => $businessId,
                'name' => $formulaNames[$i - 1],
                'composition' => 'Formula magistral de demostracion ' . $i,
                'article_type' => 'FORMULA',
                'magistral_category_id' => $categories[$categoryKey] ?? null,
                'sub_category' => $categoryKey . ' Base',
                'magistral_presentation' => $i % 2 === 0 ? 'CREMA' : 'UNIDAD',
                'magistral_format_id' => $formatIds[($i - 1) % max(1, count($formatIds))] ?? null,
                'magistral_laboratory_id' => $laboratories[($i - 1) % max(1, count($laboratories))] ?? null,
                'unit_id' => $units['UND'] ?? null,
                'status' => true,
                'magistral_status' => 'active',
                'stock_min' => 1,
                'stock_max' => 200,
                'currency' => 'PEN',
                'stock_has_expiration' => false,
                'stock_has_lot' => false,
                'cost_price' => 20 + $i,
                'sale_price' => 35 + $i,
                'purchase_price_national' => 20 + $i,
                'sale_price_national' => 35 + $i,
                'created_by' => $userId,
                'updated_by' => $userId,
            ]);
        }

        return [
            'inputs' => array_values(array_filter($inputs)),
            'formulas' => array_values(array_filter($formulas)),
        ];
    }

    private function ensureFormulas(array $articles, ?int $userId): array
    {
        if (!Schema::hasTable('magistral_formulas')) return [];

        $formulaIds = [];
        $inputs = $articles['inputs'] ?? [];
        foreach (($articles['formulas'] ?? []) as $index => $articleId) {
            if (!$articleId) continue;

            $formulaId = DB::table('magistral_formulas')->where('article_id', $articleId)->value('id');
            $payload = [
                'article_id' => $articleId,
                'detail' => 'Formula magistral operativa ' . ($index + 1),
                'preparation_instructions' => 'Validar receta, pesar insumos y registrar control de calidad.',
                'preparation_method' => 'Preparacion magistral segun protocolo interno.',
                'conservation' => 'Conservar en ambiente fresco y seco.',
                'stability' => 'Segun evaluacion del responsable tecnico.',
                'usage' => 'Uso segun prescripcion.',
                'last_edited_by' => $userId,
                'last_edited_at' => now(),
                'status' => true,
                'created_by' => $userId,
                'updated_by' => $userId,
            ];

            if ($formulaId) {
                DB::table('magistral_formulas')->where('id', $formulaId)->update($this->payload('magistral_formulas', array_merge($payload, [
                    'updated_at' => now(),
                ])));
                $formulaId = (int) $formulaId;
            } else {
                $formulaId = $this->insertRow('magistral_formulas', $payload);
            }

            $formulaIds[] = $formulaId;

            if (Schema::hasTable('magistral_formula_items') && DB::table('magistral_formula_items')->where('magistral_formula_id', $formulaId)->count() < 2) {
                DB::table('magistral_formula_items')->where('magistral_formula_id', $formulaId)->delete();
                foreach ([0, 1] as $offset) {
                    $inputId = $inputs[($index + $offset) % max(1, count($inputs))] ?? null;
                    if (!$inputId) continue;
                    $input = DB::table('articles')->where('id', $inputId)->first();
                    if (!$input) continue;

                    DB::table('magistral_formula_items')->insert($this->payload('magistral_formula_items', [
                        'magistral_formula_id' => $formulaId,
                        'article_id' => $inputId,
                        'total_units' => 30,
                        'code' => $input->code,
                        'description' => $input->name,
                        'quantity' => $offset === 0 ? 2 : 0.5,
                        'presentation' => 'MAG-G',
                        'total_quantity' => $offset === 0 ? 60 : 15,
                        'unit_price' => $this->articleCost($input),
                        'subtotal' => ($offset === 0 ? 2 : 0.5) * $this->articleCost($input),
                        'status' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]));
                }
            }
        }

        return array_values(array_filter($formulaIds));
    }

    private function ensurePurchaseOrders(
        int $businessId,
        int $branchId,
        int $warehouseId,
        array $suppliers,
        array $articles,
        ?int $userId
    ): array {
        if (!Schema::hasTable('purchase_orders') || !Schema::hasTable('purchase_order_items')) return [];

        $existing = DB::table('purchase_orders')
            ->when(Schema::hasColumn('purchase_orders', 'module_scope'), fn($query) => $query->where('module_scope', 'magistrales'))
            ->orderBy('id')
            ->pluck('id')
            ->all();

        $inputs = $articles['inputs'] ?? [];
        for ($i = count($existing) + 1; $i <= self::MIN_ROWS; $i++) {
            $articleId = $inputs[($i - 1) % max(1, count($inputs))] ?? null;
            $supplierId = $suppliers[($i - 1) % max(1, count($suppliers))] ?? null;
            if (!$articleId || !$supplierId) continue;

            $article = DB::table('articles')->where('id', $articleId)->first();
            $price = $this->articleCost($article);
            $quantity = 10 + $i;
            $total = round($quantity * $price, 2);
            $code = $this->nextCode('purchase_orders', 'OC-MAG-');

            $orderId = $this->insertRow('purchase_orders', [
                'business_id' => $businessId,
                'module_scope' => 'magistrales',
                'business_branch_id' => $branchId,
                'warehouse_id' => $warehouseId,
                'supplier_id' => $supplierId,
                'buyer_name' => 'Comprador Magistral ' . $i,
                'article_type' => $article->article_type ?? 'INSUMO',
                'code' => $code,
                'issue_date' => now()->subDays(self::MIN_ROWS - $i + 10)->toDateString(),
                'expected_date' => now()->subDays(self::MIN_ROWS - $i + 3)->toDateString(),
                'max_delivery_date' => now()->subDays(self::MIN_ROWS - $i)->toDateString(),
                'delivery_place' => $this->warehouseName,
                'currency' => 'PEN',
                'payment_condition' => 'Contado',
                'payment_method' => 'Transferencia',
                'document_type' => 'Orden compra',
                'affects_igv' => false,
                'order_status' => $i % 3 === 0 ? 'approved' : 'draft',
                'approval_status' => $i % 3 === 0 ? 'approved' : 'pending',
                'observations' => 'Orden demo Magistrales ' . $i,
                'subtotal' => $total,
                'tax_amount' => 0,
                'total' => $total,
                'status' => true,
                'created_by' => $userId,
                'updated_by' => $userId,
            ]);

            DB::table('purchase_order_items')->insert($this->payload('purchase_order_items', [
                'purchase_order_id' => $orderId,
                'article_id' => $articleId,
                'presentation_id' => null,
                'presentation_label' => $article->magistral_presentation ?? null,
                'presentation_units' => 1,
                'last_price' => $price,
                'requested_quantity' => $quantity,
                'received_quantity' => 0,
                'price_unit' => $price,
                'total' => $total,
                'status' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]));

            $existing[] = $orderId;
        }

        return DB::table('purchase_orders')
            ->when(Schema::hasColumn('purchase_orders', 'module_scope'), fn($query) => $query->where('module_scope', 'magistrales'))
            ->orderBy('id')
            ->pluck('code')
            ->all();
    }

    private function ensureIncomes(
        int $businessId,
        int $warehouseId,
        array $suppliers,
        array $articles,
        array $purchaseOrderCodes,
        ?int $userId
    ): void {
        if (!Schema::hasTable('magistral_incomes') || !Schema::hasTable('magistral_income_items')) return;

        $count = DB::table('magistral_incomes')->count();
        $inputs = $articles['inputs'] ?? [];
        for ($i = $count + 1; $i <= self::MIN_ROWS; $i++) {
            $articleId = $inputs[($i - 1) % max(1, count($inputs))] ?? null;
            $supplierId = $suppliers[($i - 1) % max(1, count($suppliers))] ?? null;
            if (!$articleId || !$supplierId) continue;

            $article = DB::table('articles')->where('id', $articleId)->first();
            $quantity = 120 + ($i * 10);
            $price = $this->articleCost($article);
            $subtotal = round($quantity * $price, 2);
            $incomeId = $this->insertRow('magistral_incomes', [
                'code' => $this->nextCode('magistral_incomes', 'ING-MAG-'),
                'purchase_order_code' => $purchaseOrderCodes[($i - 1) % max(1, count($purchaseOrderCodes))] ?? null,
                'document_type' => 'Factura',
                'document_series' => 'F' . str_pad((string) $i, 3, '0', STR_PAD_LEFT),
                'document_sequence' => str_pad((string) $i, 8, '0', STR_PAD_LEFT),
                'guide_number' => 'G-MAG-' . str_pad((string) $i, 5, '0', STR_PAD_LEFT),
                'guide_series' => 'T' . str_pad((string) $i, 3, '0', STR_PAD_LEFT),
                'guide_sequence' => str_pad((string) $i, 8, '0', STR_PAD_LEFT),
                'business_id' => $businessId,
                'warehouse_id' => $warehouseId,
                'supplier_id' => $supplierId,
                'payment_method' => 'Transferencia',
                'origin' => 'Compra demo',
                'currency' => 'PEN',
                'affects_igv' => false,
                'issue_date' => now()->subDays(self::MIN_ROWS - $i)->toDateString(),
                'observations' => 'Ingreso demo Magistrales ' . $i,
                'subtotal' => $subtotal,
                'igv' => 0,
                'total' => $subtotal,
                'status' => true,
                'created_by' => $userId,
                'updated_by' => $userId,
            ]);

            DB::table('magistral_income_items')->insert($this->payload('magistral_income_items', [
                'magistral_income_id' => $incomeId,
                'article_id' => $articleId,
                'description' => $article->name,
                'quantity' => $quantity,
                'presentation' => $article->magistral_presentation ?? 'POLVO',
                'expiration_date' => now()->addMonths(12 + $i)->toDateString(),
                'lot' => 'MAG-LOT-' . str_pad((string) $i, 3, '0', STR_PAD_LEFT),
                'price_without_igv' => $price,
                'price_with_igv' => $price,
                'subtotal' => $subtotal,
                'status' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }
    }

    private function ensureProductionOrders(
        int $warehouseId,
        array $responsibles,
        array $formats,
        array $articles,
        array $formulaIds,
        ?int $userId
    ): void {
        if (!Schema::hasTable('magistral_production_orders') || !Schema::hasTable('magistral_production_order_items')) return;

        $count = DB::table('magistral_production_orders')->count();
        $inputs = $articles['inputs'] ?? [];
        $formulas = $articles['formulas'] ?? [];
        $formatIds = array_values(array_filter($formats));

        for ($i = $count + 1; $i <= self::MIN_ROWS; $i++) {
            $formulaArticleId = $formulas[($i - 1) % max(1, count($formulas))] ?? null;
            if (!$formulaArticleId) continue;

            $productionId = $this->insertRow('magistral_production_orders', [
                'code' => $this->nextCode('magistral_production_orders', 'OP-MAG-'),
                'order_status' => 'finished',
                'responsible_id' => $responsibles[($i - 1) % max(1, count($responsibles))] ?? null,
                'destination' => $this->warehouseName,
                'destination_warehouse_id' => $warehouseId,
                'article_id' => $formulaArticleId,
                'format_id' => $formatIds[($i - 1) % max(1, count($formatIds))] ?? null,
                'batch_quantity' => 1,
                'quantity' => 25 + $i,
                'delivery_date' => now()->subDays(self::MIN_ROWS - $i)->toDateString(),
                'registration_date' => now()->subDays(self::MIN_ROWS - $i + 1)->toDateString(),
                'observations' => 'Orden de produccion demo Magistrales ' . $i,
                'status' => true,
                'created_by' => $userId,
                'updated_by' => $userId,
            ]);

            foreach ([0, 1] as $offset) {
                $inputId = $inputs[($i + $offset - 1) % max(1, count($inputs))] ?? null;
                if (!$inputId) continue;
                $input = DB::table('articles')->where('id', $inputId)->first();

                DB::table('magistral_production_order_items')->insert($this->payload('magistral_production_order_items', [
                    'magistral_production_order_id' => $productionId,
                    'article_id' => $inputId,
                    'description' => $input?->name,
                    'expiration_date' => now()->addMonths(10 + $i)->toDateString(),
                    'quantity' => $offset === 0 ? 2 : 1,
                    'magistral_formula_id' => $formulaIds[($i - 1) % max(1, count($formulaIds))] ?? null,
                    'total' => $offset === 0 ? 2 : 1,
                    'status' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]));
            }
        }
    }

    private function ensureOutputs(int $warehouseId, array $articles, ?int $userId): void
    {
        if (!Schema::hasTable('magistral_outputs') || !Schema::hasTable('magistral_output_items')) return;

        $count = DB::table('magistral_outputs')->count();
        $formulas = $articles['formulas'] ?? [];

        for ($i = $count + 1; $i <= self::MIN_ROWS; $i++) {
            $articleId = $formulas[($i - 1) % max(1, count($formulas))] ?? null;
            if (!$articleId) continue;
            $article = DB::table('articles')->where('id', $articleId)->first();
            $quantity = 1;

            $outputId = $this->insertRow('magistral_outputs', [
                'code' => $this->nextCode('magistral_outputs', 'SAL-MAG-'),
                'origin_warehouse_id' => $warehouseId,
                'destination_warehouse_id' => null,
                'destination' => null,
                'reason' => 'REGULARIZACION DE STOCK',
                'observations' => 'Salida demo Magistrales ' . $i,
                'output_date' => now()->subDays(self::MIN_ROWS - $i)->toDateString(),
                'status' => true,
                'created_by' => $userId,
                'updated_by' => $userId,
            ]);

            DB::table('magistral_output_items')->insert($this->payload('magistral_output_items', [
                'magistral_output_id' => $outputId,
                'article_id' => $articleId,
                'code' => $article?->code,
                'name' => $article?->name,
                'lot' => null,
                'expiration_date' => null,
                'stock' => $this->currentStock($articleId, $warehouseId),
                'unit_label' => 'MAG-UND',
                'quantity' => $quantity,
                'total' => $quantity,
                'status' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }
    }

    private function ensureSales(int $businessId, int $warehouseId, array $articles, ?int $userId): void
    {
        if (!Schema::hasTable('magistral_sales') || !Schema::hasTable('magistral_sale_items')) return;

        $count = DB::table('magistral_sales')->count();
        $formulas = $articles['formulas'] ?? [];

        for ($i = $count + 1; $i <= self::MIN_ROWS; $i++) {
            $articleId = $formulas[($i - 1) % max(1, count($formulas))] ?? null;
            if (!$articleId) continue;
            $article = DB::table('articles')->where('id', $articleId)->first();
            $price = max(1, (float) ($article->sale_price_national ?? $article->sale_price ?? 35));
            $quantity = 1;
            $total = round($quantity * $price, 2);
            $taxable = round($total / 1.18, 2);
            $igv = round($total - $taxable, 2);

            $saleId = $this->insertRow('magistral_sales', [
                'code' => $this->nextCode('magistral_sales', 'VTA-MAG-'),
                'pharmacy' => 'Kamary Magistrales',
                'business_id' => $businessId,
                'payment_status' => $i % 3 === 0 ? 'partial' : 'paid',
                'document_type' => $i % 2 === 0 ? 'Boleta' : 'Factura',
                'document_number' => 'MAG-DOC-' . str_pad((string) $i, 6, '0', STR_PAD_LEFT),
                'patient' => 'Paciente Magistral ' . $i,
                'doctor' => 'Dr. Magistral ' . $i,
                'discount_policy' => 'Sin descuento',
                'sale_type' => 'Presencial',
                'allergy' => false,
                'intolerance' => false,
                'taxable_amount' => $taxable,
                'unaffected_amount' => 0,
                'discount_total' => 0,
                'subtotal' => $total,
                'igv' => $igv,
                'total' => $total,
                'is_quote' => false,
                'sale_date' => now()->subDays(self::MIN_ROWS - $i)->toDateString(),
                'status' => true,
                'created_by' => $userId,
                'updated_by' => $userId,
            ]);

            DB::table('magistral_sale_items')->insert($this->payload('magistral_sale_items', [
                'magistral_sale_id' => $saleId,
                'article_id' => $articleId,
                'warehouse_id' => $warehouseId,
                'description' => $article?->name,
                'stock' => $this->currentStock($articleId, $warehouseId),
                'quantity' => $quantity,
                'unit_price' => $price,
                'discount' => 0,
                'subtotal' => $total,
                'status' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }
    }

    private function ensureInventoryCounts(int $branchId, int $warehouseId, array $articles, ?int $userId): void
    {
        if (!Schema::hasTable('magistral_inventory_counts') || !Schema::hasTable('magistral_inventory_count_items')) return;

        $count = DB::table('magistral_inventory_counts')->count();
        $allArticles = array_values(array_filter(array_merge($articles['inputs'] ?? [], $articles['formulas'] ?? [])));

        for ($i = $count + 1; $i <= self::MIN_ROWS; $i++) {
            $articleId = $allArticles[($i - 1) % max(1, count($allArticles))] ?? null;
            if (!$articleId) continue;
            $stock = $this->currentStock($articleId, $warehouseId);

            $countId = $this->insertRow('magistral_inventory_counts', [
                'code' => $this->nextCode('magistral_inventory_counts', 'INV-MAG-'),
                'business_branch_id' => $branchId,
                'warehouse_id' => $warehouseId,
                'count_date' => now()->subDays(self::MIN_ROWS - $i)->toDateString(),
                'observations' => 'Inventario demo Magistrales ' . $i,
                'status' => true,
                'created_by' => $userId,
                'updated_by' => $userId,
            ]);

            DB::table('magistral_inventory_count_items')->insert($this->payload('magistral_inventory_count_items', [
                'magistral_inventory_count_id' => $countId,
                'article_id' => $articleId,
                'lot' => null,
                'expiration_date' => null,
                'system_stock' => $stock,
                'real_stock' => $stock,
                'difference' => 0,
                'status' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }
    }

    private function upsertArticle(string $code, array $payload): ?int
    {
        $query = DB::table('articles')->where('code', $code);
        if (Schema::hasColumn('articles', 'module_scope')) {
            $query->where('module_scope', 'magistrales');
        }

        $id = $query->value('id');
        $payload = array_merge($payload, ['code' => $code]);

        return $id
            ? $this->updateRow('articles', (int) $id, $payload)
            : $this->insertRow('articles', $payload);
    }

    private function upsertBy(string $table, array $where, array $payload): ?int
    {
        if (!Schema::hasTable($table)) return null;

        $query = DB::table($table);
        foreach ($where as $column => $value) {
            if (!Schema::hasColumn($table, $column)) continue;
            $query->where($column, $value);
        }

        $id = $query->value('id');
        $payload = array_merge($where, $payload);

        return $id
            ? $this->updateRow($table, (int) $id, $payload)
            : $this->insertRow($table, $payload);
    }

    private function updateRow(string $table, int $id, array $payload): int
    {
        DB::table($table)->where('id', $id)->update($this->payload($table, array_merge($payload, [
            'updated_at' => now(),
        ])));

        return $id;
    }

    private function insertRow(string $table, array $payload): int
    {
        return (int) DB::table($table)->insertGetId($this->payload($table, array_merge($payload, [
            'created_at' => now(),
            'updated_at' => now(),
        ])));
    }

    private function nextCode(string $table, string $prefix): string
    {
        $next = 1;

        do {
            $code = $prefix . str_pad((string) $next, 6, '0', STR_PAD_LEFT);
            $next++;
        } while (DB::table($table)->where('code', $code)->exists());

        return $code;
    }

    private function currentStock(int $articleId, int $warehouseId): float
    {
        $in = $this->sumIncomes($articleId, $warehouseId);
        $production = $this->sumProduction($articleId, $warehouseId);
        $out = $this->sumOutputs($articleId, $warehouseId);
        $sales = $this->sumSales($articleId, $warehouseId);
        $consumption = $this->sumProductionConsumption($articleId, $warehouseId);

        return round($in + $production - $out - $sales - $consumption, 3);
    }

    private function sumIncomes(int $articleId, int $warehouseId): float
    {
        if (!Schema::hasTable('magistral_income_items') || !Schema::hasTable('magistral_incomes')) return 0;

        return (float) DB::table('magistral_income_items as item')
            ->join('magistral_incomes as income', 'income.id', '=', 'item.magistral_income_id')
            ->where('item.article_id', $articleId)
            ->where('income.warehouse_id', $warehouseId)
            ->whereNotNull('income.status')
            ->whereNotNull('item.status')
            ->sum('item.quantity');
    }

    private function sumOutputs(int $articleId, int $warehouseId): float
    {
        if (!Schema::hasTable('magistral_output_items') || !Schema::hasTable('magistral_outputs')) return 0;

        return (float) DB::table('magistral_output_items as item')
            ->join('magistral_outputs as output', 'output.id', '=', 'item.magistral_output_id')
            ->where('item.article_id', $articleId)
            ->where('output.origin_warehouse_id', $warehouseId)
            ->whereNotNull('output.status')
            ->whereNotNull('item.status')
            ->sum('item.quantity');
    }

    private function sumSales(int $articleId, int $warehouseId): float
    {
        if (!Schema::hasTable('magistral_sale_items') || !Schema::hasTable('magistral_sales')) return 0;

        return (float) DB::table('magistral_sale_items as item')
            ->join('magistral_sales as sale', 'sale.id', '=', 'item.magistral_sale_id')
            ->where('item.article_id', $articleId)
            ->where('item.warehouse_id', $warehouseId)
            ->whereNotNull('sale.status')
            ->whereNotNull('item.status')
            ->when(Schema::hasColumn('magistral_sales', 'is_quote'), fn($query) => $query->where('sale.is_quote', false))
            ->sum('item.quantity');
    }

    private function sumProduction(int $articleId, int $warehouseId): float
    {
        if (!Schema::hasTable('magistral_production_orders')) return 0;

        return (float) DB::table('magistral_production_orders')
            ->where('article_id', $articleId)
            ->where('order_status', 'finished')
            ->whereNotNull('status')
            ->when(Schema::hasColumn('magistral_production_orders', 'destination_warehouse_id'), fn($query) => $query->where('destination_warehouse_id', $warehouseId))
            ->sum('quantity');
    }

    private function sumProductionConsumption(int $articleId, int $warehouseId): float
    {
        if (!Schema::hasTable('magistral_production_order_items') || !Schema::hasTable('magistral_production_orders')) return 0;

        return (float) DB::table('magistral_production_order_items as item')
            ->join('magistral_production_orders as production', 'production.id', '=', 'item.magistral_production_order_id')
            ->where('item.article_id', $articleId)
            ->where('production.order_status', 'finished')
            ->whereNotNull('production.status')
            ->whereNotNull('item.status')
            ->when(Schema::hasColumn('magistral_production_orders', 'destination_warehouse_id'), fn($query) => $query->where('production.destination_warehouse_id', $warehouseId))
            ->sum(DB::raw('COALESCE(item.total, item.quantity)'));
    }

    private function articleCost(?object $article): float
    {
        if (!$article) return 0;

        foreach (['purchase_price_national', 'cost_price', 'sale_price'] as $field) {
            $value = $article->{$field} ?? null;
            if (is_numeric($value) && (float) $value > 0) {
                return round((float) $value, 4);
            }
        }

        return 1;
    }

    private function payload(string $table, array $payload): array
    {
        return array_filter(
            $payload,
            fn($value, string $column) => Schema::hasColumn($table, $column),
            ARRAY_FILTER_USE_BOTH
        );
    }
};
