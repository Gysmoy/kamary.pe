<?php

namespace App\Console\Commands;

use App\Support\BusinessScope;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class SeedStorageServiceDemoCommand extends Command
{
    protected $signature = 'kamary:seed-storage-demo
        {--force : Confirma la limpieza de datos de Serv. Almacenamiento}
        {--records=10 : Registros minimos por modulo}
        {--skip-backup : Omite el backup JSON previo}';

    protected $description = 'Limpia solo Serv. Almacenamiento y crea datos demo completos para visualizar el flujo.';

    private ?int $userId = null;
    private array $columnsCache = [];

    public function handle(): int
    {
        if (!$this->option('force')) {
            $this->error('Usa --force para confirmar la limpieza de datos de Serv. Almacenamiento.');
            return self::FAILURE;
        }

        $this->assertRequiredTables();
        $this->userId = $this->resolveUserId();
        $records = max(10, (int) $this->option('records'));

        $scope = $this->storageScopeIds();
        if (!$this->option('skip-backup')) {
            $backup = $this->backupStorageData($scope);
            $this->info("Backup creado: storage/app/{$backup}");
        }

        DB::transaction(function () use ($records) {
            $this->cleanupStorageData();

            $context = $this->ensureContext();
            $units = $this->seedUnits($records);
            $clients = $this->seedClients($records);
            $products = $this->seedProducts($context, $units, $clients, $records);
            $locations = $this->seedLocations($context, $clients, $records);
            $entryRows = $this->seedEntryNotes($context, $clients, $products, $locations, $records + 2);
            $this->seedExitNotes($context, $clients, $entryRows, $records);
            $this->seedInventoryCounts($context, $clients, $entryRows, $records);
            $services = $this->seedServices($records);
            $orders = $this->seedServiceOrders($context, $clients, $services, $records);
            $this->seedBillingDocuments($context, $orders, $records);

            $this->info("Clientes storage: " . count($clients));
            $this->info("Unidades storage: " . count($units));
            $this->info("Productos storage: " . count($products));
            $this->info("Ubicaciones storage: " . count($locations));
            $this->info("Notas de entrada: " . count($entryRows));
            $this->info("Ordenes de servicio creadas: " . count($orders));
        });

        $this->info('Datos demo de Serv. Almacenamiento creados correctamente.');
        return self::SUCCESS;
    }

    private function assertRequiredTables(): void
    {
        foreach ([
            'businesses',
            'business_branches',
            'warehouses',
            'clients',
            'client_storage_tariffs',
            'client_contracts',
            'client_notifications',
            'client_distribution_networks',
            'client_delivery_addresses',
            'units',
            'laboratories',
            'active_principles',
            'articles',
            'article_presentations',
            'storage_product_lots',
            'storage_locations',
            'entry_notes',
            'entry_note_items',
            'exit_notes',
            'exit_note_items',
            'storage_inventory_counts',
            'storage_inventory_count_items',
            'services',
            'service_orders',
            'service_order_items',
            'billing_documents',
            'billing_document_items',
        ] as $table) {
            if (!Schema::hasTable($table)) {
                throw new \RuntimeException("Tabla requerida no existe: {$table}");
            }
        }
    }

    private function backupStorageData(array $scope): string
    {
        $payload = [
            'generated_at' => now()->toIso8601String(),
            'scope' => $scope,
            'tables' => [],
        ];

        $tables = [
            'clients' => $scope['client_ids'],
            'client_storage_tariffs' => $scope['tariff_ids'],
            'client_contracts' => $scope['contract_ids'],
            'client_notifications' => $scope['notification_ids'],
            'client_distribution_networks' => $scope['distribution_network_ids'],
            'client_delivery_addresses' => $scope['delivery_address_ids'],
            'units' => $scope['unit_ids'],
            'laboratories' => $scope['laboratory_ids'],
            'active_principles' => $scope['active_principle_ids'],
            'articles' => $scope['article_ids'],
            'article_presentations' => $scope['presentation_ids'],
            'storage_product_lots' => $scope['product_lot_ids'],
            'storage_locations' => $scope['location_ids'],
            'entry_notes' => $scope['entry_note_ids'],
            'entry_note_items' => $scope['entry_item_ids'],
            'exit_notes' => $scope['exit_note_ids'],
            'exit_note_items' => $scope['exit_item_ids'],
            'storage_inventory_counts' => $scope['inventory_count_ids'],
            'storage_inventory_count_items' => $scope['inventory_item_ids'],
            'services' => $scope['service_ids'],
            'service_orders' => $scope['service_order_ids'],
            'service_order_items' => $scope['service_order_item_ids'],
            'billing_documents' => $scope['billing_document_ids'],
            'billing_document_items' => $scope['billing_document_item_ids'],
            'billing_events' => $scope['billing_event_ids'],
        ];

        foreach ($tables as $table => $ids) {
            if (!Schema::hasTable($table) || empty($ids)) {
                $payload['tables'][$table] = [];
                continue;
            }

            $payload['tables'][$table] = DB::table($table)
                ->whereIn('id', $ids)
                ->get()
                ->map(fn($row) => (array) $row)
                ->all();
        }

        $path = 'storage-demo-backups/storage-service-' . now()->format('Ymd-His') . '.json';
        Storage::disk('local')->put($path, json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

        return $path;
    }

    private function cleanupStorageData(): void
    {
        $scope = $this->storageScopeIds();

        $this->deleteByIds('billing_events', $scope['billing_event_ids']);
        $this->deleteByIds('billing_document_items', $scope['billing_document_item_ids']);
        $this->deleteByIds('billing_documents', $scope['billing_document_ids']);
        $this->deleteAccountsReceivableForServiceOrders($scope['service_order_ids']);
        $this->deleteByIds('service_order_items', $scope['service_order_item_ids']);
        $this->deleteByIds('service_orders', $scope['service_order_ids']);
        $this->deleteByIds('storage_inventory_count_items', $scope['inventory_item_ids']);
        $this->deleteByIds('storage_inventory_counts', $scope['inventory_count_ids']);
        $this->deleteByIds('exit_note_items', $scope['exit_item_ids']);
        $this->deleteByIds('exit_notes', $scope['exit_note_ids']);
        $this->deleteByIds('entry_note_items', $scope['entry_item_ids']);
        $this->deleteByIds('entry_notes', $scope['entry_note_ids']);
        $this->deleteByIds('storage_product_lots', $scope['product_lot_ids']);
        $this->deleteByIds('article_presentations', $scope['presentation_ids']);
        $this->deleteByIds('articles', $scope['article_ids']);
        $this->deleteByIds('client_notifications', $scope['notification_ids']);
        $this->deleteByIds('client_contracts', $scope['contract_ids']);
        $this->deleteByIds('client_storage_tariffs', $scope['tariff_ids']);
        $this->deleteByIds('client_delivery_addresses', $scope['delivery_address_ids']);
        $this->deleteByIds('client_distribution_networks', $scope['distribution_network_ids']);
        $this->deleteByIds('clients', $scope['client_ids']);
        $this->deleteByIds('storage_locations', $scope['location_ids']);
        $this->deleteByIds('active_principles', $scope['active_principle_ids']);
        $this->deleteByIds('laboratories', $scope['laboratory_ids']);
        $this->deleteByIds('services', $scope['service_ids']);
        $this->deleteByIds('units', $scope['unit_ids']);
    }

    private function storageScopeIds(): array
    {
        $clientIds = $this->storageClientIds();
        $articleIds = $this->storageArticleIds($clientIds);
        $entryNoteIds = $this->storageEntryNoteIds($clientIds, $articleIds);
        $exitNoteIds = $this->storageExitNoteIds($clientIds, $articleIds);
        $serviceOrderIds = $this->storageServiceOrderIds($clientIds);
        $billingDocumentIds = $this->storageBillingDocumentIds($serviceOrderIds);
        $laboratoryIds = $this->idsFromQuery(
            DB::table('laboratories')->where('code', 'like', 'STG-LAB-%')
        );

        return [
            'client_ids' => $clientIds,
            'tariff_ids' => $this->idsFromQuery(DB::table('client_storage_tariffs')->whereIn('client_id', $clientIds)),
            'contract_ids' => $this->idsFromQuery(DB::table('client_contracts')->whereIn('client_id', $clientIds)),
            'notification_ids' => $this->idsFromQuery(DB::table('client_notifications')->whereIn('client_id', $clientIds)),
            'delivery_address_ids' => Schema::hasTable('client_delivery_addresses')
                ? $this->idsFromQuery(DB::table('client_delivery_addresses')->whereIn('client_id', $clientIds))
                : [],
            'distribution_network_ids' => Schema::hasTable('client_distribution_networks')
                ? $this->idsFromQuery(DB::table('client_distribution_networks')->whereIn('client_id', $clientIds))
                : [],
            'unit_ids' => $this->idsFromQuery(
                DB::table('units')->where(function ($query) {
                    if (Schema::hasColumn('units', 'module_scope')) {
                        $query->where('module_scope', 'storage');
                    }
                    $query->orWhere('symbol', 'like', 'STG-%');
                })
            ),
            'laboratory_ids' => $laboratoryIds,
            'active_principle_ids' => $this->idsFromQuery(DB::table('active_principles')->whereIn('laboratory_id', $laboratoryIds)),
            'article_ids' => $articleIds,
            'presentation_ids' => $this->idsFromQuery(DB::table('article_presentations')->whereIn('article_id', $articleIds)),
            'product_lot_ids' => $this->idsFromQuery(DB::table('storage_product_lots')->whereIn('article_id', $articleIds)),
            'location_ids' => $this->idsFromQuery(DB::table('storage_locations')),
            'entry_note_ids' => $entryNoteIds,
            'entry_item_ids' => $this->idsFromQuery(DB::table('entry_note_items')->whereIn('entry_note_id', $entryNoteIds)),
            'exit_note_ids' => $exitNoteIds,
            'exit_item_ids' => $this->idsFromQuery(DB::table('exit_note_items')->whereIn('exit_note_id', $exitNoteIds)),
            'inventory_count_ids' => $this->idsFromQuery(DB::table('storage_inventory_counts')),
            'inventory_item_ids' => $this->idsFromQuery(DB::table('storage_inventory_count_items')),
            'service_ids' => $this->idsFromQuery(
                DB::table('services')->where(function ($query) {
                    if (Schema::hasColumn('services', 'service_scope')) {
                        $query->where('service_scope', 'storage_general');
                    }
                    $query->orWhere('code', 'like', 'STG-SER-%')
                        ->orWhere('code', 'like', 'STORAGE-SER-%')
                        ->orWhereIn('code', ['STORAGE-SERVICE', 'STORAGE-SERVICE-ADD']);
                })
            ),
            'service_order_ids' => $serviceOrderIds,
            'service_order_item_ids' => $this->idsFromQuery(DB::table('service_order_items')->whereIn('service_order_id', $serviceOrderIds)),
            'billing_document_ids' => $billingDocumentIds,
            'billing_document_item_ids' => $this->idsFromQuery(DB::table('billing_document_items')->whereIn('billing_document_id', $billingDocumentIds)),
            'billing_event_ids' => Schema::hasTable('billing_events')
                ? $this->idsFromQuery(DB::table('billing_events')->whereIn('billing_document_id', $billingDocumentIds))
                : [],
        ];
    }

    private function storageClientIds(): array
    {
        $query = DB::table('clients')->where(function ($scope) {
            if (Schema::hasColumn('clients', 'module_scope')) {
                $scope->where('module_scope', 'storage');
            }
            if (Schema::hasColumn('clients', 'has_storage_service')) {
                $scope->orWhere('has_storage_service', true);
            }
            if (Schema::hasColumn('clients', 'storage_tariff_enabled')) {
                $scope->orWhere('storage_tariff_enabled', true);
            }
            $scope->orWhere('full_name', 'like', 'Cliente Almacenamiento Demo%')
                ->orWhere(function ($demo) {
                    $demo->where('document_number', 'like', '20609%')
                        ->where('full_name', 'like', 'Cliente Almacenamiento Demo%');
                });
        });

        return $this->idsFromQuery($query);
    }

    private function storageArticleIds(array $clientIds): array
    {
        $query = DB::table('articles')->where(function ($scope) use ($clientIds) {
            if (Schema::hasColumn('articles', 'module_scope')) {
                $scope->where('module_scope', 'storage');
            }
            if (Schema::hasColumn('articles', 'client_id') && !empty($clientIds)) {
                $scope->orWhereIn('client_id', $clientIds);
            }
            $scope->orWhere('code', 'like', 'STG-ART-%');
        });

        return $this->idsFromQuery($query);
    }

    private function storageEntryNoteIds(array $clientIds, array $articleIds): array
    {
        $query = DB::table('entry_notes')->where(function ($scope) use ($clientIds, $articleIds) {
            $scope->where('code', 'like', 'NE-STG-%')
                ->orWhere('document_series', 'STG');
            if (!empty($clientIds) && Schema::hasColumn('entry_notes', 'client_id')) {
                $scope->orWhereIn('client_id', $clientIds);
            }
            if (!empty($articleIds)) {
                $scope->orWhereIn('id', function ($subquery) use ($articleIds) {
                    $subquery->select('entry_note_id')
                        ->from('entry_note_items')
                        ->whereIn('article_id', $articleIds);
                });
            }
        });

        return $this->idsFromQuery($query);
    }

    private function storageExitNoteIds(array $clientIds, array $articleIds): array
    {
        $query = DB::table('exit_notes')->where(function ($scope) use ($clientIds, $articleIds) {
            $scope->where('code', 'like', 'NS-STG-%')
                ->orWhere('document_series', 'STG');
            if (!empty($clientIds) && Schema::hasColumn('exit_notes', 'client_id')) {
                $scope->orWhereIn('client_id', $clientIds);
            }
            if (!empty($articleIds)) {
                $scope->orWhereIn('id', function ($subquery) use ($articleIds) {
                    $subquery->select('exit_note_id')
                        ->from('exit_note_items')
                        ->whereIn('article_id', $articleIds);
                });
            }
        });

        return $this->idsFromQuery($query);
    }

    private function storageServiceOrderIds(array $clientIds): array
    {
        $query = DB::table('service_orders')->where(function ($scope) use ($clientIds) {
            if (Schema::hasColumn('service_orders', 'order_type')) {
                $scope->whereIn('order_type', ['storage_service', 'storage_general']);
            }
            if (!empty($clientIds)) {
                $scope->orWhereIn('client_id', $clientIds);
            }
            $scope->orWhere('code', 'like', 'OSA-DEMO-%')
                ->orWhere('code', 'like', 'OSG-DEMO-%');
        });

        return $this->idsFromQuery($query);
    }

    private function storageBillingDocumentIds(array $serviceOrderIds): array
    {
        $query = DB::table('billing_documents')->where(function ($scope) use ($serviceOrderIds) {
            $scope->where('code', 'like', 'FAC-STG-%');
            if (!empty($serviceOrderIds)) {
                $scope->orWhereIn('service_order_id', $serviceOrderIds)
                    ->orWhere(function ($source) use ($serviceOrderIds) {
                        $source->where('source_type', 'service_order')->whereIn('source_id', $serviceOrderIds);
                    });
            }
        });

        return $this->idsFromQuery($query);
    }

    private function ensureContext(): array
    {
        $business = DB::table('businesses')
            ->when(Schema::hasColumn('businesses', 'business_key'), fn($query) => $query->where('business_key', BusinessScope::KAMARY_MEDICALS))
            ->first();

        if (!$business) {
            $businessId = $this->insertRow('businesses', [
                'business_key' => BusinessScope::KAMARY_MEDICALS,
                'name' => 'Kamary Medicals',
                'trade_name' => 'Kamary Medicals',
                'tax_number' => '20609000000',
                'description' => 'Empresa para servicios de almacenamiento.',
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);
            $business = DB::table('businesses')->find($businessId);
        }

        $this->updateRow('businesses', (int) $business->id, [
            'business_key' => BusinessScope::KAMARY_MEDICALS,
            'name' => $business->name ?: 'Kamary Medicals',
            'trade_name' => $business->trade_name ?? $business->name ?? 'Kamary Medicals',
            'tax_number' => $business->tax_number ?? '20609000000',
            'description' => $business->description ?? 'Empresa para servicios de almacenamiento.',
            'status' => true,
            'updated_by' => $this->userId,
        ]);
        $business = DB::table('businesses')->find($business->id);

        $branch = DB::table('business_branches')
            ->where('business_id', $business->id)
            ->where('name', 'Principal')
            ->first();

        if (!$branch) {
            $branchId = $this->insertRow('business_branches', [
                'business_id' => $business->id,
                'name' => 'Principal',
                'establishment_code' => '0001',
                'ubigeo' => '150101',
                'address' => 'Av. Argentina 3000, Callao',
                'series_factura' => 'F001',
                'series_boleta' => 'B001',
                'series_guia' => 'T001',
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);
            $branch = DB::table('business_branches')->find($branchId);
        } else {
            $this->updateRow('business_branches', (int) $branch->id, [
                'status' => true,
                'establishment_code' => $branch->establishment_code ?? '0001',
                'ubigeo' => $branch->ubigeo ?? '150101',
                'address' => $branch->address ?? 'Av. Argentina 3000, Callao',
                'series_guia' => $branch->series_guia ?? 'T001',
                'updated_by' => $this->userId,
            ]);
        }

        $warehouse = DB::table('warehouses')
            ->where('business_branch_id', $branch->id)
            ->where('name', 'Almacen Principal - Principal')
            ->first();

        if (!$warehouse) {
            $warehouseId = $this->insertRow('warehouses', [
                'business_branch_id' => $branch->id,
                'name' => 'Almacen Principal - Principal',
                'description' => 'Almacen principal para servicio de almacenamiento.',
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
            'warehouse_name' => (string) $warehouse->name,
        ];
    }

    private function seedUnits(int $records): array
    {
        $specs = [
            ['STG-UND', 'Unidad'],
            ['STG-CAJ', 'Caja'],
            ['STG-BLI', 'Blister'],
            ['STG-PAL', 'Pallet'],
            ['STG-BUL', 'Bulto'],
            ['STG-PQT', 'Paquete'],
            ['STG-FCO', 'Frasco'],
            ['STG-BID', 'Bidon'],
            ['STG-ROL', 'Rollo'],
            ['STG-CNT', 'Contenedor'],
        ];

        $units = [];
        foreach (array_slice($specs, 0, $records) as $spec) {
            $units[$spec[0]] = $this->firstOrInsert('units', ['symbol' => $spec[0]], [
                'module_scope' => 'storage',
                'name' => $spec[1],
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);
        }

        return $units;
    }

    private function seedClients(int $records): array
    {
        $districts = ['Callao', 'San Luis', 'Ate', 'Lurin', 'Villa El Salvador', 'San Isidro', 'Los Olivos', 'Surquillo', 'Chorrillos', 'Comas'];
        $temperatures = ['15°C a 25°C', '2°C a 8°C', '-15°C a -25°C', '-15°C a -40°C'];

        $clients = [];
        for ($index = 1; $index <= $records; $index++) {
            $client = $this->insertRowAndFetch('clients', [
                'document_type' => 'RUC',
                'document_number' => '20609' . str_pad((string) $index, 6, '0', STR_PAD_LEFT),
                'client_kind' => 'regular',
                'module_scope' => 'storage',
                'full_name' => 'Cliente Almacenamiento Demo ' . str_pad((string) $index, 2, '0', STR_PAD_LEFT) . ' SAC',
                'is_platform' => false,
                'has_storage_service' => true,
                'storage_tariff_enabled' => true,
                'contract_due_days' => 12 + ($index % 8),
                'commercial_channel' => 'Almacenamiento',
                'segment' => $index % 2 === 0 ? 'Farmaceutico' : 'Consumo masivo',
                'email' => "almacenamiento.demo{$index}@kamary.pe",
                'billing_email' => "facturacion.storage{$index}@kamary.pe",
                'primary_contact' => 'Contacto Storage ' . str_pad((string) $index, 2, '0', STR_PAD_LEFT),
                'primary_contact_phone' => '94' . str_pad((string) $index, 7, '0', STR_PAD_LEFT),
                'phone' => '94' . str_pad((string) $index, 7, '0', STR_PAD_LEFT),
                'phone_prefix' => '+51',
                'short_code' => 'STC' . str_pad((string) $index, 3, '0', STR_PAD_LEFT),
                'ubigeo' => '150101',
                'full_address' => 'Av. Industrial ' . (100 + $index) . ', ' . $districts[($index - 1) % count($districts)],
                'fiscal_address' => 'Av. Industrial ' . (100 + $index) . ', ' . $districts[($index - 1) % count($districts)],
                'department' => 'Lima',
                'province' => 'Lima',
                'district' => $districts[($index - 1) % count($districts)],
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);

            $this->insertRow('client_storage_tariffs', [
                'client_id' => $client->id,
                'temperature_range' => $temperatures[($index - 1) % count($temperatures)],
                'currency' => 'PEN',
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);

            $contractCode = 'CTR-STG-' . str_pad((string) $index, 4, '0', STR_PAD_LEFT);
            $contractStartsAt = now()->subDays(30 + $index)->toDateString();
            $contractEndsAt = now()->addMonths(12)->addDays($index)->toDateString();
            $contractFileName = 'contrato-storage-demo-' . $index . '.pdf';
            $contractFilePath = $this->ensureDemoContractFile($index, $contractCode, $contractStartsAt, $contractEndsAt);

            $this->insertRow('client_contracts', [
                'client_id' => $client->id,
                'contract_code' => $contractCode,
                'starts_at' => $contractStartsAt,
                'ends_at' => $contractEndsAt,
                'file_name' => $contractFileName,
                'file_path' => $contractFilePath,
                'file_mime' => 'application/pdf',
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);

            $this->insertRow('client_notifications', [
                'client_id' => $client->id,
                'notification_key' => 'storage_invoice_notification',
                'notification_name' => 'Envio de facturas storage',
                'to_emails' => "facturacion.storage{$index}@kamary.pe",
                'cc_emails' => "operaciones.storage{$index}@kamary.pe",
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);

            $clients[] = $client;
        }

        return $clients;
    }

    private function seedProducts(array $context, array $units, array $clients, int $records): array
    {
        $products = [
            ['Vacuna antigripal tetravalente 0.5ml', 'BIOPHARMA', 'Vacuna inactivada', 'STG-UND', '2C a 8C', 18.50],
            ['Insulina glargina 100UI/ml lapicero', 'INSUMED', 'Insulina glargina', 'STG-UND', '2C a 8C', 42.00],
            ['Reactivo glucosa GOD-PAP 500ml', 'LABCONTROL', 'Reactivo diagnostico', 'STG-FCO', '2C a 8C', 75.00],
            ['Cateter intravenoso 22G', 'MEDSUPPLY', 'Material medico', 'STG-UND', '15C a 25C', 1.80],
            ['Guantes nitrilo azul talla M caja x 100', 'SAFEHAND', 'Nitrilo', 'STG-CAJ', '15C a 25C', 28.00],
            ['Mascarilla KN95 caja x 20', 'PROTECTA', 'Filtro respiratorio', 'STG-CAJ', '15C a 25C', 12.00],
            ['Paracetamol 500mg tableta', 'FARMAUNO', 'Paracetamol', 'STG-BLI', '15C a 25C', 0.35],
            ['Omeprazol 20mg capsula', 'GASTROMED', 'Omeprazol', 'STG-BLI', '15C a 25C', 0.45],
            ['Suero fisiologico 0.9% 1L', 'SOLUFARMA', 'Cloruro de sodio', 'STG-UND', '15C a 25C', 4.80],
            ['Panales adulto talla M paquete x 10', 'CUIDAMAS', 'Higiene adulto', 'STG-PQT', '15C a 25C', 21.90],
        ];

        $records = min($records, count($products));
        $seeded = [];
        for ($index = 1; $index <= $records; $index++) {
            $spec = $products[$index - 1];
            $lab = $this->firstOrInsert('laboratories', ['code' => 'STG-LAB-' . str_pad((string) $index, 2, '0', STR_PAD_LEFT)], [
                'name' => $spec[1],
                'country' => 'Peru',
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);
            $principle = $this->firstOrInsert('active_principles', [
                'laboratory_id' => $lab->id,
                'name' => $spec[2],
            ], [
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);

            $unit = $units[$spec[3]] ?? reset($units);
            $client = $clients[($index - 1) % count($clients)];
            $article = $this->insertRowAndFetch('articles', [
                'code' => 'STG-ART-' . str_pad((string) $index, 6, '0', STR_PAD_LEFT),
                'module_scope' => 'storage',
                'business_id' => $context['business_id'],
                'client_id' => $client->id,
                'name' => $spec[0],
                'laboratory_id' => $lab->id,
                'active_principle_id' => $principle->id,
                'unit_id' => $unit->id,
                'volume' => 1,
                'status' => true,
                'margin_rule' => false,
                'igv_rule' => true,
                'units_per_article' => 1,
                'unit_weight' => round(0.05 + ($index * 0.03), 4),
                'stock_has_expiration' => true,
                'stock_has_lot' => true,
                'cost_price' => $spec[5],
                'sale_price' => round($spec[5] * 1.35, 2),
                'purchase_price_national' => $spec[5],
                'sale_price_national' => round($spec[5] * 1.35, 4),
                'notes' => 'Producto demo de servicio de almacenamiento.',
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);

            $this->seedPresentationsForProduct((int) $article->id, $spec[5], $spec[3]);
            $this->insertRow('storage_product_lots', [
                'article_id' => $article->id,
                'lot' => 'LOT-STG-' . str_pad((string) $index, 4, '0', STR_PAD_LEFT),
                'expiration_date' => now()->addMonths(9 + $index)->toDateString(),
                'storage_condition' => $spec[4],
                'manufacturer_id' => $lab->id,
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);

            $seeded[] = [
                'article' => $article,
                'client' => $client,
                'unit' => $unit,
                'manufacturer_id' => (int) $lab->id,
                'lot' => 'LOT-STG-' . str_pad((string) $index, 4, '0', STR_PAD_LEFT),
                'expiration_date' => now()->addMonths(9 + $index)->toDateString(),
                'condition' => $spec[4],
                'cost' => $spec[5],
            ];
        }

        return $seeded;
    }

    private function seedPresentationsForProduct(int $articleId, float $baseCost, string $unitSymbol): void
    {
        $presentations = $unitSymbol === 'STG-BLI'
            ? [['UNIDAD', 1, $baseCost], ['BLISTER', 10, $baseCost * 10], ['CAJA', 100, $baseCost * 100]]
            : [['UNIDAD', 1, $baseCost], ['CAJA', 12, $baseCost * 12], ['PALLET', 240, $baseCost * 240]];

        foreach ($presentations as $index => $presentation) {
            $this->insertRow('article_presentations', [
                'article_id' => $articleId,
                'name' => $presentation[0],
                'units' => $presentation[1],
                'price' => round($presentation[2] * 1.35, 4),
                'purchase_price_national' => round($presentation[2], 4),
                'purchase_price_foreign' => null,
                'sort_order' => $index + 1,
                'status' => true,
            ]);
        }
    }

    private function seedLocations(array $context, array $clients, int $records): array
    {
        $temperatures = ['15C a 25C', '2C a 8C', '-15C a -25C', '-15C a -40C'];
        $locations = [];

        for ($index = 1; $index <= $records + 2; $index++) {
            $zone = chr(64 + (int) ceil($index / 4));
            $code = $zone . '-01-' . str_pad((string) (((($index - 1) % 4) + 1)), 2, '0', STR_PAD_LEFT);
            $locations[] = $this->insertRowAndFetch('storage_locations', [
                'warehouse_id' => $context['warehouse_id'],
                'client_id' => $clients[($index - 1) % count($clients)]->id,
                'code' => $code,
                'temperature_range' => $temperatures[($index - 1) % count($temperatures)],
                'service_order_code' => 'OSA-DEMO-' . str_pad((string) min($index, 10), 6, '0', STR_PAD_LEFT),
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);
        }

        return $locations;
    }

    private function seedEntryNotes(array $context, array $clients, array $products, array $locations, int $records): array
    {
        $rows = [];
        for ($index = 1; $index <= $records; $index++) {
            $product = $products[($index - 1) % count($products)];
            $client = $product['client'] ?? $clients[($index - 1) % count($clients)];
            $location = $locations[($index - 1) % count($locations)];
            $quantity = 80 + ($index * 7);
            $status = $index <= 10 ? 'approved' : ($index === 11 ? 'pending' : 'cancelled');
            $isActive = $status !== 'cancelled';
            $date = now()->subDays(18 - min($index, 18))->toDateString();

            $entry = $this->insertRowAndFetch('entry_notes', [
                'code' => 'NE-STG-' . str_pad((string) $index, 6, '0', STR_PAD_LEFT),
                'business_id' => $context['business_id'],
                'business_branch_id' => $context['branch_id'],
                'warehouse_id' => $context['warehouse_id'],
                'supplier_id' => null,
                'client_id' => $client->id,
                'provider_distributor' => 'Transporte Storage Demo',
                'entry_date' => $date,
                'document_type' => $index % 2 === 0 ? 'Factura' : 'Guia',
                'document_series' => 'STG',
                'document_sequence' => str_pad((string) $index, 8, '0', STR_PAD_LEFT),
                'document_date' => $date,
                'invoice_type' => 'Factura',
                'invoice_series' => 'FSTG',
                'invoice_sequence' => str_pad((string) $index, 8, '0', STR_PAD_LEFT),
                'invoice_date' => $date,
                'transport_agency' => 'Transportes Lima Storage',
                'driver_name' => 'Chofer Storage ' . str_pad((string) $index, 2, '0', STR_PAD_LEFT),
                'driver_license' => 'LIC-STG-' . str_pad((string) $index, 5, '0', STR_PAD_LEFT),
                'vehicle_plate' => 'STG' . str_pad((string) $index, 3, '0', STR_PAD_LEFT),
                'currency' => 'PEN',
                'observations' => 'Ingreso demo de almacenamiento.',
                'guide_series' => 'T001',
                'guide_sequence' => str_pad((string) $index, 8, '0', STR_PAD_LEFT),
                'guide_ruc' => '20609000000',
                'entry_status' => $status,
                'status' => $isActive,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);

            $item = $this->insertRowAndFetch('entry_note_items', [
                'entry_note_id' => $entry->id,
                'batch_code' => $product['lot'],
                'lot' => $product['lot'],
                'expiration_date' => $product['expiration_date'],
                'storage_condition' => $product['condition'],
                'manufacturer_id' => $product['manufacturer_id'],
                'article_id' => $product['article']->id,
                'warehouse_id' => $context['warehouse_id'],
                'stock' => 0,
                'cost_unit' => $product['cost'],
                'location' => $location->code,
                'requested_quantity' => $quantity,
                'received_quantity' => $quantity,
                'quantity' => $quantity,
                'total' => round($quantity * $product['cost'], 2),
                'status' => true,
            ]);

            $rows[] = [
                'entry' => $entry,
                'item' => $item,
                'product' => $product,
                'client' => $client,
                'location' => $location,
                'quantity' => $quantity,
                'available' => $status === 'approved' && $isActive ? $quantity : 0,
            ];
        }

        return $rows;
    }

    private function seedExitNotes(array $context, array $clients, array $entryRows, int $records): void
    {
        for ($index = 1; $index <= $records; $index++) {
            $entryRow = $entryRows[($index - 1) % 10];
            $quantity = min(12 + $index, max(1, (float) $entryRow['available'] - 5));
            $status = $index <= 7 ? 'approved' : ($index <= 9 ? 'pending' : 'cancelled');
            $isActive = $status !== 'cancelled';
            $date = now()->subDays(10 - min($index, 10))->toDateString();

            $exit = $this->insertRowAndFetch('exit_notes', [
                'code' => 'NS-STG-' . str_pad((string) $index, 6, '0', STR_PAD_LEFT),
                'business_id' => $context['business_id'],
                'business_branch_id' => $context['branch_id'],
                'warehouse_id' => $context['warehouse_id'],
                'client_id' => $entryRow['client']->id,
                'client_name' => $entryRow['client']->full_name,
                'motives' => json_encode(['Despacho a cliente final'], JSON_UNESCAPED_SLASHES),
                'exit_date' => $date,
                'document_type' => $index % 2 === 0 ? 'Guia' : 'Orden interna',
                'document_series' => 'STG',
                'document_sequence' => str_pad((string) $index, 8, '0', STR_PAD_LEFT),
                'document_date' => $date,
                'observations' => 'Salida demo de almacenamiento.',
                'exit_status' => $status,
                'status' => $isActive,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);

            $this->insertRow('exit_note_items', [
                'exit_note_id' => $exit->id,
                'batch_code' => $entryRow['product']['lot'],
                'article_id' => $entryRow['product']['article']->id,
                'warehouse_id' => $context['warehouse_id'],
                'stock' => $entryRow['available'],
                'expiration_date' => $entryRow['product']['expiration_date'],
                'location' => $entryRow['location']->code,
                'destination_location' => 'Cliente final',
                'quantity' => $quantity,
                'total' => $quantity,
                'status' => true,
            ]);
        }
    }

    private function seedInventoryCounts(array $context, array $clients, array $entryRows, int $records): void
    {
        $statuses = ['En espera', 'Sin diferencias', 'Con diferencias', 'Aplicado'];

        for ($index = 1; $index <= $records; $index++) {
            $entryRow = $entryRows[($index - 1) % 10];
            $systemStock = max(1, (float) $entryRow['available'] - (12 + $index));
            $realStock = match ($statuses[($index - 1) % count($statuses)]) {
                'Con diferencias' => max(0, $systemStock - 2),
                'Aplicado' => $systemStock + 1,
                default => $systemStock,
            };

            $count = $this->insertRowAndFetch('storage_inventory_counts', [
                'code' => 'AI-STG-' . str_pad((string) $index, 6, '0', STR_PAD_LEFT),
                'business_branch_id' => $context['branch_id'],
                'warehouse_id' => $context['warehouse_id'],
                'client_id' => $entryRow['client']->id,
                'location' => $entryRow['location']->code,
                'count_date' => now()->subDays(5 - min($index, 5))->toDateString(),
                'inventory_status' => $statuses[($index - 1) % count($statuses)],
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);

            $this->insertRow('storage_inventory_count_items', [
                'storage_inventory_count_id' => $count->id,
                'source_key' => 'entry-' . $entryRow['item']->id,
                'article_id' => $entryRow['product']['article']->id,
                'warehouse_id' => $context['warehouse_id'],
                'lot' => $entryRow['product']['lot'],
                'expiration_date' => $entryRow['product']['expiration_date'],
                'article_name' => $entryRow['product']['article']->name,
                'client_name' => $entryRow['client']->full_name,
                'unit_label' => $entryRow['product']['unit']->symbol,
                'location' => $entryRow['location']->code,
                'temperature_range' => $entryRow['product']['condition'],
                'system_stock' => $systemStock,
                'real_stock' => $realStock,
                'difference' => round($realStock - $systemStock, 3),
                'status' => true,
            ]);
        }
    }

    private function seedServices(int $records): array
    {
        $specs = [
            ['Almacenamiento mensual seco', 'Almacenamiento', 'Mensual', 'Mes', 350.00],
            ['Almacenamiento refrigerado 2C a 8C', 'Almacenamiento', 'Refrigerado', 'Mes', 680.00],
            ['Almacenamiento congelado', 'Almacenamiento', 'Congelado', 'Mes', 920.00],
            ['Picking por pedido', 'Operacion', 'Picking', 'Pedido', 8.50],
            ['Packing y embalaje', 'Operacion', 'Packing', 'Pedido', 6.20],
            ['Etiquetado unitario', 'Valor agregado', 'Etiquetado', 'Unidad', 0.35],
            ['Inventario ciclico', 'Inventario', 'Conteo', 'Servicio', 120.00],
            ['Cross docking', 'Operacion', 'Cross docking', 'Bulto', 4.80],
            ['Manipuleo especial', 'Operacion', 'Manipuleo', 'Hora', 55.00],
            ['Control documentario', 'Administrativo', 'Documentacion', 'Documento', 12.00],
        ];

        $services = [];
        for ($index = 1; $index <= min($records, count($specs)); $index++) {
            $spec = $specs[$index - 1];
            $services[] = $this->insertRowAndFetch('services', [
                'code' => 'STG-SER-' . str_pad((string) $index, 6, '0', STR_PAD_LEFT),
                'service_scope' => 'storage_general',
                'name' => $spec[0],
                'category' => $spec[1],
                'subcategory' => $spec[2],
                'service_type' => $spec[2],
                'billing_unit' => $spec[3],
                'unit_price_pen' => $spec[4],
                'unit_price_usd' => round($spec[4] / 3.7, 2),
                'applicable_zone' => 'Lima',
                'linked_vehicle_type' => null,
                'commissions_enabled' => $index % 3 === 0,
                'observations' => 'Servicio demo para almacenamiento.',
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);
        }

        return $services;
    }

    private function seedServiceOrders(array $context, array $clients, array $services, int $records): array
    {
        $orders = [];
        $statuses = ['draft', 'approved', 'scheduled', 'executing', 'prefactured', 'invoiced', 'closed', 'cancelled', 'approved', 'scheduled'];
        $billingStatuses = ['pending', 'pending', 'partial', 'partial', 'pending', 'billed', 'billed', 'cancelled', 'partial', 'pending'];

        foreach (['storage_service' => 'OSA-DEMO', 'storage_general' => 'OSG-DEMO'] as $orderType => $prefix) {
            for ($index = 1; $index <= $records; $index++) {
                $service = $services[($index - 1) % count($services)];
                $quantity = 1 + ($index % 4);
                $unitPrice = (float) $service->unit_price_pen;
                $subtotal = round($quantity * $unitPrice, 2);
                $tax = $index % 2 === 0 ? round($subtotal * 0.18, 2) : 0;
                $total = round($subtotal + $tax, 2);
                $paid = in_array($billingStatuses[$index - 1], ['billed'], true) ? $total : ($index % 3 === 0 ? round($total / 2, 2) : 0);
                $code = $prefix . '-' . str_pad((string) $index, 6, '0', STR_PAD_LEFT);
                $date = now()->subDays(20 - min($index, 20))->toDateString();

                $order = $this->insertRowAndFetch('service_orders', [
                    'code' => $code,
                    'order_type' => $orderType,
                    'business_id' => $context['business_id'],
                    'business_branch_id' => $context['branch_id'],
                    'client_id' => $clients[($index - 1) % count($clients)]->id,
                    'seller_id' => $this->userId,
                    'expected_document_type' => $index % 2 === 0 ? 'Boleta' : 'Factura',
                    'currency' => 'PEN',
                    'billing_cycle' => $orderType === 'storage_service' ? 'Mensual' : 'Por servicio',
                    'contract_label' => 'Contrato Storage Demo ' . str_pad((string) $index, 2, '0', STR_PAD_LEFT),
                    'payment_condition' => $index % 2 === 0 ? 'Credito' : 'Contado',
                    'installments' => $index % 2 === 0 ? 2 : 1,
                    'billing_day' => 25,
                    'detraction_enabled' => $index % 4 === 0,
                    'issue_date' => $date,
                    'scheduled_at' => now()->addDays($index)->toDateString(),
                    'first_due_date' => now()->addDays(7 + $index)->toDateString(),
                    'order_status' => $statuses[$index - 1],
                    'billing_status' => $billingStatuses[$index - 1],
                    'subtotal' => $subtotal,
                    'tax_amount' => $tax,
                    'total' => $total,
                    'paid_amount' => $paid,
                    'balance_amount' => round(max(0, $total - $paid), 2),
                    'payment_status' => $paid >= $total ? 'paid' : ($paid > 0 ? 'partial' : 'pending'),
                    'billed_at' => $billingStatuses[$index - 1] === 'billed' ? now() : null,
                    'observations' => 'Orden demo de servicio de almacenamiento.',
                    'status' => $statuses[$index - 1] === 'cancelled' ? false : true,
                    'created_by' => $this->userId,
                    'updated_by' => $this->userId,
                ]);

                $this->insertRow('service_order_items', [
                    'service_order_id' => $order->id,
                    'service_id' => $service->id,
                    'scope' => $orderType === 'storage_service' ? 'Almacenamiento recurrente' : 'Servicio puntual',
                    'gloss' => "{$service->name} para {$order->code}",
                    'description' => $orderType === 'storage_service'
                        ? "{$service->name}; almacen principal; {$date}; 3 meses"
                        : "{$service->name}; servicio general",
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'detraction_percent' => $index % 4 === 0 ? 12 : 0,
                    'commission_percent' => $index % 3 === 0 ? 5 : 0,
                    'total' => $subtotal,
                    'status' => true,
                ]);

                $orders[] = $order;
            }
        }

        return $orders;
    }

    private function seedBillingDocuments(array $context, array $orders, int $records): void
    {
        $localStatuses = ['pending', 'sent', 'accepted', 'observed', 'rejected', 'cancelled', 'pending', 'accepted', 'sent', 'pending'];
        $externalStatuses = ['draft', 'sent', 'accepted', 'observed', 'rejected', 'cancelled', 'draft', 'accepted', 'sent', 'draft'];

        for ($index = 1; $index <= $records; $index++) {
            $order = $orders[($index - 1) % count($orders)];
            $issueDate = Carbon::parse($order->issue_date ?: now())->addDays(2)->toDateString();
            $localStatus = $localStatuses[$index - 1];
            $total = (float) $order->total;

            $document = $this->insertRowAndFetch('billing_documents', [
                'code' => 'PF' . str_pad((string) (7750 + $index), 5, '0', STR_PAD_LEFT),
                'source_type' => 'service_order',
                'source_id' => $order->id,
                'service_order_id' => $order->id,
                'business_id' => $context['business_id'],
                'business_branch_id' => $context['branch_id'],
                'warehouse_id' => null,
                'client_id' => $order->client_id,
                'provider' => 'facturadorpro5',
                'document_type' => $order->expected_document_type ?: 'Factura',
                'series' => $order->expected_document_type === 'Boleta' ? 'B001' : 'F001',
                'sequence' => str_pad((string) $index, 8, '0', STR_PAD_LEFT),
                'issue_date' => $issueDate,
                'due_date' => Carbon::parse($issueDate)->addDays(7)->toDateString(),
                'currency' => $order->currency ?: 'PEN',
                'payment_condition' => $order->payment_condition ?: 'Contado',
                'payment_method' => 'Transferencia',
                'provider_mode' => 'demo',
                'local_status' => $localStatus,
                'external_status' => $externalStatuses[$index - 1],
                'external_id' => in_array($localStatus, ['sent', 'accepted', 'observed', 'rejected'], true) ? 'EXT-STG-' . $index : null,
                'external_reference' => in_array($localStatus, ['accepted'], true) ? 'SUNAT-STG-' . $index : null,
                'provider_endpoint' => null,
                'subtotal' => (float) $order->subtotal,
                'tax_amount' => (float) $order->tax_amount,
                'total' => $total,
                'sent_at' => in_array($localStatus, ['sent', 'accepted', 'observed', 'rejected'], true) ? now() : null,
                'accepted_at' => $localStatus === 'accepted' ? now() : null,
                'cancelled_at' => $localStatus === 'cancelled' ? now() : null,
                'metadata' => json_encode([
                    'source_code' => $order->code,
                    'document_origin' => 'storage_demo_seed',
                ], JSON_UNESCAPED_SLASHES),
                'observations' => 'Documento demo de control de facturacion storage.',
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);

            $serviceItem = DB::table('service_order_items')->where('service_order_id', $order->id)->first();
            $this->insertRow('billing_document_items', [
                'billing_document_id' => $document->id,
                'service_order_item_id' => $serviceItem?->id,
                'item_type' => 'service',
                'item_code' => $serviceItem ? (DB::table('services')->where('id', $serviceItem->service_id)->value('code')) : null,
                'description' => $serviceItem?->description ?: 'Servicio de almacenamiento',
                'quantity' => $serviceItem?->quantity ?: 1,
                'unit_price' => $serviceItem?->unit_price ?: $total,
                'total' => $serviceItem?->total ?: $total,
                'metadata' => json_encode(['source' => 'storage_demo_seed'], JSON_UNESCAPED_SLASHES),
                'status' => true,
            ]);

            if (Schema::hasTable('billing_events')) {
                $this->insertRow('billing_events', [
                    'billing_document_id' => $document->id,
                    'event_type' => $localStatus === 'pending' ? 'prepared' : $localStatus,
                    'local_status' => $localStatus,
                    'external_status' => $externalStatuses[$index - 1],
                    'message' => 'Evento demo de facturacion storage.',
                    'status' => true,
                    'created_by' => $this->userId,
                    'updated_by' => $this->userId,
                ]);
            }
        }
    }

    private function deleteAccountsReceivableForServiceOrders(array $orderIds): void
    {
        if (!Schema::hasTable('accounts_receivable') || empty($orderIds)) {
            return;
        }
        $hasServiceOrderId = Schema::hasColumn('accounts_receivable', 'service_order_id');
        $hasSourceColumns = Schema::hasColumn('accounts_receivable', 'source_type')
            && Schema::hasColumn('accounts_receivable', 'source_id');
        if (!$hasServiceOrderId && !$hasSourceColumns) {
            return;
        }

        $receivableIds = $this->idsFromQuery(
            DB::table('accounts_receivable')->where(function ($query) use ($orderIds, $hasServiceOrderId, $hasSourceColumns) {
                if ($hasServiceOrderId) {
                    $query->whereIn('service_order_id', $orderIds);
                }
                if ($hasSourceColumns) {
                    $query->orWhere(function ($source) use ($orderIds) {
                        $source->where('source_type', 'service_order')->whereIn('source_id', $orderIds);
                    });
                }
            })
        );

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

    private function idsFromQuery($query): array
    {
        return $query->pluck('id')->map(fn($id) => (int) $id)->unique()->values()->all();
    }

    private function deleteByIds(string $table, array $ids): void
    {
        if (!Schema::hasTable($table) || empty($ids)) {
            return;
        }

        DB::table($table)->whereIn('id', $ids)->delete();
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

        return $this->insertRowAndFetch($table, array_merge($where, $values));
    }

    private function insertRowAndFetch(string $table, array $data): object
    {
        $id = $this->insertRow($table, $data);
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
        return array_intersect_key($data, array_flip($this->columns($table)));
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

    private function ensureDemoContractFile(int $index, string $code, string $startsAt, string $endsAt): string
    {
        $path = 'contracts/demo-' . $index . '.pdf';

        Storage::disk('public')->makeDirectory('contracts');
        Storage::disk('public')->put($path, $this->demoContractPdf($code, $startsAt, $endsAt));

        return $path;
    }

    private function demoContractPdf(string $code, string $startsAt, string $endsAt): string
    {
        return $this->pdfFromLines([
            'Contrato demo de almacenamiento',
            'Codigo: ' . $code,
            'Inicio: ' . $startsAt,
            'Fin: ' . $endsAt,
            'Documento generado automaticamente para los datos demo.',
        ]);
    }

    private function pdfFromLines(array $lines): string
    {
        $content = "BT\n/F1 12 Tf\n50 760 Td\n18 TL\n";
        foreach ($lines as $index => $line) {
            if ($index > 0) {
                $content .= "T*\n";
            }
            $content .= '(' . $this->pdfEscape((string) $line) . ") Tj\n";
        }
        $content .= "ET\n";

        $objects = [
            '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
            '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
            '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >> endobj',
            '4 0 obj << /Length ' . strlen($content) . " >> stream\n" . $content . 'endstream endobj',
            '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
        ];

        $pdf = "%PDF-1.4\n";
        $offsets = [0];
        foreach ($objects as $object) {
            $offsets[] = strlen($pdf);
            $pdf .= $object . "\n";
        }

        $xref = strlen($pdf);
        $pdf .= "xref\n0 " . count($offsets) . "\n";
        $pdf .= "0000000000 65535 f \n";
        for ($i = 1; $i < count($offsets); $i++) {
            $pdf .= str_pad((string) $offsets[$i], 10, '0', STR_PAD_LEFT) . " 00000 n \n";
        }

        $pdf .= "trailer << /Size " . count($offsets) . " /Root 1 0 R >>\n";
        $pdf .= "startxref\n{$xref}\n%%EOF\n";

        return $pdf;
    }

    private function pdfEscape(string $value): string
    {
        return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $value);
    }

    private function resolveUserId(): ?int
    {
        if (!Schema::hasTable('users')) {
            return null;
        }

        return DB::table('users')->whereNotNull('status')->orderBy('id')->value('id')
            ?: DB::table('users')->orderBy('id')->value('id');
    }
}
