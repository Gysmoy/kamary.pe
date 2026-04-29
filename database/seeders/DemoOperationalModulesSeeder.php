<?php

namespace Database\Seeders;

use App\Http\Controllers\Admin\AccountsPayableController;
use App\Http\Controllers\Admin\AccountsReceivableController;
use App\Http\Controllers\Admin\CommercialOrderController;
use App\Http\Controllers\Admin\PurchaseOrderController;
use App\Http\Controllers\Admin\PurchaseReceiptController;
use App\Models\Article;
use App\Models\ArticlePresentation;
use App\Models\Business;
use App\Models\BusinessBranch;
use App\Models\Client;
use App\Models\ClientDeliveryAddress;
use App\Models\ClientDistributionNetwork;
use App\Models\EventualClient;
use App\Models\Laboratory;
use App\Models\PriceList;
use App\Models\PriceListItem;
use App\Models\PurchaseReceipt;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Database\Seeder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DemoOperationalModulesSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::query()->orderBy('id')->first();
        if (!$user) {
            throw new \RuntimeException('No existe un usuario para sembrar los datos demo');
        }

        Auth::shouldUse('web');
        Auth::setUser($user);

        DB::beginTransaction();
        try {
            $this->cleanupDemoData();

            [$businesses, $branches, $warehouses] = $this->seedBusinesses($user);
            [$units, $laboratories, $articles, $presentations] = $this->seedCatalog($user);
            $suppliers = $this->seedSuppliers($user);
            $clients = $this->seedClients($user);
            $eventualClients = $this->seedEventualClients($user);
            [$networks, $addresses] = $this->seedDistributionNetworks($clients, $user);
            $priceLists = $this->seedPriceLists($businesses, $branches, $warehouses, $clients, $eventualClients, $networks, $articles, $laboratories, $user);
            $purchaseOrders = $this->seedPurchaseOrders($businesses, $branches, $warehouses, $suppliers, $articles);
            $receipts = $this->seedPurchaseReceipts($purchaseOrders, $businesses, $branches, $warehouses, $suppliers, $articles);
            $this->seedAccountsPayablePayments($receipts);
            $commercialOrders = $this->seedCommercialOrders($businesses, $branches, $warehouses, $clients, $eventualClients, $networks, $addresses, $articles, $presentations);
            $this->seedAccountsReceivablePayments($commercialOrders);

            DB::commit();

            $summary = $this->buildSummary();
            $this->command?->info('Datos demo cargados correctamente');
            foreach ($summary as $module => $count) {
                $this->command?->line(str_pad($module, 34, '.') . ' ' . $count);
            }
        } catch (\Throwable $th) {
            DB::rollBack();
            throw $th;
        }
    }

    private function cleanupDemoData(): void
    {
        $demoBusinessIds = Business::query()
            ->where('name', 'like', 'DEMO OPERATIVO %')
            ->pluck('id');

        if ($demoBusinessIds->isNotEmpty()) {
            $branchIds = BusinessBranch::query()->whereIn('business_id', $demoBusinessIds)->pluck('id');
            $warehouseIds = Warehouse::query()->whereIn('business_branch_id', $branchIds)->pluck('id');

            $purchaseReceiptIds = DB::table('purchase_receipts')->whereIn('business_id', $demoBusinessIds)->pluck('id');
            $purchaseOrderIds = DB::table('purchase_orders')->whereIn('business_id', $demoBusinessIds)->pluck('id');
            $commercialOrderIds = DB::table('commercial_orders')->whereIn('business_id', $demoBusinessIds)->pluck('id');
            $accountsPayableIds = DB::table('accounts_payable')->whereIn('business_id', $demoBusinessIds)->pluck('id');
            $accountsReceivableIds = DB::table('accounts_receivable')->whereIn('business_id', $demoBusinessIds)->pluck('id');
            $priceListIds = DB::table('price_lists')->whereIn('business_id', $demoBusinessIds)->pluck('id');

            DB::table('receivable_payments')->whereIn('accounts_receivable_id', $accountsReceivableIds)->delete();
            DB::table('accounts_receivable_installments')->whereIn('accounts_receivable_id', $accountsReceivableIds)->delete();
            DB::table('accounts_receivable')->whereIn('id', $accountsReceivableIds)->delete();
            DB::table('commercial_order_items')->whereIn('commercial_order_id', $commercialOrderIds)->delete();
            DB::table('commercial_orders')->whereIn('id', $commercialOrderIds)->delete();

            DB::table('accounts_payable_payments')->whereIn('accounts_payable_id', $accountsPayableIds)->delete();
            DB::table('accounts_payable_installments')->whereIn('accounts_payable_id', $accountsPayableIds)->delete();
            DB::table('accounts_payable')->whereIn('id', $accountsPayableIds)->delete();

            DB::table('purchase_receipt_items')->whereIn('purchase_receipt_id', $purchaseReceiptIds)->delete();
            DB::table('purchase_receipts')->whereIn('id', $purchaseReceiptIds)->delete();
            DB::table('purchase_order_items')->whereIn('purchase_order_id', $purchaseOrderIds)->delete();
            DB::table('purchase_orders')->whereIn('id', $purchaseOrderIds)->delete();

            DB::table('price_list_items')->whereIn('price_list_id', $priceListIds)->delete();
            DB::table('price_lists')->whereIn('id', $priceListIds)->delete();

            DB::table('entry_note_items')
                ->whereIn('entry_note_id', function ($query) use ($demoBusinessIds) {
                    $query->from('entry_notes')->select('id')->whereIn('business_id', $demoBusinessIds);
                })
                ->delete();
            DB::table('entry_notes')->whereIn('business_id', $demoBusinessIds)->delete();

            DB::table('batches')
                ->whereIn('business_id', $demoBusinessIds)
                ->where('lot', 'like', 'DEMO-LOT-%')
                ->delete();

            DB::table('client_delivery_addresses')
                ->whereIn('client_distribution_network_id', function ($query) {
                    $query->from('client_distribution_networks')->select('id')->where('code', 'like', 'DEMO-NET-%');
                })
                ->delete();
            DB::table('client_distribution_networks')->where('code', 'like', 'DEMO-NET-%')->delete();

            DB::table('eventual_clients')->where('business_name', 'like', 'Cliente Eventual Demo %')->delete();
            DB::table('clients')->where('full_name', 'like', 'Cliente Demo %')->delete();
            DB::table('suppliers')->where('business_name', 'like', 'Proveedor Demo %')->delete();

            DB::table('article_presentations')
                ->whereIn('article_id', function ($query) {
                    $query->from('articles')->select('id')->where('code', 'like', 'DEMO-ART-%');
                })
                ->delete();
            DB::table('articles')->where('code', 'like', 'DEMO-ART-%')->delete();
            DB::table('laboratories')->where('code', 'like', 'DEMOLAB%')->delete();
            DB::table('units')->where('symbol', 'like', 'DMU%')->delete();

            DB::table('warehouses')->whereIn('id', $warehouseIds)->delete();
            DB::table('business_branches')->whereIn('id', $branchIds)->delete();
            DB::table('businesses')->whereIn('id', $demoBusinessIds)->delete();
        }
    }

    private function seedBusinesses(User $user): array
    {
        $businesses = [];
        $branches = [];
        $warehouses = [];

        for ($i = 1; $i <= 2; $i++) {
            $business = Business::create([
                'name' => "DEMO OPERATIVO {$i}",
                'description' => "Negocio demo {$i} para compras y comercial",
                'status' => true,
                'created_by' => $user->getAuthIdentifier(),
                'updated_by' => $user->getAuthIdentifier(),
            ]);
            $businesses[] = $business;

            $branch = BusinessBranch::create([
                'business_id' => $business->id,
                'name' => "Sede Demo {$i}",
                'status' => true,
                'created_by' => $user->getAuthIdentifier(),
                'updated_by' => $user->getAuthIdentifier(),
            ]);
            $branches[] = $branch;

            $warehouse = Warehouse::create([
                'business_branch_id' => $branch->id,
                'name' => "Almacen Demo {$i}",
                'description' => "Almacen principal demo {$i}",
                'status' => true,
                'created_by' => $user->getAuthIdentifier(),
                'updated_by' => $user->getAuthIdentifier(),
            ]);
            $warehouses[] = $warehouse;
        }

        return [$businesses, $branches, $warehouses];
    }

    private function seedCatalog(User $user): array
    {
        $units = [];
        for ($i = 1; $i <= 3; $i++) {
            $units[] = Unit::create([
                'name' => "Unidad Demo {$i}",
                'symbol' => "DMU{$i}",
                'status' => true,
                'created_by' => $user->getAuthIdentifier(),
                'updated_by' => $user->getAuthIdentifier(),
            ]);
        }

        $laboratories = [];
        for ($i = 1; $i <= 3; $i++) {
            $laboratories[] = Laboratory::create([
                'name' => "Laboratorio Demo {$i}",
                'code' => "DEMOLAB{$i}",
                'status' => true,
                'created_by' => $user->getAuthIdentifier(),
                'updated_by' => $user->getAuthIdentifier(),
            ]);
        }

        $articles = [];
        $presentations = [];
        for ($i = 1; $i <= 12; $i++) {
            $article = Article::create([
                'code' => 'DEMO-ART-' . str_pad((string)$i, 3, '0', STR_PAD_LEFT),
                'name' => "Articulo Demo {$i}",
                'laboratory_id' => $laboratories[($i - 1) % count($laboratories)]->id,
                'unit_id' => $units[($i - 1) % count($units)]->id,
                'volume' => 1,
                'margin_rule' => false,
                'igv_rule' => false,
                'units_per_article' => 1,
                'status' => true,
                'created_by' => $user->getAuthIdentifier(),
                'updated_by' => $user->getAuthIdentifier(),
            ]);
            $articles[] = $article;

            $presentations[] = ArticlePresentation::create([
                'article_id' => $article->id,
                'name' => 'Unidad',
                'units' => 1,
                'price' => 25 + $i,
                'sort_order' => 1,
                'status' => true,
            ]);
        }

        return [$units, $laboratories, $articles, $presentations];
    }

    private function seedSuppliers(User $user): array
    {
        $suppliers = [];
        for ($i = 1; $i <= 10; $i++) {
            $suppliers[] = Supplier::create([
                'ruc' => '2099000' . str_pad((string)$i, 4, '0', STR_PAD_LEFT),
                'business_name' => "Proveedor Demo {$i}",
                'trade_name' => "ProvDemo {$i}",
                'address' => "Av. Proveedor {$i} - Lima",
                'phone' => '0144400' . str_pad((string)$i, 2, '0', STR_PAD_LEFT),
                'mobile' => '999880' . str_pad((string)$i, 3, '0', STR_PAD_LEFT),
                'contact_name' => "Contacto Proveedor {$i}",
                'contact_position' => 'Compras',
                'contact_phone' => '988770' . str_pad((string)$i, 3, '0', STR_PAD_LEFT),
                'contact_email' => "proveedor{$i}@demo.pe",
                'email_1' => "proveedor{$i}@demo.pe",
                'business_line' => 'Farmaceutico',
                'billing_type' => 'Factura',
                'credit_type' => $i % 2 === 0 ? 'Credito' : 'Contado',
                'bank' => 'BCP',
                'bank_account_cci' => '0020000000000000' . str_pad((string)$i, 4, '0', STR_PAD_LEFT),
                'payment_system' => 'Transferencia',
                'payment_term_days' => $i % 2 === 0 ? 30 : 0,
                'evaluation' => 'Proveedor demo para pruebas',
                'status' => true,
                'created_by' => $user->getAuthIdentifier(),
                'updated_by' => $user->getAuthIdentifier(),
            ]);
        }
        return $suppliers;
    }

    private function seedClients(User $user): array
    {
        $clients = [];
        for ($i = 1; $i <= 10; $i++) {
            $clients[] = Client::create([
                'document_type' => 'RUC',
                'document_number' => '2055000' . str_pad((string)$i, 4, '0', STR_PAD_LEFT),
                'client_kind' => 'regular',
                'full_name' => "Cliente Demo {$i}",
                'is_platform' => $i % 3 === 0,
                'has_storage_service' => $i % 4 === 0,
                'contract_due_days' => 15 + $i,
                'commercial_channel' => $i % 2 === 0 ? 'Botica' : 'Distribuidor',
                'segment' => $i % 2 === 0 ? 'Retail' : 'Mayorista',
                'email' => "cliente{$i}@demo.pe",
                'billing_email' => "facturacion{$i}@demo.pe",
                'primary_contact' => "Comprador {$i}",
                'primary_contact_phone' => '955660' . str_pad((string)$i, 3, '0', STR_PAD_LEFT),
                'phone' => '955660' . str_pad((string)$i, 3, '0', STR_PAD_LEFT),
                'phone_prefix' => '+51',
                'short_code' => 'CLD' . str_pad((string)$i, 3, '0', STR_PAD_LEFT),
                'ubigeo' => '150101',
                'full_address' => "Calle Cliente {$i} 123, Lima",
                'status' => true,
                'created_by' => $user->getAuthIdentifier(),
                'updated_by' => $user->getAuthIdentifier(),
            ]);
        }
        return $clients;
    }

    private function seedEventualClients(User $user): array
    {
        $eventualClients = [];
        for ($i = 1; $i <= 10; $i++) {
            $eventualClients[] = EventualClient::create([
                'document_type' => $i % 2 === 0 ? 'RUC' : 'DNI',
                'document_number' => $i % 2 === 0
                    ? '2066000' . str_pad((string)$i, 4, '0', STR_PAD_LEFT)
                    : '7000' . str_pad((string)$i, 4, '0', STR_PAD_LEFT),
                'business_name' => "Cliente Eventual Demo {$i}",
                'email' => "eventual{$i}@demo.pe",
                'phone_prefix' => '+51',
                'phone' => '977550' . str_pad((string)$i, 3, '0', STR_PAD_LEFT),
                'address' => "Av. Eventual {$i} 456, Lima",
                'contact_name' => "Contacto Eventual {$i}",
                'notes' => 'Cliente eventual demo',
                'status' => true,
                'created_by' => $user->getAuthIdentifier(),
                'updated_by' => $user->getAuthIdentifier(),
            ]);
        }
        return $eventualClients;
    }

    private function seedDistributionNetworks(array $clients, User $user): array
    {
        $networks = [];
        $addresses = [];

        foreach ($clients as $index => $client) {
            $network = ClientDistributionNetwork::create([
                'client_id' => $client->id,
                'code' => 'DEMO-NET-' . str_pad((string)($index + 1), 3, '0', STR_PAD_LEFT),
                'name' => 'Nodo Demo ' . ($index + 1),
                'commercial_channel' => $client->commercial_channel,
                'segment' => $client->segment,
                'contact_name' => $client->primary_contact,
                'contact_phone' => $client->primary_contact_phone,
                'contact_email' => $client->billing_email,
                'observations' => 'Red de distribucion demo',
                'is_default' => true,
                'status' => true,
                'created_by' => $user->getAuthIdentifier(),
                'updated_by' => $user->getAuthIdentifier(),
            ]);
            $networks[] = $network;

            for ($addressIndex = 1; $addressIndex <= 2; $addressIndex++) {
                $addresses[] = ClientDeliveryAddress::create([
                    'client_distribution_network_id' => $network->id,
                    'client_id' => $client->id,
                    'code' => 'DIR-' . ($index + 1) . '-' . $addressIndex,
                    'name' => "Direccion {$addressIndex} Cliente " . ($index + 1),
                    'ubigeo' => '15010' . (($addressIndex % 2) + 1),
                    'department' => 'Lima',
                    'province' => 'Lima',
                    'district' => $addressIndex === 1 ? 'Lima' : 'San Isidro',
                    'address' => "Direccion demo {$addressIndex} cliente " . ($index + 1),
                    'reference' => $addressIndex === 1 ? 'Principal' : 'Alterna',
                    'latitude' => -12.046374 + ($index * 0.001),
                    'longitude' => -77.042793 + ($addressIndex * 0.001),
                    'contact_name' => $client->primary_contact,
                    'contact_phone' => $client->primary_contact_phone,
                    'is_default' => $addressIndex === 1,
                    'status' => true,
                    'created_by' => $user->getAuthIdentifier(),
                    'updated_by' => $user->getAuthIdentifier(),
                ]);
            }
        }

        return [$networks, $addresses];
    }

    private function seedPriceLists(array $businesses, array $branches, array $warehouses, array $clients, array $eventualClients, array $networks, array $articles, array $laboratories, User $user): array
    {
        $priceLists = [];

        for ($i = 1; $i <= 10; $i++) {
            $business = $businesses[($i - 1) % count($businesses)];
            $branch = $branches[($i - 1) % count($branches)];
            $warehouse = $warehouses[($i - 1) % count($warehouses)];
            $article = $articles[($i - 1) % count($articles)];
            $laboratory = $laboratories[($i - 1) % count($laboratories)];

            $payload = [
                'code' => 'TAR-DEMO-' . str_pad((string)$i, 3, '0', STR_PAD_LEFT),
                'business_id' => $business->id,
                'business_branch_id' => $branch->id,
                'warehouse_id' => $warehouse->id,
                'currency' => 'PEN',
                'priority' => $i,
                'starts_at' => now()->subDays(5)->toDateString(),
                'observations' => 'Tarifario demo',
                'status' => true,
                'created_by' => $user->getAuthIdentifier(),
                'updated_by' => $user->getAuthIdentifier(),
            ];

            if ($i <= 8) {
                $payload['client_id'] = $clients[$i - 1]->id;
                $payload['client_distribution_network_id'] = $networks[$i - 1]->id;
                $payload['channel'] = $clients[$i - 1]->commercial_channel;
                $payload['segment'] = $clients[$i - 1]->segment;
            } else {
                $payload['eventual_client_id'] = $eventualClients[$i - 9]->id;
            }

            $priceList = PriceList::create($payload);

            PriceListItem::create([
                'price_list_id' => $priceList->id,
                'article_id' => $article->id,
                'fixed_price' => 18 + $i,
                'minimum_quantity' => 1,
                'status' => true,
            ]);

            PriceListItem::create([
                'price_list_id' => $priceList->id,
                'laboratory_id' => $laboratory->id,
                'margin_percent' => 35 + $i,
                'minimum_quantity' => 2,
                'status' => true,
            ]);

            $priceLists[] = $priceList;
        }

        return $priceLists;
    }

    private function seedPurchaseOrders(array $businesses, array $branches, array $warehouses, array $suppliers, array $articles): array
    {
        $purchaseOrders = [];
        $controller = app(PurchaseOrderController::class);

        for ($i = 1; $i <= 10; $i++) {
            $business = $businesses[($i - 1) % count($businesses)];
            $branch = $branches[($i - 1) % count($branches)];
            $warehouse = $warehouses[($i - 1) % count($warehouses)];
            $supplier = $suppliers[$i - 1];

            $articleA = $articles[($i - 1) % count($articles)];
            $articleB = $articles[$i % count($articles)];

            $payload = [
                'business_id' => $business->id,
                'business_branch_id' => $branch->id,
                'warehouse_id' => $warehouse->id,
                'supplier_id' => $supplier->id,
                'issue_date' => now()->subDays(20 - $i)->toDateString(),
                'expected_date' => now()->subDays(18 - $i)->toDateString(),
                'currency' => 'PEN',
                'payment_condition' => $i % 2 === 0 ? 'Credito' : 'Contado',
                'order_status' => 'approved',
                'approval_status' => 'approved',
                'tax_amount' => 0,
                'observations' => 'Orden de compra demo',
                'items' => [
                    [
                        'article_id' => $articleA->id,
                        'requested_quantity' => 90 + $i,
                        'received_quantity' => 0,
                        'price_unit' => 10 + $i,
                    ],
                    [
                        'article_id' => $articleB->id,
                        'requested_quantity' => 70 + $i,
                        'received_quantity' => 0,
                        'price_unit' => 12 + $i,
                    ],
                ],
            ];

            $purchaseOrders[] = $this->persistThroughController($controller, $payload);
        }

        return $purchaseOrders;
    }

    private function seedPurchaseReceipts(array $purchaseOrders, array $businesses, array $branches, array $warehouses, array $suppliers, array $articles): array
    {
        $receipts = [];
        $controller = app(PurchaseReceiptController::class);

        foreach ($purchaseOrders as $index => $purchaseOrder) {
            $i = $index + 1;
            $business = $businesses[$index % count($businesses)];
            $branch = $branches[$index % count($branches)];
            $warehouse = $warehouses[$index % count($warehouses)];
            $supplier = $suppliers[$index];
            $purchaseOrder = PurchaseReceipt::query()->getModel()::unguarded(function () use ($purchaseOrder) {
                return \App\Models\PurchaseOrder::with('items')->findOrFail($purchaseOrder['id']);
            });

            $receiptItems = [];
            foreach ($purchaseOrder->items as $itemIndex => $item) {
                $article = $articles[array_search($item->article_id, array_column(array_map(fn($article) => ['id' => $article->id], $articles), 'id')) ?: 0] ?? Article::findOrFail($item->article_id);
                $quantity = $itemIndex === 0 ? (float)$item->requested_quantity : round((float)$item->requested_quantity * 0.85, 3);
                $receiptItems[] = [
                    'purchase_order_item_id' => $item->id,
                    'article_id' => $article->id,
                    'warehouse_id' => $warehouse->id,
                    'batch_code' => 'DEMO-LOT-' . str_pad((string)$i, 3, '0', STR_PAD_LEFT) . '-' . ($itemIndex + 1),
                    'lot' => 'DEMO-LOT-' . str_pad((string)$i, 3, '0', STR_PAD_LEFT) . '-' . ($itemIndex + 1),
                    'expiration_date' => now()->addMonths(12 + $i)->toDateString(),
                    'stock_before' => 0,
                    'units_per_box' => 1,
                    'boxes_quantity' => $quantity,
                    'cost_unit' => 9 + $i + $itemIndex,
                    'location' => 'Rack ' . (($i % 4) + 1),
                    'quantity' => $quantity,
                ];
            }

            $payload = [
                'purchase_order_id' => $purchaseOrder->id,
                'business_id' => $business->id,
                'business_branch_id' => $branch->id,
                'warehouse_id' => $warehouse->id,
                'supplier_id' => $supplier->id,
                'issue_date' => now()->subDays(15 - $i)->toDateString(),
                'receipt_status' => 'confirmed',
                'document_type' => 'Factura',
                'document_series' => 'F001',
                'document_sequence' => str_pad((string)(1000 + $i), 6, '0', STR_PAD_LEFT),
                'currency' => 'PEN',
                'payment_condition' => $i % 2 === 0 ? 'Credito' : 'Contado',
                'first_due_date' => $i % 2 === 0 ? now()->addDays(15 + $i)->toDateString() : now()->subDays(15 - $i)->toDateString(),
                'installments' => $i % 2 === 0 ? 2 : 1,
                'guide_series' => 'T001',
                'guide_sequence' => str_pad((string)(2000 + $i), 6, '0', STR_PAD_LEFT),
                'guide_ruc' => $supplier->ruc,
                'observations' => 'Recepcion demo confirmada',
                'tax_amount' => 0,
                'items' => $receiptItems,
            ];

            $receipts[] = $this->persistThroughController($controller, $payload);
        }

        return $receipts;
    }

    private function seedAccountsPayablePayments(array $receipts): void
    {
        $controller = app(AccountsPayableController::class);

        foreach ($receipts as $index => $receipt) {
            if ($index >= 6) break;

            $accountsPayable = DB::table('accounts_payable')
                ->where('source_type', 'purchase_receipt')
                ->where('source_id', $receipt['id'])
                ->first();

            if (!$accountsPayable || $accountsPayable->payment_condition !== 'Credito') continue;

            $balance = (float)$accountsPayable->balance_amount;
            if ($balance <= 0) continue;

            $amount = $index % 2 === 0 ? round($balance / 2, 2) : round($balance, 2);
            $request = Request::create('/api/admin/accounts-payable/' . $accountsPayable->id . '/payments', 'POST', [
                'amount' => $amount,
                'payment_date' => now()->subDays(3 - ($index % 3))->toDateString(),
                'payment_method' => $index % 2 === 0 ? 'Transferencia' : 'Yape',
                'bank' => 'BCP',
                'operation_number' => 'AP-DEMO-' . str_pad((string)($index + 1), 3, '0', STR_PAD_LEFT),
                'observations' => 'Pago demo cuenta por pagar',
            ]);

            $response = $controller->registerPayment($request, (string)$accountsPayable->id);
            if ($response->getStatusCode() !== 200) {
                throw new \RuntimeException('No se pudo registrar el pago demo de cuenta por pagar: ' . $response->getContent());
            }
        }
    }

    private function seedCommercialOrders(array $businesses, array $branches, array $warehouses, array $clients, array $eventualClients, array $networks, array $addresses, array $articles, array $presentations): array
    {
        $commercialOrders = [];
        $controller = app(CommercialOrderController::class);

        for ($i = 1; $i <= 10; $i++) {
            $business = $businesses[($i - 1) % count($businesses)];
            $branch = $branches[($i - 1) % count($branches)];
            $warehouse = $warehouses[($i - 1) % count($warehouses)];
            $articleA = $articles[($i - 1) % count($articles)];
            $articleB = $articles[$i % count($articles)];
            $presentationA = collect($presentations)->firstWhere('article_id', $articleA->id);
            $presentationB = collect($presentations)->firstWhere('article_id', $articleB->id);

            $payload = [
                'business_id' => $business->id,
                'business_branch_id' => $branch->id,
                'warehouse_id' => $warehouse->id,
                'document_type' => $i % 2 === 0 ? 'Factura' : 'Boleta',
                'currency' => 'PEN',
                'payment_condition' => $i <= 4 ? 'Contado' : 'Credito',
                'payment_method' => $i % 2 === 0 ? 'Transferencia' : 'Yape',
                'issue_date' => now()->subDays(8 - $i)->toDateString(),
                'promised_delivery_at' => now()->addDays($i)->toDateString(),
                'installments' => $i <= 4 ? 1 : 2,
                'first_due_date' => $i <= 4 ? now()->subDays(8 - $i)->toDateString() : now()->addDays(7 + $i)->toDateString(),
                'order_status' => 'confirmed',
                'dispatch_status' => $i % 3 === 0 ? 'preparing' : 'pending',
                'billing_status' => 'pending',
                'tax_amount' => 0,
                'observations' => 'Pedido comercial demo',
                'items' => [
                    [
                        'article_id' => $articleA->id,
                        'presentation_id' => $presentationA?->id,
                        'warehouse_id' => $warehouse->id,
                        'quantity' => 2 + ($i % 3),
                    ],
                    [
                        'article_id' => $articleB->id,
                        'presentation_id' => $presentationB?->id,
                        'warehouse_id' => $warehouse->id,
                        'quantity' => 1 + ($i % 2),
                    ],
                ],
            ];

            if ($i <= 8) {
                $client = $clients[$i - 1];
                $network = $networks[$i - 1];
                $defaultAddress = collect($addresses)->first(fn($address) => $address->client_distribution_network_id === $network->id && $address->is_default);

                $payload['client_id'] = $client->id;
                $payload['client_distribution_network_id'] = $network->id;
                $payload['client_delivery_address_id'] = $defaultAddress?->id;
            } else {
                $payload['eventual_client_id'] = $eventualClients[$i - 9]->id;
                $payload['delivery_address'] = 'Direccion manual eventual demo ' . $i;
                $payload['delivery_reference'] = 'Recepcion eventual';
                $payload['ubigeo'] = '150101';
                $payload['dispatch_contact_name'] = 'Contacto eventual demo';
                $payload['dispatch_contact_phone'] = '988001122';
            }

            $commercialOrders[] = $this->persistThroughController($controller, $payload);
        }

        return $commercialOrders;
    }

    private function seedAccountsReceivablePayments(array $commercialOrders): void
    {
        $controller = app(AccountsReceivableController::class);

        foreach ($commercialOrders as $index => $commercialOrder) {
            $accountsReceivable = DB::table('accounts_receivable')
                ->where('source_type', 'commercial_order')
                ->where('source_id', $commercialOrder['id'])
                ->first();

            if (!$accountsReceivable) continue;

            $balance = (float)$accountsReceivable->balance_amount;
            if ($balance <= 0) continue;

            if ($index < 4) {
                $amount = $balance;
            } elseif ($index < 7) {
                $amount = round($balance / 2, 2);
            } else {
                continue;
            }

            $request = Request::create('/api/admin/accounts-receivable/' . $accountsReceivable->id . '/payments', 'POST', [
                'amount' => $amount,
                'payment_date' => now()->subDays($index % 4)->toDateString(),
                'payment_method' => $index % 2 === 0 ? 'Transferencia' : 'Yape',
                'bank' => 'BCP',
                'operation_number' => 'AR-DEMO-' . str_pad((string)($index + 1), 3, '0', STR_PAD_LEFT),
                'observations' => 'Pago demo cuenta por cobrar',
            ]);

            $response = $controller->registerPayment($request, (string)$accountsReceivable->id);
            if ($response->getStatusCode() !== 200) {
                throw new \RuntimeException('No se pudo registrar el pago demo de cuenta por cobrar: ' . $response->getContent());
            }
        }
    }

    private function persistThroughController(object $controller, array $payload): array
    {
        $request = Request::create('/demo', 'POST', $payload);
        $response = $controller->save($request);
        if ($response->getStatusCode() !== 200) {
            throw new \RuntimeException('No se pudo persistir el demo: ' . $response->getContent());
        }

        $data = json_decode($response->getContent(), true);
        if (($data['status'] ?? 400) !== 200 || empty($data['data'])) {
            throw new \RuntimeException('Respuesta invalida al persistir demo: ' . $response->getContent());
        }

        return $data['data'];
    }

    private function buildSummary(): array
    {
        return [
            'suppliers_demo' => Supplier::query()->where('business_name', 'like', 'Proveedor Demo %')->count(),
            'clients_demo' => Client::query()->where('full_name', 'like', 'Cliente Demo %')->count(),
            'eventual_clients_demo' => EventualClient::query()->where('business_name', 'like', 'Cliente Eventual Demo %')->count(),
            'distribution_networks_demo' => ClientDistributionNetwork::query()->where('code', 'like', 'DEMO-NET-%')->count(),
            'delivery_addresses_demo' => ClientDeliveryAddress::query()
                ->whereIn('client_distribution_network_id', ClientDistributionNetwork::query()->where('code', 'like', 'DEMO-NET-%')->pluck('id'))
                ->count(),
            'price_lists_demo' => PriceList::query()->where('code', 'like', 'TAR-DEMO-%')->count(),
            'purchase_orders_demo' => DB::table('purchase_orders')->whereIn('business_id', Business::query()->where('name', 'like', 'DEMO OPERATIVO %')->pluck('id'))->count(),
            'purchase_receipts_demo' => DB::table('purchase_receipts')->whereIn('business_id', Business::query()->where('name', 'like', 'DEMO OPERATIVO %')->pluck('id'))->count(),
            'accounts_payable_demo' => DB::table('accounts_payable')->whereIn('business_id', Business::query()->where('name', 'like', 'DEMO OPERATIVO %')->pluck('id'))->count(),
            'accounts_payable_payments_demo' => DB::table('accounts_payable_payments')->whereIn('accounts_payable_id', DB::table('accounts_payable')->whereIn('business_id', Business::query()->where('name', 'like', 'DEMO OPERATIVO %')->pluck('id'))->pluck('id'))->count(),
            'commercial_orders_demo' => DB::table('commercial_orders')->whereIn('business_id', Business::query()->where('name', 'like', 'DEMO OPERATIVO %')->pluck('id'))->count(),
            'accounts_receivable_demo' => DB::table('accounts_receivable')->whereIn('business_id', Business::query()->where('name', 'like', 'DEMO OPERATIVO %')->pluck('id'))->count(),
            'receivable_payments_demo' => DB::table('receivable_payments')->whereIn('accounts_receivable_id', DB::table('accounts_receivable')->whereIn('business_id', Business::query()->where('name', 'like', 'DEMO OPERATIVO %')->pluck('id'))->pluck('id'))->count(),
        ];
    }
}
