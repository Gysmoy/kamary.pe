<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\Business;
use App\Models\CommercialOrder;
use App\Models\Dispatch;
use App\Models\Article;
use App\Models\Driver;
use App\Models\EventualClient;
use App\Models\ReferralGuide;
use App\Models\Vehicle;
use App\Services\CommercialOrderStockService;
use App\Services\FacturadorPro5Service;
use App\Services\ReferralGuideService;
use App\Services\StockService;
use App\Support\BusinessScope;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use SoDe\Extend\Response;

class ReferralGuideController extends BasicController
{
    public $model = ReferralGuide::class;
    public $reactView = 'Admin/ManualGuides';
    public $prefix4filter = 'referral_guides';

    public function setReactViewProperties(Request $request)
    {
        $businesses = Business::query()
            ->whereIn('business_key', BusinessScope::fixedKeys())
            ->with(['branches' => fn($q) => $q->whereNotNull('status')->where('status', true)->orderBy('id')
                ->with(['warehouses' => fn($w) => $w->whereNotNull('status')->where('status', true)->orderBy('name')])])
            ->orderBy('id')
            ->get();

        $drivers = Driver::query()->whereNotNull('status')->where('status', true)
            ->orderBy('full_name')->get(['id', 'business_id', 'full_name', 'document_type', 'document_number', 'license_number']);
        $vehicles = Vehicle::query()->whereNotNull('status')->where('status', true)
            ->orderBy('plate')->get(['id', 'business_id', 'plate', 'label']);

        return [
            'requiredPermission' => 'referral_guides',
            'manualBusinesses' => $businesses->map(fn(Business $b) => [
                'id' => $b->id,
                'name' => $b->name,
                'tax_number' => $b->tax_number,
                'sync_ok' => ($b->facturador_sync_status ?? null) === 'success',
                'branches' => $b->branches->map(fn($br) => [
                    'id' => $br->id,
                    'name' => $br->name,
                    'establishment_code' => $br->establishment_code,
                    'ubigeo' => $br->ubigeo,
                    'address' => $br->address,
                    'series_guia' => $br->series_guia,
                    'synced' => (bool) $br->facturador_establishment_id,
                    'warehouses' => $br->warehouses->map(fn($w) => ['id' => $w->id, 'name' => $w->name])->values(),
                ])->values(),
            ])->values(),
            'manualDrivers' => $drivers,
            'manualVehicles' => $vehicles,
        ];
    }

    public function createManual(Request $request): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            BusinessScope::findFixedBusinessForRequest($request->input('business_id'), $request);
            $guide = DB::transaction(function () use ($request) {
                $order = $this->createOrderForManualGuide($request);
                return app(ReferralGuideService::class)->createManual($request->all(), $order);
            });
            $response->status = 200;
            $response->message = 'Pedido ' . ($guide->commercialOrder?->code ?? '') . ' creado. La guia se emitira al terminar la preparacion.';
            $response->data = $guide;
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    /**
     * La guia manual se comporta como un pedido: crea un pedido comercial con los productos
     * del almacen para que reserve stock, pase por picking y descuente al cerrar el despacho.
     */
    private function createOrderForManualGuide(Request $request): CommercialOrder
    {
        $warehouseId = (int) $request->input('warehouse_id');
        if (!$warehouseId) throw new \Exception('Selecciona el almacen');

        $items = collect($request->input('items', []))
            ->filter(fn($it) => is_array($it) && !empty($it['article_id']) && (float) ($it['quantity'] ?? 0) > 0)
            ->map(fn($it) => [
                'article_id' => (int) $it['article_id'],
                'presentation_id' => !empty($it['presentation_id']) ? (int) $it['presentation_id'] : null,
                'warehouse_id' => $warehouseId,
                'quantity' => (float) $it['quantity'],
            ])
            ->values()
            ->all();
        if (empty($items)) throw new \Exception('Agrega al menos un producto del almacen');

        $eventualClient = $this->resolveRecipientClient($request);
        $documentType = trim((string) $request->input('order_document_type'))
            ?: ($eventualClient->document_type === 'ruc' ? 'Factura' : 'Boleta');

        $orderRequest = Request::create('/api/admin/commercial-orders', 'POST', [
            'business_id' => $request->input('business_id'),
            'business_branch_id' => $request->input('business_branch_id'),
            'warehouse_id' => $warehouseId,
            'eventual_client_id' => $eventualClient->id,
            'document_type' => $documentType,
            'order_status' => 'confirmed',
            'dispatch_status' => 'pending',
            'issue_date' => now('America/Lima')->toDateString(),
            'promised_delivery_at' => $request->input('transfer_date'),
            'delivery_address' => $request->input('destination_address'),
            'ubigeo' => $request->input('destination_ubigeo'),
            'dispatch_contact_name' => $request->input('recipient_name'),
            'dispatch_contact_phone' => $request->input('recipient_phone'),
            'observations' => trim('Pedido generado desde guia manual. ' . (string) $request->input('observations')),
            'items' => $items,
        ]);
        $orderRequest->setUserResolver($request->getUserResolver());

        $result = app(CommercialOrderController::class)->save($orderRequest);
        $payload = json_decode($result->getContent(), true) ?: [];
        if ($result->getStatusCode() !== 200) {
            throw new \Exception($payload['message'] ?? 'No se pudo crear el pedido de la guia');
        }

        return CommercialOrder::findOrFail($payload['data']['id'] ?? 0);
    }

    private function resolveRecipientClient(Request $request): EventualClient
    {
        $documentType = strtolower(trim((string) $request->input('recipient_document_type')));
        $documentNumber = preg_replace('/\D+/', '', (string) $request->input('recipient_document_number'));
        $name = trim((string) $request->input('recipient_name'));

        if (!in_array($documentType, ['dni', 'ce', 'ruc'], true)) throw new \Exception('Tipo de documento del destinatario invalido');
        if ($documentType === 'dni' && strlen($documentNumber) !== 8) throw new \Exception('El DNI del destinatario debe tener 8 digitos');
        if ($documentType === 'ruc' && strlen($documentNumber) !== 11) throw new \Exception('El RUC del destinatario debe tener 11 digitos');
        if ($documentType === 'ce' && strlen($documentNumber) < 6) throw new \Exception('El carnet de extranjeria debe tener al menos 6 digitos');
        if ($name === '') throw new \Exception('Falta el destinatario');

        $client = EventualClient::where('document_type', $documentType)->where('document_number', $documentNumber)->first();
        if ($client) return $client;

        return EventualClient::create([
            'document_type' => $documentType,
            'document_number' => $documentNumber,
            'business_name' => $name,
            'phone' => trim((string) $request->input('recipient_phone')) ?: null,
            'address' => trim((string) $request->input('destination_address')) ?: null,
            'status' => true,
            'created_by' => Auth::id(),
            'updated_by' => Auth::id(),
        ]);
    }

    /**
     * Productos con stock disponible en el almacen (fisico menos lo reservado por otros pedidos).
     */
    public function warehouseArticles(Request $request): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            $warehouseId = (int) $request->query('warehouse_id');
            if (!$warehouseId) throw new \Exception('Selecciona el almacen');
            $business = BusinessScope::findFixedBusinessForRequest($request->query('business_id'), $request);

            $stockRows = app(StockService::class)->availableStorageStockRows(
                $warehouseId,
                trim((string) $request->query('search', '')),
                0,
                $business->business_key
            );
            $articleIds = collect($stockRows)->pluck('article_id')->filter()->unique()->take(40)->values()->all();

            $stockService = app(StockService::class);
            $reservationService = app(CommercialOrderStockService::class);
            $response->data = Article::query()
                ->with(['unit:id,name,symbol', 'presentations:id,article_id,name,units,status'])
                ->where(fn($scope) => $scope->where('module_scope', 'standard')->orWhereNull('module_scope'))
                ->whereNotNull('status')
                ->whereIn('id', $articleIds)
                ->orderBy('name')
                ->get()
                ->map(function (Article $article) use ($warehouseId, $stockService, $reservationService) {
                    $physical = $stockService->getAvailableStockByWarehouse($article->id, $warehouseId);
                    $reserved = $reservationService->reservedByOtherOrders($article->id, $warehouseId);
                    return [
                        'id' => $article->id,
                        'code' => $article->code,
                        'name' => $article->name,
                        'unit' => $article->unit?->symbol ?: ($article->unit?->name ?: 'NIU'),
                        'stock' => max(0, round($physical - $reserved, 3)),
                        'presentations' => $article->presentations->where('status', true)
                            ->map(fn($p) => ['id' => $p->id, 'name' => $p->name, 'units' => (float) ($p->units ?: 1)])
                            ->values(),
                    ];
                })
                ->filter(fn($row) => $row['stock'] > 0)
                ->values();
            $response->status = 200;
            $response->message = 'Operacion correcta';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function setPaginationInstance(string $model)
    {
        $query = $model::select('referral_guides.*')
            ->with([
                'business:id,name,tax_number',
                'branch:id,business_id,name,ubigeo,address',
                'warehouse:id,name',
                'dispatch:id,code,manifest_code,dispatch_status,scheduled_date',
                'commercialOrder:id,code,order_status,dispatch_status,document_type,delivery_address,delivery_reference,dispatch_contact_name,dispatch_contact_phone,total',
                'driver:id,full_name,document_type,document_number,license_number',
                'vehicle:id,plate,label',
                'items:id,referral_guide_id,article_id,item_code,description,unit,quantity,gross_weight,status',
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ]);

        $scopeKey = BusinessScope::scopedKeyForRequest(request());
        $query->whereHas('business', function ($business) use ($scopeKey) {
            $business->whereIn('business_key', BusinessScope::fixedKeys());
            if ($scopeKey) $business->where('business_key', $scopeKey);
        });

        return $query;
    }

    public function prepareFromDispatch(Request $request, string $dispatchId): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            $dispatch = Dispatch::findOrFail($dispatchId);
            BusinessScope::findFixedBusinessForRequest($dispatch->business_id, $request);
            $response->status = 200;
            $response->message = 'Guias generadas correctamente';
            $response->data = app(ReferralGuideService::class)->prepareForDispatch($dispatch);
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function prepareFromCommercialOrder(Request $request, string $orderId): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            $order = CommercialOrder::findOrFail($orderId);
            BusinessScope::findFixedBusinessForRequest($order->business_id, $request);
            $response->status = 200;
            $response->message = 'Guia generada correctamente';
            $response->data = app(ReferralGuideService::class)->prepareForCommercialOrder($order);
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function connectorPayload(Request $request, string $id): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            $guide = app(ReferralGuideService::class)->loadGuide((int) $id);
            BusinessScope::findFixedBusinessForRequest($guide->business_id, $request);
            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = json_decode($guide->request_payload ?: '[]', true) ?: app(ReferralGuideService::class)->buildProviderPayload($guide);
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function issue(Request $request, string $id): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            $guide = ReferralGuide::findOrFail($id);
            BusinessScope::findFixedBusinessForRequest($guide->business_id, $request);
            $response->status = 200;
            $response->message = 'Guia emitida correctamente';
            $response->data = app(ReferralGuideService::class)->issue($guide);
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function cancel(Request $request, string $id): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            $guide = ReferralGuide::findOrFail($id);
            BusinessScope::findFixedBusinessForRequest($guide->business_id, $request);
            $response->status = 200;
            $response->message = 'Guia anulada correctamente';
            $response->data = app(ReferralGuideService::class)->cancel($guide, trim((string) $request->input('reason')) ?: null);
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function download(Request $request, string $id, string $type): HttpResponse|ResponseFactory
    {
        try {
            $guide = app(ReferralGuideService::class)->loadGuide((int) $id);
            BusinessScope::findFixedBusinessForRequest($guide->business_id, $request);
            $file = app(FacturadorPro5Service::class)->downloadReferralGuideFile($guide, $type);

            return response($file['content'], 200, [
                'Content-Type' => $file['content_type'],
                'Content-Disposition' => 'inline; filename="' . $file['filename'] . '"',
                'Cache-Control' => 'private, max-age=0, must-revalidate',
            ]);
        } catch (\Throwable $th) {
            return response([
                'status' => 400,
                'message' => $th->getMessage(),
            ], 400);
        }
    }

    public function boolean(Request $request)
    {
        $response = new Response();
        try {
            $guide = ReferralGuide::findOrFail($request->id);
            BusinessScope::findFixedBusinessForRequest($guide->business_id, $request);
            $field = trim((string) $request->field);
            if (!in_array($field, ['guide_status', 'external_status', 'observations'], true)) {
                throw new \Exception('Campo no editable para guia');
            }
            $guide->update([
                $field => $request->value,
                'updated_by' => Auth::id(),
            ]);
            $response->status = 200;
            $response->message = 'Operacion correcta';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }
}
