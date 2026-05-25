<?php

namespace App\Console\Commands;

use App\Models\CommercialOrder;
use App\Models\Dispatch;
use App\Services\AccountsReceivableService;
use App\Services\DispatchService;
use App\Services\ReferralGuideService;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class SeedOperationalFlowDemoCommand extends Command
{
    protected $signature = 'kamary:seed-operational-flow-demo
        {--force : Confirma la limpieza de pedidos, preparacion y despachos}
        {--orders=10 : Pedidos en modulo Pedido}
        {--preparation=10 : Pedidos visibles en Preparacion}
        {--dispatches=10 : Despachos entregados}
        {--skip-backup : Omite el backup JSON previo}';

    protected $description = 'Limpia datos operativos de pedido/preparacion/despacho y crea un flujo demo completo.';

    private const DEMO_MARK = 'operational flow demo';
    private const STOCK_ENTRY_CODE = 'NE-DEMO-FLOW';

    private ?int $userId = null;
    private array $columnsCache = [];

    public function handle(): int
    {
        if (!$this->option('force')) {
            $this->error('Usa --force para confirmar la limpieza de pedidos, preparacion y despachos.');
            return self::FAILURE;
        }

        $this->assertRequiredTables();
        $this->userId = $this->resolveUserId();

        $orderCount = max(1, (int) $this->option('orders'));
        $preparationCount = max(1, (int) $this->option('preparation'));
        $dispatchCount = max(1, (int) $this->option('dispatches'));

        $backupPath = null;
        if (!$this->option('skip-backup')) {
            $backupPath = $this->backupOperationalData();
            $this->info("Backup creado: storage/app/{$backupPath}");
        }

        DB::transaction(function () use ($orderCount, $preparationCount, $dispatchCount) {
            $this->cleanupOperationalData();

            $context = $this->ensureDemoContext();
            $articles = $this->ensureDemoArticles($context);
            $clients = $this->ensureDemoClients();
            $routes = $this->ensureDemoRoutes($context);
            $this->seedDemoStock($context, $articles);

            $ordersCreated = 0;
            $preparationCreated = 0;
            $dispatchesCreated = 0;

            for ($index = 1; $index <= $orderCount; $index++) {
                $clientBundle = $clients[($index - 1) % count($clients)];
                $articleBundle = $articles[($index - 1) % count($articles)];
                $this->createCommercialOrder($context, $clientBundle, $articleBundle, $index, 'draft');
                $ordersCreated++;
            }

            for ($index = 1; $index <= $preparationCount; $index++) {
                $clientBundle = $clients[($index + 2) % count($clients)];
                $articleBundle = $articles[($index + 1) % count($articles)];
                $status = $index % 2 === 0 ? 'preparing' : 'pending';
                $this->createCommercialOrder($context, $clientBundle, $articleBundle, $orderCount + $index, 'preparation', $status);
                $preparationCreated++;
            }

            for ($index = 1; $index <= $dispatchCount; $index++) {
                $clientBundle = $clients[($index + 5) % count($clients)];
                $articleBundle = $articles[($index + 3) % count($articles)];
                $order = $this->createCommercialOrder(
                    $context,
                    $clientBundle,
                    $articleBundle,
                    $orderCount + $preparationCount + $index,
                    'dispatch'
                );
                $routeBundle = $routes[($index - 1) % count($routes)];
                $this->createDeliveredDispatch($context, $routeBundle, $order, $index);
                $dispatchesCreated++;
            }

            $this->info("Pedidos demo creados: {$ordersCreated}");
            $this->info("Pedidos en preparacion creados: {$preparationCreated}");
            $this->info("Despachos entregados creados: {$dispatchesCreated}");
        });

        if ($backupPath) {
            $this->line("Backup disponible para auditoria: storage/app/{$backupPath}");
        }
        $this->info('Flujo demo operativo creado correctamente.');

        return self::SUCCESS;
    }

    private function assertRequiredTables(): void
    {
        foreach ([
            'businesses',
            'business_branches',
            'warehouses',
            'clients',
            'client_distribution_networks',
            'client_delivery_addresses',
            'articles',
            'article_presentations',
            'entry_notes',
            'entry_note_items',
            'commercial_orders',
            'commercial_order_items',
            'commercial_order_stock_movements',
            'commercial_order_tracking_events',
            'referral_guides',
            'referral_guide_items',
            'delivery_evidences',
            'dispatches',
            'dispatch_assignments',
        ] as $table) {
            if (!Schema::hasTable($table)) {
                throw new \RuntimeException("Tabla requerida no existe: {$table}");
            }
        }
    }

    private function backupOperationalData(): string
    {
        $tables = [
            'commercial_orders',
            'commercial_order_items',
            'commercial_order_stock_movements',
            'commercial_order_tracking_events',
            'dispatches',
            'dispatch_assignments',
            'delivery_evidences',
            'referral_guides',
            'referral_guide_items',
            'accounts_receivable',
            'accounts_receivable_installments',
            'receivable_payments',
        ];

        $payload = [
            'generated_at' => now()->toIso8601String(),
            'tables' => [],
        ];

        foreach ($tables as $table) {
            if (!Schema::hasTable($table)) {
                continue;
            }
            $payload['tables'][$table] = DB::table($table)->get()->map(fn($row) => (array) $row)->all();
        }

        $path = 'demo-flow-backups/operational-flow-' . now()->format('Ymd-His') . '.json';
        Storage::disk('local')->put($path, json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

        return $path;
    }

    private function cleanupOperationalData(): void
    {
        $dispatchIds = $this->pluckIds('dispatches');
        $orderIds = $this->pluckIds('commercial_orders');
        $exitNoteIds = Schema::hasTable('dispatches') && Schema::hasColumn('dispatches', 'exit_note_id')
            ? DB::table('dispatches')->whereNotNull('exit_note_id')->pluck('exit_note_id')->map(fn($id) => (int) $id)->unique()->values()->all()
            : [];
        $guideIds = Schema::hasTable('referral_guides')
            ? DB::table('referral_guides')
                ->when(!empty($dispatchIds), fn($query) => $query->orWhereIn('dispatch_id', $dispatchIds))
                ->when(!empty($orderIds), fn($query) => $query->orWhereIn('commercial_order_id', $orderIds))
                ->pluck('id')
                ->map(fn($id) => (int) $id)
                ->all()
            : [];

        if (Schema::hasTable('delivery_evidences')) {
            DB::table('delivery_evidences')->delete();
        }
        if (Schema::hasTable('commercial_order_tracking_events')) {
            DB::table('commercial_order_tracking_events')->delete();
        }
        if (Schema::hasTable('referral_guide_items') && !empty($guideIds)) {
            DB::table('referral_guide_items')->whereIn('referral_guide_id', $guideIds)->delete();
        }
        if (Schema::hasTable('referral_guides')) {
            DB::table('referral_guides')->delete();
        }

        $this->deleteAccountsReceivableForOrders($orderIds);

        if (Schema::hasTable('dispatch_assignments')) {
            DB::table('dispatch_assignments')->delete();
        }
        if (!empty($exitNoteIds) && Schema::hasTable('exit_note_items')) {
            DB::table('exit_note_items')->whereIn('exit_note_id', $exitNoteIds)->delete();
        }
        if (!empty($exitNoteIds) && Schema::hasTable('exit_notes')) {
            DB::table('exit_notes')->whereIn('id', $exitNoteIds)->delete();
        }
        if (Schema::hasTable('dispatches')) {
            DB::table('dispatches')->delete();
        }
        if (Schema::hasTable('commercial_order_stock_movements')) {
            DB::table('commercial_order_stock_movements')->delete();
        }
        if (Schema::hasTable('commercial_order_items')) {
            DB::table('commercial_order_items')->delete();
        }
        if (Schema::hasTable('commercial_orders')) {
            DB::table('commercial_orders')->delete();
        }

        $this->deletePreviousDemoStock();
    }

    private function deleteAccountsReceivableForOrders(array $orderIds): void
    {
        if (!Schema::hasTable('accounts_receivable') || empty($orderIds)) {
            return;
        }

        $receivableIds = DB::table('accounts_receivable')
            ->where(function ($query) use ($orderIds) {
                $query->where(function ($source) use ($orderIds) {
                    $source->where('source_type', 'commercial_order')->whereIn('source_id', $orderIds);
                });
                if (Schema::hasColumn('accounts_receivable', 'commercial_order_id')) {
                    $query->orWhereIn('commercial_order_id', $orderIds);
                }
            })
            ->pluck('id')
            ->map(fn($id) => (int) $id)
            ->all();

        if (empty($receivableIds)) {
            return;
        }

        if (Schema::hasTable('receivable_payments')) {
            DB::table('receivable_payments')->whereIn('accounts_receivable_id', $receivableIds)->delete();
        }
        if (Schema::hasTable('accounts_receivable_installments')) {
            DB::table('accounts_receivable_installments')->whereIn('accounts_receivable_id', $receivableIds)->delete();
        }
        DB::table('accounts_receivable')->whereIn('id', $receivableIds)->delete();
    }

    private function deletePreviousDemoStock(): void
    {
        if (!Schema::hasTable('entry_notes')) {
            return;
        }

        $ids = DB::table('entry_notes')
            ->where('code', self::STOCK_ENTRY_CODE)
            ->orWhere('document_series', 'DEMO-FLOW')
            ->orWhere('observations', 'like', '%' . self::DEMO_MARK . '%')
            ->pluck('id')
            ->map(fn($id) => (int) $id)
            ->all();

        if (empty($ids)) {
            return;
        }

        if (Schema::hasTable('entry_note_items')) {
            DB::table('entry_note_items')->whereIn('entry_note_id', $ids)->delete();
        }
        DB::table('entry_notes')->whereIn('id', $ids)->delete();
    }

    private function ensureDemoContext(): array
    {
        $business = DB::table('businesses')
            ->when(Schema::hasColumn('businesses', 'business_key'), fn($query) => $query->where('business_key', 'kamary_peru'))
            ->first();

        if (!$business) {
            $business = DB::table('businesses')
                ->whereNotNull('status')
                ->orderBy('id')
                ->first();
        }

        if (!$business) {
            $businessId = $this->insertRow('businesses', [
                'business_key' => 'kamary_peru',
                'name' => 'Kamary Peru',
                'tax_number' => '20600000001',
                'trade_name' => 'Kamary Peru',
                'description' => 'Empresa comercial principal.',
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);
            $business = DB::table('businesses')->find($businessId);
        }

        $this->updateRow('businesses', (int) $business->id, [
            'status' => true,
            'tax_number' => $business->tax_number ?? '20600000001',
            'trade_name' => $business->trade_name ?? $business->name,
            'updated_by' => $this->userId,
        ]);

        $branch = DB::table('business_branches')
            ->where('business_id', $business->id)
            ->whereNotNull('status')
            ->orderByRaw("CASE WHEN name = 'Principal' THEN 0 ELSE 1 END")
            ->orderBy('id')
            ->first();

        if (!$branch) {
            $branchId = $this->insertRow('business_branches', [
                'business_id' => $business->id,
                'name' => 'Principal',
                'establishment_code' => '0000',
                'ubigeo' => '150101',
                'address' => 'Av. Republica de Panama 3505, San Isidro, Lima',
                'series_factura' => 'F001',
                'series_boleta' => 'B001',
                'series_nota_credito' => 'FC01',
                'series_guia' => 'T001',
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);
            $branch = DB::table('business_branches')->find($branchId);
        } else {
            $this->updateRow('business_branches', (int) $branch->id, [
                'status' => true,
                'establishment_code' => $branch->establishment_code ?? '0000',
                'ubigeo' => $branch->ubigeo ?? '150101',
                'address' => $branch->address ?? 'Av. Republica de Panama 3505, San Isidro, Lima',
                'series_guia' => $branch->series_guia ?? 'T001',
                'updated_by' => $this->userId,
            ]);
        }

        $warehouse = DB::table('warehouses')
            ->where('business_branch_id', $branch->id)
            ->whereNotNull('status')
            ->orderBy('id')
            ->first();

        if (!$warehouse) {
            $warehouseId = $this->insertRow('warehouses', [
                'business_branch_id' => $branch->id,
                'name' => 'Almacen Principal - Principal',
                'description' => 'Almacen principal para flujo demo.',
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);
            $warehouse = DB::table('warehouses')->find($warehouseId);
        } else {
            $this->updateRow('warehouses', (int) $warehouse->id, [
                'business_branch_id' => $branch->id,
                'status' => true,
                'updated_by' => $this->userId,
            ]);
        }

        return [
            'business_id' => (int) $business->id,
            'branch_id' => (int) $branch->id,
            'warehouse_id' => (int) $warehouse->id,
            'warehouse_name' => $warehouse->name,
        ];
    }

    private function ensureDemoClients(): array
    {
        $districts = [
            ['Miraflores', 'Av. Jose Pardo 620', '-12.119142', '-77.029103'],
            ['San Isidro', 'Av. Camino Real 390', '-12.097671', '-77.036530'],
            ['Surco', 'Av. Primavera 120', '-12.111718', '-76.990103'],
            ['La Molina', 'Av. La Molina 540', '-12.076470', '-76.945839'],
            ['Jesus Maria', 'Av. Brasil 1300', '-12.073855', '-77.048576'],
            ['Pueblo Libre', 'Av. Bolivar 900', '-12.076337', '-77.067917'],
            ['Magdalena del Mar', 'Jr. Bolognesi 450', '-12.090962', '-77.071322'],
            ['San Borja', 'Av. Aviacion 2400', '-12.094437', '-77.001765'],
            ['Lince', 'Av. Arequipa 1900', '-12.082138', '-77.034669'],
            ['Lima Cercado', 'Jr. Camana 550', '-12.046374', '-77.031726'],
        ];

        $clients = [];
        foreach ($districts as $index => $district) {
            $number = $index + 1;
            $client = $this->firstOrInsert('clients', [
                'document_type' => 'DNI',
                'document_number' => '70001' . str_pad((string) $number, 3, '0', STR_PAD_LEFT),
                'module_scope' => 'commercial',
            ], [
                'client_kind' => 'regular',
                'full_name' => 'Cliente Demo Flujo ' . str_pad((string) $number, 2, '0', STR_PAD_LEFT),
                'email' => "cliente.demo{$number}@kamary.pe",
                'billing_email' => "cliente.demo{$number}@kamary.pe",
                'phone' => '94' . str_pad((string) $number, 7, '0', STR_PAD_LEFT),
                'phone_prefix' => '+51',
                'short_code' => 'CDF' . str_pad((string) $number, 3, '0', STR_PAD_LEFT),
                'full_address' => $district[1] . ', ' . $district[0],
                'fiscal_address' => $district[1] . ', ' . $district[0],
                'ubigeo' => '150101',
                'department' => 'Lima',
                'province' => 'Lima',
                'district' => $district[0],
                'commercial_channel' => 'Farmacia',
                'segment' => 'Retail',
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);

            $network = $this->firstOrInsert('client_distribution_networks', [
                'code' => 'NET-DEMO-' . str_pad((string) $number, 3, '0', STR_PAD_LEFT),
            ], [
                'client_id' => $client->id,
                'name' => 'Red Demo ' . str_pad((string) $number, 2, '0', STR_PAD_LEFT),
                'commercial_channel' => 'Farmacia',
                'segment' => 'Retail',
                'contact_name' => 'Contacto Demo ' . str_pad((string) $number, 2, '0', STR_PAD_LEFT),
                'contact_phone' => '94' . str_pad((string) $number, 7, '0', STR_PAD_LEFT),
                'is_default' => true,
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);

            $address = $this->firstOrInsert('client_delivery_addresses', [
                'client_distribution_network_id' => $network->id,
                'code' => 'DIR-DEMO-' . str_pad((string) $number, 3, '0', STR_PAD_LEFT),
            ], [
                'client_id' => $client->id,
                'name' => 'Entrega Demo ' . str_pad((string) $number, 2, '0', STR_PAD_LEFT),
                'ubigeo' => '150101',
                'department' => 'Lima',
                'province' => 'Lima',
                'district' => $district[0],
                'address' => $district[1] . ', ' . $district[0],
                'reference' => 'Referencia de entrega ' . $district[0],
                'latitude' => $district[2],
                'longitude' => $district[3],
                'contact_name' => 'Recepcion Demo ' . str_pad((string) $number, 2, '0', STR_PAD_LEFT),
                'contact_phone' => '94' . str_pad((string) $number, 7, '0', STR_PAD_LEFT),
                'is_default' => true,
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);

            $clients[] = [
                'client' => $client,
                'network' => $network,
                'address' => $address,
            ];
        }

        return $clients;
    }

    private function ensureDemoArticles(array $context): array
    {
        $unit = $this->firstOrInsert('units', ['symbol' => 'NIU'], [
            'name' => 'Unidad',
            'status' => true,
            'created_by' => $this->userId,
            'updated_by' => $this->userId,
        ]);

        $lab = $this->firstOrInsert('laboratories', ['code' => 'DEMO-LAB'], [
            'name' => 'Demo Pharma Lab',
            'status' => true,
            'created_by' => $this->userId,
            'updated_by' => $this->userId,
        ]);

        $articleSpecs = [
            ['PARACETAMOL 500MG TABLETA', 'Paracetamol', 0.03, 0.35, 3.30, 30.00],
            ['OMEPRAZOL 20MG CAPSULA', 'Omeprazol', 0.03, 0.85, 8.00, 75.00],
            ['IBUPROFENO 400MG TABLETA', 'Ibuprofeno', 0.03, 0.55, 5.20, 48.00],
            ['CETIRIZINA 10MG TABLETA', 'Cetirizina', 0.02, 0.70, 6.80, 62.00],
            ['ENOXAPARINA 40MG JERINGA', 'Enoxaparina', 0.08, 38.00, 360.00, 3400.00],
        ];

        $articles = [];
        foreach ($articleSpecs as $index => $spec) {
            $number = $index + 1;
            $principle = $this->firstOrInsert('active_principles', [
                'laboratory_id' => $lab->id,
                'name' => $spec[1],
            ], [
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);

            $article = $this->firstOrInsert('articles', [
                'module_scope' => 'standard',
                'code' => 'ART-DEMO-' . str_pad((string) $number, 3, '0', STR_PAD_LEFT),
            ], [
                'business_id' => $context['business_id'],
                'name' => $spec[0],
                'laboratory_id' => $lab->id,
                'active_principle_id' => $principle->id,
                'unit_id' => $unit->id,
                'volume' => 1,
                'units_per_article' => 1,
                'unit_weight' => $spec[2],
                'sale_price_national' => $spec[3],
                'purchase_price_national' => round($spec[3] * 0.65, 4),
                'currency' => 'PEN',
                'stock_min' => 20,
                'stock_max' => 10000,
                'margin_rule' => false,
                'igv_rule' => true,
                'is_pack' => false,
                'status' => true,
                'notes' => 'Articulo demo para flujo operativo.',
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);

            $presentationUnit = $this->firstOrInsert('article_presentations', [
                'article_id' => $article->id,
                'name' => 'UNIDAD',
            ], [
                'units' => 1,
                'price' => $spec[3],
                'purchase_price_national' => round($spec[3] * 0.65, 4),
                'sort_order' => 1,
                'status' => true,
            ]);
            $presentationBlister = $this->firstOrInsert('article_presentations', [
                'article_id' => $article->id,
                'name' => 'BLISTER',
            ], [
                'units' => 10,
                'price' => $spec[4],
                'purchase_price_national' => round($spec[4] * 0.65, 4),
                'sort_order' => 2,
                'status' => true,
            ]);
            $presentationBox = $this->firstOrInsert('article_presentations', [
                'article_id' => $article->id,
                'name' => 'CAJA',
            ], [
                'units' => 100,
                'price' => $spec[5],
                'purchase_price_national' => round($spec[5] * 0.65, 4),
                'sort_order' => 3,
                'status' => true,
            ]);

            $articles[] = [
                'article' => $article,
                'presentations' => [$presentationUnit, $presentationBlister, $presentationBox],
            ];
        }

        return $articles;
    }

    private function ensureDemoRoutes(array $context): array
    {
        $zones = [
            ['Lima Centro', 'Lima'],
            ['Lima Sur', 'Santiago de Surco'],
            ['Lima Norte', 'Los Olivos'],
            ['Lima Este', 'La Molina'],
            ['Callao', 'Callao'],
        ];

        $routes = [];
        foreach ($zones as $index => $zoneData) {
            $number = $index + 1;
            $zone = $this->firstOrInsert('zones', [
                'code' => 'ZON-DEMO-' . str_pad((string) $number, 3, '0', STR_PAD_LEFT),
            ], [
                'business_id' => $context['business_id'],
                'name' => $zoneData[0],
                'ubigeo' => '150101',
                'department' => 'Lima',
                'province' => 'Lima',
                'district' => $zoneData[1],
                'reference' => $zoneData[0],
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);

            $driver = $this->firstOrInsert('drivers', [
                'code' => 'DRV-DEMO-' . str_pad((string) $number, 3, '0', STR_PAD_LEFT),
            ], [
                'business_id' => $context['business_id'],
                'full_name' => 'Conductor Demo ' . str_pad((string) $number, 2, '0', STR_PAD_LEFT),
                'document_type' => 'DNI',
                'document_number' => '46001' . str_pad((string) $number, 3, '0', STR_PAD_LEFT),
                'license_number' => 'LIC-DEMO-' . str_pad((string) $number, 3, '0', STR_PAD_LEFT),
                'phone' => '98' . str_pad((string) $number, 7, '0', STR_PAD_LEFT),
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);

            $vehicle = $this->firstOrInsert('vehicles', [
                'code' => 'VEH-DEMO-' . str_pad((string) $number, 3, '0', STR_PAD_LEFT),
            ], [
                'business_id' => $context['business_id'],
                'zone_id' => $zone->id,
                'plate' => 'KAM' . str_pad((string) $number, 3, '0', STR_PAD_LEFT),
                'label' => 'Unidad Demo ' . str_pad((string) $number, 2, '0', STR_PAD_LEFT),
                'brand' => 'Toyota',
                'model' => 'Hiace',
                'vehicle_type' => 'Furgon',
                'capacity' => 1200,
                'gross_weight' => 2500,
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);

            $routes[] = [
                'zone' => $zone,
                'driver' => $driver,
                'vehicle' => $vehicle,
            ];
        }

        return $routes;
    }

    private function seedDemoStock(array $context, array $articles): void
    {
        $entryNoteId = $this->insertRow('entry_notes', [
            'code' => self::STOCK_ENTRY_CODE,
            'business_id' => $context['business_id'],
            'business_branch_id' => $context['branch_id'],
            'warehouse_id' => $context['warehouse_id'],
            'document_type' => 'Nota demo',
            'document_series' => 'DEMO-FLOW',
            'document_sequence' => now()->format('YmdHis'),
            'currency' => 'PEN',
            'entry_date' => now()->toDateString(),
            'document_date' => now()->toDateString(),
            'observations' => self::DEMO_MARK . ': stock inicial para pruebas de pedido, preparacion y despacho.',
            'entry_status' => 'approved',
            'status' => true,
            'created_by' => $this->userId,
            'updated_by' => $this->userId,
        ]);

        foreach ($articles as $index => $bundle) {
            $article = $bundle['article'];
            $quantity = 12000 - ($index * 500);
            $cost = round((float) ($article->purchase_price_national ?? 0.25), 4);

            $this->insertRow('entry_note_items', [
                'entry_note_id' => $entryNoteId,
                'batch_code' => 'LOT-DEMO-' . str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT),
                'lot' => 'LOT-DEMO-' . str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT),
                'expiration_date' => now()->addYear()->toDateString(),
                'storage_condition' => 'Ambiente',
                'manufacturer_id' => $article->laboratory_id,
                'article_id' => $article->id,
                'warehouse_id' => $context['warehouse_id'],
                'stock' => $quantity,
                'cost_unit' => $cost,
                'location' => $context['warehouse_name'],
                'requested_quantity' => $quantity,
                'received_quantity' => $quantity,
                'quantity' => $quantity,
                'total' => round($quantity * $cost, 2),
                'status' => true,
            ]);
        }
    }

    private function createCommercialOrder(
        array $context,
        array $clientBundle,
        array $articleBundle,
        int $number,
        string $flow,
        string $preparationStatus = 'pending'
    ): CommercialOrder {
        $client = $clientBundle['client'];
        $network = $clientBundle['network'];
        $address = $clientBundle['address'];
        $article = $articleBundle['article'];
        $presentation = $articleBundle['presentations'][$number % count($articleBundle['presentations'])];

        $quantity = match ($flow) {
            'dispatch' => 2 + ($number % 3),
            'preparation' => 1 + ($number % 4),
            default => 1 + ($number % 2),
        };
        $presentationUnits = max(1, (float) $presentation->units);
        $priceUnit = max(0.1, (float) $presentation->price);
        $lineTotal = round($quantity * $priceUnit, 2);
        $totals = $this->totalsFromGross($lineTotal);
        $baseQuantity = round($quantity * $presentationUnits, 3);
        $issueDate = now()->subDays(max(0, 30 - $number))->toDateString();
        $promisedDate = now()->addDays(($number % 6) + 1)->toDateString();

        $orderStatus = match ($flow) {
            'draft' => 'draft',
            'dispatch' => 'dispatched',
            default => $preparationStatus === 'preparing' ? 'preparing' : 'confirmed',
        };
        $dispatchStatus = match ($flow) {
            'dispatch' => 'dispatched',
            'preparation' => $preparationStatus,
            default => 'pending',
        };

        $orderId = $this->insertRow('commercial_orders', [
            'code' => 'PED-DEMO-' . str_pad((string) $number, 6, '0', STR_PAD_LEFT),
            'business_id' => $context['business_id'],
            'business_branch_id' => $context['branch_id'],
            'warehouse_id' => $context['warehouse_id'],
            'client_id' => $client->id,
            'eventual_client_id' => null,
            'client_distribution_network_id' => $network->id,
            'client_delivery_address_id' => $address->id,
            'seller_id' => $this->userId,
            'document_type' => $number % 2 === 0 ? 'Boleta' : 'Factura',
            'currency' => 'PEN',
            'payment_condition' => 'Contado',
            'payment_method' => 'Transferencia',
            'commercial_channel' => 'Farmacia',
            'segment' => 'Retail',
            'order_status' => $orderStatus,
            'payment_status' => 'pending',
            'dispatch_status' => $dispatchStatus,
            'billing_status' => $flow === 'draft' ? 'pending' : 'partial',
            'issue_date' => $issueDate,
            'promised_delivery_at' => $promisedDate,
            'installments' => 1,
            'first_due_date' => $issueDate,
            'delivery_address' => $address->address,
            'delivery_reference' => $address->reference,
            'ubigeo' => $address->ubigeo,
            'map_lat' => $address->latitude,
            'map_lng' => $address->longitude,
            'dispatch_contact_name' => $address->contact_name,
            'dispatch_contact_phone' => $address->contact_phone,
            'subtotal' => $totals['subtotal'],
            'tax_amount' => $totals['tax_amount'],
            'total' => $totals['total'],
            'paid_amount' => 0,
            'balance_amount' => $totals['total'],
            'observations' => self::DEMO_MARK . ": pedido {$flow}.",
            'approved_at' => $flow === 'draft' ? null : now(),
            'status' => true,
            'created_by' => $this->userId,
            'updated_by' => $this->userId,
        ]);

        $itemId = $this->insertRow('commercial_order_items', [
            'commercial_order_id' => $orderId,
            'article_id' => $article->id,
            'presentation_id' => $presentation->id,
            'warehouse_id' => $context['warehouse_id'],
            'stock_available' => 10000,
            'reserved_quantity' => $flow === 'draft' ? 0 : $baseQuantity,
            'cost_unit' => round(max(0.01, (float) ($article->purchase_price_national ?? 0.1)), 4),
            'price_unit' => $priceUnit,
            'presentation_units' => $presentationUnits,
            'quantity' => $quantity,
            'total' => $lineTotal,
            'price_source' => 'demo',
            'status' => true,
        ]);

        $order = CommercialOrder::with(['items', 'client', 'eventualClient', 'business', 'branch', 'warehouse'])->findOrFail($orderId);
        $this->recordTracking($orderId, 'order_created', 'Pedido demo creado', $orderStatus, "Pedido {$order->code} creado para pruebas.");

        if ($flow !== 'draft') {
            $this->recordStockMovement($order, $itemId, $article->id, $context['warehouse_id'], 'reserved', $baseQuantity, 'Reserva demo desde creacion de pedido');
            $this->recordTracking($orderId, 'stock_reservation', 'Stock reservado', 'reserved', 'Reserva demo generada desde creacion.');
            app(AccountsReceivableService::class)->syncFromCommercialOrder($order);
        }

        return $order->fresh(['items', 'client', 'eventualClient', 'business', 'branch', 'warehouse']);
    }

    private function createDeliveredDispatch(array $context, array $routeBundle, CommercialOrder $order, int $number): void
    {
        $driver = $routeBundle['driver'];
        $vehicle = $routeBundle['vehicle'];
        $zone = $routeBundle['zone'];
        $scheduledDate = now()->subDays(max(0, 10 - $number))->toDateString();

        $dispatchId = $this->insertRow('dispatches', [
            'code' => 'DSP-DEMO-' . str_pad((string) $number, 6, '0', STR_PAD_LEFT),
            'business_id' => $context['business_id'],
            'business_branch_id' => $context['branch_id'],
            'warehouse_id' => $context['warehouse_id'],
            'scheduled_date' => $scheduledDate,
            'shift' => $number % 2 === 0 ? 'Tarde' : 'Manana',
            'driver_id' => $driver->id,
            'driver_name' => $driver->full_name,
            'copilot_name' => 'Copiloto Demo ' . str_pad((string) $number, 2, '0', STR_PAD_LEFT),
            'vehicle_id' => $vehicle->id,
            'vehicle_label' => $vehicle->label,
            'vehicle_plate' => $vehicle->plate,
            'zone_id' => $zone->id,
            'zone' => $zone->name,
            'manifest_code' => 'MNF-DEMO-' . str_pad((string) $number, 6, '0', STR_PAD_LEFT),
            'dispatch_status' => 'delivered',
            'departed_at' => Carbon::parse($scheduledDate)->setTime(9, 0),
            'delivered_at' => Carbon::parse($scheduledDate)->setTime(12, 30),
            'observations' => self::DEMO_MARK . ': despacho entregado para pruebas.',
            'status' => true,
            'created_by' => $this->userId,
            'updated_by' => $this->userId,
        ]);

        $this->insertRow('dispatch_assignments', [
            'dispatch_id' => $dispatchId,
            'commercial_order_id' => $order->id,
            'commercial_order_code' => $order->code,
            'customer_name' => $order->client?->full_name ?: 'Cliente demo',
            'total' => $order->total,
            'assignment_status' => 'delivered',
            'status' => true,
        ]);

        $dispatch = Dispatch::with(['assignments.commercialOrder.items', 'business', 'branch', 'warehouse', 'driver', 'vehicle'])->findOrFail($dispatchId);
        app(ReferralGuideService::class)->prepareForDispatch($dispatch);
        app(DispatchService::class)->syncExitNote($dispatch->fresh(['assignments.commercialOrder.items', 'exitNote.items']));

        $this->insertRow('delivery_evidences', [
            'code' => 'EVD-DEMO-' . str_pad((string) $number, 6, '0', STR_PAD_LEFT),
            'business_id' => $context['business_id'],
            'dispatch_id' => $dispatchId,
            'commercial_order_id' => $order->id,
            'driver_id' => $driver->id,
            'recipient_name' => $order->dispatch_contact_name,
            'recipient_document_type' => 'DNI',
            'recipient_document_number' => '7000' . str_pad((string) $number, 4, '0', STR_PAD_LEFT),
            'recipient_phone' => $order->dispatch_contact_phone,
            'evidence_url' => '/images/delivery-evidence-demo.jpg',
            'evidence_notes' => 'Entrega demo conforme.',
            'delivered_at' => Carbon::parse($scheduledDate)->setTime(12, 30),
            'latitude' => $order->map_lat,
            'longitude' => $order->map_lng,
            'metadata' => json_encode(['source' => self::DEMO_MARK], JSON_UNESCAPED_SLASHES),
            'status' => true,
            'created_by' => $this->userId,
            'updated_by' => $this->userId,
        ]);

        $freshDispatch = $dispatch->fresh(['assignments.commercialOrder.items']);
        app(DispatchService::class)->syncCommercialOrderStatuses([$order->id]);

        $this->recordTracking($order->id, 'dispatch_delivered', 'Despacho entregado', 'delivered', "Despacho {$freshDispatch->code} entregado.", $dispatchId);
        $this->recordTracking($order->id, 'delivery_evidence', 'Evidencia de entrega registrada', 'delivered', 'Entrega demo conforme.', $dispatchId);
    }

    private function recordStockMovement(
        CommercialOrder $order,
        int $itemId,
        int $articleId,
        int $warehouseId,
        string $type,
        float $quantity,
        string $observations
    ): void {
        if (!Schema::hasTable('commercial_order_stock_movements')) {
            return;
        }

        $this->insertRow('commercial_order_stock_movements', [
            'commercial_order_id' => $order->id,
            'commercial_order_item_id' => $itemId,
            'business_id' => $order->business_id,
            'business_branch_id' => $order->business_branch_id,
            'warehouse_id' => $warehouseId,
            'article_id' => $articleId,
            'movement_type' => $type,
            'quantity' => $quantity,
            'reference_code' => $order->code,
            'observations' => $observations,
            'metadata' => json_encode([
                'source' => self::DEMO_MARK,
                'order_status' => $order->order_status,
                'dispatch_status' => $order->dispatch_status,
            ], JSON_UNESCAPED_SLASHES),
            'status' => true,
            'created_by' => $this->userId,
            'updated_by' => $this->userId,
        ]);
    }

    private function recordTracking(
        int $orderId,
        string $type,
        string $title,
        ?string $status = null,
        ?string $description = null,
        ?int $dispatchId = null
    ): void {
        if (!Schema::hasTable('commercial_order_tracking_events')) {
            return;
        }

        $this->insertRow('commercial_order_tracking_events', [
            'commercial_order_id' => $orderId,
            'dispatch_id' => $dispatchId,
            'event_type' => $type,
            'event_status' => $status,
            'title' => $title,
            'description' => $description,
            'happened_at' => now(),
            'metadata' => json_encode(['source' => self::DEMO_MARK], JSON_UNESCAPED_SLASHES),
            'status' => true,
            'created_by' => $this->userId,
            'updated_by' => $this->userId,
        ]);
    }

    private function totalsFromGross(float $gross): array
    {
        $subtotal = round($gross / 1.18, 2);
        $tax = round($gross - $subtotal, 2);

        return [
            'subtotal' => $subtotal,
            'tax_amount' => $tax,
            'total' => round($gross, 2),
        ];
    }

    private function firstOrInsert(string $table, array $where, array $values): object
    {
        $query = DB::table($table);
        foreach ($this->onlyExistingColumns($table, $where) as $column => $value) {
            $query->where($column, $value);
        }

        $existing = $query->first();
        if ($existing) {
            $this->updateRow($table, (int) $existing->id, array_merge($values, ['updated_by' => $this->userId]));
            return DB::table($table)->find($existing->id);
        }

        $id = $this->insertRow($table, array_merge($where, $values));
        return DB::table($table)->find($id);
    }

    private function insertRow(string $table, array $data): int
    {
        $payload = $this->withTimestamps($table, $this->onlyExistingColumns($table, $data), false);
        return (int) DB::table($table)->insertGetId($payload);
    }

    private function updateRow(string $table, int $id, array $data): void
    {
        $payload = $this->withTimestamps($table, $this->onlyExistingColumns($table, $data), true);
        if (empty($payload)) {
            return;
        }
        DB::table($table)->where('id', $id)->update($payload);
    }

    private function onlyExistingColumns(string $table, array $data): array
    {
        $columns = $this->columns($table);
        return array_intersect_key($data, array_flip($columns));
    }

    private function withTimestamps(string $table, array $data, bool $updateOnly): array
    {
        $now = now();
        $columns = $this->columns($table);
        if (in_array('updated_at', $columns, true)) {
            $data['updated_at'] = $now;
        }
        if (!$updateOnly && in_array('created_at', $columns, true)) {
            $data['created_at'] = $now;
        }

        return $data;
    }

    private function columns(string $table): array
    {
        if (!isset($this->columnsCache[$table])) {
            $this->columnsCache[$table] = Schema::getColumnListing($table);
        }
        return $this->columnsCache[$table];
    }

    private function pluckIds(string $table): array
    {
        if (!Schema::hasTable($table)) {
            return [];
        }
        return DB::table($table)->pluck('id')->map(fn($id) => (int) $id)->all();
    }

    private function resolveUserId(): ?int
    {
        return Schema::hasTable('users')
            ? (DB::table('users')->whereNotNull('status')->orderBy('id')->value('id') ?: DB::table('users')->orderBy('id')->value('id'))
            : null;
    }
}
