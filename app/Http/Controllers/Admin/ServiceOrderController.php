<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\BillingDocument;
use App\Models\BillingDocumentItem;
use App\Models\Client;
use App\Models\ServiceCatalog;
use App\Models\ServiceOrder;
use App\Models\ServiceOrderItem;
use App\Services\BillingDocumentService;
use App\Support\BusinessScope;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ServiceOrderController extends BasicController
{
    public $model = ServiceOrder::class;
    public $reactView = 'Admin/ServiceOrders';
    public $prefix4filter = 'service_orders';
    public $ignoreStatusFilter = true;

    private array $itemsPayload = [];

    public function setReactViewProperties(Request $request)
    {
        return [
            'requiredPermission' => 'services-service-order',
            'moduleTitle' => 'Orden de Servicio',
            'serviceOrderType' => $this->orderType(),
        ];
    }

    protected function orderType(): string
    {
        return 'service';
    }

    protected function codePrefix(): string
    {
        return 'OS';
    }

    protected function clientModuleScopeForOrder(): string
    {
        return $this->orderType() === 'service' ? 'services' : 'storage';
    }

    public function setPaginationInstance(string $model)
    {
        $query = $model::select('service_orders.*')
            ->with([
                'business:id,name', 'branch:id,business_id,name', 'client:id,full_name,document_number', 'seller:id,name,lastname,username,fullname',
                'accountsReceivable:id,service_order_id,code,total,paid_amount,balance_amount,payment_status,status',
                'items:id,service_order_id,service_id,scope,gloss,description,quantity,unit_price,detraction_percent,commission_percent,total,status',
                'items.service:id,code,name,category,subcategory,billing_unit',
                'creator:id,name,lastname,username,fullname', 'updater:id,name,lastname,username,fullname',
            ])
            ->join('users as creator', 'creator.id', '=', 'service_orders.created_by')
            ->join('users as updater', 'updater.id', '=', 'service_orders.updated_by');

        if (Schema::hasColumn('service_orders', 'order_type')) {
            $query->where('service_orders.order_type', $this->orderType());
        }

        if (request()->boolean('deleted')) {
            $query->whereNull('service_orders.status');
        } else {
            $query->whereNotNull('service_orders.status');
        }

        $scopeKey = BusinessScope::scopedKeyForRequest(request());
        $query->whereHas('business', function ($business) use ($scopeKey) {
            $business->whereIn('business_key', BusinessScope::fixedKeys());
            if ($scopeKey) $business->where('business_key', $scopeKey);
        });

        return $query;
    }

    public function branches(Request $request, string $businessId)
    {
        $business = BusinessScope::findFixedBusinessForRequest($businessId, $request);
        return response([
            'status' => 200,
            'message' => 'Operacion correcta',
            'data' => $business->branches()->whereNotNull('status')->orderBy('name')->get(['id', 'business_id', 'name', 'status']),
        ], 200);
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $userId = Auth::id();
        $id = $body['id'] ?? null;
        $businessId = (int) ($body['business_id'] ?? 0);
        $branchId = $this->toNullableInt($body['business_branch_id'] ?? null);
        $clientId = $this->normalizeClientId($body['client_id'] ?? null);
        $sellerId = $this->toNullableInt($body['seller_id'] ?? null) ?: $userId;
        $issueDate = $this->normalizeDate($body['issue_date'] ?? now()->toDateString());

        if ($businessId <= 0) throw new \Exception('La empresa es obligatoria');
        if ($clientId <= 0) throw new \Exception('El cliente es obligatorio');
        if (!$issueDate) throw new \Exception('La fecha es obligatoria');

        $business = BusinessScope::findFixedBusinessForRequest($businessId, $request);
        $client = Client::findOrFail($clientId);
        if ($client->client_kind !== 'regular') throw new \Exception('La orden de servicio debe trabajar con cliente regular');
        if (
            Schema::hasColumn('clients', 'module_scope')
            && ($client->module_scope ?? null) !== $this->clientModuleScopeForOrder()
        ) {
            throw new \Exception('El cliente no pertenece a este modulo');
        }

        $branch = BusinessScope::requireBranchForBusiness($business, $branchId);
        $branchId = (int) $branch->id;

        $rawItems = $body['items'] ?? [];
        if (is_string($rawItems)) {
            $decoded = json_decode($rawItems, true);
            $rawItems = is_array($decoded) ? $decoded : [];
        }
        if (!is_array($rawItems)) $rawItems = [];
        $this->itemsPayload = $rawItems;
        unset($body['items']);

        if (!$id) {
            DB::table('businesses')->where('id', $business->id)->lockForUpdate()->value('id');
            $body['code'] = $this->nextCode();
            $body['created_by'] = $userId;
            $body['status'] = true;
        }

        $body['updated_by'] = $userId;
        if (Schema::hasColumn('service_orders', 'order_type')) {
            $body['order_type'] = $this->orderType();
        } else {
            unset($body['order_type']);
        }
        $body['business_id'] = $businessId;
        $body['business_branch_id'] = $branchId;
        $body['client_id'] = $clientId;
        $body['seller_id'] = $sellerId;
        $body['expected_document_type'] = trim((string) ($body['expected_document_type'] ?? 'Factura')) ?: 'Factura';
        $body['currency'] = strtoupper(trim((string) ($body['currency'] ?? 'PEN')));
        $body['billing_cycle'] = trim((string) ($body['billing_cycle'] ?? '')) ?: null;
        if (Schema::hasColumn('service_orders', 'contract_label')) {
            $body['contract_label'] = trim((string) ($body['contract_label'] ?? '')) ?: null;
        } else {
            unset($body['contract_label']);
        }
        $body['payment_condition'] = $this->normalizePaymentCondition($body['payment_condition'] ?? 'Contado');
        $body['installments'] = max(1, $this->toNullableInt($body['installments'] ?? null) ?? 1);
        if (Schema::hasColumn('service_orders', 'billing_day')) {
            $billingDay = $this->toNullableInt($body['billing_day'] ?? null);
            if ($billingDay !== null && ($billingDay < 1 || $billingDay > 31)) {
                throw new \Exception('El dia de facturacion debe estar entre 1 y 31');
            }
            $body['billing_day'] = $billingDay;
        } else {
            unset($body['billing_day']);
        }
        if (Schema::hasColumn('service_orders', 'detraction_enabled')) {
            $body['detraction_enabled'] = $this->toBoolean($body['detraction_enabled'] ?? false);
        } else {
            unset($body['detraction_enabled']);
        }
        $body['issue_date'] = $issueDate;
        $body['scheduled_at'] = $this->normalizeDate($body['scheduled_at'] ?? null);
        $body['first_due_date'] = $this->normalizeDate($body['first_due_date'] ?? null);
        $body['order_status'] = $this->normalizeOrderStatus($body['order_status'] ?? 'draft');
        $body['billing_status'] = $this->normalizeBillingStatus($body['billing_status'] ?? 'pending');
        $body['observations'] = trim((string) ($body['observations'] ?? '')) ?: null;
        $body['subtotal'] = 0;
        $body['tax_amount'] = $this->toDecimal($body['tax_amount'] ?? 0);
        $body['total'] = 0;
        $body['paid_amount'] = $this->toDecimal($body['paid_amount'] ?? 0);
        $body['balance_amount'] = $this->toDecimal($body['balance_amount'] ?? 0);
        $body['payment_status'] = $this->normalizePaymentStatus($body['payment_status'] ?? 'pending');
        $body['billed_at'] = $body['billing_status'] === 'billed' ? ($body['billed_at'] ?? now()) : null;

        return $body;
    }

    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        DB::beginTransaction();
        try {
            ServiceOrderItem::where('service_order_id', $jpa->id)->delete();
            $inserted = 0;
            $subtotal = 0;
            $storageBillingItems = [];

            foreach ($this->itemsPayload as $item) {
                if (!is_array($item)) continue;
                $serviceId = $this->toNullableInt($item['service_id'] ?? null);
                if (!$serviceId) throw new \Exception('Cada linea debe tener servicio');
                $service = ServiceCatalog::findOrFail($serviceId);
                $quantity = $this->toDecimal($item['quantity'] ?? 0, 3);
                if ($quantity <= 0) throw new \Exception("La cantidad debe ser mayor a 0 para {$service->name}");
                $unitPrice = $this->toDecimal($item['unit_price'] ?? ($jpa->currency === 'USD' ? $service->unit_price_usd : $service->unit_price_pen));
                $detraction = $this->toDecimal($item['detraction_percent'] ?? 0);
                $commission = $this->toDecimal($item['commission_percent'] ?? 0);
                $total = $this->toDecimal($item['total'] ?? round($quantity * $unitPrice, 2));
                $parsedStorageSchedule = $this->parseStorageScheduleFromDescription($item['description'] ?? '');
                $billingDates = $this->normalizeBillingDates(
                    $item['billing_dates'] ?? [],
                    $parsedStorageSchedule['start_date'],
                    (int) $parsedStorageSchedule['months']
                );

                $itemData = [
                    'service_order_id' => $jpa->id,
                    'service_id' => $service->id,
                    'description' => trim((string) ($item['description'] ?? $item['gloss'] ?? '')) ?: $service->name,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'detraction_percent' => $detraction,
                    'commission_percent' => $commission,
                    'total' => $total,
                    'status' => true,
                ];
                if (Schema::hasColumn('service_order_items', 'scope')) {
                    $itemData['scope'] = trim((string) ($item['scope'] ?? '')) ?: null;
                }
                if (Schema::hasColumn('service_order_items', 'gloss')) {
                    $itemData['gloss'] = trim((string) ($item['gloss'] ?? '')) ?: null;
                }

                $serviceOrderItem = ServiceOrderItem::create($itemData);
                $subtotal += $this->orderType() === 'storage_service'
                    ? $total * max(1, count($billingDates))
                    : $total;
                if ($this->orderType() === 'storage_service') {
                    $storageBillingItems[] = [
                        'item' => $serviceOrderItem,
                        'billing_dates' => $billingDates,
                    ];
                }
                $inserted++;
            }

            if ($inserted === 0) throw new \Exception('Debes agregar al menos una linea de servicio');

            $subtotal = round($subtotal, 2);
            $taxAmount = round((float) ($request->input('tax_amount') ?? 0), 2);
            $total = round($subtotal + $taxAmount, 2);
            $jpa->update(['subtotal' => $subtotal, 'total' => $total, 'balance_amount' => $total]);

            if ($this->orderType() === 'storage_service') {
                $createdPrefactures = $this->syncStoragePrefactures(
                    $jpa->fresh(['business', 'branch', 'client']),
                    $storageBillingItems
                );
                if ($createdPrefactures > 0 && in_array($jpa->order_status, ['draft', 'approved', 'scheduled'], true)) {
                    $jpa->update(['order_status' => 'prefactured']);
                }
            }

            app(\App\Services\AccountsReceivableService::class)->syncFromServiceOrder($jpa->fresh([
                'client',
                'business',
                'branch',
                'accountsReceivable',
            ]));

            DB::commit();
            return $jpa->fresh(['business', 'branch', 'client', 'seller', 'accountsReceivable', 'items.service', 'creator', 'updater']);
        } catch (\Throwable $th) {
            DB::rollBack();
            throw $th;
        }
    }

    public function boolean(Request $request)
    {
        $response = new \SoDe\Extend\Response();
        DB::beginTransaction();
        try {
            $order = ServiceOrder::findOrFail($request->id);
            $field = trim((string) $request->field);
            if ($field === '') throw new \Exception('Campo invalido');

            $order->update([
                $field => $request->value,
                'updated_by' => Auth::id(),
            ]);

            app(\App\Services\AccountsReceivableService::class)->syncFromServiceOrder($order->fresh([
                'client',
                'business',
                'branch',
                'accountsReceivable',
            ]));

            DB::commit();
            $response->status = 200;
            $response->message = 'Operacion correcta';
        } catch (\Throwable $th) {
            DB::rollBack();
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function status(Request $request)
    {
        $response = new \SoDe\Extend\Response();
        DB::beginTransaction();
        try {
            $order = ServiceOrder::findOrFail($request->id);
            $order->update([
                'status' => $request->status ? 0 : 1,
                'updated_by' => Auth::id(),
            ]);

            app(\App\Services\AccountsReceivableService::class)->syncFromServiceOrder($order->fresh([
                'client',
                'business',
                'branch',
                'accountsReceivable',
            ]));

            DB::commit();
            $response->status = 200;
            $response->message = 'Operacion correcta';
        } catch (\Throwable $th) {
            DB::rollBack();
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function delete(Request $request, string $id)
    {
        $response = new \SoDe\Extend\Response();
        DB::beginTransaction();
        try {
            $order = ServiceOrder::findOrFail($id);
            $order->update([
                'status' => null,
                'updated_by' => Auth::id(),
            ]);

            app(\App\Services\AccountsReceivableService::class)->syncFromServiceOrder($order->fresh([
                'client',
                'business',
                'branch',
                'accountsReceivable',
            ]));

            DB::commit();
            $response->status = 200;
            $response->message = 'Operacion correcta';
        } catch (\Throwable $th) {
            DB::rollBack();
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    private function parseStorageScheduleFromDescription($description): array
    {
        $parts = explode(';', (string) $description);
        $dateText = trim((string) ($parts[2] ?? ''));
        preg_match_all('/\d{4}-\d{2}-\d{2}/', $dateText, $dateMatches);
        $monthText = trim((string) ($parts[3] ?? ''));
        preg_match('/\d+/', $monthText, $monthMatches);

        return [
            'start_date' => $dateMatches[0][0] ?? null,
            'months' => isset($monthMatches[0]) ? (int) $monthMatches[0] : 0,
        ];
    }

    private function normalizeBillingDates($value, ?string $fallbackStartDate, int $fallbackMonths): array
    {
        $rawDates = $value;
        if (is_string($rawDates)) {
            $decoded = json_decode($rawDates, true);
            $rawDates = is_array($decoded) ? $decoded : array_filter(array_map('trim', explode(',', $rawDates)));
        }
        if (!is_array($rawDates)) $rawDates = [];

        $dates = [];
        foreach ($rawDates as $row) {
            $date = is_array($row)
                ? ($row['date'] ?? $row['billing_date'] ?? $row['fecha_facturacion'] ?? null)
                : $row;
            if (!$date) continue;
            $dates[] = $this->normalizeDate($date);
        }

        if (empty($dates) && $fallbackStartDate && $fallbackMonths > 0) {
            $start = Carbon::parse($fallbackStartDate);
            for ($index = 0; $index < $fallbackMonths; $index++) {
                $dates[] = $start->copy()->addMonthsNoOverflow($index)->format('Y-m-d');
            }
        }

        return array_values(array_unique(array_filter($dates)));
    }

    private function syncStoragePrefactures(ServiceOrder $order, array $storageBillingItems): int
    {
        $this->deletePendingStoragePrefactures($order->id);

        $protectedDates = $this->protectedStoragePrefactureDates($order->id);
        $linesByDate = [];
        foreach ($storageBillingItems as $scheduledItem) {
            $serviceOrderItem = $scheduledItem['item'] ?? null;
            if (!$serviceOrderItem instanceof ServiceOrderItem) continue;

            foreach (($scheduledItem['billing_dates'] ?? []) as $index => $billingDate) {
                if (!$billingDate || isset($protectedDates[$billingDate])) continue;
                $linesByDate[$billingDate][] = [
                    'item' => $serviceOrderItem,
                    'month' => $index + 1,
                ];
            }
        }

        ksort($linesByDate);
        $created = 0;
        $userId = Auth::id();
        $billingService = app(BillingDocumentService::class);

        foreach ($linesByDate as $billingDate => $lines) {
            $subtotal = round(array_reduce($lines, function ($carry, $line) {
                return $carry + (float) $line['item']->total;
            }, 0), 2);
            if ($subtotal <= 0) continue;

            $document = BillingDocument::create([
                'code' => $this->nextBillingCode(),
                'source_type' => 'service_order',
                'source_id' => $order->id,
                'commercial_order_id' => null,
                'service_order_id' => $order->id,
                'reference_billing_document_id' => null,
                'business_id' => $order->business_id,
                'business_branch_id' => $order->business_branch_id,
                'warehouse_id' => null,
                'client_id' => $order->client_id,
                'eventual_client_id' => null,
                'provider' => 'facturadorpro5',
                'document_type' => $order->expected_document_type ?: 'Factura',
                'series' => null,
                'sequence' => null,
                'issue_date' => $billingDate,
                'due_date' => $billingDate,
                'currency' => $order->currency ?: 'PEN',
                'payment_condition' => $order->payment_condition ?: 'Contado',
                'payment_method' => null,
                'customer_email' => $order->client?->billing_email ?: $order->client?->email,
                'provider_endpoint' => rtrim((string) config('facturadorpro5.base_url'), '/') . (string) config('facturadorpro5.issue_endpoint'),
                'provider_mode' => config('facturadorpro5.mode', 'demo'),
                'subtotal' => $subtotal,
                'tax_amount' => 0,
                'total' => $subtotal,
                'local_status' => 'pending',
                'external_status' => 'draft',
                'metadata' => [
                    'source_code' => $order->code,
                    'document_origin' => 'storage_service_order',
                    'storage_auto_prefacture' => true,
                    'billing_date' => $billingDate,
                ],
                'observations' => "Prefactura mensual {$billingDate}",
                'status' => true,
                'created_by' => $userId,
                'updated_by' => $userId,
            ]);

            foreach ($lines as $line) {
                $serviceOrderItem = $line['item'];
                BillingDocumentItem::create([
                    'billing_document_id' => $document->id,
                    'commercial_order_item_id' => null,
                    'service_order_item_id' => $serviceOrderItem->id,
                    'item_type' => 'service',
                    'item_code' => $serviceOrderItem->service?->code,
                    'description' => $serviceOrderItem->description ?: ($serviceOrderItem->service?->name ?: 'Servicio'),
                    'quantity' => $serviceOrderItem->quantity,
                    'unit_price' => $serviceOrderItem->unit_price,
                    'total' => $serviceOrderItem->total,
                    'metadata' => [
                        'service_id' => $serviceOrderItem->service_id,
                        'detraction_percent' => $serviceOrderItem->detraction_percent,
                        'commission_percent' => $serviceOrderItem->commission_percent,
                        'storage_billing_date' => $billingDate,
                        'storage_billing_month' => $line['month'],
                    ],
                    'status' => true,
                ]);
            }

            $freshDocument = $billingService->refreshConnectorPayload($document->fresh(['items', 'client', 'eventualClient', 'business', 'branch', 'serviceOrder']));
            $billingService->registerEvent($freshDocument, 'prepared', [
                'message' => 'Prefactura mensual generada desde la orden de almacenamiento',
            ]);
            $created++;
        }

        return $created;
    }

    private function deletePendingStoragePrefactures(int $orderId): void
    {
        $documents = BillingDocument::query()
            ->where('source_type', 'service_order')
            ->where('source_id', $orderId)
            ->where('service_order_id', $orderId)
            ->where('local_status', 'pending')
            ->get();

        foreach ($documents as $document) {
            if (!$this->isStorageAutoPrefacture($document)) continue;
            BillingDocumentItem::where('billing_document_id', $document->id)->delete();
            $document->delete();
        }
    }

    private function protectedStoragePrefactureDates(int $orderId): array
    {
        return BillingDocument::query()
            ->where('source_type', 'service_order')
            ->where('source_id', $orderId)
            ->where('service_order_id', $orderId)
            ->where('status', true)
            ->get()
            ->filter(function ($document) {
                return $this->isStorageAutoPrefacture($document)
                    && !in_array($document->local_status, ['pending', 'cancelled'], true);
            })
            ->mapWithKeys(function ($document) {
                $date = $document->due_date ?: $document->issue_date;
                return $date ? [$date->format('Y-m-d') => true] : [];
            })
            ->all();
    }

    private function isStorageAutoPrefacture(BillingDocument $document): bool
    {
        $metadata = is_array($document->metadata) ? $document->metadata : [];
        return (bool) ($metadata['storage_auto_prefacture'] ?? false)
            || ($metadata['document_origin'] ?? null) === 'storage_service_order';
    }

    private function toNullableInt($value): ?int
    {
        if ($value === null) return null;
        $text = trim((string) $value);
        if ($text === '') return null;
        if (!ctype_digit(ltrim($text, '+'))) throw new \Exception("Valor entero invalido: {$value}");
        return (int) $text;
    }

    private function normalizeClientId($value): int
    {
        if ($value === null) return 0;

        $text = trim((string) $value);
        if ($text === '') return 0;
        if (preg_match('/^client-(\d+)$/i', $text, $matches)) return (int) $matches[1];
        if (preg_match('/^eventual-(\d+)$/i', $text)) {
            throw new \Exception('La orden de servicio debe trabajar con cliente regular');
        }
        if (!ctype_digit(ltrim($text, '+'))) throw new \Exception("Valor entero invalido: {$value}");

        return (int) $text;
    }

    private function toDecimal($value, int $precision = 2): float
    {
        $text = trim((string) $value);
        if ($text === '') return 0;
        if (!is_numeric($text)) throw new \Exception("Valor numerico invalido: {$value}");
        return round((float) $text, $precision);
    }

    private function toBoolean($value): bool
    {
        if (is_bool($value)) return $value;
        if (is_numeric($value)) return (bool) ((int) $value);
        return in_array(mb_strtolower(trim((string) $value)), ['1', 'true', 'si', 'sí', 'yes', 'on'], true);
    }

    private function normalizeDate($value): ?string
    {
        if ($value === null) return null;
        $text = trim((string) $value);
        if ($text === '') return null;
        $timestamp = strtotime($text);
        if ($timestamp === false) throw new \Exception("Fecha invalida: {$value}");
        return date('Y-m-d', $timestamp);
    }

    private function normalizePaymentCondition($value): string
    {
        $normalized = mb_strtolower(trim((string) $value));
        return $normalized === 'credito' ? 'Credito' : 'Contado';
    }

    private function normalizeOrderStatus($value): string
    {
        $allowed = ['draft', 'approved', 'scheduled', 'executing', 'prefactured', 'invoiced', 'closed', 'cancelled'];
        $normalized = mb_strtolower(trim((string) $value));
        return in_array($normalized, $allowed, true) ? $normalized : 'draft';
    }

    private function normalizeBillingStatus($value): string
    {
        $allowed = ['pending', 'partial', 'billed', 'cancelled'];
        $normalized = mb_strtolower(trim((string) $value));
        return in_array($normalized, $allowed, true) ? $normalized : 'pending';
    }

    private function normalizePaymentStatus($value): string
    {
        $allowed = ['pending', 'partial', 'paid'];
        $normalized = mb_strtolower(trim((string) $value));
        return in_array($normalized, $allowed, true) ? $normalized : 'pending';
    }

    protected function nextCode(): string
    {
        $next = 1;
        $latest = ServiceOrder::query()
            ->when(Schema::hasColumn('service_orders', 'order_type'), fn($query) => $query->where('order_type', $this->orderType()))
            ->lockForUpdate()
            ->latest('id')
            ->value('code');
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) $next = ((int) $matches[1]) + 1;
        return $this->codePrefix() . '-' . str_pad((string) $next, 6, '0', STR_PAD_LEFT);
    }

    private function nextBillingCode(): string
    {
        $next = 1;
        $latest = BillingDocument::query()->lockForUpdate()->latest('id')->value('code');
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) $next = ((int) $matches[1]) + 1;
        return 'FAC-' . str_pad((string) $next, 6, '0', STR_PAD_LEFT);
    }
}
