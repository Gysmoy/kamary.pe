<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Http\Classes\dxResponse;
use App\Models\Article;
use App\Models\ArticlePresentation;
use App\Models\Client;
use App\Models\ClientDeliveryAddress;
use App\Models\ClientDistributionNetwork;
use App\Models\CommercialOrder;
use App\Models\CommercialOrderItem;
use App\Models\dxDataGrid;
use App\Models\EventualClient;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\AccountsReceivableService;
use App\Services\CommercialOrderTrackingService;
use App\Services\CommercialOrderStockService;
use App\Services\PriceListResolverService;
use App\Services\StockService;
use App\Support\BusinessScope;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Carbon;
use SoDe\Extend\Response;

class CommercialOrderController extends BasicController
{
    public $model = CommercialOrder::class;
    public $reactView = 'Admin/CommercialOrders';
    public $prefix4filter = 'commercial_orders';

    private array $itemsPayload = [];
    private bool $allowStockShortage = false;

    public function setReactViewProperties(Request $request)
    {
        return [
            'requiredPermission' => 'orders',
            'externalSource' => $request->is('admin/commercial-orders/multivende')
                ? config('integrations.ecomsur.external_source', 'ecomsur_oms')
                : null,
            'pageTitle' => $request->is('admin/commercial-orders/multivende')
                ? 'Pedidos Multivende'
                : 'Pedidos comerciales',
        ];
    }

    public function setPaginationInstance(string $model)
    {
        $itemColumns = 'items:id,commercial_order_id,article_id,presentation_id,warehouse_id,price_list_item_id,external_item_number,external_sku,external_payload,stock_available,';
        if (Schema::hasColumn('commercial_order_items', 'reserved_quantity')) {
            $itemColumns .= 'reserved_quantity,';
        }
        $itemColumns .= 'cost_unit,price_unit,presentation_units,quantity,total,price_source,status';

        $query = $model::select('commercial_orders.*')
            ->with([
                'business:id,name',
                'branch:id,business_id,name',
                'warehouse:id,name',
                'client:id,document_type,document_number,full_name',
                'eventualClient:id,document_type,document_number,business_name',
                'deliveryAddress:id,client_distribution_network_id,client_id,code,name,address,reference,ubigeo,latitude,longitude,contact_name,contact_phone',
                'seller:id,name,lastname,username,fullname',
                'priceList:id,code',
                'accountsReceivable:id,source_id,code,total,paid_amount,balance_amount,payment_status,status',
                'billingDocuments' => fn ($documents) => $documents
                    ->select('id', 'commercial_order_id', 'code', 'document_type', 'series', 'sequence', 'external_status', 'external_reference', 'status')
                    ->whereNotNull('status'),
                $itemColumns,
                'items.article:id,code,name,default_lot,laboratory_id,active_principle_id,unit_id',
                'items.article.laboratory:id,name',
                'items.article.activePrinciple:id,name',
                'items.article.unit:id,name,symbol',
                'items.article.presentations:id,article_id,name,units,price,status',
                'items.presentation:id,article_id,name,units,price',
                'items.priceListItem:id,price_list_id,article_id,laboratory_id,fixed_price,margin_percent,minimum_quantity,status',
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
                'dispatchAssignments:id,dispatch_id,commercial_order_id,assignment_status,status',
                'dispatchAssignments.dispatch:id,code,dispatch_status,manifest_code,scheduled_date,departed_at,delivered_at,status',
                'referralGuides:id,code,business_id,business_branch_id,warehouse_id,dispatch_id,commercial_order_id,driver_id,vehicle_id,series,sequence,external_reference,issue_date,transfer_date,guide_status,external_status,origin_ubigeo,origin_address,destination_ubigeo,destination_address,recipient_name,recipient_document_type,recipient_document_number,recipient_phone,driver_name,driver_document_type,driver_document_number,driver_license_number,vehicle_plate,transfer_reason,package_count,gross_weight,metadata,observations,status',
                'referralGuides.business:id,name,tax_number',
                'referralGuides.branch:id,business_id,name,ubigeo,address',
                'referralGuides.dispatch:id,code,manifest_code,dispatch_status,scheduled_date',
                'referralGuides.items:id,referral_guide_id,item_code,description,unit,quantity,gross_weight,status',
                'deliveryEvidences:id,code,business_id,dispatch_id,commercial_order_id,driver_id,recipient_name,recipient_document_type,recipient_document_number,recipient_phone,evidence_url,evidence_notes,delivered_at,latitude,longitude,status,created_at',
                'deliveryEvidences.dispatch:id,code,manifest_code,dispatch_status',
                'deliveryEvidences.driver:id,full_name,license_number',
                'trackingEvents:id,commercial_order_id,dispatch_id,referral_guide_id,event_type,event_status,title,description,happened_at,metadata,status,created_at',
            ])
            ->join('users as creator', 'creator.id', '=', 'commercial_orders.created_by')
            ->join('users as updater', 'updater.id', '=', 'commercial_orders.updated_by');

        $scopeKey = BusinessScope::scopedKeyForRequest(request());
        $query->whereHas('business', function ($business) use ($scopeKey) {
            $business->whereIn('business_key', BusinessScope::fixedKeys());
            if ($scopeKey) $business->where('business_key', $scopeKey);
        });

        return $query;
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $userId = Auth::id();
        $orderId = $body['id'] ?? null;
        $persistedOrder = $orderId ? CommercialOrder::find($orderId) : null;

        $businessId = $this->toNullableInt($body['business_id'] ?? null);
        $branchId = $this->toNullableInt($body['business_branch_id'] ?? null);
        $warehouseId = $this->toNullableInt($body['warehouse_id'] ?? null);
        $clientId = $this->toNullableInt($body['client_id'] ?? null);
        $eventualClientId = $this->toNullableInt($body['eventual_client_id'] ?? null);
        $networkId = $this->toNullableInt($body['client_distribution_network_id'] ?? null);
        $deliveryAddressId = $this->toNullableInt($body['client_delivery_address_id'] ?? null);
        $sellerId = $this->toNullableInt($body['seller_id'] ?? null) ?? $userId;
        $issueDate = $this->normalizeDate($body['issue_date'] ?? now()->toDateString());
        $promisedDate = $this->normalizeDate($body['promised_delivery_at'] ?? null);
        $firstDueDate = $this->normalizeDate($body['first_due_date'] ?? null);

        if (!$businessId) throw new \Exception('La empresa es obligatoria');
        if (!$warehouseId) throw new \Exception('El almacen es obligatorio');
        if (!$issueDate) throw new \Exception('La fecha de emision es obligatoria');
        if (!$clientId && !$eventualClientId) throw new \Exception('Debes seleccionar un cliente regular o eventual');
        if ($clientId && $eventualClientId) throw new \Exception('No puedes mezclar cliente regular y eventual en el mismo pedido');

        $business = BusinessScope::findFixedBusinessForRequest($businessId, $request);
        $warehouse = Warehouse::findOrFail($warehouseId);
        User::findOrFail($sellerId);

        $branchId = BusinessScope::branchIdFromWarehouse($business, $warehouse, $branchId);

        $client = null;
        $eventualClient = null;
        if ($clientId) {
            $client = Client::findOrFail($clientId);
            if ($client->client_kind !== 'regular') {
                throw new \Exception('El cliente del pedido comercial debe ser regular');
            }
        } else {
            $eventualClient = EventualClient::findOrFail($eventualClientId);
        }

        $network = null;
        $deliveryAddress = null;

        if ($clientId) {
            if (!$networkId) {
                $network = ClientDistributionNetwork::where('client_id', $clientId)
                    ->where('status', 1)
                    ->where('is_default', 1)
                    ->first();
                $networkId = $network?->id;
            }

            if ($networkId) {
                $network = $network ?: ClientDistributionNetwork::findOrFail($networkId);
                if ((int)$network->client_id !== (int)$clientId) {
                    throw new \Exception('La red de distribucion no pertenece al cliente seleccionado');
                }

                if (!$deliveryAddressId) {
                    $deliveryAddress = ClientDeliveryAddress::where('client_distribution_network_id', $networkId)
                        ->where('status', 1)
                        ->where('is_default', 1)
                        ->first();
                    $deliveryAddressId = $deliveryAddress?->id;
                }
            }

            if ($deliveryAddressId) {
                $deliveryAddress = $deliveryAddress ?: ClientDeliveryAddress::findOrFail($deliveryAddressId);
                if ($networkId && (int)$deliveryAddress->client_distribution_network_id !== (int)$networkId) {
                    throw new \Exception('La direccion de entrega no pertenece a la red seleccionada');
                }
                if ((int)$deliveryAddress->client_id !== (int)$clientId) {
                    throw new \Exception('La direccion de entrega no pertenece al cliente seleccionado');
                }
            }
        } elseif ($networkId || $deliveryAddressId) {
            throw new \Exception('Los pedidos con cliente eventual no usan red de distribucion ni direccion ligada a cliente');
        }

        $commercialChannel = trim((string)($body['commercial_channel'] ?? '')) ?: null;
        $segment = trim((string)($body['segment'] ?? '')) ?: null;
        if ($network) {
            $commercialChannel = $network->commercial_channel ?: $commercialChannel;
            $segment = $network->segment ?: $segment;
        } elseif ($client) {
            $commercialChannel = $client->commercial_channel ?: $commercialChannel;
            $segment = $client->segment ?: $segment;
        }

        $rawItems = $body['items'] ?? [];
        if (is_string($rawItems)) {
            $decoded = json_decode($rawItems, true);
            $rawItems = is_array($decoded) ? $decoded : [];
        }
        if (!is_array($rawItems)) $rawItems = [];
        $this->allowStockShortage = filter_var($body['allow_stock_shortage'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $this->itemsPayload = $rawItems;
        unset($body['allow_stock_shortage']);
        unset($body['items']);

        $reservationPlan = app(CommercialOrderStockService::class)->buildReservationPlan(
            $rawItems,
            (int)$warehouseId,
            $orderId ? (int)$orderId : null
        );
        if (!$this->allowStockShortage) {
            app(CommercialOrderStockService::class)->assertNoShortages(
                $reservationPlan,
                'Stock insuficiente para crear el pedido.'
            );
        }

        if (!$orderId) {
            $body['code'] = $this->nextCode();
            $body['created_by'] = $userId;
            $body['status'] = true;
        }

        $body['updated_by'] = $userId;
        $body['business_id'] = $businessId;
        $body['business_branch_id'] = $branchId;
        $body['warehouse_id'] = $warehouseId;
        $body['client_id'] = $clientId;
        $body['eventual_client_id'] = $eventualClientId;
        $body['client_distribution_network_id'] = $networkId;
        $body['client_delivery_address_id'] = $deliveryAddressId;
        $body['seller_id'] = $sellerId;
        $body['doctor_name'] = trim((string)($body['doctor_name'] ?? '')) ?: null;
        $externalSource = trim((string) ($body['external_source'] ?? ($persistedOrder?->external_source ?? ''))) ?: null;
        $body['external_source'] = $externalSource;
        $body['document_type'] = $this->normalizeDocumentType($body['document_type'] ?? 'Factura');
        $body['currency'] = $this->normalizeCurrency($body['currency'] ?? 'PEN');
        $body['payment_condition'] = $this->normalizePaymentCondition($body['payment_condition'] ?? 'Contado');
        $body['payment_method'] = trim((string)($body['payment_method'] ?? '')) ?: null;
        $body['purchase_order'] = trim((string)($body['purchase_order'] ?? '')) ?: null;
        $body['guide_number'] = trim((string)($body['guide_number'] ?? '')) ?: null;
        $body['referral_guide'] = trim((string)($body['referral_guide'] ?? '')) ?: null;
        $body['commercial_channel'] = $commercialChannel;
        $body['segment'] = $segment;
        $body['order_status'] = $this->normalizeOrderStatus($body['order_status'] ?? ($externalSource ? 'pending' : 'draft'));
        $body['dispatch_status'] = $this->normalizeDispatchStatus($body['dispatch_status'] ?? 'pending');
        $body['billing_status'] = $this->normalizeBillingStatus($body['billing_status'] ?? 'pending');
        $body['issue_date'] = $issueDate;
        $body['promised_delivery_at'] = $promisedDate;
        $body['installments'] = max(1, $this->toNullableInt($body['installments'] ?? null) ?? 1);
        $body['first_due_date'] = $firstDueDate;
        $body['delivery_address'] = ($this->textValue($body['delivery_address'] ?? null) ?: $this->textValue($deliveryAddress->address ?? '')) ?: null;
        $body['delivery_reference'] = ($this->textValue($body['delivery_reference'] ?? null) ?: $this->textValue($deliveryAddress->reference ?? '')) ?: null;
        $body['ubigeo'] = ($this->textValue($body['ubigeo'] ?? null) ?: $this->textValue($deliveryAddress->ubigeo ?? '')) ?: null;
        $body['map_lat'] = $this->toNullableDecimal($body['map_lat'] ?? ($deliveryAddress->latitude ?? null));
        $body['map_lng'] = $this->toNullableDecimal($body['map_lng'] ?? ($deliveryAddress->longitude ?? null));
        $body['dispatch_contact_name'] = ($this->textValue($body['dispatch_contact_name'] ?? null) ?: $this->textValue($deliveryAddress->contact_name ?? '')) ?: null;
        $body['dispatch_contact_phone'] = ($this->textValue($body['dispatch_contact_phone'] ?? null) ?: $this->textValue($deliveryAddress->contact_phone ?? '')) ?: null;
        $body['subtotal'] = $this->toNullableDecimal($body['subtotal'] ?? null) ?? 0;
        $body['tax_amount'] = $this->toNullableDecimal($body['tax_amount'] ?? null) ?? 0;
        $body['total'] = $this->toNullableDecimal($body['total'] ?? null) ?? 0;
        $body['paid_amount'] = $this->toNullableDecimal($body['paid_amount'] ?? null) ?? 0;
        $body['balance_amount'] = $this->toNullableDecimal($body['balance_amount'] ?? null) ?? 0;
        $body['payment_status'] = $this->normalizePaymentStatus($body['payment_status'] ?? 'pending');
        $body['observations'] = trim((string)($body['observations'] ?? '')) ?: null;
        $body['approved_at'] = in_array($body['order_status'], ['confirmed', 'preparing', 'dispatched', 'billed', 'closed'], true)
            ? ($body['approved_at'] ?? now())
            : null;
        $body['billed_at'] = $body['billing_status'] === 'billed'
            ? ($body['billed_at'] ?? now())
            : null;

        return $body;
    }

    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        DB::beginTransaction();
        try {
            $stockReservationService = app(CommercialOrderStockService::class);
            if (!$isNew) {
                $stockReservationService->releaseOrderReservations(
                    $jpa->fresh(['items']),
                    'Liberacion de reserva por actualizacion del pedido'
                );
            }
            CommercialOrderItem::where('commercial_order_id', $jpa->id)->delete();

            $inserted = 0;
            $subtotal = 0;
            $matchedPriceListIds = [];
            $business = BusinessScope::findFixedBusiness($jpa->business_id);
            $reservationPlan = $stockReservationService->buildReservationPlan(
                $this->itemsPayload,
                (int)$jpa->warehouse_id,
                (int)$jpa->id
            );
            if (!$this->allowStockShortage) {
                $stockReservationService->assertNoShortages(
                    $reservationPlan,
                    'Stock insuficiente para crear el pedido.'
                );
            }

            foreach ($this->itemsPayload as $itemIndex => $item) {
                if (!is_array($item)) continue;

                $articleId = $this->toNullableInt($item['article_id'] ?? null);
                if (!$articleId) throw new \Exception('Cada linea debe tener articulo');

                $article = Article::with(['presentations:id,article_id,name,units,price,status'])->findOrFail($articleId);
                $presentationId = $this->toNullableInt($item['presentation_id'] ?? null);
                $presentationUnits = $this->toNullableDecimal($item['presentation_units'] ?? null) ?? 1;

                if ($presentationId) {
                    $presentation = ArticlePresentation::where('id', $presentationId)
                        ->where('article_id', $article->id)
                        ->firstOrFail();
                    $presentationUnits = (float)($presentation->units ?? 1);
                }
                if ($presentationUnits <= 0) $presentationUnits = 1;

                $warehouseId = $this->toNullableInt($item['warehouse_id'] ?? null) ?? (int)$jpa->warehouse_id;
                $itemWarehouse = Warehouse::findOrFail($warehouseId);
                BusinessScope::branchIdFromWarehouse($business, $itemWarehouse, $jpa->business_branch_id);

                $quantity = $this->toNullableDecimal($item['quantity'] ?? null) ?? 0;
                if ($quantity <= 0) {
                    throw new \Exception("La cantidad por linea debe ser mayor a 0 para {$article->name}");
                }
                $baseQuantity = round($quantity * $presentationUnits, 3);

                $stockPlan = $reservationPlan['items'][$itemIndex] ?? null;
                $availableStock = $stockPlan
                    ? (float)$stockPlan['available_for_reservation']
                    : $this->getAvailableStockByWarehouse((int)$articleId, (int)$warehouseId);
                $reservedQuantity = $stockPlan
                    ? (float)$stockPlan['reserved_quantity']
                    : min($baseQuantity, $availableStock);

                $resolution = app(PriceListResolverService::class)->resolve([
                    'business_id' => $jpa->business_id,
                    'business_branch_id' => $jpa->business_branch_id,
                    'warehouse_id' => $warehouseId,
                    'client_id' => $jpa->client_id,
                    'eventual_client_id' => $jpa->eventual_client_id,
                    'client_distribution_network_id' => $jpa->client_distribution_network_id,
                    'commercial_channel' => $jpa->commercial_channel,
                    'segment' => $jpa->segment,
                    'issue_date' => $jpa->issue_date instanceof Carbon ? $jpa->issue_date->format('Y-m-d') : $jpa->issue_date,
                ], $article, $quantity, $presentationId);

                $requestedPriceUnit = $this->toNullableDecimal($item['price_unit'] ?? null);
                $priceUnit = is_null($requestedPriceUnit) || $requestedPriceUnit <= 0
                    ? (float)$resolution['price_unit']
                    : (float)$requestedPriceUnit;
                $priceSource = (!is_null($requestedPriceUnit) && abs($requestedPriceUnit - (float)$resolution['price_unit']) > 0.0001)
                    ? 'manual'
                    : $resolution['source'];

                $grossLineTotal = round((float)$quantity * (float)$priceUnit, 2);
                $discountType = $this->normalizeDiscountType($item['discount_type'] ?? 'none');
                $discountValue = max(0, $this->toNullableDecimal($item['discount_value'] ?? null) ?? 0);
                $discountAmount = $this->calculateLineDiscount($grossLineTotal, $discountType, $discountValue);
                $lineTotal = round(max(0, $grossLineTotal - $discountAmount), 2);

                $itemPayload = [
                    'commercial_order_id' => $jpa->id,
                    'article_id' => $article->id,
                    'presentation_id' => $presentationId ?: null,
                    'warehouse_id' => $warehouseId,
                    'price_list_item_id' => $resolution['price_list_item_id'],
                    'stock_available' => $availableStock,
                    'cost_unit' => $resolution['base_cost'],
                    'price_unit' => $priceUnit,
                    'presentation_units' => $presentationUnits,
                    'quantity' => $quantity,
                    'total' => $lineTotal,
                    'price_source' => $priceSource,
                    'external_payload' => [
                        'commercial_form' => [
                            'discount_type' => $discountType,
                            'discount_value' => $discountType === 'none' ? 0 : $discountValue,
                            'discount_amount' => $discountAmount,
                            'gross_total' => $grossLineTotal,
                        ],
                    ],
                    'status' => isset($item['status']) ? (bool)$item['status'] : true,
                ];
                if ($stockReservationService->supportsReservations()) {
                    $itemPayload['reserved_quantity'] = $reservedQuantity;
                }
                CommercialOrderItem::create($itemPayload);

                if ($resolution['price_list_id']) {
                    $matchedPriceListIds[] = (int)$resolution['price_list_id'];
                }

                $subtotal += (float)$lineTotal;
                $inserted++;
            }

            if ($inserted === 0) throw new \Exception('Debes agregar al menos un item');

            $subtotal = round($subtotal, 2);
            $totals = $this->deriveFinancialTotals($subtotal, $jpa->document_type);
            $matchedPriceListIds = array_values(array_unique($matchedPriceListIds));

            $jpa->update([
                'price_list_id' => count($matchedPriceListIds) === 1 ? $matchedPriceListIds[0] : null,
                'subtotal' => $totals['subtotal'],
                'tax_amount' => $totals['tax_amount'],
                'total' => $totals['total'],
                'balance_amount' => round(max(0, (float) $totals['total'] - (float) $jpa->paid_amount), 2),
            ]);

            app(AccountsReceivableService::class)->syncFromCommercialOrder($jpa->fresh([
                'client',
                'eventualClient',
                'business',
                'branch',
                'warehouse',
            ]));
            $freshOrder = $jpa->fresh(['items']);
            $stockReservationService->recordOrderReservationMovements($freshOrder);
            $stockReservationService->recordReservationTracking($freshOrder, $reservationPlan);

            DB::commit();

            return $this->loadCommercialOrder($jpa->id);
        } catch (\Throwable $th) {
            DB::rollBack();
            throw $th;
        }
    }

    public function branches(Request $request, string $businessId): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            $business = BusinessScope::findFixedBusinessForRequest($businessId, $request);
            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = $business->branches()->whereNotNull('status')->orderBy('name')->get(['id', 'business_id', 'name', 'status']);
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function distributionNetworks(Request $request, string $clientId): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            Client::findOrFail($clientId);
            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = ClientDistributionNetwork::with('addresses:id,client_distribution_network_id,client_id,code,name,address,reference,ubigeo,latitude,longitude,contact_name,contact_phone,is_default,status')
                ->where('client_id', $clientId)
                ->whereNotNull('status')
                ->orderByDesc('is_default')
                ->orderBy('name')
                ->get(['id', 'client_id', 'code', 'name', 'commercial_channel', 'segment', 'is_default', 'status']);
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function deliveryAddresses(Request $request, string $networkId): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            ClientDistributionNetwork::findOrFail($networkId);
            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = ClientDeliveryAddress::where('client_distribution_network_id', $networkId)
                ->whereNotNull('status')
                ->orderByDesc('is_default')
                ->orderBy('name')
                ->get(['id', 'client_distribution_network_id', 'client_id', 'code', 'name', 'ubigeo', 'address', 'reference', 'latitude', 'longitude', 'contact_name', 'contact_phone', 'is_default', 'status']);
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function resolvePrice(Request $request): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            $articleId = $this->toNullableInt($request->query('article_id'));
            $warehouseId = $this->toNullableInt($request->query('warehouse_id'));
            $presentationId = $this->toNullableInt($request->query('presentation_id'));
            $quantity = $this->toNullableDecimal($request->query('quantity')) ?? 1;

            if (!$articleId) throw new \Exception('El articulo es obligatorio');
            if (!$warehouseId) throw new \Exception('El almacen es obligatorio');

            $article = Article::with(['presentations:id,article_id,name,units,price,status'])->findOrFail($articleId);
            $resolution = app(PriceListResolverService::class)->resolve([
                'business_id' => $this->toNullableInt($request->query('business_id')),
                'business_branch_id' => $this->toNullableInt($request->query('business_branch_id')),
                'warehouse_id' => $warehouseId,
                'client_id' => $this->toNullableInt($request->query('client_id')),
                'eventual_client_id' => $this->toNullableInt($request->query('eventual_client_id')),
                'client_distribution_network_id' => $this->toNullableInt($request->query('client_distribution_network_id')),
                'commercial_channel' => trim((string)$request->query('commercial_channel', '')) ?: null,
                'segment' => trim((string)$request->query('segment', '')) ?: null,
                'issue_date' => $this->normalizeDate($request->query('issue_date')) ?? now()->toDateString(),
            ], $article, $quantity, $presentationId);

            $response->status = 200;
            $response->message = 'Operacion correcta';
            $stockPlan = app(CommercialOrderStockService::class)->buildReservationPlan([[
                'article_id' => $articleId,
                'warehouse_id' => $warehouseId,
                'quantity' => max(1, $quantity),
            ]], $warehouseId);
            $response->data = array_merge($resolution, [
                'stock_available' => $stockPlan['items'][0]['available_for_reservation'] ?? $this->getAvailableStockByWarehouse($articleId, $warehouseId),
            ]);
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function articles(Request $request): HttpResponse|ResponseFactory
    {
        $response = new dxResponse();
        try {
            $warehouseId = $this->toNullableInt($request->query('warehouse_id', $request->input('warehouse_id')));
            if (!$warehouseId) {
                $response->status = 200;
                $response->message = 'Operacion correcta';
                $response->data = [];
                $response->totalCount = 0;
                return response($response->toArray(), $response->status);
            }

            $search = $this->extractSearchTerm($request->input('filter', []));
            $stockRows = app(StockService::class)->availableStorageStockRows(
                $warehouseId,
                $search,
                0,
                BusinessScope::scopedKeyForRequest($request) ?: BusinessScope::KAMARY_PERU
            );
            $articleIds = collect($stockRows)
                ->pluck('article_id')
                ->filter()
                ->unique()
                ->values()
                ->all();

            if (empty($articleIds)) {
                $response->status = 200;
                $response->message = 'Operacion correcta';
                $response->data = [];
                $response->totalCount = 0;
                return response($response->toArray(), $response->status);
            }

            $query = Article::query()
                ->select('articles.*')
                ->with([
                    'laboratory:id,name,code',
                    'activePrinciple:id,laboratory_id,name',
                    'client:id,full_name,document_number',
                    'unit:id,name,symbol',
                    'presentations:id,article_id,name,units,price,sort_order,status',
                ])
                ->where(function ($scope) {
                    $scope->where('articles.module_scope', 'standard')
                        ->orWhereNull('articles.module_scope');
                })
                ->whereNotNull('articles.status')
                ->whereIn('articles.id', $articleIds);

            if ($request->sort != null) {
                foreach ($request->sort as $sorting) {
                    $selector = $sorting['selector'] ?? 'name';
                    if (!in_array($selector, ['id', 'code', 'name'], true)) $selector = 'name';
                    $query->orderBy("articles.{$selector}", !empty($sorting['desc']) ? 'DESC' : 'ASC');
                }
            } else {
                $query->orderBy('articles.name');
            }

            $response->totalCount = $request->requireTotalCount
                ? (clone $query)->count('articles.id')
                : 0;
            $response->data = $query
                ->skip($request->skip ?? 0)
                ->take($request->take ?? 10)
                ->get();
            $response->status = 200;
            $response->message = 'Operacion correcta';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function boolean(Request $request)
    {
        $response = new Response();
        DB::beginTransaction();
        try {
            $order = CommercialOrder::findOrFail($request->id);
            $field = trim((string)$request->field);
            if ($field === '') throw new \Exception('Campo invalido');
            if (!in_array($field, ['status', 'order_status', 'dispatch_status', 'billing_status', 'payment_status', 'document_type'], true)) {
                throw new \Exception('Campo no permitido para esta operacion');
            }

            $value = $request->value;
            $payload = [
                'updated_by' => Auth::id(),
            ];
            if ($field === 'order_status') {
                $payload[$field] = $this->normalizeOrderStatus($value);
                $payload['approved_at'] = in_array($payload[$field], ['confirmed', 'preparing', 'in_route', 'delivered', 'dispatched', 'billed', 'closed'], true)
                    ? ($order->approved_at ?? now())
                    : null;
            } elseif ($field === 'dispatch_status') {
                $payload[$field] = $this->normalizeDispatchStatus($value);
                if ($payload[$field] === 'dispatched') {
                    app(CommercialOrderStockService::class)->assertOrderReadyForDispatch($order);
                }
                $nextOrderStatus = $this->orderStatusFromDispatchStatus($payload[$field]);
                if ($nextOrderStatus && !in_array($order->order_status, ['billed', 'closed', 'cancelled'], true)) {
                    $payload['order_status'] = $nextOrderStatus;
                    $payload['approved_at'] = $order->approved_at ?? now();
                }
            } elseif ($field === 'billing_status') {
                $payload[$field] = $this->normalizeBillingStatus($value);
                $payload['billed_at'] = $payload[$field] === 'billed' ? ($order->billed_at ?? now()) : null;
            } elseif ($field === 'document_type') {
                $payload[$field] = $this->normalizeDocumentType($value);
                $totals = $this->deriveFinancialTotals((float) $order->total, $payload[$field]);
                $payload['subtotal'] = $totals['subtotal'];
                $payload['tax_amount'] = $totals['tax_amount'];
                $payload['total'] = $totals['total'];
                $payload['balance_amount'] = round(max(0, (float) $totals['total'] - (float) $order->paid_amount), 2);
            } else {
                $payload[$field] = $value;
            }
            $order->update($payload);
            if (
                ($field === 'dispatch_status' && in_array($payload[$field] ?? null, ['cancelled', 'delivered'], true))
                || ($field === 'order_status' && in_array($payload[$field] ?? null, ['cancelled', 'closed'], true))
            ) {
                app(CommercialOrderStockService::class)->releaseOrderReservations($order);
            }

            app(AccountsReceivableService::class)->syncFromCommercialOrder($order->fresh([
                'client',
                'eventualClient',
                'business',
                'branch',
                'warehouse',
            ]));
            if (in_array($field, ['order_status', 'dispatch_status', 'billing_status'], true)) {
                $freshOrder = $order->fresh();
                $tracking = app(CommercialOrderTrackingService::class);
                $tracking->recordStatusChange($freshOrder, $field, $payload[$field]);
                if ($field === 'dispatch_status' && array_key_exists('order_status', $payload)) {
                    $tracking->recordStatusChange($freshOrder, 'order_status', $payload['order_status']);
                }
                app(\App\Services\Integrations\ExternalOrderEventService::class)->recordOrderStatus($freshOrder, "{$field}_changed");
            }

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
        $response = new Response();
        DB::beginTransaction();
        try {
            $order = CommercialOrder::findOrFail($request->id);
            $order->update([
                'status' => $request->status ? 0 : 1,
                'updated_by' => Auth::id(),
            ]);
            if ($request->status) {
                app(CommercialOrderStockService::class)->releaseOrderReservations($order);
            }

            app(AccountsReceivableService::class)->syncFromCommercialOrder($order->fresh([
                'client',
                'eventualClient',
                'business',
                'branch',
                'warehouse',
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
        $response = new Response();
        DB::beginTransaction();
        try {
            $order = CommercialOrder::findOrFail($id);
            $order->update([
                'status' => null,
                'updated_by' => Auth::id(),
            ]);
            app(CommercialOrderStockService::class)->releaseOrderReservations($order);

            app(AccountsReceivableService::class)->syncFromCommercialOrder($order->fresh([
                'client',
                'eventualClient',
                'business',
                'branch',
                'warehouse',
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

    private function loadCommercialOrder(int $id): CommercialOrder
    {
        return $this->setPaginationInstance($this->model)->findOrFail($id);
    }

    private function getAvailableStockByWarehouse(int $articleId, int $warehouseId): float
    {
        return app(StockService::class)->getAvailableStockByWarehouse($articleId, $warehouseId);
    }

    private function toNullableDecimal($value): ?float
    {
        if ($value === null) return null;
        $text = trim((string)$value);
        if ($text === '') return null;
        if (!is_numeric($text)) throw new \Exception("Valor numerico invalido: {$value}");
        return (float)$text;
    }

    private function toNullableInt($value): ?int
    {
        if ($value === null) return null;
        $text = trim((string)$value);
        if ($text === '') return null;
        if (!ctype_digit(ltrim($text, '+'))) throw new \Exception("Valor entero invalido: {$value}");
        return (int)$text;
    }

    private function normalizeDate($value): ?string
    {
        if ($value === null) return null;
        $text = trim((string)$value);
        if ($text === '') return null;
        $timestamp = strtotime($text);
        if ($timestamp === false) throw new \Exception("Fecha invalida: {$value}");
        return date('Y-m-d', $timestamp);
    }

    private function normalizeCurrency($value): string
    {
        $currency = strtoupper(trim((string)$value));
        return in_array($currency, ['PEN', 'USD', 'EUR'], true) ? $currency : 'PEN';
    }

    private function normalizePaymentCondition($value): string
    {
        $normalized = mb_strtolower(trim((string)$value));
        return $normalized === 'credito' ? 'Credito' : 'Contado';
    }

    private function normalizeDocumentType($value): string
    {
        $normalized = mb_strtolower(trim((string) $value));
        return match ($normalized) {
            'boleta' => 'Boleta',
            'nota de pedido', 'nota_pedido', 'note_order' => 'Nota de pedido',
            default => 'Factura',
        };
    }

    private function textValue($value): string
    {
        if (is_array($value)) {
            foreach (['address', 'reference', 'ubigeo', 'contact_name', 'contact_phone', 'name', 'description', 'value'] as $key) {
                if (array_key_exists($key, $value) && !is_array($value[$key]) && trim((string) $value[$key]) !== '') {
                    return trim((string) $value[$key]);
                }
            }
            return '';
        }

        $text = trim((string) ($value ?? ''));
        return $text === '[object Object]' ? '' : $text;
    }

    private function normalizeOrderStatus($value): string
    {
        $allowed = ['draft', 'pending', 'confirmed', 'preparing', 'in_route', 'delivered', 'dispatched', 'billed', 'closed', 'cancelled'];
        $normalized = mb_strtolower(trim((string)$value));
        return in_array($normalized, $allowed, true) ? $normalized : 'draft';
    }

    private function normalizeDispatchStatus($value): string
    {
        $allowed = ['pending', 'preparing', 'in_route', 'dispatched', 'delivered', 'cancelled'];
        $normalized = mb_strtolower(trim((string)$value));
        return in_array($normalized, $allowed, true) ? $normalized : 'pending';
    }

    private function orderStatusFromDispatchStatus(string $dispatchStatus): ?string
    {
        return match ($dispatchStatus) {
            'preparing' => 'preparing',
            'dispatched' => 'dispatched',
            'in_route' => 'in_route',
            'delivered' => 'delivered',
            default => null,
        };
    }

    private function normalizeBillingStatus($value): string
    {
        $allowed = ['pending', 'partial', 'billed', 'cancelled'];
        $normalized = mb_strtolower(trim((string)$value));
        return in_array($normalized, $allowed, true) ? $normalized : 'pending';
    }

    private function normalizePaymentStatus($value): string
    {
        $allowed = ['pending', 'partial', 'paid'];
        $normalized = mb_strtolower(trim((string)$value));
        return in_array($normalized, $allowed, true) ? $normalized : 'pending';
    }

    private function normalizeDiscountType($value): string
    {
        $allowed = ['none', 'percent', 'amount'];
        $normalized = mb_strtolower(trim((string)$value));
        return in_array($normalized, $allowed, true) ? $normalized : 'none';
    }

    private function calculateLineDiscount(float $grossLineTotal, string $discountType, float $discountValue): float
    {
        $grossLineTotal = round(max(0, $grossLineTotal), 2);
        $discountValue = max(0, $discountValue);
        if ($grossLineTotal <= 0 || $discountValue <= 0 || $discountType === 'none') return 0.00;
        if ($discountType === 'percent') return round(min($grossLineTotal, $grossLineTotal * min($discountValue, 100) / 100), 2);
        if ($discountType === 'amount') return round(min($grossLineTotal, $discountValue), 2);
        return 0.00;
    }

    private function nextCode(): string
    {
        $next = 1;
        $latest = CommercialOrder::query()->latest('id')->value('code');
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) {
            $next = ((int)$matches[1]) + 1;
        }
        return 'PED-' . str_pad((string)$next, 6, '0', STR_PAD_LEFT);
    }

    private function deriveFinancialTotals(float $grossAmount, string $documentType): array
    {
        $grossAmount = round(max(0, $grossAmount), 2);
        if (!$this->isTaxableDocumentType($documentType)) {
            return [
                'subtotal' => $grossAmount,
                'tax_amount' => 0.00,
                'total' => $grossAmount,
            ];
        }

        $subtotal = round($grossAmount / 1.18, 2);
        $taxAmount = round($grossAmount - $subtotal, 2);

        return [
            'subtotal' => $subtotal,
            'tax_amount' => $taxAmount,
            'total' => $grossAmount,
        ];
    }

    private function isTaxableDocumentType(string $documentType): bool
    {
        return in_array($this->normalizeDocumentType($documentType), ['Factura', 'Boleta'], true);
    }

    private function extractSearchTerm($filter): string
    {
        if (!is_array($filter)) return '';
        if (count($filter) === 3 && is_string($filter[0] ?? null) && is_string($filter[1] ?? null)) {
            [$field, $operator, $value] = $filter;
            if (in_array($field, ['name', 'code'], true) && in_array($operator, ['contains', 'startswith', '='], true)) {
                return trim((string) $value);
            }
        }

        foreach ($filter as $item) {
            $term = $this->extractSearchTerm($item);
            if ($term !== '') return $term;
        }

        return '';
    }
}
