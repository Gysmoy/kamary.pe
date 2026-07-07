<?php

namespace Database\Seeders;

use App\Models\Article;
use App\Models\Business;
use App\Models\BusinessBranch;
use App\Models\Client;
use App\Models\EntryNote;
use App\Models\EntryNoteItem;
use App\Models\Laboratory;
use App\Models\StorageLocation;
use App\Models\StorageProductLot;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use App\Support\BusinessScope;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Importa la data base del "Servicio de Almacenamiento" exportada del sistema
 * legado L105 (kamary.l105.com) hacia los modulos de almacenamiento de Kamary
 * (empresa kamary_medicals).
 *
 * Fuente: database/data/almacenamiento_kamary_base.json
 *
 * Puebla, de forma idempotente y en una sola transaccion:
 *   - warehouses          (almacenes)
 *   - clients             (clientes con detalle RUC + catalogo por nombre)
 *   - units               (CAJA / UNIDAD / FRASCO)
 *   - laboratories        (un laboratorio placeholder "Importado L105")
 *   - articles            (productos, module_scope=storage, por cliente)
 *   - storage_locations   (ubicaciones por almacen)
 *   - storage_product_lots(lotes por producto)
 *   - entry_notes/items   (stock inicial: 1 nota por almacen+cliente, entry_status=approved)
 *
 * El stock del modulo se deriva de las notas de entrada aprobadas
 * (ver App\Http\Controllers\Admin\Storage\KardexController::kardexQuery).
 *
 * Ejecutar:
 *   php artisan db:seed --class=StorageServiceImportSeeder
 *
 * Es re-ejecutable: usa updateOrCreate por claves naturales y regenera los
 * items de las notas de entrada de la importacion (prefijo NE-L105-).
 */
class StorageServiceImportSeeder extends Seeder
{
    private const DATA_FILE = 'data/almacenamiento_kamary_base.json';
    private const NOTE_PREFIX = 'NE-L105-';
    private const LAB_CODE = 'IMP-L105';
    private const LAB_NAME = 'Importado L105';

    /** Temperaturas validas del modulo (App\...\Storage\KardexController::TEMPERATURES). */
    private const ALLOWED_TEMPERATURES = [
        '-15°C a -25°C',
        '2°C a 8°C',
        '15°C a 25°C',
        '-15°C a -40°C',
    ];

    private ?int $userId = null;

    public function run(): void
    {
        if (!$this->hasRequiredTables()) {
            $this->command?->error('Faltan tablas del modulo de almacenamiento. Corre las migraciones primero.');
            return;
        }

        $json = $this->loadJson();
        if ($json === null) {
            $this->command?->error('No se pudo leer ' . self::DATA_FILE);
            return;
        }

        $plan = $this->buildPlan($json);
        $this->userId = User::query()->orderBy('id')->value('id');

        DB::transaction(function () use ($plan) {
            $business = $this->resolveBusiness();

            // Reset total del modulo de almacenamiento: deja SOLO la data del dump.
            $wiped = $this->wipeStorageModule($business);

            $branch = $this->resolveBranch($business);
            $labId = $this->ensureLaboratory();

            $warehouseIds = $this->syncWarehouses($plan['warehouses'], $business, $branch->id);
            $unitIds = $this->syncUnits($plan['units']);
            $clientIds = $this->syncClients($plan['clients']);
            $articleIds = $this->syncArticles($plan['articles'], $business->id, $clientIds, $unitIds, $labId);

            $this->syncLocations($plan['locations'], $warehouseIds, $clientIds);
            $this->syncProductLots($plan['lots'], $articleIds);
            $this->syncEntryNotes($plan['notes'], $business, $branch->id, $warehouseIds, $clientIds, $articleIds);

            $this->printSummary($plan, $wiped);
        });
    }

    // ------------------------------------------------------------------
    // PLAN (transformacion pura, sin BD, testeable de forma aislada)
    // ------------------------------------------------------------------

    /**
     * Convierte el JSON del export en un plan estructurado con claves naturales.
     * No toca la base de datos; run() resuelve las claves a ids al persistir.
     */
    public function buildPlan(array $json): array
    {
        $warehouses = [];
        foreach ($json['almacenes'] ?? [] as $a) {
            $name = $this->text($a['nombre'] ?? '');
            if ($name !== '') {
                $warehouses[$this->norm($name)] = $name;
            }
        }

        // --- clientes: detalle (RUC) primero, luego catalogo (CAT-<id>) sin duplicar por nombre ---
        $clients = [];      // clientKey(norm) => datos
        $catIdToKey = [];   // id de catalogo => clientKey

        foreach ($json['clientes'] ?? [] as $c) {
            $name = $this->text($c['razon_social'] ?? '');
            if ($name === '') continue;
            $key = $this->norm($name);
            $clients[$key] = [
                'document_type' => mb_substr($this->text($c['tipo_documento'] ?? 'RUC') ?: 'RUC', 0, 5),
                'document_number' => mb_substr($this->text($c['n_documento'] ?? '') ?: ('SD-' . ($c['id'] ?? $key)), 0, 20),
                'full_name' => mb_substr($name, 0, 255),
                'email' => $this->firstEmail($c['email'] ?? ''),
                'full_address' => $this->cap($this->text($c['direccion'] ?? ''), 255),
                'status' => $this->norm($c['estado'] ?? 'Activo') !== 'INACTIVO',
            ];
        }

        foreach ($json['clientes_catalogo'] ?? [] as $c) {
            $name = $this->text($c['nombre'] ?? '');
            if ($name === '') continue;
            $key = $this->norm($name);
            $catIdToKey[(string) ($c['id'] ?? '')] = $key;
            if (isset($clients[$key])) continue; // ya existe con detalle
            $clients[$key] = [
                'document_type' => 'CAT',
                'document_number' => mb_substr('CAT-' . ($c['id'] ?? $key), 0, 20),
                'full_name' => mb_substr($name, 0, 255),
                'email' => null,
                'full_address' => null,
                'status' => true,
            ];
        }

        // --- productos: articulos, unidades, ubicaciones, lotes, notas e items ---
        $units = [];
        $articles = [];     // articleCode => datos
        $locations = [];    // whKey||codeNorm => datos
        $lots = [];         // articleCode||lot => datos
        $notes = [];        // whKey||clientKey => ['warehouse','clientKey','items'=>[]]
        $missingClients = [];

        foreach ($json['productos_en_stock'] ?? [] as $p) {
            $whName = $this->text($p['almacen'] ?? '');
            $whKey = $this->norm($whName);
            if ($whName === '') continue;

            $clientName = $this->text($p['cliente'] ?? '');
            $clientKey = $this->norm($clientName);
            if ($clientKey === '' || !isset($clients[$clientKey])) {
                // Cliente que aparece en productos pero no en catalogo/detalle: lo creamos.
                if ($clientKey === '') continue;
                if (!isset($clients[$clientKey])) {
                    $clients[$clientKey] = [
                        'document_type' => 'CAT',
                        'document_number' => 'CAT-AUTO-' . substr(sha1($clientKey), 0, 10),
                        'full_name' => mb_substr($clientName, 0, 255),
                        'email' => null,
                        'full_address' => null,
                        'status' => true,
                    ];
                    $missingClients[$clientKey] = true;
                }
            }

            $articleName = $this->text($p['articulo'] ?? '');
            if ($articleName === '') continue;
            $unitLabel = $this->norm($p['unidad_medida'] ?? 'UNIDAD') ?: 'UNIDAD';
            $units[$unitLabel] = $unitLabel;

            $articleCode = $this->articleCode($clientKey, $articleName);
            if (!isset($articles[$articleCode])) {
                $articles[$articleCode] = [
                    'code' => $articleCode,
                    'clientKey' => $clientKey,
                    'name' => $articleName,
                    'unit' => $unitLabel,
                ];
            }

            $lot = $this->text($p['lote'] ?? '');
            $expiration = $this->normalizeDate($p['fecha_vencimiento'] ?? null);
            $temperature = $this->normalizeTemperature($p['temperatura'] ?? '');
            $location = $this->text($p['ubicacion'] ?? '');
            $quantity = (float) ($p['stock_sistema'] ?? 0);

            if ($location !== '') {
                $locKey = $whKey . '||' . $this->norm($location);
                if (!isset($locations[$locKey])) {
                    $locations[$locKey] = [
                        'warehouse' => $whKey,
                        'clientKey' => $clientKey,
                        'code' => $location,
                        'temperature' => $temperature ?: '15°C a 25°C',
                    ];
                }
            }

            if ($lot !== '') {
                $lotKey = $articleCode . '||' . $lot;
                if (!isset($lots[$lotKey])) {
                    $lots[$lotKey] = [
                        'articleCode' => $articleCode,
                        'lot' => $lot,
                        'expiration' => $expiration,
                        'storage_condition' => $temperature,
                    ];
                }
            }

            $noteKey = $whKey . '||' . $clientKey;
            if (!isset($notes[$noteKey])) {
                $notes[$noteKey] = [
                    'warehouse' => $whKey,
                    'clientKey' => $clientKey,
                    'items' => [],
                ];
            }
            $notes[$noteKey]['items'][] = [
                'articleCode' => $articleCode,
                'warehouse' => $whKey,
                'lot' => $lot,
                'expiration' => $expiration,
                'storage_condition' => $temperature,
                'location' => $location,
                'quantity' => $quantity,
            ];
        }

        return [
            'warehouses' => $warehouses,
            'clients' => $clients,
            'units' => $units,
            'articles' => $articles,
            'locations' => $locations,
            'lots' => $lots,
            'notes' => $notes,
            'missingClients' => array_keys($missingClients),
        ];
    }

    // ------------------------------------------------------------------
    // PERSISTENCIA
    // ------------------------------------------------------------------

    private function resolveBusiness(): Business
    {
        $business = Business::query()
            ->where('business_key', BusinessScope::KAMARY_MEDICALS)
            ->first();

        if ($business) {
            return $business;
        }

        return Business::query()->create([
            'business_key' => BusinessScope::KAMARY_MEDICALS,
            'name' => 'Kamary Medicals',
            'trade_name' => 'Kamary Medicals',
            'description' => 'Empresa para servicios de almacenamiento.',
            'status' => true,
            'created_by' => $this->userId,
            'updated_by' => $this->userId,
        ]);
    }

    private function resolveBranch(Business $business): BusinessBranch
    {
        $branch = BusinessBranch::query()
            ->where('business_id', $business->id)
            ->whereNotNull('status')
            ->orderBy('id')
            ->first();

        if ($branch) {
            return $branch;
        }

        return BusinessBranch::query()->create([
            'business_id' => $business->id,
            'name' => 'Almacenamiento Principal',
            'establishment_code' => '0000',
            'ubigeo' => '150101',
            'address' => 'Sede de servicios de almacenamiento',
            'email' => 'almacenamiento@kamary.pe',
            'telephone' => '014856320',
            'series_factura' => 'FM01',
            'series_boleta' => 'BM01',
            'series_nota_credito' => 'FCM1',
            'status' => true,
            'created_by' => $this->userId,
            'updated_by' => $this->userId,
        ]);
    }

    /**
     * Reset total del modulo de almacenamiento (empresa kamary_medicals).
     * Borra, de forma acotada al scope storage y FK-safe, toda la data actual
     * para que solo quede la del dump. NO toca datos de kamary_peru ni maestros
     * compartidos (almacenes, sedes, laboratorios se conservan/reutilizan).
     *
     * @return array<string,int> conteos eliminados por grupo
     */
    private function wipeStorageModule(Business $business): array
    {
        $medicalsId = (int) $business->id;

        $clientIds = Client::query()->where('module_scope', 'storage')->pluck('id')->all();
        $articleIds = Article::query()->where('module_scope', 'storage')->pluck('id')->all();

        $wiped = [
            'clients' => count($clientIds),
            'articles' => count($articleIds),
            'entry_notes' => $this->countByColumn('entry_notes', 'business_id', $medicalsId),
            'billing_documents' => $this->countByColumn('billing_documents', 'business_id', $medicalsId),
            'service_orders' => $this->countByColumn('service_orders', 'business_id', $medicalsId),
        ];

        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        try {
            // Facturacion de storage
            $this->deleteChildrenByParent('billing_events', 'billing_document_id', 'billing_documents', 'business_id', $medicalsId);
            $this->deleteChildrenByParent('billing_document_items', 'billing_document_id', 'billing_documents', 'business_id', $medicalsId);
            $this->deleteByColumn('billing_documents', 'business_id', $medicalsId);

            // Cuentas por cobrar de storage
            $this->deleteChildrenByParent('receivable_payments', 'accounts_receivable_id', 'accounts_receivable', 'business_id', $medicalsId);
            $this->deleteChildrenByParent('accounts_receivable_installments', 'accounts_receivable_id', 'accounts_receivable', 'business_id', $medicalsId);
            $this->deleteByColumn('accounts_receivable', 'business_id', $medicalsId);

            // Ordenes de servicio de storage
            $this->deleteChildrenByParent('service_order_items', 'service_order_id', 'service_orders', 'business_id', $medicalsId);
            $this->deleteByColumn('service_orders', 'business_id', $medicalsId);

            // Despachos de storage
            $this->deleteChildrenByParent('dispatch_assignments', 'dispatch_id', 'dispatches', 'business_id', $medicalsId);
            $this->deleteByColumn('dispatches', 'business_id', $medicalsId);

            // Notas de salida de storage
            $this->deleteChildrenByParent('exit_note_items', 'exit_note_id', 'exit_notes', 'business_id', $medicalsId);
            $this->deleteByColumn('exit_notes', 'business_id', $medicalsId);

            // Notas de entrada de storage
            $this->deleteChildrenByParent('entry_note_items', 'entry_note_id', 'entry_notes', 'business_id', $medicalsId);
            $this->deleteByColumn('entry_notes', 'business_id', $medicalsId);

            // Conteos de inventario de storage (tablas exclusivas de storage)
            $this->deleteChildrenByParent('storage_inventory_count_items', 'storage_inventory_count_id', 'storage_inventory_counts', null, null);
            $this->deleteAll('storage_inventory_counts');

            // Ubicaciones y lotes (tablas exclusivas de storage)
            $this->deleteAll('storage_product_lots');
            $this->deleteAll('storage_locations');

            // Satelites por cliente storage
            foreach ([
                'storage_api_tokens',
                'client_notifications',
                'client_contracts',
                'client_storage_tariffs',
                'client_delivery_addresses',
                'client_distribution_networks',
            ] as $table) {
                $this->deleteByColumnIn($table, 'client_id', $clientIds);
            }

            // Articulos storage (presentaciones y lotes por FK, batches por si acaso)
            $this->deleteByColumnIn('article_presentations', 'article_id', $articleIds);
            $this->deleteByColumnIn('batches', 'article_id', $articleIds);
            Article::query()->where('module_scope', 'storage')->delete();

            // Unidades storage
            Unit::query()->where('module_scope', 'storage')->delete();

            // Clientes storage
            Client::query()->where('module_scope', 'storage')->delete();
        } finally {
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        }

        return $wiped;
    }

    private function ensureLaboratory(): int
    {
        return (int) Laboratory::query()->updateOrCreate(
            ['code' => self::LAB_CODE],
            [
                'name' => self::LAB_NAME,
                'country' => 'Perú',
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]
        )->id;
    }

    /** @return array<string,int> warehouseKey(norm) => id */
    private function syncWarehouses(array $warehouses, Business $business, int $branchId): array
    {
        // Almacenes ya existentes bajo kamary_medicals, por nombre normalizado.
        $existing = Warehouse::query()
            ->whereHas('branch.business', function ($q) use ($business) {
                $q->where('business_key', BusinessScope::KAMARY_MEDICALS);
            })
            ->get(['id', 'name']);

        $byNorm = [];
        foreach ($existing as $w) {
            $byNorm[$this->norm($w->name)] = (int) $w->id;
        }

        $map = [];
        foreach ($warehouses as $key => $name) {
            if (isset($byNorm[$key])) {
                $map[$key] = $byNorm[$key];
                continue;
            }
            $warehouse = Warehouse::query()->create([
                'business_branch_id' => $branchId,
                'name' => $name,
                'description' => 'Importado de L105 (Servicio de Almacenamiento).',
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);
            $map[$key] = (int) $warehouse->id;
        }

        // Deja SOLO los 6 almacenes del dump: desactiva (status=null, reversible)
        // los demas almacenes activos de kamary_medicals que no son del dump.
        $keepIds = array_values($map);
        if (!empty($keepIds)) {
            Warehouse::query()
                ->whereHas('branch.business', function ($q) {
                    $q->where('business_key', BusinessScope::KAMARY_MEDICALS);
                })
                ->whereNotNull('status')
                ->whereNotIn('id', $keepIds)
                ->update(['status' => null, 'updated_by' => $this->userId]);
        }

        return $map;
    }

    /**
     * @return array<string,int> unitLabel => id
     *
     * OJO: units.symbol tiene unique GLOBAL (no por module_scope). Reutilizamos
     * la unidad existente por simbolo (a lo sumo una por simbolo) y solo creamos
     * una nueva con scope storage si el simbolo no existe en ningun modulo.
     */
    private function syncUnits(array $units): array
    {
        $map = [];
        foreach ($units as $label) {
            $unit = Unit::query()->firstOrCreate(
                ['symbol' => $label],
                [
                    'module_scope' => 'storage',
                    'name' => ucfirst(mb_strtolower($label, 'UTF-8')),
                    'status' => true,
                    'created_by' => $this->userId,
                    'updated_by' => $this->userId,
                ]
            );
            $map[$label] = (int) $unit->id;
        }

        return $map;
    }

    /** @return array<string,int> clientKey(norm) => id */
    private function syncClients(array $clients): array
    {
        $map = [];
        foreach ($clients as $key => $c) {
            $client = Client::query()->updateOrCreate(
                [
                    'document_type' => $c['document_type'],
                    'document_number' => $c['document_number'],
                    'module_scope' => 'storage',
                ],
                [
                    'client_kind' => 'regular',
                    'full_name' => $c['full_name'],
                    'email' => $c['email'],
                    'full_address' => $c['full_address'],
                    'has_storage_service' => true,
                    'status' => $c['status'],
                    'created_by' => $this->userId,
                    'updated_by' => $this->userId,
                ]
            );
            $map[$key] = (int) $client->id;
        }

        return $map;
    }

    /**
     * @param array<string,int> $clientIds
     * @param array<string,int> $unitIds
     * @return array<string,int> articleCode => id
     */
    private function syncArticles(array $articles, int $businessId, array $clientIds, array $unitIds, int $labId): array
    {
        $map = [];
        foreach ($articles as $code => $a) {
            // articles.code es unique GLOBAL: keyear solo por code (los codigos
            // L105-* son exclusivos de este import y no chocan con otros modulos).
            $article = Article::query()->updateOrCreate(
                ['code' => $code],
                [
                    'module_scope' => 'storage',
                    'business_id' => $businessId,
                    'client_id' => $clientIds[$a['clientKey']] ?? null,
                    'name' => $a['name'],
                    'laboratory_id' => $labId,
                    'unit_id' => $unitIds[$a['unit']] ?? null,
                    'units_per_article' => 1,
                    'margin_rule' => false,
                    'igv_rule' => false,
                    'stock_has_lot' => true,
                    'stock_has_expiration' => true,
                    'currency' => 'PEN',
                    'status' => true,
                    'created_by' => $this->userId,
                    'updated_by' => $this->userId,
                ]
            );
            $map[$code] = (int) $article->id;
        }

        return $map;
    }

    /**
     * @param array<string,int> $warehouseIds
     * @param array<string,int> $clientIds
     */
    private function syncLocations(array $locations, array $warehouseIds, array $clientIds): void
    {
        foreach ($locations as $loc) {
            $warehouseId = $warehouseIds[$loc['warehouse']] ?? null;
            $clientId = $clientIds[$loc['clientKey']] ?? null;
            if (!$warehouseId || !$clientId) continue;

            StorageLocation::query()->updateOrCreate(
                ['warehouse_id' => $warehouseId, 'code' => $loc['code']],
                [
                    'client_id' => $clientId,
                    'temperature_range' => $loc['temperature'],
                    'status' => true,
                    'created_by' => $this->userId,
                    'updated_by' => $this->userId,
                ]
            );
        }
    }

    /** @param array<string,int> $articleIds */
    private function syncProductLots(array $lots, array $articleIds): void
    {
        foreach ($lots as $lot) {
            $articleId = $articleIds[$lot['articleCode']] ?? null;
            if (!$articleId) continue;

            StorageProductLot::query()->updateOrCreate(
                ['article_id' => $articleId, 'lot' => $lot['lot']],
                [
                    'expiration_date' => $lot['expiration'],
                    'storage_condition' => $lot['storage_condition'] ?: null,
                    'status' => true,
                    'created_by' => $this->userId,
                    'updated_by' => $this->userId,
                ]
            );
        }
    }

    /**
     * @param array<string,int> $warehouseIds
     * @param array<string,int> $clientIds
     * @param array<string,int> $articleIds
     */
    private function syncEntryNotes(array $notes, Business $business, int $branchId, array $warehouseIds, array $clientIds, array $articleIds): void
    {
        foreach ($notes as $note) {
            $warehouseId = $warehouseIds[$note['warehouse']] ?? null;
            $clientId = $clientIds[$note['clientKey']] ?? null;
            if (!$warehouseId || !$clientId) continue;

            $code = self::NOTE_PREFIX . $warehouseId . '-' . $clientId;

            $entryNote = EntryNote::query()->updateOrCreate(
                ['code' => $code],
                [
                    'business_id' => $business->id,
                    'business_branch_id' => $branchId,
                    'warehouse_id' => $warehouseId,
                    'client_id' => $clientId,
                    'document_type' => 'Nota de entrada',
                    'currency' => 'PEN',
                    'entry_date' => now()->toDateString(),
                    'provider_distributor' => 'Importacion L105',
                    'observations' => 'Stock inicial importado del servicio de almacenamiento L105.',
                    'entry_status' => 'approved',
                    'status' => true,
                    'created_by' => $this->userId,
                    'updated_by' => $this->userId,
                ]
            );

            // Regeneramos los items para reflejar exactamente el export (idempotente).
            EntryNoteItem::query()->where('entry_note_id', $entryNote->id)->delete();

            $rows = [];
            $now = now();
            foreach ($note['items'] as $item) {
                $articleId = $articleIds[$item['articleCode']] ?? null;
                if (!$articleId) continue;

                $rows[] = [
                    'entry_note_id' => $entryNote->id,
                    'article_id' => $articleId,
                    'warehouse_id' => $warehouseId,
                    'lot' => $item['lot'] ?: null,
                    'batch_code' => $item['lot'] ?: null,
                    'expiration_date' => $item['expiration'],
                    'storage_condition' => $item['storage_condition'] ?: null,
                    'manufacturer_id' => null,
                    'location' => $item['location'] ?: null,
                    'stock' => 0,
                    'cost_unit' => 0,
                    'requested_quantity' => $item['quantity'],
                    'received_quantity' => $item['quantity'],
                    'quantity' => $item['quantity'],
                    'total' => 0,
                    'status' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            foreach (array_chunk($rows, 500) as $chunk) {
                EntryNoteItem::query()->insert($chunk);
            }
        }
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private function hasRequiredTables(): bool
    {
        foreach ([
            'businesses', 'business_branches', 'warehouses', 'clients', 'units',
            'laboratories', 'articles', 'storage_locations', 'storage_product_lots',
            'entry_notes', 'entry_note_items',
        ] as $table) {
            if (!Schema::hasTable($table)) return false;
        }

        return true;
    }

    private function loadJson(): ?array
    {
        $path = database_path(self::DATA_FILE);
        if (!is_file($path)) return null;

        $raw = file_get_contents($path);
        $data = json_decode($raw, true);

        return is_array($data) ? $data : null;
    }

    private function articleCode(string $clientKey, string $articleName): string
    {
        return 'L105-' . strtoupper(substr(sha1($clientKey . '|' . $this->norm($articleName)), 0, 16));
    }

    private function firstEmail(?string $email): ?string
    {
        $email = trim((string) $email);
        if ($email === '') return null;
        $first = trim(explode(',', $email)[0]);
        return $first !== '' ? mb_substr($first, 0, 255) : null;
    }

    private function normalizeTemperature(?string $value): string
    {
        $value = $this->text($value);
        return in_array($value, self::ALLOWED_TEMPERATURES, true) ? $value : '';
    }

    /** '0000-00-00'/'0001-01-01' => null; '0029-01-31' => '2029-01-31'. */
    private function normalizeDate(?string $value): ?string
    {
        $value = trim((string) $value);
        if ($value === '' || $value === '0000-00-00' || $value === '0001-01-01') return null;
        if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $value, $m)) return null;

        $year = (int) $m[1];
        $month = (int) $m[2];
        $day = (int) $m[3];
        if ($month < 1 || $month > 12 || $day < 1 || $day > 31) return null;
        if ($year < 100) $year += 2000;
        if ($year < 2000 || $year > 2100) return null;

        return sprintf('%04d-%02d-%02d', $year, $month, $day);
    }

    private function text($value): string
    {
        return trim((string) $value);
    }

    private function cap(string $value, int $length): ?string
    {
        $value = trim($value);
        return $value !== '' ? mb_substr($value, 0, $length) : null;
    }

    private function norm($value): string
    {
        $value = $this->text($value);
        $value = preg_replace('/\s+/u', ' ', $value);
        return mb_strtoupper($value, 'UTF-8');
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

    private function deleteAll(string $table): void
    {
        if (!Schema::hasTable($table)) return;
        DB::table($table)->delete();
    }

    /**
     * Borra filas de $childTable cuyo $fk apunta a filas de $parentTable filtradas
     * por $parentColumn=$parentValue (o todas si $parentColumn es null).
     */
    private function deleteChildrenByParent(string $childTable, string $fk, string $parentTable, ?string $parentColumn, $parentValue): void
    {
        if (!Schema::hasTable($childTable) || !Schema::hasColumn($childTable, $fk) || !Schema::hasTable($parentTable)) return;

        $parentIds = DB::table($parentTable)
            ->when($parentColumn !== null, function ($query) use ($parentTable, $parentColumn, $parentValue) {
                if (Schema::hasColumn($parentTable, $parentColumn)) {
                    $query->where($parentColumn, $parentValue);
                }
            })
            ->pluck('id')
            ->all();

        $this->deleteByColumnIn($childTable, $fk, $parentIds);
    }

    private function printSummary(array $plan, array $wiped = []): void
    {
        $items = 0;
        foreach ($plan['notes'] as $note) {
            $items += count($note['items']);
        }

        if (!empty($wiped)) {
            $this->command?->warn('Reset del modulo de almacenamiento (data eliminada):');
            $this->command?->line('  clientes storage ... ' . ($wiped['clients'] ?? 0));
            $this->command?->line('  articulos storage .. ' . ($wiped['articles'] ?? 0));
            $this->command?->line('  notas de entrada ... ' . ($wiped['entry_notes'] ?? 0));
            $this->command?->line('  docs facturacion ... ' . ($wiped['billing_documents'] ?? 0));
            $this->command?->line('  ordenes servicio ... ' . ($wiped['service_orders'] ?? 0));
        }

        $this->command?->info('Importacion L105 (Servicio de Almacenamiento) completada:');
        $this->command?->line('  almacenes .......... ' . count($plan['warehouses']));
        $this->command?->line('  clientes ........... ' . count($plan['clients']));
        $this->command?->line('  unidades ........... ' . count($plan['units']));
        $this->command?->line('  articulos .......... ' . count($plan['articles']));
        $this->command?->line('  ubicaciones ........ ' . count($plan['locations']));
        $this->command?->line('  lotes .............. ' . count($plan['lots']));
        $this->command?->line('  notas de entrada ... ' . count($plan['notes']));
        $this->command?->line('  items de stock ..... ' . $items);
        if (!empty($plan['missingClients'])) {
            $this->command?->line('  clientes auto-creados (no estaban en catalogo): ' . count($plan['missingClients']));
        }
    }
}
