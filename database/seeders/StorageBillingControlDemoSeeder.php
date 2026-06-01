<?php

namespace Database\Seeders;

use App\Models\BillingDocument;
use App\Models\BillingDocumentItem;
use App\Models\Business;
use App\Models\BusinessBranch;
use App\Models\Client;
use App\Models\ServiceCatalog;
use App\Models\ServiceOrder;
use App\Models\ServiceOrderItem;
use App\Models\User;
use App\Support\BusinessScope;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class StorageBillingControlDemoSeeder extends Seeder
{
    private ?int $userId = null;

    public function run(): void
    {
        if (!$this->hasRequiredTables()) {
            return;
        }

        $this->userId = User::query()->orderBy('id')->value('id');

        DB::transaction(function () {
            $business = $this->ensureBusiness();
            $branch = $this->ensureBranch($business);
            $client = $this->ensureClient();
            $service = $this->ensureService();
            $order = $this->ensureServiceOrder($business, $branch, $client);
            $item = $this->ensureServiceOrderItem($order, $service);

            if (!$this->hasPrefactures()) {
                $this->ensureDocument('STG-BILL-DEMO-PREF-001', $business, $branch, $client, $order, $item, [
                    'document_type' => 'Factura',
                    'series' => null,
                    'sequence' => null,
                    'local_status' => 'pending',
                    'external_status' => 'draft',
                    'observations' => 'Prefactura demo de almacenamiento.',
                ]);
            }

            if (!$this->hasIssuedInvoices()) {
                $this->ensureDocument('STG-BILL-DEMO-ISS-001', $business, $branch, $client, $order, $item, [
                    'document_type' => 'Factura',
                    'series' => 'FM01',
                    'sequence' => '00001001',
                    'local_status' => 'accepted',
                    'external_status' => 'accepted',
                    'external_id' => 'EXT-STG-DEMO-1001',
                    'external_reference' => 'SUNAT-STG-DEMO-1001',
                    'sent_at' => now(),
                    'accepted_at' => now(),
                    'observations' => 'Factura emitida demo de almacenamiento.',
                ]);
            }

            if (!$this->hasCancelledInvoices()) {
                $this->ensureDocument('STG-BILL-DEMO-CAN-001', $business, $branch, $client, $order, $item, [
                    'document_type' => 'Factura',
                    'series' => 'FM01',
                    'sequence' => '00001002',
                    'local_status' => 'cancelled',
                    'external_status' => 'cancelled',
                    'external_id' => 'EXT-STG-DEMO-1002',
                    'cancelled_at' => now(),
                    'observations' => 'Factura anulada demo de almacenamiento.',
                ]);
            }

            if (!$this->hasCreditNotes()) {
                $reference = $this->acceptedReference($business, $branch, $client, $order, $item);
                $this->ensureDocument('STG-BILL-DEMO-NC-001', $business, $branch, $client, $order, $item, [
                    'reference_billing_document_id' => $reference->id,
                    'document_type' => 'Nota de credito',
                    'series' => 'FCM1',
                    'sequence' => '00000001',
                    'local_status' => 'accepted',
                    'external_status' => 'accepted',
                    'external_id' => 'EXT-STG-DEMO-NC-1',
                    'external_reference' => 'SUNAT-STG-DEMO-NC-1',
                    'sent_at' => now(),
                    'accepted_at' => now(),
                    'subtotal' => 120,
                    'tax_amount' => 0,
                    'total' => 120,
                    'observations' => 'Nota de credito demo de almacenamiento.',
                ]);
            }
        });
    }

    private function hasRequiredTables(): bool
    {
        foreach (['businesses', 'business_branches', 'clients', 'services', 'service_orders', 'service_order_items', 'billing_documents', 'billing_document_items'] as $table) {
            if (!Schema::hasTable($table)) return false;
        }

        return true;
    }

    private function ensureBusiness(): Business
    {
        return Business::query()->updateOrCreate(
            ['business_key' => BusinessScope::KAMARY_MEDICALS],
            [
                'name' => 'Kamary Medicals',
                'trade_name' => 'Kamary Medicals',
                'description' => 'Empresa de servicios de almacenamiento.',
                'facturador_sync_status' => 'pending',
                'facturador_sync_message' => 'Datos demo para control de facturacion de almacenamiento.',
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]
        );
    }

    private function ensureBranch(Business $business): BusinessBranch
    {
        return BusinessBranch::query()->updateOrCreate(
            ['business_id' => $business->id, 'name' => 'Almacenamiento Principal'],
            [
                'establishment_code' => '0000',
                'ubigeo' => '150101',
                'address' => 'Sede demo de almacenamiento',
                'email' => 'almacenamiento@kamary.pe',
                'telephone' => '014856320',
                'series_factura' => 'FM01',
                'series_boleta' => 'BM01',
                'series_nota_credito' => 'FCM1',
                'facturador_sync_status' => 'pending',
                'facturador_sync_message' => 'Sede demo de almacenamiento.',
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]
        );
    }

    private function ensureClient(): Client
    {
        return Client::query()->updateOrCreate(
            ['document_type' => 'RUC', 'document_number' => '20609000999', 'module_scope' => 'storage'],
            [
                'client_kind' => 'regular',
                'full_name' => 'Cliente Demo Control Facturacion Storage SAC',
                'has_storage_service' => true,
                'storage_tariff_enabled' => true,
                'email' => 'cliente.storage.demo@kamary.pe',
                'billing_email' => 'facturacion.storage.demo@kamary.pe',
                'phone' => '+51 999 000 999',
                'phone_prefix' => '+51',
                'ubigeo' => '150101',
                'full_address' => 'Av. Demo Storage 123, Lima',
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]
        );
    }

    private function ensureService(): ServiceCatalog
    {
        return ServiceCatalog::query()->updateOrCreate(
            ['code' => 'STG-BILL-DEMO-SER'],
            [
                'service_scope' => 'storage_general',
                'name' => 'Servicio demo de almacenamiento mensual',
                'category' => 'Almacenamiento',
                'subcategory' => 'Control de facturacion',
                'service_type' => 'Almacenamiento',
                'billing_unit' => 'Mes',
                'unit_price_pen' => 500,
                'unit_price_usd' => 135,
                'commissions_enabled' => false,
                'observations' => 'Servicio demo para control de facturacion.',
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]
        );
    }

    private function ensureServiceOrder(Business $business, BusinessBranch $branch, Client $client): ServiceOrder
    {
        return ServiceOrder::query()->updateOrCreate(
            ['code' => 'OS-STG-BILL-DEMO-001'],
            [
                'order_type' => 'storage_service',
                'business_id' => $business->id,
                'business_branch_id' => $branch->id,
                'client_id' => $client->id,
                'expected_document_type' => 'Factura',
                'currency' => 'PEN',
                'billing_cycle' => 'Mensual',
                'contract_label' => 'Contrato demo control facturacion',
                'payment_condition' => 'Contado',
                'installments' => 1,
                'billing_day' => 30,
                'detraction_enabled' => false,
                'issue_date' => now()->subDays(15)->toDateString(),
                'scheduled_at' => now()->subDays(10)->toDateString(),
                'first_due_date' => now()->toDateString(),
                'order_status' => 'approved',
                'billing_status' => 'partial',
                'subtotal' => 500,
                'tax_amount' => 0,
                'total' => 500,
                'observations' => 'OS demo para control de facturacion de almacenamiento.',
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]
        );
    }

    private function ensureServiceOrderItem(ServiceOrder $order, ServiceCatalog $service): ServiceOrderItem
    {
        return ServiceOrderItem::query()->updateOrCreate(
            ['service_order_id' => $order->id, 'service_id' => $service->id],
            [
                'scope' => 'Almacenamiento recurrente',
                'gloss' => 'Servicio mensual demo para control de facturacion',
                'description' => 'Serv. Almacen. | Almacen Km 4 - Mes demo',
                'quantity' => 1,
                'unit_price' => 500,
                'detraction_percent' => 0,
                'commission_percent' => 0,
                'total' => 500,
                'status' => true,
            ]
        );
    }

    private function acceptedReference(Business $business, BusinessBranch $branch, Client $client, ServiceOrder $order, ServiceOrderItem $item): BillingDocument
    {
        return $this->ensureDocument('STG-BILL-DEMO-NC-REF-001', $business, $branch, $client, $order, $item, [
            'document_type' => 'Factura',
            'series' => 'FM01',
            'sequence' => '00001003',
            'local_status' => 'accepted',
            'external_status' => 'accepted',
            'external_id' => 'EXT-STG-DEMO-1003',
            'external_reference' => 'SUNAT-STG-DEMO-1003',
            'sent_at' => now(),
            'accepted_at' => now(),
            'observations' => 'Factura referencia demo para nota de credito.',
        ]);
    }

    private function ensureDocument(string $code, Business $business, BusinessBranch $branch, Client $client, ServiceOrder $order, ServiceOrderItem $item, array $overrides): BillingDocument
    {
        $subtotal = (float) ($overrides['subtotal'] ?? 500);
        $taxAmount = (float) ($overrides['tax_amount'] ?? 0);
        $total = (float) ($overrides['total'] ?? ($subtotal + $taxAmount));
        $issueDate = Carbon::parse($overrides['issue_date'] ?? now())->toDateString();

        $document = BillingDocument::query()->updateOrCreate(
            ['code' => $code],
            array_merge([
                'source_type' => 'service_order',
                'source_id' => $order->id,
                'commercial_order_id' => null,
                'service_order_id' => $order->id,
                'reference_billing_document_id' => null,
                'business_id' => $business->id,
                'business_branch_id' => $branch->id,
                'warehouse_id' => null,
                'client_id' => $client->id,
                'eventual_client_id' => null,
                'provider' => 'facturadorpro5',
                'document_type' => 'Factura',
                'series' => null,
                'sequence' => null,
                'issue_date' => $issueDate,
                'due_date' => Carbon::parse($issueDate)->addDays(7)->toDateString(),
                'currency' => 'PEN',
                'payment_condition' => 'Contado',
                'payment_method' => 'Transferencia',
                'customer_email' => $client->billing_email ?: $client->email,
                'local_status' => 'pending',
                'external_status' => 'draft',
                'external_id' => null,
                'external_reference' => null,
                'provider_endpoint' => null,
                'provider_mode' => 'demo',
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'total' => $total,
                'request_payload' => null,
                'response_payload' => null,
                'error_message' => null,
                'sent_at' => null,
                'accepted_at' => null,
                'cancelled_at' => null,
                'metadata' => [
                    'source_code' => $order->code,
                    'document_origin' => 'storage_billing_control_demo',
                ],
                'observations' => 'Documento demo de control de facturacion de almacenamiento.',
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ], $overrides)
        );

        BillingDocumentItem::query()->updateOrCreate(
            ['billing_document_id' => $document->id, 'service_order_item_id' => $item->id],
            [
                'commercial_order_item_id' => null,
                'item_type' => 'service',
                'item_code' => 'STG-BILL-DEMO-SER',
                'description' => $item->description,
                'quantity' => $item->quantity,
                'unit_price' => $item->unit_price,
                'total' => $total,
                'metadata' => [
                    'source' => 'storage_billing_control_demo',
                    'service_id' => $item->service_id,
                ],
                'status' => true,
            ]
        );

        $this->ensureEvent($document, (string) ($overrides['local_status'] ?? 'pending'), (string) ($overrides['external_status'] ?? 'draft'));

        return $document;
    }

    private function ensureEvent(BillingDocument $document, string $localStatus, string $externalStatus): void
    {
        if (!Schema::hasTable('billing_events')) {
            return;
        }

        DB::table('billing_events')->updateOrInsert(
            [
                'billing_document_id' => $document->id,
                'event_type' => $localStatus === 'pending' ? 'prepared' : $localStatus,
            ],
            [
                'local_status' => $localStatus,
                'external_status' => $externalStatus,
                'message' => 'Evento demo de control de facturacion de almacenamiento.',
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }

    private function storageBillingQuery()
    {
        return BillingDocument::query()
            ->where('source_type', 'service_order')
            ->where('status', true)
            ->whereHas('serviceOrder', function ($query) {
                $query->where('order_type', 'storage_service')
                    ->whereHas('client', function ($client) {
                        $client->where('client_kind', 'regular')
                            ->where('module_scope', 'storage')
                            ->whereNotNull('status');
                    });
            });
    }

    private function hasPrefactures(): bool
    {
        return (clone $this->storageBillingQuery())
            ->where('local_status', 'pending')
            ->where(function ($query) {
                $query->whereNull('series')->orWhere('series', '');
            })
            ->where(function ($query) {
                $query->whereNull('sequence')->orWhere('sequence', '');
            })
            ->where('document_type', '<>', 'Nota de credito')
            ->exists();
    }

    private function hasIssuedInvoices(): bool
    {
        return (clone $this->storageBillingQuery())
            ->whereIn('local_status', ['sent', 'accepted', 'observed', 'rejected'])
            ->where('document_type', '<>', 'Nota de credito')
            ->exists();
    }

    private function hasCancelledInvoices(): bool
    {
        return (clone $this->storageBillingQuery())
            ->where('local_status', 'cancelled')
            ->where('document_type', '<>', 'Nota de credito')
            ->exists();
    }

    private function hasCreditNotes(): bool
    {
        return (clone $this->storageBillingQuery())
            ->where('document_type', 'Nota de credito')
            ->exists();
    }
}
