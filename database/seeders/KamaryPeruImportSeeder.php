<?php

namespace Database\Seeders;

use App\Models\ActivePrinciple;
use App\Models\Article;
use App\Models\ArticlePresentation;
use App\Models\Business;
use App\Models\BusinessBranch;
use App\Models\Laboratory;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use App\Support\BusinessScope;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Importa la data real de Kamary Peru (kamary_peru) exportada del sistema legado:
 *   - database/data/kamary_peru_productos.json  (catalogo comercial + magistrales)
 *   - database/data/kamary_peru_series.json     (series de documentos por empresa)
 *
 * PURGA FISICA IRREVERSIBLE (borrado de raiz). Deja SOLO la data del dump:
 *   - Conserva los ~92 productos del dump (66 standard + 26 magistrales; el dump trae
 *     108 filas = 92 codigos, 10 se repiten por lote) y los 3 almacenes de marca.
 *   - BORRA fisicamente (FOREIGN_KEY_CHECKS=0, acotado a kamary_peru): los articulos
 *     standard/magistrales/NULL que no son del dump (+ presentaciones/lotes), todo el
 *     transaccional demo (pedidos, compras, recepciones, listas de precio, despachos,
 *     guias, conteos, notas de entrada/salida, facturacion, CxP/CxC, actividades,
 *     take/sample orders) y los almacenes demo.
 *   - VACIA los almacenes fijos de Muestras y Magistrales (los deja para recargar
 *     data real). Los 26 productos magistrales del dump se conservan.
 *   - NO toca kamary_medicals (almacenamiento).
 *
 * Ademas: crea usuarios nuevos (clave 4ccessme + rol Admin; a los existentes solo
 * les concede Admin, sin pisar password) y setea las series por sede comercial.
 *
 * Ejecutar:  php artisan db:seed --class=KamaryPeruImportSeeder
 * Idempotente y re-ejecutable.
 */
class KamaryPeruImportSeeder extends Seeder
{
    private const PRODUCTS_FILE = 'data/kamary_peru_productos.json';
    private const SERIES_FILE = 'data/kamary_peru_series.json';
    private const DEFAULT_PASSWORD = '4ccessme';

    /** usuario(etiqueta) => [empresa peru|medical]. Todos: clave 4ccessme + rol Admin. */
    private const USERS = [
        ['label' => 'MASTER', 'empresa' => 'peru'],
        ['label' => 'APROBADOR', 'empresa' => 'peru'],
        ['label' => 'SUPERVISOR', 'empresa' => 'peru'],
        ['label' => 'MAGISTRAL', 'empresa' => 'peru'],
        ['label' => 'Almacén 1', 'empresa' => 'peru'],
        ['label' => 'EPROFESIONAL', 'empresa' => 'peru'],
        ['label' => 'Administracion 01', 'empresa' => 'peru'],
        ['label' => 'Gerencia 1', 'empresa' => 'peru'],
        ['label' => 'Gerencia 2', 'empresa' => 'peru'],
        ['label' => 'DIRECCION TECNICA', 'empresa' => 'medical'],
        ['label' => 'asistente tecnico', 'empresa' => 'medical'],
        ['label' => 'Almacén 2', 'empresa' => 'medical'],
        ['label' => 'Almacén 3', 'empresa' => 'medical'],
        ['label' => 'Almacén 4', 'empresa' => 'medical'],
        ['label' => 'almacén 5', 'empresa' => 'medical'],
        ['label' => 'Administracion KM', 'empresa' => 'medical'],
        ['label' => 'externo', 'empresa' => 'medical'],
    ];

    private ?int $userId = null;

    public function run(): void
    {
        if (!$this->hasRequiredTables()) {
            $this->command?->error('Faltan tablas base. Corre las migraciones primero.');
            return;
        }

        $products = $this->loadJson(self::PRODUCTS_FILE);
        $series = $this->loadJson(self::SERIES_FILE);
        if ($products === null) {
            $this->command?->error('No se pudo leer ' . self::PRODUCTS_FILE);
            return;
        }

        $plan = $this->buildPlan($products);
        $this->userId = User::query()->orderBy('id')->value('id');

        // Catalogo (atomico e independiente): asegura el catalogo del dump y oculta el resto.
        [$kept, $removed] = DB::transaction(function () use ($plan) {
            $peru = $this->resolveBusiness(BusinessScope::KAMARY_PERU, 'Kamary Peru');
            $branch = $this->resolveMainBranch($peru);

            $labIds = $this->syncLaboratories($plan['labs']);
            $principleIds = $this->syncActivePrinciples($labIds);
            $unitIds = $this->syncUnits($plan['units']);
            $warehouseIds = $this->syncBrandWarehouses($plan['warehouses'], $branch->id);

            // 1) Asegura los productos del dump (activos).
            $kept = $this->syncProducts($plan['articles'], $peru->id, $labIds, $principleIds, $unitIds, $warehouseIds);

            // 2) PURGA FISICA IRREVERSIBLE: borra de raiz todo lo demas de Kamary Peru
            //    (articulos no-dump, transaccional demo, almacenes demo). Vacia Muestras/Magistrales.
            $keepCodes = array_values(array_unique(array_merge($plan['stdCodes'], $plan['magCodes'])));
            $removed = $this->hardPurge($peru->id, $keepCodes, $warehouseIds);

            return [$kept, $removed];
        });

        // Series y usuarios: aislados en su propia transaccion; un fallo aqui NO revierte el catalogo.
        $seriesSet = 0;
        $usersSet = 0;
        if ($series) {
            try {
                $seriesSet = DB::transaction(fn () => $this->syncSeries($series));
            } catch (\Throwable $e) {
                $this->command?->warn('Series omitidas por error: ' . $e->getMessage());
            }
        }
        try {
            $usersSet = DB::transaction(fn () => $this->syncUsers());
        } catch (\Throwable $e) {
            $this->command?->warn('Usuarios omitidos por error: ' . $e->getMessage());
        }

        $this->printSummary($plan, $kept, $removed, $seriesSet, $usersSet);
    }

    // ------------------------------------------------------------------
    // PLAN (puro)
    // ------------------------------------------------------------------

    public function buildPlan(array $products): array
    {
        $labs = [];        // labName => true
        $units = [];       // symbol => true
        $warehouses = [];  // brand warehouse name => true (solo standard)
        $articles = [];    // "scope|code" => datos
        $stdCodes = [];
        $magCodes = [];

        foreach ($products as $p) {
            $code = $this->text($p['codigo'] ?? '');
            $name = $this->text($p['nombre'] ?? '');
            $lab = $this->text($p['laboratorio'] ?? '');
            $unit = $this->norm($p['unidad'] ?? 'UNIDAD') ?: 'UNIDAD';
            $lot = $this->text($p['lote'] ?? '');
            $almacen = $this->text($p['almacen'] ?? '');
            if ($code === '' || $name === '') continue;

            $isMag = $this->norm($lab) === 'MAGISTRALES';
            $scope = $isMag ? 'magistrales' : 'standard';
            $key = $scope . '|' . $code;

            if ($lab !== '') $labs[$lab] = true;
            $units[$unit] = true;
            if (!$isMag && $almacen !== '') $warehouses[$almacen] = true;

            if (!isset($articles[$key])) {
                $articles[$key] = [
                    'scope' => $scope,
                    'code' => $code,
                    'name' => mb_substr($name, 0, 255),
                    'lab' => $lab,
                    'unit' => $unit,
                    'warehouse' => $isMag ? null : $almacen,
                    'default_lot' => $lot !== '' ? mb_substr($lot, 0, 80) : null,
                ];
                if ($isMag) $magCodes[$code] = true; else $stdCodes[$code] = true;
            }
        }

        return [
            'labs' => array_keys($labs),
            'units' => array_keys($units),
            'warehouses' => array_keys($warehouses),
            'articles' => $articles,
            'stdCodes' => array_keys($stdCodes),
            'magCodes' => array_keys($magCodes),
        ];
    }

    // ------------------------------------------------------------------
    // PERSISTENCIA
    // ------------------------------------------------------------------

    private function resolveBusiness(string $key, string $name): Business
    {
        $business = Business::query()->where('business_key', $key)->first();
        if ($business) return $business;

        return Business::query()->create([
            'business_key' => $key,
            'name' => $name,
            'trade_name' => $name,
            'status' => true,
            'created_by' => $this->userId,
            'updated_by' => $this->userId,
        ]);
    }

    private function resolveMainBranch(Business $business): BusinessBranch
    {
        $branch = BusinessBranch::query()
            ->where('business_id', $business->id)
            ->whereNotNull('status')
            ->orderByRaw("CASE WHEN LOWER(name) = 'principal' THEN 0 ELSE 1 END")
            ->orderBy('id')
            ->first();

        if ($branch) return $branch;

        return BusinessBranch::query()->create([
            'business_id' => $business->id,
            'name' => 'Principal',
            'establishment_code' => '0000',
            'ubigeo' => '150101',
            'address' => 'Sede principal Kamary Peru',
            'status' => true,
            'created_by' => $this->userId,
            'updated_by' => $this->userId,
        ]);
    }

    /** @return array<string,int> labNameNorm => id */
    private function syncLaboratories(array $labs): array
    {
        $map = [];
        foreach ($labs as $name) {
            $existing = Laboratory::query()->whereRaw('LOWER(TRIM(name)) = ?', [mb_strtolower(trim($name))])->first();
            if ($existing) {
                $map[$this->norm($name)] = (int) $existing->id;
                continue;
            }
            $lab = Laboratory::query()->create([
                'name' => mb_substr($name, 0, 255),
                'code' => $this->uniqueLabCode($name),
                'country' => 'Perú',
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);
            $map[$this->norm($name)] = (int) $lab->id;
        }
        return $map;
    }

    /** @return array<int,int> labId => activePrincipleId ("PRINCIPIO GENERAL") */
    private function syncActivePrinciples(array $labIds): array
    {
        $map = [];
        foreach (array_unique(array_values($labIds)) as $labId) {
            $ap = ActivePrinciple::query()->updateOrCreate(
                ['laboratory_id' => $labId, 'name' => 'PRINCIPIO GENERAL'],
                ['status' => true, 'created_by' => $this->userId, 'updated_by' => $this->userId]
            );
            $map[$labId] = (int) $ap->id;
        }
        return $map;
    }

    /** @return array<string,int> unitSymbol => id (units.symbol es unique GLOBAL) */
    private function syncUnits(array $units): array
    {
        $map = [];
        foreach ($units as $label) {
            $unit = Unit::query()->whereRaw('LOWER(TRIM(name)) = ?', [mb_strtolower(trim($label))])->first()
                ?? Unit::query()->whereRaw('LOWER(TRIM(symbol)) = ?', [mb_strtolower(trim($label))])->first();
            if (!$unit) {
                $unit = Unit::query()->create([
                    'module_scope' => 'standard',
                    'name' => ucfirst(mb_strtolower($label, 'UTF-8')),
                    'symbol' => $label,
                    'status' => true,
                    'created_by' => $this->userId,
                    'updated_by' => $this->userId,
                ]);
            }
            $map[$label] = (int) $unit->id;
        }
        return $map;
    }

    /** @return array<string,int> brandWarehouseNorm => id */
    private function syncBrandWarehouses(array $warehouses, int $branchId): array
    {
        $map = [];
        foreach ($warehouses as $name) {
            $existing = Warehouse::query()->whereRaw('LOWER(TRIM(name)) = ?', [mb_strtolower(trim($name))])->first();
            if ($existing) {
                if ($existing->status === null) {
                    $existing->update(['status' => true, 'updated_by' => $this->userId]);
                }
                $map[$this->norm($name)] = (int) $existing->id;
                continue;
            }
            $wh = Warehouse::query()->create([
                'business_branch_id' => $branchId,
                'name' => mb_substr($name, 0, 255),
                'description' => 'Almacen de marca (import Kamary Peru).',
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);
            $map[$this->norm($name)] = (int) $wh->id;
        }
        return $map;
    }

    /**
     * PURGA FISICA IRREVERSIBLE de todo el demo de Kamary Peru. Con FOREIGN_KEY_CHECKS=0,
     * acotado a la empresa kamary_peru:
     *   - borra el transaccional (pedidos, ordenes de compra, recepciones, listas de
     *     precio, despachos, guias, conteos, notas de entrada/salida, facturacion, CxP/CxC,
     *     actividades, lotes, take/sample orders);
     *   - borra los articulos standard/magistrales/NULL que NO son del dump (+ hijos);
     *   - borra fisicamente los almacenes demo (deja solo los 3 de marca);
     *   - vacia los almacenes fijos de Muestras y Magistrales (borra sus ubicaciones).
     * Conserva: los productos del dump, los almacenes de marca, Muestras y Magistrales
     * (vacios), empresa/sedes/usuarios/series/labs/units.
     *
     * @param array<string> $keepCodes codigos de articulo a conservar (los del dump)
     * @param array<string,int> $keepWarehouseIds ids de almacenes de marca a conservar
     * @return array<string,int> conteos eliminados
     */
    private function hardPurge(int $peruId, array $keepCodes, array $keepWarehouseIds): array
    {
        $counts = [
            'articulos_no_dump' => Article::query()
                ->where(function ($q) {
                    $q->whereIn('module_scope', ['standard', 'magistrales'])->orWhereNull('module_scope');
                })
                ->whereNotIn('code', $keepCodes)
                ->count(),
            'pedidos_com' => $this->countByColumn('commercial_orders', 'business_id', $peruId),
            'ordenes_compra' => $this->countByColumn('purchase_orders', 'business_id', $peruId),
        ];

        // Hijos (item/detalle) cuyo header tiene business_id = kamary_peru.
        $childByParent = [
            ['order_items', 'order_id', 'orders'],
            ['commercial_order_items', 'commercial_order_id', 'commercial_orders'],
            ['commercial_order_stock_movements', 'commercial_order_id', 'commercial_orders'],
            ['purchase_order_items', 'purchase_order_id', 'purchase_orders'],
            ['purchase_receipt_items', 'purchase_receipt_id', 'purchase_receipts'],
            ['price_list_items', 'price_list_id', 'price_lists'],
            ['dispatch_assignments', 'dispatch_id', 'dispatches'],
            ['delivery_evidences', 'dispatch_id', 'dispatches'],
            ['referral_guide_items', 'referral_guide_id', 'referral_guides'],
            ['inventory_count_items', 'inventory_count_id', 'inventory_counts'],
            ['entry_note_items', 'entry_note_id', 'entry_notes'],
            ['exit_note_items', 'exit_note_id', 'exit_notes'],
            ['take_order_items', 'take_order_id', 'take_orders'],
            ['billing_document_items', 'billing_document_id', 'billing_documents'],
            ['billing_events', 'billing_document_id', 'billing_documents'],
            ['accounts_payable_installments', 'accounts_payable_id', 'accounts_payable'],
            ['accounts_payable_payments', 'accounts_payable_id', 'accounts_payable'],
            ['accounts_receivable_installments', 'accounts_receivable_id', 'accounts_receivable'],
            ['receivable_payments', 'accounts_receivable_id', 'accounts_receivable'],
            ['activity_items', 'activity_id', 'activities'],
        ];
        $headers = [
            'orders', 'commercial_orders', 'purchase_orders', 'purchase_receipts', 'price_lists',
            'dispatches', 'referral_guides', 'inventory_counts', 'entry_notes', 'exit_notes',
            'take_orders', 'billing_documents', 'accounts_payable',
            'accounts_receivable', 'activities', 'batches',
        ];
        // Tablas de kamary_peru sin business_id (modulo Muestras / tracking): borrado total.
        $deleteAll = ['sample_orders', 'commercial_order_tracking_events'];

        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        try {
            foreach ($childByParent as [$child, $fk, $parent]) {
                $this->deleteChildrenByParent($child, $fk, $parent, 'business_id', $peruId);
            }
            foreach ($headers as $table) {
                $this->deleteByColumn($table, 'business_id', $peruId);
            }
            foreach ($deleteAll as $table) {
                if (Schema::hasTable($table)) DB::table($table)->delete();
            }

            // Articulos NO-dump + hijos que los referencian por article_id.
            $delIds = Article::query()
                ->where(function ($q) {
                    $q->whereIn('module_scope', ['standard', 'magistrales'])->orWhereNull('module_scope');
                })
                ->whereNotIn('code', $keepCodes)
                ->pluck('id')->all();

            if (!empty($delIds)) {
                foreach ([
                    'article_presentations', 'order_items', 'commercial_order_items', 'purchase_order_items',
                    'purchase_receipt_items', 'price_list_items', 'entry_note_items', 'exit_note_items',
                    'take_order_items', 'inventory_count_items', 'activity_items', 'referral_guide_items',
                ] as $t) {
                    $this->deleteByColumnIn($t, 'article_id', $delIds);
                }
                $this->deleteByColumnIn('article_pack_components', 'pack_article_id', $delIds);
                $this->deleteByColumnIn('article_pack_components', 'component_article_id', $delIds);
                foreach (array_chunk($delIds, 1000) as $chunk) {
                    Article::query()->whereIn('id', $chunk)->delete();
                }
            }

            // Almacenes demo (kamary_peru, no marca, no muestras/magistrales) -> HARD delete + ubicaciones.
            $keepWh = array_values(array_unique(array_map('intval', $keepWarehouseIds)));
            $demoWh = Warehouse::query()
                ->whereHas('branch.business', fn($q) => $q->where('business_key', BusinessScope::KAMARY_PERU))
                ->when(!empty($keepWh), fn($q) => $q->whereNotIn('id', $keepWh))
                ->whereRaw('LOWER(name) NOT LIKE ?', ['%muestra%'])
                ->whereRaw('LOWER(name) NOT LIKE ?', ['%magistral%'])
                ->pluck('id')->all();
            $counts['almacenes_demo'] = count($demoWh);
            if (!empty($demoWh)) {
                $this->deleteByColumnIn('warehouse_locations', 'warehouse_id', $demoWh);
                foreach (array_chunk($demoWh, 500) as $chunk) {
                    Warehouse::query()->whereIn('id', $chunk)->delete();
                }
            }

            // Vaciar Muestras/Magistrales (borrar sus ubicaciones; su stock ya se elimino arriba).
            $fixedWh = Warehouse::query()
                ->whereHas('branch.business', fn($q) => $q->where('business_key', BusinessScope::KAMARY_PERU))
                ->where(function ($q) {
                    $q->whereRaw('LOWER(name) LIKE ?', ['%muestra%'])->orWhereRaw('LOWER(name) LIKE ?', ['%magistral%']);
                })
                ->pluck('id')->all();
            $this->deleteByColumnIn('warehouse_locations', 'warehouse_id', $fixedWh);
        } finally {
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        }

        return $counts;
    }

    private function countByColumn(string $table, string $column, $value): int
    {
        if (!Schema::hasTable($table) || !Schema::hasColumn($table, $column)) return 0;
        return (int) DB::table($table)->where($column, $value)->count();
    }

    private function deleteByColumn(string $table, string $column, $value): void
    {
        if (!Schema::hasTable($table) || !Schema::hasColumn($table, $column)) return;
        DB::table($table)->where($column, $value)->delete();
    }

    private function deleteByColumnIn(string $table, string $column, array $ids): void
    {
        if (empty($ids) || !Schema::hasTable($table) || !Schema::hasColumn($table, $column)) return;
        foreach (array_chunk($ids, 1000) as $chunk) {
            DB::table($table)->whereIn($column, $chunk)->delete();
        }
    }

    private function deleteChildrenByParent(string $childTable, string $fk, string $parentTable, string $parentColumn, $parentValue): void
    {
        if (!Schema::hasTable($childTable) || !Schema::hasColumn($childTable, $fk) || !Schema::hasTable($parentTable) || !Schema::hasColumn($parentTable, $parentColumn)) {
            return;
        }
        $parentIds = DB::table($parentTable)->where($parentColumn, $parentValue)->pluck('id')->all();
        $this->deleteByColumnIn($childTable, $fk, $parentIds);
    }

    /**
     * Deja ACTIVOS los 108 productos del dump. Si el articulo ya existe (por
     * module_scope+code) solo lo re-activa (NO pisa su lab/principio/unidad
     * reales). Si no existe, lo crea completo con placeholders.
     *
     * @return int cantidad de productos del dump asegurados
     */
    private function syncProducts(array $articles, int $businessId, array $labIds, array $principleIds, array $unitIds, array $warehouseIds): int
    {
        $count = 0;
        foreach ($articles as $a) {
            // El catalogo standard historico puede tener module_scope NULL (el grid lo
            // muestra via orWhereNull). Buscamos por code contemplando NULL para standard,
            // priorizando la fila con scope exacto.
            $article = Article::query()
                ->where('code', $a['code'])
                ->where(function ($q) use ($a) {
                    $q->where('module_scope', $a['scope']);
                    if ($a['scope'] === 'standard') $q->orWhereNull('module_scope');
                })
                ->orderByRaw('CASE WHEN module_scope = ? THEN 0 ELSE 1 END', [$a['scope']])
                ->first();

            if ($article) {
                // Existe: reactivar sin clobbear la data real (solo normalizar scope si venia NULL).
                $updates = ['updated_by' => $this->userId];
                if ($article->status !== true) $updates['status'] = true;
                if ($article->module_scope !== $a['scope']) $updates['module_scope'] = $a['scope'];
                if (Schema::hasColumn('articles', 'default_lot') && !$article->default_lot && $a['default_lot']) {
                    $updates['default_lot'] = $a['default_lot'];
                }
                $article->update($updates);
                $this->ensureDefaultPresentation((int) $article->id);
                $count++;
                continue;
            }

            // Nuevo: crear completo.
            $labId = $labIds[$this->norm($a['lab'])] ?? null;
            $data = [
                'module_scope' => $a['scope'],
                'business_id' => $businessId,
                'code' => $a['code'],
                'name' => $a['name'],
                'laboratory_id' => $labId,
                'unit_id' => $unitIds[$a['unit']] ?? null,
                'units_per_article' => 1,
                'margin_rule' => false,
                'igv_rule' => false,
                'status' => true,
                'default_lot' => $a['default_lot'],
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ];
            if ($a['scope'] === 'magistrales') {
                $data['active_principle_id'] = null;                 // magistrales lo exige NULL
                $data['warehouse_id'] = null;
                $data['magistral_status'] = 'vigente';
            } else {
                $data['active_principle_id'] = $labId ? ($principleIds[$labId] ?? null) : null; // obligatorio en grid
                $data['warehouse_id'] = $a['warehouse'] ? ($warehouseIds[$this->norm($a['warehouse'])] ?? null) : null;
            }

            $article = Article::query()->create($data);
            $this->ensureDefaultPresentation((int) $article->id);
            $count++;
        }
        return $count;
    }

    private function ensureDefaultPresentation(int $articleId): void
    {
        $exists = ArticlePresentation::query()->where('article_id', $articleId)->exists();
        if ($exists) return;

        ArticlePresentation::query()->create([
            'article_id' => $articleId,
            'name' => 'Unidad',
            'units' => 1,
            'price' => 0,
            'sort_order' => 0,
            'status' => true,
        ]);
    }

    /** Setea series por sede en business_branches. @return int series aplicadas */
    private function syncSeries(array $series): int
    {
        // Agrupa: empresaKey => tipo => [series...]
        $byEmpresa = [];
        foreach ($series as $row) {
            $empRaw = $this->norm($row['empresa'] ?? '');
            $tipo = $this->norm($row['tipo_documento'] ?? '');
            $serie = $this->text($row['serie'] ?? '');
            if ($serie === '') continue;
            $empKey = str_contains($empRaw, 'MEDICAL') ? BusinessScope::KAMARY_MEDICALS : BusinessScope::KAMARY_PERU;
            $byEmpresa[$empKey][$tipo][] = $serie;
        }

        $colFor = [
            'FACTURAS' => 'series_factura',
            'BOLETAS' => 'series_boleta',
            'GUIA DE REMISION' => 'series_guia',
        ];

        $applied = 0;
        foreach ($byEmpresa as $empKey => $tipos) {
            $business = Business::query()->where('business_key', $empKey)->first();
            if (!$business) continue;

            // Sedes comerciales activas (excluye la sede de Magistrales), Principal primero.
            $branches = BusinessBranch::query()
                ->where('business_id', $business->id)
                ->whereNotNull('status')
                ->whereRaw("LOWER(name) NOT LIKE '%magistral%'")
                ->orderByRaw("CASE WHEN LOWER(name) LIKE 'principal%' THEN 0 ELSE 1 END")
                ->orderBy('id')
                ->get();
            if ($branches->isEmpty()) continue;

            foreach ($tipos as $tipo => $seriesList) {
                $col = $colFor[$tipo] ?? null;
                if (!$col || !Schema::hasColumn('business_branches', $col)) continue;
                $seriesList = array_values(array_unique($seriesList));
                foreach ($seriesList as $i => $serie) {
                    $branch = $branches[$i] ?? $branches[0];
                    $payload = [$col => $serie, 'updated_by' => $this->userId];
                    if (Schema::hasColumn('business_branches', 'facturador_sync_status')) {
                        $payload['facturador_sync_status'] = 'pending';
                    }
                    $branch->update($payload);
                    $applied++;
                }
            }
        }
        return $applied;
    }

    /** Crea/actualiza los 17 usuarios con clave 4ccessme + rol Admin. @return int */
    private function syncUsers(): int
    {
        $this->ensureAdminRole();
        $count = 0;

        foreach (self::USERS as $spec) {
            $username = $this->slug($spec['label']);
            if ($username === '') continue;
            $scope = $spec['empresa'] === 'medical' ? ['kamary-medicals'] : ['kamary-peru'];
            $domain = $spec['empresa'] === 'medical' ? 'kamarymedical.com' : 'kamary.pe';

            $user = User::query()->where('username', $username)->first();
            if ($user) {
                // Cuenta real ya existente: NO pisar su password/scope/status/email;
                // solo se le concede acceso Admin (segun la decision de negocio).
                $user->assignRole('Admin');
                $count++;
                continue;
            }

            // Usuario nuevo: se crea con clave comun 4ccessme + Admin.
            $user = new User();
            $user->username = $username;
            $user->name = $spec['label'];
            $user->lastname = $spec['empresa'] === 'medical' ? 'Kamary Medical' : 'Kamary Peru';
            $user->email = $username . '@' . $domain;
            if (Schema::hasColumn('users', 'email_verified_at')) $user->email_verified_at = now();
            if (Schema::hasColumn('users', 'created_by')) $user->created_by = $this->userId;
            $user->password = self::DEFAULT_PASSWORD; // cast 'hashed' -> bcrypt automatico
            $user->status = true;
            if (Schema::hasColumn('users', 'scope')) $user->scope = $scope;
            if (Schema::hasColumn('users', 'updated_by')) $user->updated_by = $this->userId;
            $user->save();
            $user->assignRole('Admin');
            $count++;
        }
        return $count;
    }

    private function ensureAdminRole(): void
    {
        $roleClass = \Spatie\Permission\Models\Role::class;
        if (class_exists($roleClass)) {
            $roleClass::findOrCreate('Admin', 'web');
        }
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private function hasRequiredTables(): bool
    {
        foreach (['businesses', 'business_branches', 'warehouses', 'articles', 'article_presentations', 'laboratories', 'active_principles', 'units', 'users', 'roles'] as $t) {
            if (!Schema::hasTable($t)) return false;
        }
        return true;
    }

    private function loadJson(string $file): ?array
    {
        $path = database_path($file);
        if (!is_file($path)) return null;
        $data = json_decode(file_get_contents($path), true);
        return is_array($data) ? $data : null;
    }

    private function uniqueLabCode(string $name): string
    {
        $base = preg_replace('/[^A-Z0-9]/', '', strtoupper($this->text($name)));
        $base = mb_substr($base ?: 'LAB', 0, 20);
        $code = $base;
        $i = 1;
        while (Laboratory::query()->where('code', $code)->exists()) {
            $suffix = (string) $i++;
            $code = mb_substr($base, 0, 20 - mb_strlen($suffix)) . $suffix;
        }
        return $code;
    }

    private function slug(string $label): string
    {
        $s = $this->text($label);
        $s = strtr($s, ['á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ñ' => 'n', 'Á' => 'A', 'É' => 'E', 'Í' => 'I', 'Ó' => 'O', 'Ú' => 'U', 'Ñ' => 'N']);
        $s = strtolower($s);
        $s = preg_replace('/[^a-z0-9]+/', '-', $s);
        return trim($s, '-');
    }

    private function text($value): string
    {
        return trim((string) $value);
    }

    private function norm($value): string
    {
        return mb_strtoupper(preg_replace('/\s+/u', ' ', trim((string) $value)), 'UTF-8');
    }

    private function printSummary(array $plan, int $kept, array $removed, int $seriesSet, int $usersSet): void
    {
        $this->command?->info('Import Kamary Peru completado:');
        $this->command?->line('  productos dump asegurados (activos) . ' . $kept . ' (' . count($plan['stdCodes']) . ' standard + ' . count($plan['magCodes']) . ' magistrales)');
        $this->command?->warn('  PURGA FISICA (borrado de raiz):');
        $this->command?->line('    articulos no-dump eliminados ..... ' . ($removed['articulos_no_dump'] ?? 0));
        $this->command?->line('    pedidos comerciales eliminados ... ' . ($removed['pedidos_com'] ?? 0));
        $this->command?->line('    ordenes de compra eliminadas ..... ' . ($removed['ordenes_compra'] ?? 0));
        $this->command?->line('    almacenes demo eliminados ........ ' . ($removed['almacenes_demo'] ?? 0));
        $this->command?->line('  laboratorios ....................... ' . count($plan['labs']));
        $this->command?->line('  almacenes de marca ................. ' . count($plan['warehouses']));
        $this->command?->line('  series aplicadas ................... ' . $seriesSet);
        $this->command?->line('  usuarios creados/actualizados ...... ' . $usersSet);
    }
}
