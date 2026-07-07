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
 * Efecto sobre el catalogo (REVERSIBLE):
 *   - Deja ACTIVOS solo los productos del dump. El dump trae 108 filas = 92 codigos
 *     distintos (66 standard + 26 magistrales; 10 codigos se repiten por lote). El
 *     catalogo queda con esos ~92 productos activos.
 *   - "Elimina" (soft-delete: status=null, como el boton Eliminar de la app) los
 *     demas articulos standard (y NULL) y magistrales de Kamary Peru -> desaparecen
 *     del catalogo pero NO se borran filas ni se rompen pedidos/compras/inventarios.
 *   - NO toca el modulo Muestras.
 *
 * Ademas (NO reversible):
 *   - Crea los almacenes de marca (GLOBAL GREEN / PHARMA SOLUTIONS / PHARMARIS).
 *   - Setea las series de documentos en las sedes comerciales.
 *   - Crea usuarios nuevos (clave 4ccessme + rol Admin). A las cuentas ya
 *     existentes NO les toca password/scope: solo les concede Admin.
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
            $this->softDeleteDemoWarehouses($warehouseIds);

            $kept = $this->syncProducts($plan['articles'], $peru->id, $labIds, $principleIds, $unitIds, $warehouseIds);
            $removed = $this->softDeleteOthers($plan['stdCodes'], $plan['magCodes']);

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
     * Oculta (soft-delete status=null, reversible) los almacenes demo/operativos
     * de Kamary Peru que NO son del dump: deja solo los 3 de marca. NO toca los
     * almacenes fijos de Muestras ni Magistrales (la app los protege). No borra
     * filas: pedidos/compras/despachos que los referencian siguen intactos.
     *
     * @param array<string,int> $keepIds ids de los almacenes de marca a conservar
     */
    private function softDeleteDemoWarehouses(array $keepIds): void
    {
        $keep = array_values(array_unique(array_map('intval', $keepIds)));

        Warehouse::query()
            ->whereHas('branch.business', function ($q) {
                $q->where('business_key', BusinessScope::KAMARY_PERU);
            })
            ->whereNotNull('status')
            ->when(!empty($keep), fn($q) => $q->whereNotIn('id', $keep))
            ->whereRaw('LOWER(name) NOT LIKE ?', ['%muestra%'])
            ->whereRaw('LOWER(name) NOT LIKE ?', ['%magistral%'])
            ->update(['status' => null, 'updated_by' => $this->userId]);
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

    /**
     * Soft-delete (status=null, reversible) de todos los articulos standard y
     * magistrales que NO son del dump -> el catalogo queda con solo los 108.
     * No borra filas: no rompe pedidos/compras/inventarios que los referencien.
     *
     * @return array{standard:int,magistrales:int}
     */
    private function softDeleteOthers(array $stdCodes, array $magCodes): array
    {
        $std = 0;
        $mag = 0;

        if (!empty($stdCodes)) {
            // Espeja el grid standard (module_scope='standard' OR IS NULL) para que no
            // queden articulos NULL visibles fuera del dump.
            $std = Article::query()
                ->where(function ($q) {
                    $q->where('module_scope', 'standard')->orWhereNull('module_scope');
                })
                ->whereNotNull('status')
                ->whereNotIn('code', $stdCodes)
                ->update(['status' => null, 'updated_by' => $this->userId]);
        }
        if (!empty($magCodes)) {
            $mag = Article::query()
                ->where('module_scope', 'magistrales')
                ->whereNotNull('status')
                ->whereNotIn('code', $magCodes)
                ->update(['status' => null, 'updated_by' => $this->userId]);
        }

        return ['standard' => (int) $std, 'magistrales' => (int) $mag];
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
        $this->command?->line('  standard soft-deleted (status=null) . ' . ($removed['standard'] ?? 0));
        $this->command?->line('  magistrales soft-deleted ............ ' . ($removed['magistrales'] ?? 0));
        $this->command?->line('  laboratorios ....................... ' . count($plan['labs']));
        $this->command?->line('  almacenes de marca ................. ' . count($plan['warehouses']));
        $this->command?->line('  series aplicadas ................... ' . $seriesSet);
        $this->command?->line('  usuarios creados/actualizados ...... ' . $usersSet);
    }
}
