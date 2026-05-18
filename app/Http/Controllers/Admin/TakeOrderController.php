<?php

namespace App\Http\Controllers\Admin;

use App\Http\Classes\dxResponse;
use App\Http\Controllers\BasicController;
use App\Models\Article;
use App\Models\ArticlePresentation;
use App\Models\Client;
use App\Models\ClientDeliveryAddress;
use App\Models\ClientDistributionNetwork;
use App\Models\dxDataGrid;
use App\Models\TakeOrder;
use App\Models\TakeOrderItem;
use App\Models\EventualClient;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\PriceListResolverService;
use App\Services\StockService;
use App\Support\BusinessScope;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;
use SoDe\Extend\Response;

class TakeOrderController extends BasicController
{
    public $model = TakeOrder::class;
    public $reactView = 'Admin/TakeOrders';
    public $prefix4filter = 'take_orders';

    private array $itemsPayload = [];

    public function setReactViewProperties(Request $request)
    {
        return [
            'requiredPermission' => 'orders',
            'pageTitle' => 'Toma pedido',
        ];
    }

    public function setPaginationInstance(string $model)
    {
        $query = $model::select('take_orders.*')
            ->with([
                'business:id,name,tax_number,trade_name,description',
                'branch:id,business_id,name,ubigeo,address,telephone,email',
                'warehouse:id,name',
                'client:id,document_type,document_number,full_name,full_address,phone,primary_contact,primary_contact_phone,email,contract_due_days,commercial_channel,segment,ubigeo',
                'eventualClient:id,document_type,document_number,business_name,address,phone,email',
                'distributionNetwork:id,client_id,code,name,commercial_channel,segment',
                'deliveryAddress:id,client_distribution_network_id,client_id,code,name,address,reference,ubigeo,latitude,longitude,contact_name,contact_phone',
                'seller:id,name,lastname,username,fullname',
                'priceList:id,code',
                'items:id,take_order_id,article_id,presentation_id,warehouse_id,price_list_item_id,stock_available,cost_unit,price_unit,presentation_units,quantity,total,price_source,status',
                'items.article:id,code,name,laboratory_id,active_principle_id,unit_id',
                'items.article.laboratory:id,name',
                'items.article.activePrinciple:id,name',
                'items.article.unit:id,name,symbol',
                'items.article.presentations:id,article_id,name,units,price,status',
                'items.presentation:id,article_id,name,units,price',
                'items.priceListItem:id,price_list_id,article_id,laboratory_id,fixed_price,margin_percent,minimum_quantity,status',
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ])
            ->join('users as creator', 'creator.id', '=', 'take_orders.created_by')
            ->join('users as updater', 'updater.id', '=', 'take_orders.updated_by');

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

        $businessId = $this->toNullableInt($body['business_id'] ?? null);
        $branchId = $this->toNullableInt($body['business_branch_id'] ?? null);
        $warehouseId = $this->toNullableInt($body['warehouse_id'] ?? null);
        $clientId = $this->toNullableInt($body['client_id'] ?? null);
        $eventualClientId = $this->toNullableInt($body['eventual_client_id'] ?? null);
        $networkId = $this->toNullableInt($body['client_distribution_network_id'] ?? null);
        $deliveryAddressId = $this->toNullableInt($body['client_delivery_address_id'] ?? null);
        $sellerId = $this->toNullableInt($body['seller_id'] ?? null) ?? $userId;
        $priceListId = $this->toNullableInt($body['price_list_id'] ?? null);
        $issueDate = $this->normalizeDate($body['issue_date'] ?? now()->toDateString());
        $promisedDate = $this->normalizeDate($body['promised_delivery_at'] ?? null);
        $firstDueDate = $this->normalizeDate($body['first_due_date'] ?? null);

        if (!$businessId) throw new \Exception('La empresa es obligatoria');
        if (!$warehouseId) throw new \Exception('El almacén es obligatorio');
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
                throw new \Exception('El cliente de la toma de pedido debe ser regular');
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
        $this->itemsPayload = $rawItems;
        unset($body['items']);

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
        $body['price_list_id'] = $priceListId;
        $body['order_profile'] = $this->normalizeOrderProfile($body['order_profile'] ?? 'micro');
        $body['document_type'] = trim((string)($body['document_type'] ?? 'Factura')) ?: 'Factura';
        $body['currency'] = $this->normalizeCurrency($body['currency'] ?? 'PEN');
        $body['payment_condition'] = $this->normalizePaymentCondition($body['payment_condition'] ?? 'Contado');
        $body['payment_method'] = trim((string)($body['payment_method'] ?? '')) ?: null;
        $body['commercial_channel'] = $commercialChannel;
        $body['segment'] = $segment;
        $body['order_status'] = $this->normalizeOrderStatus($body['order_status'] ?? 'draft');
        $body['dispatch_status'] = $this->normalizeDispatchStatus($body['dispatch_status'] ?? 'pending');
        $body['billing_status'] = $this->normalizeBillingStatus($body['billing_status'] ?? 'pending');
        $body['issue_date'] = $issueDate;
        $body['promised_delivery_at'] = $promisedDate;
        $body['installments'] = max(1, $this->toNullableInt($body['installments'] ?? null) ?? 1);
        $body['first_due_date'] = $firstDueDate;
        $body['delivery_address'] = trim((string)($body['delivery_address'] ?? ($deliveryAddress->address ?? ''))) ?: null;
        $body['delivery_reference'] = trim((string)($body['delivery_reference'] ?? ($deliveryAddress->reference ?? ''))) ?: null;
        $body['ubigeo'] = trim((string)($body['ubigeo'] ?? ($deliveryAddress->ubigeo ?? ''))) ?: null;
        $body['map_lat'] = $this->toNullableDecimal($body['map_lat'] ?? ($deliveryAddress->latitude ?? null));
        $body['map_lng'] = $this->toNullableDecimal($body['map_lng'] ?? ($deliveryAddress->longitude ?? null));
        $body['dispatch_contact_name'] = trim((string)($body['dispatch_contact_name'] ?? ($deliveryAddress->contact_name ?? ''))) ?: null;
        $body['dispatch_contact_phone'] = trim((string)($body['dispatch_contact_phone'] ?? ($deliveryAddress->contact_phone ?? ''))) ?: null;
        $body['purchase_order'] = trim((string)($body['purchase_order'] ?? '')) ?: null;
        $body['referral_guide'] = trim((string)($body['referral_guide'] ?? '')) ?: null;
        $body['subtotal'] = $this->toNullableDecimal($body['subtotal'] ?? null) ?? 0;
        $body['tax_amount'] = $this->toNullableDecimal($body['tax_amount'] ?? null) ?? 0;
        $body['total'] = $this->toNullableDecimal($body['total'] ?? null) ?? 0;
        $body['payment_status'] = $this->normalizePaymentStatus($body['payment_status'] ?? 'pending');
        $body['observations'] = trim((string)($body['observations'] ?? '')) ?: null;
        $body['approved_at'] = in_array($body['order_status'], ['confirmed', 'preparing', 'dispatched', 'billed', 'closed'], true)
            ? ($body['approved_at'] ?? now())
            : null;

        return $body;
    }

    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        DB::beginTransaction();
        try {
            TakeOrderItem::where('take_order_id', $jpa->id)->delete();

            $inserted = 0;
            $subtotal = 0;
            $matchedPriceListIds = [];
            $business = BusinessScope::findFixedBusiness($jpa->business_id);
            $articleContext = $this->articleContextFromArray([
                'business_id' => $jpa->business_id,
                'business_branch_id' => $jpa->business_branch_id,
                'warehouse_id' => $jpa->warehouse_id,
                'price_list_id' => $jpa->price_list_id,
                'client_id' => $jpa->client_id,
                'eventual_client_id' => $jpa->eventual_client_id,
                'client_distribution_network_id' => $jpa->client_distribution_network_id,
                'issue_date' => $jpa->issue_date instanceof Carbon ? $jpa->issue_date->format('Y-m-d') : $jpa->issue_date,
                'commercial_channel' => $jpa->commercial_channel,
                'segment' => $jpa->segment,
            ]);
            $allowedArticleRules = $this->allowedArticleRules($articleContext);

            foreach ($this->itemsPayload as $item) {
                if (!is_array($item)) continue;

                $articleId = $this->toNullableInt($item['article_id'] ?? null);
                if (!$articleId) throw new \Exception('Cada linea debe tener articulo');

                $article = Article::with(['presentations:id,article_id,name,units,price,status'])->findOrFail($articleId);
                if (!$this->articleAllowedForContext($article, $articleContext, $allowedArticleRules)) {
                    throw new \Exception("El articulo {$article->name} no está habilitado para el cliente seleccionado");
                }
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

                $availableStock = $this->getAvailableStockByWarehouse((int)$articleId, (int)$warehouseId);
                if ($quantity > $availableStock) {
                    throw new \Exception("Stock insuficiente para {$article->name}. Disponible: {$availableStock}");
                }

                $resolution = app(PriceListResolverService::class)->resolve([
                    'business_id' => $jpa->business_id,
                    'business_branch_id' => $jpa->business_branch_id,
                    'warehouse_id' => $warehouseId,
                    'price_list_id' => $jpa->price_list_id,
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

                $lineTotal = $this->toNullableDecimal($item['total'] ?? null);
                if (is_null($lineTotal) || $lineTotal < 0) {
                    $lineTotal = round((float)$quantity * (float)$priceUnit, 2);
                }

                TakeOrderItem::create([
                    'take_order_id' => $jpa->id,
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
                    'status' => isset($item['status']) ? (bool)$item['status'] : true,
                ]);

                if ($resolution['price_list_id']) {
                    $matchedPriceListIds[] = (int)$resolution['price_list_id'];
                }

                $subtotal += (float)$lineTotal;
                $inserted++;
            }

            if ($inserted === 0) throw new \Exception('Debes agregar al menos un item');

            $taxAmount = $this->toNullableDecimal($request->input('tax_amount')) ?? 0;
            $total = $this->toNullableDecimal($request->input('total'));
            $subtotal = round($subtotal, 2);
            $taxAmount = round($taxAmount, 2);
            $total = is_null($total) ? round($subtotal + $taxAmount, 2) : round($total, 2);
            $matchedPriceListIds = array_values(array_unique($matchedPriceListIds));

            $jpa->update([
                'price_list_id' => $jpa->price_list_id ?: (count($matchedPriceListIds) === 1 ? $matchedPriceListIds[0] : null),
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'total' => $total,
            ]);

            DB::commit();

            return $this->loadTakeOrder($jpa->id);
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
            $response->data = ClientDistributionNetwork::with('addresses:id,client_distribution_network_id,client_id,code,name,address,reference,ubigeo,contact_name,contact_phone,is_default,status')
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
            if (!$warehouseId) throw new \Exception('El almacén es obligatorio');

            $article = Article::with(['presentations:id,article_id,name,units,price,status'])->findOrFail($articleId);
            $articleContext = $this->articleContextFromRequest($request);
            if (!$this->articleAllowedForContext($article, $articleContext)) {
                throw new \Exception('El articulo no esta habilitado para el cliente seleccionado');
            }
            $resolution = app(PriceListResolverService::class)->resolve([
                'business_id' => $this->toNullableInt($request->query('business_id')),
                'business_branch_id' => $this->toNullableInt($request->query('business_branch_id')),
                'warehouse_id' => $warehouseId,
                'price_list_id' => $this->toNullableInt($request->query('price_list_id')),
                'client_id' => $this->toNullableInt($request->query('client_id')),
                'eventual_client_id' => $this->toNullableInt($request->query('eventual_client_id')),
                'client_distribution_network_id' => $this->toNullableInt($request->query('client_distribution_network_id')),
                'commercial_channel' => trim((string)$request->query('commercial_channel', '')) ?: null,
                'segment' => trim((string)$request->query('segment', '')) ?: null,
                'issue_date' => $this->normalizeDate($request->query('issue_date')) ?? now()->toDateString(),
            ], $article, $quantity, $presentationId);

            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = array_merge($resolution, [
                'stock_available' => $this->getAvailableStockByWarehouse($articleId, $warehouseId),
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
            $context = $this->articleContextFromRequest($request);
            if (!$context['client_id'] && !$context['eventual_client_id']) {
                $response->status = 200;
                $response->message = 'Operacion correcta';
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
                ->whereNotNull('articles.status');

            $this->applyAllowedArticleScope($query, $context);

            if ($request->filter) {
                $query->where(function ($filterQuery) use ($request) {
                    dxDataGrid::filter($filterQuery, $request->filter ?? [], false, 'articles');
                });
            }

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
            $order = TakeOrder::findOrFail($request->id);
            $field = trim((string)$request->field);
            if ($field === '') throw new \Exception('Campo invalido');

            $value = $request->value;
            $payload = [
                $field => $value,
                'updated_by' => Auth::id(),
            ];
            $order->update($payload);

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
            $order = TakeOrder::findOrFail($request->id);
            $order->update([
                'status' => $request->status ? 0 : 1,
                'updated_by' => Auth::id(),
            ]);

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
            $order = TakeOrder::findOrFail($id);
            $order->update([
                'status' => null,
                'updated_by' => Auth::id(),
            ]);

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

    private function loadTakeOrder(int $id): TakeOrder
    {
        return $this->setPaginationInstance($this->model)->findOrFail($id);
    }

    private function articleContextFromRequest(Request $request): array
    {
        return $this->articleContextFromArray([
            'business_id' => $request->query('business_id', $request->input('business_id')),
            'business_branch_id' => $request->query('business_branch_id', $request->input('business_branch_id')),
            'warehouse_id' => $request->query('warehouse_id', $request->input('warehouse_id')),
            'price_list_id' => $request->query('price_list_id', $request->input('price_list_id')),
            'client_id' => $request->query('client_id', $request->input('client_id')),
            'eventual_client_id' => $request->query('eventual_client_id', $request->input('eventual_client_id')),
            'client_distribution_network_id' => $request->query('client_distribution_network_id', $request->input('client_distribution_network_id')),
            'issue_date' => $request->query('issue_date', $request->input('issue_date')),
            'commercial_channel' => $request->query('commercial_channel', $request->input('commercial_channel')),
            'segment' => $request->query('segment', $request->input('segment')),
        ]);
    }

    private function articleContextFromArray(array $payload): array
    {
        return [
            'business_id' => $this->toNullableInt($payload['business_id'] ?? null),
            'business_branch_id' => $this->toNullableInt($payload['business_branch_id'] ?? null),
            'warehouse_id' => $this->toNullableInt($payload['warehouse_id'] ?? null),
            'price_list_id' => $this->toNullableInt($payload['price_list_id'] ?? null),
            'client_id' => $this->toNullableInt($payload['client_id'] ?? null),
            'eventual_client_id' => $this->toNullableInt($payload['eventual_client_id'] ?? null),
            'client_distribution_network_id' => $this->toNullableInt($payload['client_distribution_network_id'] ?? null),
            'issue_date' => $this->normalizeDate($payload['issue_date'] ?? null) ?? now()->toDateString(),
            'commercial_channel' => trim((string)($payload['commercial_channel'] ?? '')) ?: null,
            'segment' => trim((string)($payload['segment'] ?? '')) ?: null,
        ];
    }

    private function allowedArticleRules(array $context): array
    {
        $priceLists = app(PriceListResolverService::class)->matchingPriceListsForContext($context);
        $articleIds = [];
        $laboratoryIds = [];

        foreach ($priceLists as $priceList) {
            foreach ($priceList->items as $item) {
                if ($item->status === null || $item->status === false || (int)$item->status === 0) continue;
                if ($item->article_id) $articleIds[] = (int)$item->article_id;
                if ($item->laboratory_id) $laboratoryIds[] = (int)$item->laboratory_id;
            }
        }

        return [
            'article_ids' => array_values(array_unique($articleIds)),
            'laboratory_ids' => array_values(array_unique($laboratoryIds)),
        ];
    }

    private function applyAllowedArticleScope($query, array $context): void
    {
        $clientId = $context['client_id'] ?? null;
        $eventualClientId = $context['eventual_client_id'] ?? null;
        $rules = $this->allowedArticleRules($context);
        $articleIds = $rules['article_ids'];
        $laboratoryIds = $rules['laboratory_ids'];

        if (!$clientId && !$eventualClientId) {
            $query->whereRaw('1 = 0');
            return;
        }

        if ($clientId) {
            $query->where(function ($clientScope) use ($clientId) {
                $clientScope->whereNull('articles.client_id')
                    ->orWhere('articles.client_id', $clientId);
            });
        } else {
            $query->whereNull('articles.client_id');
        }

        $query->where(function ($allowedScope) use ($clientId, $articleIds, $laboratoryIds) {
            $allowedScope->whereRaw('1 = 0');
            if ($clientId) $allowedScope->orWhere('articles.client_id', $clientId);
            if (count($articleIds) > 0) $allowedScope->orWhereIn('articles.id', $articleIds);
            if (count($laboratoryIds) > 0) $allowedScope->orWhereIn('articles.laboratory_id', $laboratoryIds);
        });
    }

    private function articleAllowedForContext(Article $article, array $context, ?array $rules = null): bool
    {
        $clientId = $context['client_id'] ?? null;
        $eventualClientId = $context['eventual_client_id'] ?? null;
        if (!$clientId && !$eventualClientId) return false;

        if ($clientId && !is_null($article->client_id) && (int)$article->client_id === (int)$clientId) {
            return true;
        }

        if ($clientId && !is_null($article->client_id) && (int)$article->client_id !== (int)$clientId) {
            return false;
        }

        $rules ??= $this->allowedArticleRules($context);

        return in_array((int)$article->id, $rules['article_ids'], true)
            || in_array((int)$article->laboratory_id, $rules['laboratory_ids'], true);
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

    private function normalizeOrderStatus($value): string
    {
        $allowed = ['draft', 'confirmed', 'preparing', 'dispatched', 'billed', 'closed', 'cancelled'];
        $normalized = mb_strtolower(trim((string)$value));
        return in_array($normalized, $allowed, true) ? $normalized : 'draft';
    }

    private function normalizeOrderProfile($value): string
    {
        $normalized = mb_strtolower(trim((string)$value));
        return in_array($normalized, ['micro', 'mediana'], true) ? $normalized : 'micro';
    }

    private function normalizeDispatchStatus($value): string
    {
        $allowed = ['pending', 'preparing', 'dispatched', 'delivered', 'cancelled'];
        $normalized = mb_strtolower(trim((string)$value));
        return in_array($normalized, $allowed, true) ? $normalized : 'pending';
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

    private function nextCode(): string
    {
        $next = 1;
        $latest = TakeOrder::query()->latest('id')->value('code');
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) {
            $next = ((int)$matches[1]) + 1;
        }
        return 'TP-' . str_pad((string)$next, 6, '0', STR_PAD_LEFT);
    }
}
