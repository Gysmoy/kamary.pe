<?php

namespace Database\Seeders;

use App\Models\AccountsPayable;
use App\Models\AccountsReceivable;
use App\Models\Activity;
use App\Models\ActivityItem;
use App\Models\Article;
use App\Models\ArticlePresentation;
use App\Models\BillingDocument;
use App\Models\BillingDocumentItem;
use App\Models\Business;
use App\Models\BusinessBranch;
use App\Models\Client;
use App\Models\ClientDeliveryAddress;
use App\Models\ClientDistributionNetwork;
use App\Models\CommercialOrder;
use App\Models\CommercialOrderItem;
use App\Models\Dispatch;
use App\Models\DispatchAssignment;
use App\Models\Driver;
use App\Models\EntryNote;
use App\Models\EntryNoteItem;
use App\Models\EventualClient;
use App\Models\ExitNote;
use App\Models\ExitNoteItem;
use App\Models\Laboratory;
use App\Models\PriceList;
use App\Models\PriceListItem;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\PurchaseReceipt;
use App\Models\PurchaseReceiptItem;
use App\Models\ServiceCatalog;
use App\Models\ServiceOrder;
use App\Models\ServiceOrderItem;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\Warehouse;
use App\Models\Zone;
use App\Support\BusinessScope;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ProductionModuleDataSeeder extends Seeder
{
    private ?int $userId = null;

    public function run(): void
    {
        $this->userId = User::query()->orderBy('id')->value('id');

        DB::transaction(function () {
            $businesses = $this->ensureFixedBusinesses();
            $branches = $this->ensureBranches($businesses);
            $warehouses = $this->ensureWarehouses($branches);
            $units = $this->ensureUnits();
            $laboratories = $this->ensureLaboratories();
            $articles = $this->ensureArticles($units, $laboratories);
            $presentations = $this->ensurePresentations($articles);
            $suppliers = $this->ensureSuppliers();
            $clients = $this->ensureClients();
            $eventualClients = $this->ensureEventualClients();
            $networks = $this->ensureDistributionNetworks($clients);
            $addresses = $this->ensureDeliveryAddresses($clients, $networks);
            $services = $this->ensureServices();
            $zones = $this->ensureZones($businesses);
            $drivers = $this->ensureDrivers($businesses);
            $vehicles = $this->ensureVehicles($businesses, $zones);
            $priceLists = $this->ensurePriceLists($businesses, $branches, $warehouses, $articles, $laboratories);
            $purchaseOrders = $this->ensurePurchaseOrders($businesses, $branches, $warehouses, $suppliers, $articles);
            $this->ensurePurchaseReceipts($purchaseOrders);
            $this->ensureEntryNotes($businesses, $branches, $warehouses, $suppliers, $articles);
            $this->ensureExitNotes($businesses, $branches, $warehouses, $articles);
            $commercialOrders = $this->ensureCommercialOrders($businesses, $branches, $warehouses, $clients, $eventualClients, $networks, $addresses, $articles, $presentations, $priceLists);
            $serviceOrders = $this->ensureServiceOrders($businesses, $branches, $clients, $services);
            $this->ensureAccountsReceivable($commercialOrders, $serviceOrders);
            $dispatches = $this->ensureDispatches($businesses, $branches, $warehouses, $drivers, $vehicles, $zones, $commercialOrders);
            $this->ensureActivities($commercialOrders, $dispatches);
            $this->ensureBillingDocuments($commercialOrders, $serviceOrders);
        });
    }

    private function ensureFixedBusinesses(): Collection
    {
        $defaults = [
            BusinessScope::KAMARY_PERU => [
                'name' => 'Kamary Peru',
                'description' => 'Empresa general y operativa de Kamary Peru.',
            ],
            BusinessScope::KAMARY_MEDICALS => [
                'name' => 'Kamary Medicals',
                'description' => 'Empresa para servicios de almacenamiento.',
            ],
        ];

        foreach ($defaults as $key => $default) {
            Business::query()->updateOrCreate(
                ['business_key' => $key],
                [
                    'name' => $default['name'],
                    'description' => $default['description'],
                    'status' => true,
                    'updated_by' => $this->userId,
                ]
            );
        }

        return Business::query()
            ->whereIn('business_key', BusinessScope::fixedKeys())
            ->whereNotNull('status')
            ->orderBy('id')
            ->get();
    }

    private function ensureBranches(Collection $businesses): Collection
    {
        $branchTemplates = [
            [
                'name' => 'Principal',
                'establishment_code' => '0000',
                'series_factura' => 'F001',
                'series_boleta' => 'B001',
                'series_nota_credito' => 'FC01',
            ],
            [
                'name' => 'Sucursal Operativa',
                'establishment_code' => '0001',
                'series_factura' => 'F002',
                'series_boleta' => 'B002',
                'series_nota_credito' => 'FC02',
            ],
        ];

        foreach ($businesses as $business) {
            if ($business->branches()->exists()) {
                continue;
            }

            foreach ($branchTemplates as $template) {
                BusinessBranch::create([
                    'business_id' => $business->id,
                    'name' => $template['name'],
                    'establishment_code' => $template['establishment_code'],
                    'ubigeo' => '150101',
                    'address' => 'Direccion fiscal pendiente de actualizar',
                    'email' => 'facturacion@kamary.pe',
                    'telephone' => '000000000',
                    'series_factura' => $template['series_factura'],
                    'series_boleta' => $template['series_boleta'],
                    'series_nota_credito' => $template['series_nota_credito'],
                    'facturador_sync_status' => 'pending',
                    'facturador_sync_message' => 'Sede creada por seeder inicial. Completar datos fiscales antes de emitir.',
                    'status' => true,
                    'created_by' => $this->userId,
                    'updated_by' => $this->userId,
                ]);
            }
        }

        return BusinessBranch::query()
            ->whereIn('business_id', $businesses->pluck('id'))
            ->whereNotNull('status')
            ->orderBy('id')
            ->get();
    }

    private function ensureWarehouses(Collection $branches): Collection
    {
        $warehouseTemplates = [
            ['name' => 'Almacen Principal', 'description' => 'Almacen principal para stock operativo'],
            ['name' => 'Almacen Reserva', 'description' => 'Almacen de reserva para pruebas de traslados y despacho'],
        ];

        foreach ($branches as $branch) {
            if (Warehouse::query()->where('business_branch_id', $branch->id)->exists()) {
                continue;
            }

            foreach ($warehouseTemplates as $template) {
                Warehouse::create([
                    'business_branch_id' => $branch->id,
                    'name' => $template['name'] . ' - ' . $branch->name,
                    'description' => $template['description'],
                    'status' => true,
                    'created_by' => $this->userId,
                    'updated_by' => $this->userId,
                ]);
            }
        }

        return Warehouse::query()
            ->whereIn('business_branch_id', $branches->pluck('id'))
            ->orderBy('id')
            ->get();
    }

    private function ensureUnits(): Collection
    {
        if (!$this->hasRows('units')) {
            foreach ([['Unidad', 'UND'], ['Caja', 'CAJ'], ['Frasco', 'FCO'], ['Blister', 'BLS'], ['Kilogramo', 'KG'], ['Servicio', 'SRV']] as $row) {
                Unit::create([
                    'name' => $row[0],
                    'symbol' => $row[1],
                    'status' => true,
                    'created_by' => $this->userId,
                    'updated_by' => $this->userId,
                ]);
            }
        }

        return Unit::query()->whereNotNull('status')->orderBy('id')->take(10)->get();
    }

    private function ensureLaboratories(): Collection
    {
        if (!$this->hasRows('laboratories')) {
            foreach ([['Generico Kamary', 'LAB-KAM-001'], ['Proveedor Nacional', 'LAB-KAM-002'], ['Magistrales Base', 'LAB-KAM-003'], ['Cosmetica Salud', 'LAB-KAM-004'], ['Dermatologia Peru', 'LAB-KAM-005'], ['Hospitalario Base', 'LAB-KAM-006']] as $row) {
                Laboratory::create([
                    'name' => $row[0],
                    'code' => $row[1],
                    'status' => true,
                    'created_by' => $this->userId,
                    'updated_by' => $this->userId,
                ]);
            }
        }

        return Laboratory::query()->whereNotNull('status')->orderBy('id')->take(10)->get();
    }

    private function ensureArticles(Collection $units, Collection $laboratories): Collection
    {
        if (!$this->hasRows('articles')) {
            $families = ['Farmacia', 'Magistral', 'Dermocosmetica', 'Hospitalario'];

            for ($i = 1; $i <= 24; $i++) {
                Article::create([
                    'code' => 'INI-ART-' . str_pad((string) $i, 3, '0', STR_PAD_LEFT),
                    'name' => $families[($i - 1) % count($families)] . ' Inicial ' . $i,
                    'laboratory_id' => $laboratories[($i - 1) % max(1, $laboratories->count())]?->id,
                    'unit_id' => $units[($i - 1) % max(1, $units->count())]?->id,
                    'volume' => 1,
                    'margin_rule' => $i % 2 === 0,
                    'igv_rule' => $i % 4 !== 0,
                    'units_per_article' => $i % 3 === 0 ? 12 : 1,
                    'unit_weight' => 0.25 + ($i % 5),
                    'notes' => 'Producto inicial para pruebas operativas y variantes de IGV/margen',
                    'status' => $i % 12 !== 0,
                    'created_by' => $this->userId,
                    'updated_by' => $this->userId,
                ]);
            }
        }

        return Article::query()->whereNotNull('status')->orderBy('id')->take(100)->get();
    }

    private function ensurePresentations(Collection $articles): Collection
    {
        if (!$this->hasRows('article_presentations')) {
            foreach ($articles as $index => $article) {
                foreach ([['Unidad', 1, 1], ['Caja x 12', 12, 2]] as $presentation) {
                    ArticlePresentation::create([
                        'article_id' => $article->id,
                        'name' => $presentation[0],
                        'units' => $presentation[1],
                        'price' => (10 + ($index + 1)) * $presentation[1],
                        'sort_order' => $presentation[2],
                        'status' => true,
                    ]);
                }
            }
        }

        return ArticlePresentation::query()->whereNotNull('status')->orderBy('id')->take(100)->get();
    }

    private function ensureSuppliers(): Collection
    {
        if (!$this->hasRows('suppliers')) {
            $variants = [
                ['Factura', 'Contado', 0, 'Farmaceutico'],
                ['Factura', 'Credito', 30, 'Farmaceutico'],
                ['Boleta', 'Contado', 0, 'Material medico'],
                ['Factura', 'Credito', 45, 'Insumos magistrales'],
            ];

            for ($i = 1; $i <= 16; $i++) {
                $variant = $variants[($i - 1) % count($variants)];
                Supplier::create([
                    'ruc' => '20' . str_pad((string) (900000000 + $i), 9, '0', STR_PAD_LEFT),
                    'business_name' => 'Proveedor Inicial ' . $i,
                    'trade_name' => 'Proveedor ' . $i,
                    'address' => 'Av. Proveedor ' . $i,
                    'phone' => '01000000' . $i,
                    'mobile' => '90000000' . $i,
                    'contact_name' => 'Contacto Proveedor ' . $i,
                    'contact_position' => 'Ventas',
                    'contact_phone' => '90010000' . $i,
                    'contact_email' => 'proveedor' . $i . '@kamary.pe',
                    'email_1' => 'proveedor' . $i . '@kamary.pe',
                    'business_line' => $variant[3],
                    'billing_type' => $variant[0],
                    'credit_type' => $variant[1],
                    'bank' => 'BCP',
                    'bank_account_cci' => '0020000000000000000' . $i,
                    'payment_system' => 'Transferencia',
                    'payment_term_days' => $variant[2],
                    'evaluation' => 'Inicial',
                    'status' => $i % 16 !== 0,
                    'created_by' => $this->userId,
                    'updated_by' => $this->userId,
                ]);
            }
        }

        return Supplier::query()->whereNotNull('status')->orderBy('id')->take(20)->get();
    }

    private function ensureClients(): Collection
    {
        if (!$this->hasRows('clients')) {
            $channels = ['Retail', 'Mayorista', 'Institucional', 'Ecommerce'];
            $segments = ['Kamary Peru', 'Kamary Medicals', 'Frecuente', 'Nuevo'];

            for ($i = 1; $i <= 20; $i++) {
                Client::create([
                    'document_type' => $i % 2 === 0 ? 'RUC' : 'DNI',
                    'document_number' => $i % 2 === 0 ? '20' . str_pad((string) (800000000 + $i), 9, '0', STR_PAD_LEFT) : str_pad((string) (70000000 + $i), 8, '0', STR_PAD_LEFT),
                    'client_kind' => 'regular',
                    'full_name' => 'Cliente Inicial ' . $i,
                    'is_platform' => false,
                    'has_storage_service' => $i % 3 === 0,
                    'contract_due_days' => 30,
                    'commercial_channel' => $channels[($i - 1) % count($channels)],
                    'segment' => $segments[($i - 1) % count($segments)],
                    'email' => 'cliente' . $i . '@kamary.pe',
                    'billing_email' => 'facturacion.cliente' . $i . '@kamary.pe',
                    'primary_contact' => 'Contacto Cliente ' . $i,
                    'primary_contact_phone' => '91000000' . $i,
                    'phone' => '91000000' . $i,
                    'phone_prefix' => '+51',
                    'short_code' => 'CLI' . str_pad((string) $i, 3, '0', STR_PAD_LEFT),
                    'ubigeo' => '150101',
                    'full_address' => 'Av. Cliente Inicial ' . $i,
                    'status' => $i % 20 !== 0,
                    'created_by' => $this->userId,
                    'updated_by' => $this->userId,
                ]);
            }
        }

        return Client::query()->whereNotNull('status')->orderBy('id')->take(20)->get();
    }

    private function ensureEventualClients(): Collection
    {
        if (!$this->hasRows('eventual_clients')) {
            $documentTypes = ['DNI', 'RUC', 'CE'];

            for ($i = 1; $i <= 12; $i++) {
                $documentType = $documentTypes[($i - 1) % count($documentTypes)];
                EventualClient::create([
                    'document_type' => $documentType,
                    'document_number' => $documentType === 'RUC'
                        ? '20' . str_pad((string) (760000000 + $i), 9, '0', STR_PAD_LEFT)
                        : str_pad((string) (76000000 + $i), 8, '0', STR_PAD_LEFT),
                    'business_name' => 'Cliente Eventual Inicial ' . $i,
                    'email' => 'eventual' . $i . '@kamary.pe',
                    'phone_prefix' => '+51',
                    'phone' => '92000000' . $i,
                    'address' => 'Direccion eventual ' . $i,
                    'contact_name' => 'Contacto Eventual ' . $i,
                    'notes' => 'Cliente eventual inicial',
                    'status' => true,
                    'created_by' => $this->userId,
                    'updated_by' => $this->userId,
                ]);
            }
        }

        return EventualClient::query()->whereNotNull('status')->orderBy('id')->take(50)->get();
    }

    private function ensureDistributionNetworks(Collection $clients): Collection
    {
        if (!$this->hasRows('client_distribution_networks')) {
            $channels = ['Retail', 'Mayorista', 'Institucional', 'Ecommerce'];

            foreach ($clients->take(16)->values() as $index => $client) {
                ClientDistributionNetwork::create([
                    'client_id' => $client->id,
                    'code' => 'NET-INI-' . str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT),
                    'name' => 'Red Inicial ' . ($index + 1),
                    'commercial_channel' => $channels[$index % count($channels)],
                    'segment' => $index % 2 === 0 ? 'Kamary Peru' : 'Kamary Medicals',
                    'contact_name' => 'Contacto Red ' . ($index + 1),
                    'contact_phone' => '93000000' . ($index + 1),
                    'contact_email' => 'red' . ($index + 1) . '@kamary.pe',
                    'observations' => 'Red inicial',
                    'is_default' => true,
                    'status' => true,
                    'created_by' => $this->userId,
                    'updated_by' => $this->userId,
                ]);
            }
        }

        return ClientDistributionNetwork::query()->whereNotNull('status')->orderBy('id')->take(20)->get();
    }

    private function ensureDeliveryAddresses(Collection $clients, Collection $networks): Collection
    {
        if (!$this->hasRows('client_delivery_addresses')) {
            foreach ($networks as $index => $network) {
                foreach ([['Principal', '150101', 'Lima', 'Lima', 'Lima'], ['Alterna', '150122', 'Lima', 'Lima', 'Miraflores']] as $addressIndex => $addressData) {
                    ClientDeliveryAddress::create([
                        'client_distribution_network_id' => $network->id,
                        'client_id' => $network->client_id,
                        'code' => 'DIR-INI-' . str_pad((string) (($index * 2) + $addressIndex + 1), 3, '0', STR_PAD_LEFT),
                        'name' => 'Direccion ' . $addressData[0],
                        'ubigeo' => $addressData[1],
                        'department' => $addressData[2],
                        'province' => $addressData[3],
                        'district' => $addressData[4],
                        'address' => 'Av. Reparto Inicial ' . ($index + 1) . ' - ' . $addressData[0],
                        'reference' => 'Referencia inicial ' . $addressData[0],
                        'latitude' => -12.0464 + ($addressIndex * 0.01),
                        'longitude' => -77.0428 + ($addressIndex * 0.01),
                        'contact_name' => 'Contacto Entrega ' . ($index + 1),
                        'contact_phone' => '94000000' . ($index + 1),
                        'is_default' => $addressIndex === 0,
                        'status' => true,
                        'created_by' => $this->userId,
                        'updated_by' => $this->userId,
                    ]);
                }
            }
        }

        return ClientDeliveryAddress::query()->whereNotNull('status')->orderBy('id')->take(100)->get();
    }

    private function ensureServices(): Collection
    {
        if (!$this->hasRows('services')) {
            $rows = [
                ['SRV-INI-001', 'Almacenamiento mensual', 'Almacenamiento', 'General', 'Recurrente', 'Mes', 120, 35],
                ['SRV-INI-002', 'Despacho local', 'Distribucion', 'Local', 'Puntual', 'Viaje', 45, 15],
                ['SRV-INI-003', 'Servicio general', 'Operacion', 'General', 'Puntual', 'Servicio', 80, 25],
                ['SRV-INI-004', 'Despacho provincial', 'Distribucion', 'Provincia', 'Puntual', 'Viaje', 95, 28],
                ['SRV-INI-005', 'Picking y packing', 'Operacion', 'Preparacion', 'Puntual', 'Servicio', 35, 10],
                ['SRV-INI-006', 'Inventario mensual', 'Almacenamiento', 'Inventario', 'Recurrente', 'Mes', 180, 52],
                ['SRV-INI-007', 'Custodia especial', 'Almacenamiento', 'Controlado', 'Recurrente', 'Mes', 240, 70],
                ['SRV-INI-008', 'Recojo de productos', 'Distribucion', 'Recojo', 'Puntual', 'Viaje', 55, 16],
                ['SRV-INI-009', 'Devolucion documentaria', 'Distribucion', 'Retorno', 'Puntual', 'Servicio', 40, 12],
                ['SRV-INI-010', 'Etiquetado', 'Operacion', 'Acondicionado', 'Puntual', 'Servicio', 60, 18],
                ['SRV-INI-011', 'Control de temperatura', 'Almacenamiento', 'Cadena fria', 'Recurrente', 'Mes', 320, 90],
                ['SRV-INI-012', 'Asesoria regulatoria', 'Asesoria', 'Regulatorio', 'Puntual', 'Hora', 150, 42],
                ['SRV-INI-013', 'Despacho express', 'Distribucion', 'Express', 'Puntual', 'Viaje', 75, 22],
                ['SRV-INI-014', 'Servicio magistral', 'Operacion', 'Magistral', 'Puntual', 'Servicio', 110, 32],
                ['SRV-INI-015', 'Embalaje especial', 'Operacion', 'Embalaje', 'Puntual', 'Servicio', 50, 15],
                ['SRV-INI-016', 'Almacenamiento por pallet', 'Almacenamiento', 'Pallet', 'Recurrente', 'Mes', 210, 60],
            ];
            foreach ($rows as $row) {
                ServiceCatalog::create([
                    'code' => $row[0],
                    'name' => $row[1],
                    'category' => $row[2],
                    'subcategory' => $row[3],
                    'service_type' => $row[4],
                    'billing_unit' => $row[5],
                    'unit_price_pen' => $row[6],
                    'unit_price_usd' => $row[7],
                    'applicable_zone' => 'Lima',
                    'linked_vehicle_type' => 'Furgon',
                    'commissions_enabled' => $row[4] === 'Puntual',
                    'observations' => 'Servicio inicial',
                    'status' => true,
                    'created_by' => $this->userId,
                    'updated_by' => $this->userId,
                ]);
            }
        }

        return ServiceCatalog::query()->whereNotNull('status')->orderBy('id')->take(20)->get();
    }

    private function ensureZones(Collection $businesses): Collection
    {
        if (!$this->hasRows('zones')) {
            $zoneTemplates = [
                ['Lima Centro', '150101', 'Lima', 'Lima', 'Lima'],
                ['Lima Norte', '150117', 'Lima', 'Lima', 'Los Olivos'],
                ['Lima Sur', '150143', 'Lima', 'Lima', 'Villa Maria del Triunfo'],
                ['Lima Este', '150103', 'Lima', 'Lima', 'Ate'],
                ['Callao', '070101', 'Callao', 'Callao', 'Callao'],
                ['Miraflores', '150122', 'Lima', 'Lima', 'Miraflores'],
                ['San Isidro', '150131', 'Lima', 'Lima', 'San Isidro'],
                ['Surco', '150140', 'Lima', 'Lima', 'Santiago de Surco'],
            ];

            $sequence = 1;
            foreach ($businesses as $business) {
                foreach ($zoneTemplates as $template) {
                    Zone::create([
                        'business_id' => $business->id,
                        'code' => 'ZON-INI-' . str_pad((string) $sequence, 3, '0', STR_PAD_LEFT),
                        'name' => $template[0],
                        'ubigeo' => $template[1],
                        'department' => $template[2],
                        'province' => $template[3],
                        'district' => $template[4],
                        'reference' => 'Zona inicial ' . $template[0],
                        'observations' => 'Zona inicial para despacho',
                        'status' => true,
                        'created_by' => $this->userId,
                        'updated_by' => $this->userId,
                    ]);
                    $sequence++;
                }
            }
        }

        return Zone::query()->whereNotNull('status')->orderBy('id')->take(100)->get();
    }

    private function ensureDrivers(Collection $businesses): Collection
    {
        if (!$this->hasRows('drivers')) {
            foreach ($businesses as $businessIndex => $business) {
                for ($i = 1; $i <= 8; $i++) {
                    $sequence = ($businessIndex * 8) + $i;
                    Driver::create([
                        'business_id' => $business->id,
                        'code' => 'DRV-INI-' . str_pad((string) $sequence, 3, '0', STR_PAD_LEFT),
                        'full_name' => 'Conductor Inicial ' . $sequence,
                        'document_type' => $i % 4 === 0 ? 'CE' : 'DNI',
                        'document_number' => str_pad((string) (78000000 + $sequence), 8, '0', STR_PAD_LEFT),
                        'license_number' => 'LIC-INI-' . str_pad((string) $sequence, 4, '0', STR_PAD_LEFT),
                        'phone' => '95000000' . $sequence,
                        'email' => 'conductor' . $sequence . '@kamary.pe',
                        'observations' => 'Conductor inicial',
                        'status' => true,
                        'created_by' => $this->userId,
                        'updated_by' => $this->userId,
                    ]);
                }
            }
        }

        return Driver::query()->whereNotNull('status')->orderBy('id')->take(100)->get();
    }

    private function ensureVehicles(Collection $businesses, Collection $zones): Collection
    {
        if (!$this->hasRows('vehicles')) {
            $vehicleTypes = ['Furgon', 'Moto', 'Camioneta', 'Van'];

            foreach ($businesses as $businessIndex => $business) {
                for ($i = 1; $i <= 8; $i++) {
                    $sequence = ($businessIndex * 8) + $i;
                    $zone = $zones->firstWhere('business_id', $business->id) ?: $zones->first();
                    Vehicle::create([
                        'business_id' => $business->id,
                        'zone_id' => $zone?->id,
                        'code' => 'VEH-INI-' . str_pad((string) $sequence, 3, '0', STR_PAD_LEFT),
                        'plate' => 'INI' . str_pad((string) $sequence, 3, '0', STR_PAD_LEFT),
                        'label' => 'Unidad Inicial ' . $sequence,
                        'brand' => $i % 2 === 0 ? 'Hyundai' : 'Toyota',
                        'model' => $i % 2 === 0 ? 'H100' : 'Hiace',
                        'color' => $i % 3 === 0 ? 'Gris' : 'Blanco',
                        'vehicle_type' => $vehicleTypes[($i - 1) % count($vehicleTypes)],
                        'capacity' => 5 + $i,
                        'gross_weight' => 500 + ($i * 100),
                        'observations' => 'Vehiculo inicial',
                        'status' => true,
                        'created_by' => $this->userId,
                        'updated_by' => $this->userId,
                    ]);
                }
            }
        }

        return Vehicle::query()->whereNotNull('status')->orderBy('id')->take(100)->get();
    }

    private function ensurePriceLists(Collection $businesses, Collection $branches, Collection $warehouses, Collection $articles, Collection $laboratories): Collection
    {
        if (!$this->hasRows('price_lists')) {
            $sequence = 1;
            $configs = [
                ['General', 'Base', 'PEN', 10, false],
                ['Mayorista', 'Frecuente', 'PEN', 20, true],
                ['Retail', 'Nuevo', 'PEN', 30, true],
                ['Exportacion', 'USD', 'USD', 40, false],
            ];

            foreach ($businesses as $business) {
                $businessBranches = $branches->where('business_id', $business->id)->values();
                if ($businessBranches->isEmpty()) {
                    continue;
                }

                foreach ($configs as $configIndex => $config) {
                    $branch = $businessBranches[$configIndex % $businessBranches->count()];
                    $warehouse = $warehouses->where('business_branch_id', $branch?->id)->values()->get($configIndex % max(1, $warehouses->where('business_branch_id', $branch?->id)->count()));
                    $priceList = PriceList::create([
                        'code' => 'TAR-INI-' . str_pad((string) $sequence, 3, '0', STR_PAD_LEFT),
                        'business_id' => $business->id,
                        'business_branch_id' => $config[4] ? $branch?->id : null,
                        'warehouse_id' => $config[4] ? $warehouse?->id : null,
                        'channel' => $config[0],
                        'segment' => $business->name . ' - ' . $config[1],
                        'currency' => $config[2],
                        'priority' => $config[3],
                        'starts_at' => now()->subDays($configIndex)->toDateString(),
                        'ends_at' => $configIndex === 3 ? now()->addMonths(6)->toDateString() : null,
                        'observations' => 'Tarifario inicial para caso ' . $config[0],
                        'status' => true,
                        'created_by' => $this->userId,
                        'updated_by' => $this->userId,
                    ]);

                    foreach ($articles->slice($configIndex * 4, 8)->values() as $articleIndex => $article) {
                        PriceListItem::create([
                            'price_list_id' => $priceList->id,
                            'article_id' => $article->id,
                            'laboratory_id' => $article->laboratory_id ?: $laboratories->first()?->id,
                            'fixed_price' => ($config[2] === 'USD' ? 5 : 15) + $articleIndex + $configIndex,
                            'minimum_quantity' => $configIndex + 1,
                            'status' => true,
                        ]);
                    }

                    $sequence++;
                }
            }
        }

        return PriceList::query()->whereNotNull('status')->orderBy('id')->take(100)->get();
    }

    private function ensurePurchaseOrders(Collection $businesses, Collection $branches, Collection $warehouses, Collection $suppliers, Collection $articles): Collection
    {
        if (!$this->hasRows('purchase_orders')) {
            $statusCases = [
                ['draft', 'pending', 'Contado'],
                ['approved', 'approved', 'Credito'],
                ['partial', 'approved', 'Credito'],
                ['completed', 'approved', 'Contado'],
                ['cancelled', 'rejected', 'Contado'],
            ];

            $sequence = 1;
            foreach ($statusCases as $case) {
                for ($variant = 1; $variant <= 4; $variant++) {
                    $business = $businesses[($sequence - 1) % max(1, $businesses->count())] ?? null;
                    if (!$business) continue;

                    $businessBranches = $branches->where('business_id', $business->id)->values();
                    $branch = $businessBranches->get(($variant - 1) % max(1, $businessBranches->count()));
                    $businessWarehouses = $warehouses->where('business_branch_id', $branch?->id)->values();
                    $warehouse = $businessWarehouses->get(($variant - 1) % max(1, $businessWarehouses->count()));
                    $supplier = $suppliers[($sequence - 1) % max(1, $suppliers->count())] ?? null;
                    if (!$branch || !$warehouse || !$supplier) continue;

                    $order = PurchaseOrder::create([
                        'business_id' => $business->id,
                        'business_branch_id' => $branch->id,
                        'warehouse_id' => $warehouse->id,
                        'supplier_id' => $supplier->id,
                        'code' => 'OC-INI-' . str_pad((string) $sequence, 6, '0', STR_PAD_LEFT),
                        'issue_date' => now()->subDays(20 - $sequence)->toDateString(),
                        'expected_date' => now()->addDays($variant + 2)->toDateString(),
                        'currency' => $variant === 4 ? 'USD' : 'PEN',
                        'payment_condition' => $case[2],
                        'order_status' => $case[0],
                        'approval_status' => $case[1],
                        'observations' => 'Orden de compra inicial: ' . $case[0],
                        'subtotal' => 0,
                        'tax_amount' => 0,
                        'total' => 0,
                        'status' => true,
                        'created_by' => $this->userId,
                        'updated_by' => $this->userId,
                    ]);

                    $this->seedPurchaseOrderItems($order, $articles, $sequence);
                    $sequence++;
                }
            }
        }

        return PurchaseOrder::query()->whereNotNull('status')->with('items')->orderBy('id')->take(100)->get();
    }

    private function ensurePurchaseReceipts(Collection $purchaseOrders): Collection
    {
        if (!$this->hasRows('purchase_receipts')) {
            $shouldSeedPayables = !$this->hasRows('accounts_payable');
            $receiptStatuses = ['draft', 'confirmed', 'cancelled'];

            $sequence = 1;
            foreach ($receiptStatuses as $receiptStatus) {
                foreach ($purchaseOrders->values()->slice($sequence - 1, 4) as $order) {
                    if ($sequence > 12) break 2;
                    $isConfirmed = $receiptStatus === 'confirmed';
                    $receipt = PurchaseReceipt::create([
                        'purchase_order_id' => $order->id,
                        'business_id' => $order->business_id,
                        'business_branch_id' => $order->business_branch_id,
                        'warehouse_id' => $order->warehouse_id,
                        'supplier_id' => $order->supplier_id,
                        'code' => 'IC-INI-' . str_pad((string) $sequence, 6, '0', STR_PAD_LEFT),
                        'issue_date' => now()->subDays(12 - $sequence)->toDateString(),
                        'receipt_status' => $receiptStatus,
                        'confirmed_at' => $isConfirmed ? now()->subDays(2) : null,
                        'document_type' => $sequence % 4 === 0 ? 'Boleta' : 'Factura',
                        'document_series' => $sequence % 4 === 0 ? 'B001' : 'F001',
                        'document_sequence' => str_pad((string) $sequence, 6, '0', STR_PAD_LEFT),
                        'currency' => $order->currency,
                        'payment_condition' => $order->payment_condition,
                        'first_due_date' => $order->payment_condition === 'Credito' ? now()->addDays(30)->toDateString() : now()->toDateString(),
                        'installments' => $order->payment_condition === 'Credito' ? 3 : 1,
                        'observations' => 'Ingreso por compra inicial: ' . $receiptStatus,
                        'subtotal' => $order->subtotal,
                        'tax_amount' => $order->tax_amount,
                        'total' => $order->total,
                        'status' => true,
                        'created_by' => $this->userId,
                        'updated_by' => $this->userId,
                    ]);

                    foreach ($order->items as $item) {
                        PurchaseReceiptItem::create([
                            'purchase_receipt_id' => $receipt->id,
                            'purchase_order_item_id' => $item->id,
                            'batch_code' => 'LOT-INI-' . $receipt->id . '-' . $item->id,
                            'lot' => 'LOT-INI-' . $receipt->id . '-' . $item->id,
                            'expiration_date' => now()->addMonths(6 + $sequence)->toDateString(),
                            'article_id' => $item->article_id,
                            'warehouse_id' => $order->warehouse_id,
                            'stock_before' => 0,
                            'units_per_box' => 1,
                            'boxes_quantity' => 1,
                            'cost_unit' => $item->price_unit,
                            'location' => 'Inicial',
                            'quantity' => $item->requested_quantity,
                            'total' => $item->total,
                            'status' => true,
                        ]);
                    }

                    if ($shouldSeedPayables && $isConfirmed) {
                        $this->createAccountsPayable($receipt);
                    }

                    $sequence++;
                }
            }
        }

        return PurchaseReceipt::query()->whereNotNull('status')->orderBy('id')->take(100)->get();
    }
    private function ensureEntryNotes(Collection $businesses, Collection $branches, Collection $warehouses, Collection $suppliers, Collection $articles): void
    {
        if ($this->hasRows('entry_notes')) {
            return;
        }

        $documentCases = [
            ['Factura', 'F001', 'Compra regular'],
            ['Boleta', 'B001', 'Compra menor'],
            ['Guia', 'T001', 'Traslado interno'],
            ['Ajuste', 'A001', 'Ajuste de inventario'],
        ];

        for ($sequence = 1; $sequence <= 8; $sequence++) {
            $business = $businesses[($sequence - 1) % max(1, $businesses->count())] ?? null;
            $businessBranches = $business ? $branches->where('business_id', $business->id)->values() : collect();
            $branch = $businessBranches->get(($sequence - 1) % max(1, $businessBranches->count()));
            $businessWarehouses = $warehouses->where('business_branch_id', $branch?->id)->values();
            $warehouse = $businessWarehouses->get(($sequence - 1) % max(1, $businessWarehouses->count()));
            $supplier = $suppliers[($sequence - 1) % max(1, $suppliers->count())] ?? null;
            if (!$business || !$branch || !$warehouse) continue;

            $case = $documentCases[($sequence - 1) % count($documentCases)];
            $note = EntryNote::create([
                'business_id' => $business->id,
                'business_branch_id' => $branch->id,
                'warehouse_id' => $warehouse->id,
                'supplier_id' => $supplier?->id,
                'document_type' => $case[0],
                'document_series' => $case[1],
                'document_sequence' => 'INI-' . str_pad((string) $sequence, 4, '0', STR_PAD_LEFT),
                'currency' => $sequence % 4 === 0 ? 'USD' : 'PEN',
                'observations' => 'Nota de ingreso inicial: ' . $case[2],
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);

            foreach ($articles->slice(($sequence - 1) % 8, 4)->values() as $articleIndex => $article) {
                $cost = 8 + $articleIndex + ($sequence % 3);
                $quantity = 10 + $sequence + $articleIndex;
                EntryNoteItem::create([
                    'entry_note_id' => $note->id,
                    'batch_code' => 'ENT-INI-' . $note->id . '-' . $article->id,
                    'lot' => 'ENT-INI-' . $note->id . '-' . $article->id,
                    'article_id' => $article->id,
                    'warehouse_id' => $warehouse->id,
                    'stock' => 0,
                    'cost_unit' => $cost,
                    'location' => 'Inicial',
                    'quantity' => $quantity,
                    'total' => $cost * $quantity,
                    'status' => true,
                ]);
            }
        }
    }

    private function ensureExitNotes(Collection $businesses, Collection $branches, Collection $warehouses, Collection $articles): void
    {
        if ($this->hasRows('exit_notes')) {
            return;
        }

        $motiveCases = [
            ['Despacho inicial'],
            ['Merma'],
            ['Traslado interno'],
            ['Devolucion proveedor'],
        ];

        for ($sequence = 1; $sequence <= 8; $sequence++) {
            $business = $businesses[($sequence - 1) % max(1, $businesses->count())] ?? null;
            $businessBranches = $business ? $branches->where('business_id', $business->id)->values() : collect();
            $branch = $businessBranches->get(($sequence - 1) % max(1, $businessBranches->count()));
            $businessWarehouses = $warehouses->where('business_branch_id', $branch?->id)->values();
            $warehouse = $businessWarehouses->get(($sequence - 1) % max(1, $businessWarehouses->count()));
            if (!$business || !$branch || !$warehouse) continue;

            $note = ExitNote::create([
                'business_id' => $business->id,
                'business_branch_id' => $branch->id,
                'warehouse_id' => $warehouse->id,
                'client_name' => 'Cliente salida inicial ' . $sequence,
                'motives' => $motiveCases[($sequence - 1) % count($motiveCases)],
                'observations' => 'Nota de salida inicial caso ' . $sequence,
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]);

            foreach ($articles->slice(($sequence - 1) % 8, 3)->values() as $articleIndex => $article) {
                ExitNoteItem::create([
                    'exit_note_id' => $note->id,
                    'batch_code' => 'SAL-INI-' . $note->id . '-' . $article->id,
                    'article_id' => $article->id,
                    'warehouse_id' => $warehouse->id,
                    'stock' => 20,
                    'expiration_date' => now()->addMonths(4 + $sequence)->toDateString(),
                    'location' => 'Inicial',
                    'destination_location' => $sequence % 2 === 0 ? 'Sucursal' : 'Cliente',
                    'quantity' => 1 + $articleIndex,
                    'total' => 0,
                    'status' => true,
                ]);
            }
        }
    }
    private function ensureCommercialOrders(Collection $businesses, Collection $branches, Collection $warehouses, Collection $clients, Collection $eventualClients, Collection $networks, Collection $addresses, Collection $articles, Collection $presentations, Collection $priceLists): Collection
    {
        if (!$this->hasRows('commercial_orders')) {
            $orderStatuses = ['draft', 'confirmed', 'preparing', 'dispatched', 'billed', 'closed', 'cancelled'];
            $dispatchStatuses = ['pending', 'preparing', 'dispatched', 'delivered', 'delivered', 'delivered', 'cancelled'];
            $billingStatuses = ['pending', 'pending', 'partial', 'partial', 'billed', 'billed', 'cancelled'];
            $paymentStatuses = ['pending', 'partial', 'paid', 'pending'];

            $sequence = 1;
            foreach ($orderStatuses as $statusIndex => $orderStatus) {
                for ($variant = 1; $variant <= 4; $variant++) {
                    $business = $businesses[($sequence - 1) % max(1, $businesses->count())] ?? null;
                    if (!$business) continue;

                    $businessBranches = $branches->where('business_id', $business->id)->values();
                    $branch = $businessBranches->get(($variant - 1) % max(1, $businessBranches->count()));
                    $businessWarehouses = $warehouses->where('business_branch_id', $branch?->id)->values();
                    $warehouse = $businessWarehouses->get(($variant - 1) % max(1, $businessWarehouses->count()));
                    if (!$branch || !$warehouse) continue;

                    $usesEventualClient = $variant === 4;
                    $client = $usesEventualClient ? null : ($clients[($sequence - 1) % max(1, $clients->count())] ?? null);
                    $eventualClient = $usesEventualClient ? ($eventualClients[($sequence - 1) % max(1, $eventualClients->count())] ?? null) : null;
                    if (!$client && !$eventualClient) continue;

                    $network = $client ? $networks->firstWhere('client_id', $client->id) : null;
                    $address = $client ? $addresses->firstWhere('client_id', $client->id) : null;
                    $priceList = $priceLists->firstWhere('business_id', $business->id);
                    $paymentStatus = $paymentStatuses[($variant - 1) % count($paymentStatuses)];

                    $order = CommercialOrder::create([
                        'code' => 'PED-INI-' . str_pad((string) $sequence, 6, '0', STR_PAD_LEFT),
                        'business_id' => $business->id,
                        'business_branch_id' => $branch->id,
                        'warehouse_id' => $warehouse->id,
                        'client_id' => $client?->id,
                        'eventual_client_id' => $eventualClient?->id,
                        'client_distribution_network_id' => $network?->id,
                        'client_delivery_address_id' => $address?->id,
                        'seller_id' => $this->userId,
                        'price_list_id' => $priceList?->id,
                        'document_type' => $variant % 2 === 0 ? 'Boleta' : 'Factura',
                        'currency' => $variant === 3 ? 'USD' : 'PEN',
                        'payment_condition' => $paymentStatus === 'pending' ? 'Credito' : 'Contado',
                        'payment_method' => $paymentStatus === 'paid' ? 'Transferencia' : 'Pendiente',
                        'commercial_channel' => $variant % 2 === 0 ? 'Retail' : 'Mayorista',
                        'segment' => $business->name,
                        'order_status' => $orderStatus,
                        'payment_status' => $paymentStatus,
                        'dispatch_status' => $dispatchStatuses[$statusIndex],
                        'billing_status' => $billingStatuses[$statusIndex],
                        'issue_date' => now()->subDays(28 - $sequence)->toDateString(),
                        'promised_delivery_at' => now()->addDays($variant)->toDateString(),
                        'installments' => $paymentStatus === 'pending' ? 3 : 1,
                        'first_due_date' => $paymentStatus === 'pending' ? now()->addDays(30)->toDateString() : now()->toDateString(),
                        'delivery_address' => $address?->address ?: ($eventualClient?->address ?: $client?->full_address),
                        'delivery_reference' => $address?->reference ?: 'Referencia comercial inicial',
                        'ubigeo' => $address?->ubigeo ?: ($client?->ubigeo ?: '150101'),
                        'dispatch_contact_name' => $address?->contact_name ?: ($eventualClient?->contact_name ?: $client?->primary_contact),
                        'dispatch_contact_phone' => $address?->contact_phone ?: ($eventualClient?->phone ?: $client?->primary_contact_phone),
                        'subtotal' => 0,
                        'tax_amount' => 0,
                        'total' => 0,
                        'paid_amount' => 0,
                        'balance_amount' => 0,
                        'observations' => 'Pedido comercial inicial: ' . $orderStatus,
                        'approved_at' => in_array($orderStatus, ['confirmed', 'preparing', 'dispatched', 'billed', 'closed'], true) ? now()->subDays(1) : null,
                        'billed_at' => $billingStatuses[$statusIndex] === 'billed' ? now() : null,
                        'status' => true,
                        'created_by' => $this->userId,
                        'updated_by' => $this->userId,
                    ]);

                    $this->seedCommercialOrderItems($order, $warehouse, $articles, $presentations, $sequence);
                    $order->refresh();
                    $paidAmount = $paymentStatus === 'paid' ? $order->total : ($paymentStatus === 'partial' ? round($order->total / 2, 2) : 0);
                    $order->update([
                        'paid_amount' => $paidAmount,
                        'balance_amount' => max(0, $order->total - $paidAmount),
                    ]);

                    $sequence++;
                }
            }
        }

        return CommercialOrder::query()->whereNotNull('status')->with('items')->orderBy('id')->take(100)->get();
    }

    private function ensureServiceOrders(Collection $businesses, Collection $branches, Collection $clients, Collection $services): Collection
    {
        if (!$this->hasRows('service_orders')) {
            $orderStatuses = ['draft', 'approved', 'scheduled', 'executing', 'prefactured', 'invoiced', 'closed', 'cancelled'];
            $billingStatuses = ['pending', 'pending', 'pending', 'partial', 'partial', 'billed', 'billed', 'cancelled'];
            $paymentStatuses = ['pending', 'partial', 'paid', 'pending'];

            $sequence = 1;
            foreach ($orderStatuses as $statusIndex => $orderStatus) {
                for ($variant = 1; $variant <= 4; $variant++) {
                    $business = $businesses[($sequence - 1) % max(1, $businesses->count())] ?? null;
                    if (!$business) continue;

                    $businessBranches = $branches->where('business_id', $business->id)->values();
                    $branch = $businessBranches->get(($variant - 1) % max(1, $businessBranches->count()));
                    $client = $clients[($sequence + 1) % max(1, $clients->count())] ?? null;
                    $service = $services[($sequence - 1) % max(1, $services->count())] ?? null;
                    if (!$branch || !$client || !$service) continue;

                    $paymentStatus = $paymentStatuses[($variant - 1) % count($paymentStatuses)];
                    $total = (float) $service->unit_price_pen * (1 + (($variant - 1) % 3));
                    $paidAmount = $paymentStatus === 'paid' ? $total : ($paymentStatus === 'partial' ? round($total / 2, 2) : 0);

                    $order = ServiceOrder::create([
                        'code' => 'OS-INI-' . str_pad((string) $sequence, 6, '0', STR_PAD_LEFT),
                        'business_id' => $business->id,
                        'business_branch_id' => $branch->id,
                        'client_id' => $client->id,
                        'seller_id' => $this->userId,
                        'expected_document_type' => $variant % 2 === 0 ? 'Boleta' : 'Factura',
                        'currency' => $variant === 4 ? 'USD' : 'PEN',
                        'billing_cycle' => $service->service_type === 'Recurrente' ? 'Mensual' : 'Eventual',
                        'payment_condition' => $paymentStatus === 'pending' ? 'Credito' : 'Contado',
                        'installments' => $paymentStatus === 'pending' ? 3 : 1,
                        'issue_date' => now()->subDays(32 - $sequence)->toDateString(),
                        'scheduled_at' => now()->addDays($variant)->toDateString(),
                        'first_due_date' => $paymentStatus === 'pending' ? now()->addDays(30)->toDateString() : now()->toDateString(),
                        'order_status' => $orderStatus,
                        'billing_status' => $billingStatuses[$statusIndex],
                        'subtotal' => $total,
                        'tax_amount' => 0,
                        'total' => $total,
                        'paid_amount' => $paidAmount,
                        'balance_amount' => max(0, $total - $paidAmount),
                        'payment_status' => $paymentStatus,
                        'observations' => 'Orden de servicio inicial: ' . $orderStatus,
                        'status' => true,
                        'created_by' => $this->userId,
                        'updated_by' => $this->userId,
                    ]);

                    ServiceOrderItem::create([
                        'service_order_id' => $order->id,
                        'service_id' => $service->id,
                        'description' => $service->name,
                        'quantity' => 1 + (($variant - 1) % 3),
                        'unit_price' => $service->unit_price_pen,
                        'detraction_percent' => $variant === 4 ? 12 : 0,
                        'commission_percent' => $service->commissions_enabled ? 5 : 0,
                        'total' => $total,
                        'status' => true,
                    ]);

                    $sequence++;
                }
            }
        }

        return ServiceOrder::query()->whereNotNull('status')->with('items')->orderBy('id')->take(100)->get();
    }
    private function ensureAccountsReceivable(Collection $commercialOrders, Collection $serviceOrders): void
    {
        if ($this->hasRows('accounts_receivable')) {
            return;
        }

        foreach ($commercialOrders->whereNotIn('order_status', ['draft', 'cancelled']) as $order) {
            $this->createAccountsReceivableForCommercialOrder($order);
        }

        foreach ($serviceOrders->whereNotIn('order_status', ['draft', 'cancelled']) as $order) {
            $this->createAccountsReceivableForServiceOrder($order);
        }
    }

    private function ensureDispatches(Collection $businesses, Collection $branches, Collection $warehouses, Collection $drivers, Collection $vehicles, Collection $zones, Collection $commercialOrders): Collection
    {
        if (!$this->hasRows('dispatches')) {
            $dispatchStatuses = ['waiting', 'assigned', 'in_route', 'delivered', 'incident', 'closed', 'cancelled'];
            $eligibleOrders = $commercialOrders->whereNotIn('order_status', ['draft'])->values();
            if ($eligibleOrders->isEmpty()) {
                $eligibleOrders = $commercialOrders->values();
            }

            $sequence = 1;
            foreach ($dispatchStatuses as $dispatchStatus) {
                for ($variant = 1; $variant <= 4; $variant++) {
                    $order = $eligibleOrders->get(($sequence - 1) % max(1, $eligibleOrders->count()));
                    if (!$order) continue;
                    $driver = $drivers->where('business_id', $order->business_id)->values()->get(($variant - 1) % max(1, $drivers->where('business_id', $order->business_id)->count())) ?: $drivers->first();
                    $vehicle = $vehicles->where('business_id', $order->business_id)->values()->get(($variant - 1) % max(1, $vehicles->where('business_id', $order->business_id)->count())) ?: $vehicles->first();
                    $zone = $zones->where('business_id', $order->business_id)->values()->get(($variant - 1) % max(1, $zones->where('business_id', $order->business_id)->count())) ?: $zones->first();

                    $dispatch = Dispatch::create([
                        'code' => 'DES-INI-' . str_pad((string) $sequence, 6, '0', STR_PAD_LEFT),
                        'business_id' => $order->business_id,
                        'business_branch_id' => $order->business_branch_id,
                        'warehouse_id' => $order->warehouse_id,
                        'scheduled_date' => now()->addDays($variant)->toDateString(),
                        'shift' => $variant % 2 === 0 ? 'Tarde' : 'Manana',
                        'driver_id' => $driver?->id,
                        'driver_name' => $driver?->full_name,
                        'vehicle_id' => $vehicle?->id,
                        'vehicle_label' => $vehicle?->label,
                        'vehicle_plate' => $vehicle?->plate,
                        'zone_id' => $zone?->id,
                        'zone' => $zone?->name,
                        'manifest_code' => 'MNF-INI-' . str_pad((string) $sequence, 6, '0', STR_PAD_LEFT),
                        'dispatch_status' => $dispatchStatus,
                        'departed_at' => in_array($dispatchStatus, ['in_route', 'delivered', 'incident', 'closed'], true) ? now()->subHours(4) : null,
                        'delivered_at' => in_array($dispatchStatus, ['delivered', 'closed'], true) ? now()->subHours(1) : null,
                        'observations' => 'Despacho inicial: ' . $dispatchStatus,
                        'status' => true,
                        'created_by' => $this->userId,
                        'updated_by' => $this->userId,
                    ]);

                    DispatchAssignment::create([
                        'dispatch_id' => $dispatch->id,
                        'commercial_order_id' => $order->id,
                        'commercial_order_code' => $order->code,
                        'customer_name' => $order->client?->full_name ?: $order->eventualClient?->business_name,
                        'total' => $order->total,
                        'assignment_status' => $dispatchStatus,
                        'status' => true,
                    ]);

                    $sequence++;
                }
            }
        }

        return Dispatch::query()->whereNotNull('status')->orderBy('id')->take(100)->get();
    }

    private function ensureActivities(Collection $commercialOrders, Collection $dispatches): void
    {
        if ($this->hasRows('activities')) {
            return;
        }

        $activityStatuses = ['scheduled', 'assigned', 'in_progress', 'completed', 'incident', 'cancelled'];
        $activityTypes = ['delivery', 'pickup', 'return', 'visit'];
        $orders = $commercialOrders->whereNotIn('order_status', ['draft'])->values();
        if ($orders->isEmpty()) {
            $orders = $commercialOrders->values();
        }

        $sequence = 1;
        foreach ($activityStatuses as $activityStatus) {
            for ($variant = 1; $variant <= 4; $variant++) {
                $order = $orders->get(($sequence - 1) % max(1, $orders->count()));
                if (!$order) continue;
                $dispatch = $dispatches->where('business_id', $order->business_id)->values()->get(($sequence - 1) % max(1, $dispatches->where('business_id', $order->business_id)->count())) ?: $dispatches->first();
                $activity = Activity::create([
                    'code' => 'ACT-INI-' . str_pad((string) $sequence, 6, '0', STR_PAD_LEFT),
                    'business_id' => $order->business_id,
                    'business_branch_id' => $order->business_branch_id,
                    'warehouse_id' => $order->warehouse_id,
                    'commercial_order_id' => $order->id,
                    'dispatch_id' => $dispatch?->id,
                    'client_id' => $order->client_id,
                    'eventual_client_id' => $order->eventual_client_id,
                    'driver_id' => $dispatch?->driver_id,
                    'vehicle_id' => $dispatch?->vehicle_id,
                    'zone_id' => $dispatch?->zone_id,
                    'activity_type' => $activityTypes[($variant - 1) % count($activityTypes)],
                    'activity_status' => $activityStatus,
                    'transfer_date' => now()->addDays($variant)->toDateString(),
                    'customer_name' => $order->client?->full_name ?: $order->eventualClient?->business_name,
                    'document_number' => $order->client?->document_number ?: $order->eventualClient?->document_number,
                    'manifest_code' => $dispatch?->manifest_code,
                    'origin_address' => 'Almacen principal',
                    'destination_address' => $order->delivery_address,
                    'destination_reference' => $order->delivery_reference,
                    'dispatch_contact_name' => $order->dispatch_contact_name,
                    'dispatch_contact_phone' => $order->dispatch_contact_phone,
                    'ubigeo' => $order->ubigeo,
                    'package_count' => max(1, $order->items->count()),
                    'gross_weight' => 10 + $sequence,
                    'observations' => 'Actividad inicial: ' . $activityStatus,
                    'status' => true,
                    'created_by' => $this->userId,
                    'updated_by' => $this->userId,
                ]);

                foreach ($order->items as $item) {
                    ActivityItem::create([
                        'activity_id' => $activity->id,
                        'commercial_order_item_id' => $item->id,
                        'article_id' => $item->article_id,
                        'item_code' => $item->article?->code,
                        'description' => $item->article?->name ?: 'Producto',
                        'quantity' => $item->quantity,
                        'delivered_quantity' => $activityStatus === 'completed' ? $item->quantity : 0,
                        'metadata' => ['warehouse_id' => $item->warehouse_id],
                        'status' => true,
                    ]);
                }

                $sequence++;
            }
        }
    }
    private function ensureBillingDocuments(Collection $commercialOrders, Collection $serviceOrders): void
    {
        if ($this->hasRows('billing_documents')) {
            return;
        }

        $sourcePool = collect();
        foreach ($commercialOrders->whereNotIn('order_status', ['draft'])->values() as $order) {
            $sourcePool->push(['type' => 'commercial_order', 'order' => $order]);
        }
        foreach ($serviceOrders->whereNotIn('order_status', ['draft'])->values() as $order) {
            $sourcePool->push(['type' => 'service_order', 'order' => $order]);
        }
        if ($sourcePool->isEmpty()) {
            return;
        }

        $localStatuses = ['pending', 'sent', 'accepted', 'observed', 'rejected', 'cancelled'];
        $sequence = 1;
        foreach ($localStatuses as $localStatus) {
            for ($variant = 1; $variant <= 4; $variant++) {
                $source = $sourcePool->get(($sequence - 1) % $sourcePool->count());
                $order = $source['order'];
                $isCommercial = $source['type'] === 'commercial_order';
                $documentType = $variant % 2 === 0 ? 'Boleta' : 'Factura';
                $series = $documentType === 'Boleta' ? 'B001' : 'F001';
                $externalStatus = match ($localStatus) {
                    'pending' => 'draft',
                    'sent' => 'sent',
                    'accepted' => 'accepted',
                    'observed' => 'observed',
                    'rejected' => 'rejected',
                    'cancelled' => 'cancelled',
                    default => 'draft',
                };

                $document = BillingDocument::create([
                    'code' => 'FAC-INI-' . str_pad((string) $sequence, 6, '0', STR_PAD_LEFT),
                    'source_type' => $source['type'],
                    'source_id' => $order->id,
                    'commercial_order_id' => $isCommercial ? $order->id : null,
                    'service_order_id' => $isCommercial ? null : $order->id,
                    'business_id' => $order->business_id,
                    'business_branch_id' => $order->business_branch_id,
                    'warehouse_id' => $isCommercial ? $order->warehouse_id : null,
                    'client_id' => $order->client_id,
                    'eventual_client_id' => $isCommercial ? $order->eventual_client_id : null,
                    'provider' => 'facturadorpro5',
                    'document_type' => $documentType,
                    'series' => $series,
                    'sequence' => $localStatus === 'pending' ? null : str_pad((string) $sequence, 8, '0', STR_PAD_LEFT),
                    'issue_date' => now()->subDays(24 - $sequence)->toDateString(),
                    'due_date' => $order->first_due_date ?: now()->toDateString(),
                    'currency' => $order->currency,
                    'payment_condition' => $order->payment_condition,
                    'payment_method' => $isCommercial ? $order->payment_method : null,
                    'customer_email' => $order->client?->billing_email ?: $order->client?->email,
                    'local_status' => $localStatus,
                    'external_status' => $externalStatus,
                    'external_id' => $localStatus === 'pending' ? null : 'DEMO-' . str_pad((string) $sequence, 8, '0', STR_PAD_LEFT),
                    'external_reference' => $localStatus === 'pending' ? null : $series . '-' . str_pad((string) $sequence, 8, '0', STR_PAD_LEFT),
                    'provider_endpoint' => 'internal-demo',
                    'provider_mode' => config('facturadorpro5.mode', 'api'),
                    'subtotal' => $order->subtotal,
                    'tax_amount' => $order->tax_amount,
                    'total' => $order->total,
                    'error_message' => in_array($localStatus, ['observed', 'rejected'], true) ? 'Caso demo de comprobante ' . $localStatus : null,
                    'metadata' => ['seed' => 'production-initial', 'case' => $localStatus, 'variant' => $variant],
                    'sent_at' => in_array($localStatus, ['sent', 'accepted', 'observed', 'rejected', 'cancelled'], true) ? now()->subHours(3) : null,
                    'accepted_at' => in_array($localStatus, ['accepted', 'cancelled'], true) ? now()->subHours(2) : null,
                    'cancelled_at' => $localStatus === 'cancelled' ? now()->subHour() : null,
                    'observations' => 'Comprobante inicial: ' . $localStatus,
                    'status' => true,
                    'created_by' => $this->userId,
                    'updated_by' => $this->userId,
                ]);

                if ($isCommercial) {
                    foreach ($order->items as $item) {
                        BillingDocumentItem::create([
                            'billing_document_id' => $document->id,
                            'commercial_order_item_id' => $item->id,
                            'item_type' => 'article',
                            'item_code' => $item->article?->code,
                            'description' => $item->article?->name ?: 'Producto',
                            'quantity' => $item->quantity,
                            'unit_price' => $item->price_unit,
                            'total' => $item->total,
                            'metadata' => ['warehouse_id' => $item->warehouse_id],
                            'status' => true,
                        ]);
                    }
                } else {
                    foreach ($order->items as $item) {
                        BillingDocumentItem::create([
                            'billing_document_id' => $document->id,
                            'service_order_item_id' => $item->id,
                            'item_type' => 'service',
                            'item_code' => $item->service?->code,
                            'description' => $item->description ?: $item->service?->name ?: 'Servicio',
                            'quantity' => $item->quantity,
                            'unit_price' => $item->unit_price,
                            'total' => $item->total,
                            'metadata' => ['service_id' => $item->service_id],
                            'status' => true,
                        ]);
                    }
                }

                $sequence++;
            }
        }
    }
    private function seedPurchaseOrderItems(PurchaseOrder $order, Collection $articles, int $seedOffset = 0): void
    {
        $subtotal = 0;
        foreach ($articles->slice($seedOffset % max(1, $articles->count()), 3)->values() as $index => $article) {
            $quantity = 10 + $index + ($seedOffset % 4);
            $price = 8 + $index + ($seedOffset % 3);
            $total = $quantity * $price;
            PurchaseOrderItem::create([
                'purchase_order_id' => $order->id,
                'article_id' => $article->id,
                'requested_quantity' => $quantity,
                'received_quantity' => in_array($order->order_status, ['partial', 'completed'], true) ? ($order->order_status === 'completed' ? $quantity : floor($quantity / 2)) : 0,
                'price_unit' => $price,
                'total' => $total,
                'status' => true,
            ]);
            $subtotal += $total;
        }

        $order->update([
            'subtotal' => $subtotal,
            'tax_amount' => 0,
            'total' => $subtotal,
        ]);
    }

    private function seedCommercialOrderItems(CommercialOrder $order, Warehouse $warehouse, Collection $articles, Collection $presentations, int $seedOffset = 0): void
    {
        $subtotal = 0;
        foreach ($articles->slice($seedOffset % max(1, $articles->count()), 3)->values() as $index => $article) {
            $presentation = $presentations->firstWhere('article_id', $article->id);
            $quantity = 2 + $index + ($seedOffset % 3);
            $price = 15 + $index + ($seedOffset % 5);
            $total = $quantity * $price;
            CommercialOrderItem::create([
                'commercial_order_id' => $order->id,
                'article_id' => $article->id,
                'presentation_id' => $presentation?->id,
                'warehouse_id' => $warehouse->id,
                'stock_available' => 20,
                'cost_unit' => 8 + $index,
                'price_unit' => $price,
                'presentation_units' => 1,
                'quantity' => $quantity,
                'total' => $total,
                'price_source' => 'seed',
                'status' => true,
            ]);
            $subtotal += $total;
        }

        $order->update([
            'subtotal' => $subtotal,
            'tax_amount' => 0,
            'total' => $subtotal,
            'balance_amount' => $subtotal,
        ]);
    }

    private function createAccountsPayable(PurchaseReceipt $receipt): void
    {
        if (!Schema::hasTable('accounts_payable') || AccountsPayable::query()->where('source_type', 'purchase_receipt')->where('source_id', $receipt->id)->exists()) {
            return;
        }

        $paymentCases = ['pending', 'partial', 'paid', 'pending'];
        $numericCode = (int) preg_replace('/\D+/', '', (string) $receipt->code);
        $paymentStatus = $paymentCases[$numericCode % count($paymentCases)];
        $paidAmount = $paymentStatus === 'paid'
            ? $receipt->total
            : ($paymentStatus === 'partial' ? round($receipt->total / 2, 2) : 0);
        $balanceAmount = max(0, $receipt->total - $paidAmount);

        $payable = AccountsPayable::create([
            'business_id' => $receipt->business_id,
            'business_branch_id' => $receipt->business_branch_id,
            'warehouse_id' => $receipt->warehouse_id,
            'supplier_id' => $receipt->supplier_id,
            'source_type' => 'purchase_receipt',
            'source_id' => $receipt->id,
            'code' => 'CP-INI-' . str_pad((string) $receipt->id, 6, '0', STR_PAD_LEFT),
            'document_type' => $receipt->document_type,
            'series' => $receipt->document_series,
            'sequence' => $receipt->document_sequence,
            'issue_date' => $receipt->issue_date,
            'due_date' => $receipt->first_due_date ?: $receipt->issue_date,
            'currency' => $receipt->currency,
            'payment_condition' => $receipt->payment_condition,
            'subtotal' => $receipt->subtotal,
            'tax_amount' => $receipt->tax_amount,
            'total' => $receipt->total,
            'paid_amount' => $paidAmount,
            'balance_amount' => $balanceAmount,
            'payment_status' => $paymentStatus,
            'observations' => 'Cuenta por pagar inicial',
            'status' => true,
            'created_by' => $this->userId,
            'updated_by' => $this->userId,
        ]);

        $this->createInstallment('accounts_payable_installments', 'accounts_payable_id', $payable->id, $payable->due_date, $payable->balance_amount ?: $payable->total);
    }

    private function createAccountsReceivableForCommercialOrder(CommercialOrder $order): void
    {
        if (AccountsReceivable::query()->where('source_type', 'commercial_order')->where('source_id', $order->id)->exists()) {
            return;
        }

        $receivable = AccountsReceivable::create([
            'business_id' => $order->business_id,
            'business_branch_id' => $order->business_branch_id,
            'warehouse_id' => $order->warehouse_id,
            'client_id' => $order->client_id,
            'eventual_client_id' => $order->eventual_client_id,
            'commercial_order_id' => $order->id,
            'source_type' => 'commercial_order',
            'source_id' => $order->id,
            'code' => 'CC-INI-' . str_pad((string) $order->id, 6, '0', STR_PAD_LEFT),
            'document_type' => $order->document_type,
            'issue_date' => $order->issue_date,
            'due_date' => $order->first_due_date ?: $order->issue_date,
            'currency' => $order->currency,
            'payment_condition' => $order->payment_condition,
            'subtotal' => $order->subtotal,
            'tax_amount' => $order->tax_amount,
            'total' => $order->total,
            'paid_amount' => $order->paid_amount ?? 0,
            'balance_amount' => $order->balance_amount ?? $order->total,
            'payment_status' => $order->payment_status ?? 'pending',
            'observations' => 'Cuenta por cobrar inicial',
            'status' => true,
            'created_by' => $this->userId,
            'updated_by' => $this->userId,
        ]);

        $this->createInstallment('accounts_receivable_installments', 'accounts_receivable_id', $receivable->id, $receivable->due_date, $receivable->balance_amount ?: $receivable->total);
    }

    private function createAccountsReceivableForServiceOrder(ServiceOrder $order): void
    {
        if (AccountsReceivable::query()->where('source_type', 'service_order')->where('source_id', $order->id)->exists()) {
            return;
        }

        $receivable = AccountsReceivable::create([
            'business_id' => $order->business_id,
            'business_branch_id' => $order->business_branch_id,
            'warehouse_id' => null,
            'client_id' => $order->client_id,
            'service_order_id' => $order->id,
            'source_type' => 'service_order',
            'source_id' => $order->id,
            'code' => 'CC-INI-SRV-' . str_pad((string) $order->id, 6, '0', STR_PAD_LEFT),
            'document_type' => $order->expected_document_type,
            'issue_date' => $order->issue_date,
            'due_date' => $order->first_due_date ?: $order->issue_date,
            'currency' => $order->currency,
            'payment_condition' => $order->payment_condition,
            'subtotal' => $order->subtotal,
            'tax_amount' => $order->tax_amount,
            'total' => $order->total,
            'paid_amount' => $order->paid_amount ?? 0,
            'balance_amount' => $order->balance_amount ?? $order->total,
            'payment_status' => $order->payment_status ?? 'pending',
            'observations' => 'Cuenta por cobrar inicial de servicio',
            'status' => true,
            'created_by' => $this->userId,
            'updated_by' => $this->userId,
        ]);

        $this->createInstallment('accounts_receivable_installments', 'accounts_receivable_id', $receivable->id, $receivable->due_date, $receivable->balance_amount ?: $receivable->total);
    }

    private function createInstallment(string $table, string $foreignKey, int $parentId, $dueDate, float $amount): void
    {
        if (!Schema::hasTable($table)) {
            return;
        }

        DB::table($table)->insert([
            $foreignKey => $parentId,
            'installment_number' => 1,
            'due_date' => $dueDate ?: now()->toDateString(),
            'amount' => $amount,
            'paid_amount' => 0,
            'balance_amount' => $amount,
            'payment_status' => 'pending',
            'status' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function hasRows(string $table): bool
    {
        return Schema::hasTable($table) && DB::table($table)->exists();
    }
}
