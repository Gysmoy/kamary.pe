<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private string $businessKey = 'kamary_medicals';
    private string $businessName = 'Kamary Medicals';
    private string $branchName = 'Principal Magistrales';
    private string $warehouseName = 'Almacen Magistrales Principal';

    public function up(): void
    {
        $businessId = $this->ensureBusiness();
        if (!$businessId) return;

        $branchId = $this->ensureBranch($businessId);
        if (!$branchId) return;

        $warehouseId = $this->ensureWarehouse($branchId);
        if (!$warehouseId) return;

        $this->backfillMagistralesWarehouse($businessId, $branchId, $warehouseId);
        $this->ensureBaseCatalog($businessId, $warehouseId);
    }

    public function down(): void
    {
        //
    }

    private function ensureBusiness(): ?int
    {
        if (!Schema::hasTable('businesses') || !Schema::hasColumn('businesses', 'business_key')) {
            return null;
        }

        $id = DB::table('businesses')->where('business_key', $this->businessKey)->value('id');
        $payload = $this->payload('businesses', [
            'name' => $this->businessName,
            'trade_name' => $this->businessName,
            'description' => 'Unidad operativa para formulas magistrales.',
            'status' => true,
            'updated_at' => now(),
        ]);

        if ($id) {
            DB::table('businesses')->where('id', $id)->update($payload);
            return (int) $id;
        }

        return (int) DB::table('businesses')->insertGetId($this->payload('businesses', array_merge($payload, [
            'business_key' => $this->businessKey,
            'created_at' => now(),
        ])));
    }

    private function ensureBranch(int $businessId): ?int
    {
        if (!Schema::hasTable('business_branches')) return null;

        $id = DB::table('business_branches')
            ->where('business_id', $businessId)
            ->where('name', $this->branchName)
            ->value('id');

        $payload = $this->payload('business_branches', [
            'establishment_code' => '0000',
            'ubigeo' => '150101',
            'address' => 'Calle Leoncio Prado 830, Urb. La Vina, San Luis, Lima',
            'email' => 'magistrales@kamarymedicals.pe',
            'telephone' => '014856320',
            'series_factura' => 'FM01',
            'series_boleta' => 'BM01',
            'series_nota_credito' => 'FCM1',
            'status' => true,
            'updated_at' => now(),
        ]);

        if ($id) {
            DB::table('business_branches')->where('id', $id)->update($payload);
            return (int) $id;
        }

        return (int) DB::table('business_branches')->insertGetId($this->payload('business_branches', array_merge($payload, [
            'business_id' => $businessId,
            'name' => $this->branchName,
            'created_at' => now(),
        ])));
    }

    private function ensureWarehouse(int $branchId): ?int
    {
        if (!Schema::hasTable('warehouses')) return null;

        $id = DB::table('warehouses')
            ->where('business_branch_id', $branchId)
            ->where('name', $this->warehouseName)
            ->value('id');

        $payload = $this->payload('warehouses', [
            'description' => 'Almacen fijo del modulo Magistrales.',
            'status' => true,
            'updated_at' => now(),
        ]);

        if ($id) {
            DB::table('warehouses')->where('id', $id)->update($payload);
            return (int) $id;
        }

        return (int) DB::table('warehouses')->insertGetId($this->payload('warehouses', array_merge($payload, [
            'business_branch_id' => $branchId,
            'name' => $this->warehouseName,
            'created_at' => now(),
        ])));
    }

    private function backfillMagistralesWarehouse(int $businessId, int $branchId, int $warehouseId): void
    {
        $this->updateAll('magistral_categories', ['warehouse_id' => $warehouseId]);
        $this->updateAll('magistral_incomes', [
            'business_id' => $businessId,
            'warehouse_id' => $warehouseId,
        ]);
        $this->updateAll('magistral_inventory_counts', [
            'business_branch_id' => $branchId,
            'warehouse_id' => $warehouseId,
        ]);
        $this->updateAll('magistral_outputs', [
            'origin_warehouse_id' => $warehouseId,
        ]);
        $this->updateAll('magistral_production_orders', [
            'destination' => $this->warehouseName,
            'destination_warehouse_id' => $warehouseId,
        ]);
        $this->updateAll('magistral_sale_items', [
            'warehouse_id' => $warehouseId,
        ]);

        if (Schema::hasTable('purchase_orders') && Schema::hasColumn('purchase_orders', 'module_scope')) {
            DB::table('purchase_orders')
                ->where('module_scope', 'magistrales')
                ->update($this->payload('purchase_orders', [
                    'business_id' => $businessId,
                    'business_branch_id' => $branchId,
                    'warehouse_id' => $warehouseId,
                    'updated_at' => now(),
                ]));
        }
    }

    private function ensureBaseCatalog(int $businessId, int $warehouseId): void
    {
        $userId = Schema::hasTable('users') ? DB::table('users')->orderBy('id')->value('id') : null;

        $units = $this->ensureUnits($userId);
        $categories = $this->ensureCategories($warehouseId, $userId);
        $this->ensureSubcategories($categories, $userId);
        $formats = $this->ensureFormats($userId);
        $laboratoryId = $this->ensureLaboratory($userId);

        $this->ensureResponsible($userId);
        $this->ensureSupplier($userId);

        $articles = $this->ensureArticles($businessId, $units, $categories, $formats, $laboratoryId, $userId);
        $this->ensureFormula($articles, $userId);
    }

    private function ensureUnits(?int $userId): array
    {
        if (!Schema::hasTable('units')) return [];

        return [
            'UND' => $this->upsertBy('units', ['symbol' => 'MAG-UND'], [
                'module_scope' => 'magistrales',
                'name' => 'Unidad Magistral',
                'status' => true,
                'created_by' => $userId,
                'updated_by' => $userId,
            ]),
            'G' => $this->upsertBy('units', ['symbol' => 'MAG-G'], [
                'module_scope' => 'magistrales',
                'name' => 'Gramo Magistral',
                'status' => true,
                'created_by' => $userId,
                'updated_by' => $userId,
            ]),
            'ML' => $this->upsertBy('units', ['symbol' => 'MAG-ML'], [
                'module_scope' => 'magistrales',
                'name' => 'Mililitro Magistral',
                'status' => true,
                'created_by' => $userId,
                'updated_by' => $userId,
            ]),
        ];
    }

    private function ensureCategories(int $warehouseId, ?int $userId): array
    {
        if (!Schema::hasTable('magistral_categories')) return [];

        $categories = [];
        $activeIds = [];
        foreach ([
            ['code' => 'MAG-CAT-001', 'description' => 'GINECOLOGIA', 'sale_material' => true],
            ['code' => 'MAG-CAT-002', 'description' => 'INSUMOS', 'sale_material' => false],
            ['code' => 'MAG-CAT-003', 'description' => 'ANDROLOGIA', 'sale_material' => true],
        ] as $category) {
            $payload = [
                'code' => $category['code'],
                'description' => $category['description'],
                'warehouse_id' => $warehouseId,
                'sale_material' => $category['sale_material'],
                'status' => true,
                'created_by' => $userId,
                'updated_by' => $userId,
            ];

            $upsertPayload = $this->payload('magistral_categories', array_merge($payload, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
            $updateColumns = array_values(array_filter(
                array_keys($upsertPayload),
                fn(string $column) => !in_array($column, ['code', 'created_at'], true)
            ));

            DB::table('magistral_categories')->upsert([$upsertPayload], ['code'], $updateColumns);

            $categoryId = $this->categoryIdByCode($category['code']);
            if (!$categoryId) {
                $categoryId = $this->categoryIdByDescription($category['description']);
            }

            if ($categoryId) {
                $this->updateRow('magistral_categories', $categoryId, $payload);
                $categories[$category['description']] = $categoryId;
                $activeIds[] = $categoryId;
            }
        }

        if (count($activeIds) > 0) {
            DB::table('magistral_categories')
                ->whereNotIn('id', $activeIds)
                ->update($this->payload('magistral_categories', [
                    'status' => null,
                    'updated_by' => $userId,
                    'updated_at' => now(),
                ]));
        }

        return $categories;
    }

    private function categoryIdByCode(string $code): ?int
    {
        $id = DB::table('magistral_categories')
            ->whereRaw('LOWER(TRIM(code)) = ?', [strtolower($code)])
            ->orderBy('id')
            ->value('id');

        return $id ? (int) $id : null;
    }

    private function categoryIdByDescription(string $description): ?int
    {
        $id = DB::table('magistral_categories')
            ->whereRaw('LOWER(TRIM(description)) = ?', [strtolower($description)])
            ->orderBy('id')
            ->value('id');

        return $id ? (int) $id : null;
    }

    private function ensureSubcategories(array $categories, ?int $userId): array
    {
        if (!Schema::hasTable('magistral_subcategories')) return [];

        $map = [
            'GINECOLOGIA' => ['Hormonal', 'Ovulos', 'Gel'],
            'INSUMOS' => ['Activos', 'Excipientes', 'Envases'],
            'ANDROLOGIA' => ['Capsulas', 'Soluciones'],
        ];
        $subcategories = [];

        foreach ($map as $categoryName => $items) {
            $categoryId = $categories[$categoryName] ?? null;
            if (!$categoryId) continue;

            foreach ($items as $description) {
                $subcategories[$categoryName][$description] = $this->upsertBy(
                    'magistral_subcategories',
                    ['magistral_category_id' => $categoryId, 'description' => $description],
                    [
                        'status' => true,
                        'created_by' => $userId,
                        'updated_by' => $userId,
                    ]
                );
            }
        }

        return $subcategories;
    }

    private function ensureFormats(?int $userId): array
    {
        if (!Schema::hasTable('magistral_formats')) return [];

        $formats = [];
        foreach ([
            ['description' => 'Capsulas x 30', 'quantity' => 30],
            ['description' => 'Crema 30 g', 'quantity' => 30],
            ['description' => 'Solucion 100 ml', 'quantity' => 100],
        ] as $format) {
            $formats[$format['description']] = $this->upsertBy(
                'magistral_formats',
                ['description' => $format['description']],
                [
                    'quantity' => $format['quantity'],
                    'status' => true,
                    'created_by' => $userId,
                    'updated_by' => $userId,
                ]
            );
        }

        return $formats;
    }

    private function ensureLaboratory(?int $userId): ?int
    {
        if (!Schema::hasTable('magistral_laboratories')) return null;

        return $this->upsertBy('magistral_laboratories', ['code' => 'MAGLAB-001'], [
            'description' => 'Laboratorio Magistral Kamary',
            'status' => true,
            'created_by' => $userId,
            'updated_by' => $userId,
        ]);
    }

    private function ensureResponsible(?int $userId): ?int
    {
        if (!Schema::hasTable('magistral_responsibles')) return null;

        return $this->upsertBy('magistral_responsibles', ['document_number' => 'MAG-RESP-001'], [
            'name' => 'Responsable Magistrales',
            'status' => true,
            'created_by' => $userId,
            'updated_by' => $userId,
        ]);
    }

    private function ensureSupplier(?int $userId): ?int
    {
        if (!Schema::hasTable('suppliers')) return null;

        return $this->upsertBy('suppliers', ['ruc' => '20600000001'], [
            'module_scope' => 'magistrales',
            'business_name' => 'Proveedor Magistral Base',
            'trade_name' => 'Proveedor Magistral Base',
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

    private function ensureArticles(
        int $businessId,
        array $units,
        array $categories,
        array $formats,
        ?int $laboratoryId,
        ?int $userId
    ): array {
        if (!Schema::hasTable('articles') || empty($units['G']) || empty($units['UND'])) return [];

        $baseData = [
            'module_scope' => 'magistrales',
            'business_id' => $businessId,
            'laboratory_id' => null,
            'magistral_laboratory_id' => $laboratoryId,
            'status' => true,
            'magistral_status' => 'active',
            'currency' => 'PEN',
            'stock_has_expiration' => true,
            'stock_has_lot' => true,
            'created_by' => $userId,
            'updated_by' => $userId,
        ];

        return [
            'base' => $this->upsertArticle('MAG-INS-001', array_merge($baseData, [
                'name' => 'Base excipiente magistral',
                'composition' => 'Excipiente base para preparaciones magistrales.',
                'article_type' => 'INSUMO',
                'magistral_category_id' => $categories['INSUMOS'] ?? null,
                'sub_category' => 'Excipientes',
                'magistral_presentation' => 'POLVO',
                'unit_id' => $units['G'],
                'stock_min' => 100,
                'stock_max' => 5000,
                'cost_price' => 1.50,
                'sale_price' => 2.10,
                'purchase_price_national' => 1.50,
                'sale_price_national' => 2.10,
            ])),
            'active' => $this->upsertArticle('MAG-INS-002', array_merge($baseData, [
                'name' => 'Activo magistral demo',
                'composition' => 'Activo referencial para formulas magistrales.',
                'article_type' => 'INSUMO',
                'magistral_category_id' => $categories['INSUMOS'] ?? null,
                'sub_category' => 'Activos',
                'magistral_presentation' => 'POLVO',
                'unit_id' => $units['G'],
                'stock_min' => 10,
                'stock_max' => 500,
                'cost_price' => 8.00,
                'sale_price' => 12.00,
                'purchase_price_national' => 8.00,
                'sale_price_national' => 12.00,
            ])),
            'formula' => $this->upsertArticle('MAG-FRM-001', array_merge($baseData, [
                'name' => 'Formula magistral base',
                'composition' => 'Producto base para validar recetas magistrales.',
                'article_type' => 'FORMULA',
                'magistral_category_id' => $categories['GINECOLOGIA'] ?? null,
                'sub_category' => 'Hormonal',
                'magistral_presentation' => 'UNIDAD',
                'magistral_format_id' => $formats['Capsulas x 30'] ?? null,
                'unit_id' => $units['UND'],
                'stock_min' => 1,
                'stock_max' => 100,
                'cost_price' => 25.00,
                'sale_price' => 45.00,
                'purchase_price_national' => 25.00,
                'sale_price_national' => 45.00,
            ])),
        ];
    }

    private function ensureFormula(array $articles, ?int $userId): void
    {
        if (!Schema::hasTable('magistral_formulas') || empty($articles['formula'])) return;

        $formulaId = DB::table('magistral_formulas')
            ->where('article_id', $articles['formula'])
            ->value('id');

        $payload = [
            'detail' => 'Formula base creada para habilitar el flujo inicial de Magistrales.',
            'preparation_instructions' => 'Validar receta, pesar insumos y registrar lote antes de dispensar.',
            'preparation_method' => 'Mezcla y encapsulado segun indicacion tecnica.',
            'conservation' => 'Conservar en lugar fresco y seco.',
            'stability' => 'Segun criterio del responsable tecnico.',
            'usage' => 'Uso segun receta.',
            'last_edited_by' => $userId,
            'last_edited_at' => now(),
            'status' => true,
            'created_by' => $userId,
            'updated_by' => $userId,
        ];

        if (!$formulaId) {
            $formulaId = DB::table('magistral_formulas')->insertGetId($this->payload('magistral_formulas', array_merge($payload, [
                'article_id' => $articles['formula'],
                'created_at' => now(),
                'updated_at' => now(),
            ])));
        }

        if (
            !Schema::hasTable('magistral_formula_items')
            || DB::table('magistral_formula_items')->where('magistral_formula_id', $formulaId)->exists()
        ) {
            return;
        }

        foreach ([
            ['article_id' => $articles['base'] ?? null, 'quantity' => 29.5, 'unit_price' => 1.50],
            ['article_id' => $articles['active'] ?? null, 'quantity' => 0.5, 'unit_price' => 8.00],
        ] as $item) {
            if (!$item['article_id']) continue;

            $article = DB::table('articles')->where('id', $item['article_id'])->first();
            if (!$article) continue;

            DB::table('magistral_formula_items')->insert($this->payload('magistral_formula_items', [
                'magistral_formula_id' => $formulaId,
                'article_id' => $article->id,
                'total_units' => 30,
                'code' => $article->code,
                'description' => $article->name,
                'quantity' => $item['quantity'],
                'presentation' => 'MAG-G',
                'total_quantity' => $item['quantity'] * 30,
                'unit_price' => $item['unit_price'],
                'subtotal' => $item['quantity'] * $item['unit_price'],
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

    private function updateAll(string $table, array $payload): void
    {
        if (!Schema::hasTable($table)) return;

        $filtered = $this->payload($table, array_merge($payload, ['updated_at' => now()]));
        if (count($filtered) === 0) return;

        DB::table($table)->update($filtered);
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
