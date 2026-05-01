<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\Activity;
use App\Models\ActivityItem;
use App\Models\ActivityLog;
use App\Models\Article;
use App\Models\Client;
use App\Models\CommercialOrder;
use App\Models\CommercialOrderItem;
use App\Models\Dispatch;
use App\Models\Driver;
use App\Models\EventualClient;
use App\Models\Vehicle;
use App\Models\Warehouse;
use App\Models\Zone;
use App\Support\BusinessScope;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use SoDe\Extend\Response;

class ActivityController extends BasicController
{
    public $model = Activity::class;
    public $reactView = 'Admin/Activities';
    public $prefix4filter = 'activities';

    private array $itemsPayload = [];
    private ?string $previousStatus = null;

    public function setReactViewProperties(Request $request)
    {
        return ['requiredPermission' => 'activity'];
    }

    public function setPaginationInstance(string $model)
    {
        $query = $model::select('activities.*')
            ->with([
                'business:id,name',
                'branch:id,business_id,name',
                'warehouse:id,name',
                'commercialOrder:id,code,client_id,eventual_client_id,dispatch_status,total',
                'dispatch:id,code,dispatch_status,manifest_code',
                'client:id,full_name,document_number',
                'eventualClient:id,business_name,document_number',
                'driver:id,full_name,license_number',
                'vehicle:id,plate,label,vehicle_type',
                'zone:id,name,code',
                'items:id,activity_id,commercial_order_item_id,article_id,item_code,description,quantity,delivered_quantity,metadata,status',
                'items.article:id,code,name',
                'logs:id,activity_id,activity_status,logged_at,message,status',
                'creator:id,name,lastname,fullname',
                'updater:id,name,lastname,fullname',
            ]);

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
        $id = $body['id'] ?? null;
        $businessId = $this->toNullableInt($body['business_id'] ?? null);
        $branchId = $this->toNullableInt($body['business_branch_id'] ?? null);
        $warehouseId = $this->toNullableInt($body['warehouse_id'] ?? null);
        $commercialOrderId = $this->toNullableInt($body['commercial_order_id'] ?? null);
        $dispatchId = $this->toNullableInt($body['dispatch_id'] ?? null);
        $clientId = $this->toNullableInt($body['client_id'] ?? null);
        $eventualClientId = $this->toNullableInt($body['eventual_client_id'] ?? null);
        $driverId = $this->toNullableInt($body['driver_id'] ?? null);
        $vehicleId = $this->toNullableInt($body['vehicle_id'] ?? null);
        $zoneId = $this->toNullableInt($body['zone_id'] ?? null);
        $transferDate = $this->normalizeDate($body['transfer_date'] ?? now()->toDateString());
        $activityStatus = $this->normalizeStatus($body['activity_status'] ?? 'scheduled');

        $dispatch = $dispatchId ? Dispatch::findOrFail($dispatchId) : null;
        $order = $commercialOrderId ? CommercialOrder::with(['items.article', 'client', 'eventualClient'])->findOrFail($commercialOrderId) : null;

        if ($dispatch) {
            $businessId ??= (int) $dispatch->business_id;
            $branchId ??= $dispatch->business_branch_id ? (int) $dispatch->business_branch_id : null;
            $warehouseId ??= $dispatch->warehouse_id ? (int) $dispatch->warehouse_id : null;
            $driverId ??= $dispatch->driver_id ? (int) $dispatch->driver_id : null;
            $vehicleId ??= $dispatch->vehicle_id ? (int) $dispatch->vehicle_id : null;
            $zoneId ??= $dispatch->zone_id ? (int) $dispatch->zone_id : null;
        }

        if ($order) {
            $businessId ??= (int) $order->business_id;
            $branchId ??= $order->business_branch_id ? (int) $order->business_branch_id : null;
            $warehouseId ??= $order->warehouse_id ? (int) $order->warehouse_id : null;
            $clientId ??= $order->client_id ? (int) $order->client_id : null;
            $eventualClientId ??= $order->eventual_client_id ? (int) $order->eventual_client_id : null;
        }

        if (!$businessId) throw new \Exception('La empresa es obligatoria');
        $business = BusinessScope::findFixedBusinessForRequest($businessId, $request);
        if ($warehouseId) {
            $warehouse = Warehouse::findOrFail($warehouseId);
            $branchId = BusinessScope::branchIdFromWarehouse($business, $warehouse, $branchId);
        } elseif ($branchId) {
            BusinessScope::requireBranchForBusiness($business, $branchId);
        }
        if ($clientId && $eventualClientId) throw new \Exception('No puedes mezclar cliente regular y eventual en la misma actividad');
        if ($clientId) Client::findOrFail($clientId);
        if ($eventualClientId) EventualClient::findOrFail($eventualClientId);
        if ($driverId) Driver::findOrFail($driverId);
        $vehicle = $vehicleId ? Vehicle::findOrFail($vehicleId) : null;
        if ($vehicle && !$zoneId && $vehicle->zone_id) $zoneId = (int) $vehicle->zone_id;
        if ($zoneId) Zone::findOrFail($zoneId);

        $rawItems = $body['items'] ?? [];
        if (is_string($rawItems)) {
            $decoded = json_decode($rawItems, true);
            $rawItems = is_array($decoded) ? $decoded : [];
        }
        if (!is_array($rawItems)) $rawItems = [];
        $this->itemsPayload = $rawItems;

        if ($id) {
            $persisted = Activity::findOrFail($id);
            $this->previousStatus = $persisted->activity_status;
        }

        if (!$id) {
            $body['code'] = $this->nextCode();
            $body['created_by'] = $userId;
            $body['status'] = true;
        }

        $customerName = trim((string) ($body['customer_name'] ?? ''));
        $documentNumber = trim((string) ($body['document_number'] ?? ''));
        if ($order) {
            $customerName = $customerName ?: ($order->client?->full_name ?: $order->eventualClient?->business_name ?: '');
            $documentNumber = $documentNumber ?: ($order->client?->document_number ?: $order->eventualClient?->document_number ?: '');
        }
        if ($clientId && !$customerName) $customerName = Client::findOrFail($clientId)->full_name;
        if ($eventualClientId && !$customerName) $customerName = EventualClient::findOrFail($eventualClientId)->business_name;

        $body['updated_by'] = $userId;
        $body['business_id'] = $businessId;
        $body['business_branch_id'] = $branchId;
        $body['warehouse_id'] = $warehouseId;
        $body['commercial_order_id'] = $commercialOrderId;
        $body['dispatch_id'] = $dispatchId;
        $body['client_id'] = $clientId;
        $body['eventual_client_id'] = $eventualClientId;
        $body['driver_id'] = $driverId;
        $body['vehicle_id'] = $vehicleId;
        $body['zone_id'] = $zoneId;
        $body['activity_type'] = trim((string) ($body['activity_type'] ?? 'delivery')) ?: 'delivery';
        $body['activity_status'] = $activityStatus;
        $body['transfer_date'] = $transferDate;
        $body['customer_name'] = $customerName ?: null;
        $body['document_number'] = $documentNumber ?: null;
        $body['manifest_code'] = trim((string) ($body['manifest_code'] ?? ($dispatch?->manifest_code ?? ''))) ?: null;
        $body['origin_address'] = trim((string) ($body['origin_address'] ?? '')) ?: null;
        $body['destination_address'] = trim((string) ($body['destination_address'] ?? ($order?->delivery_address ?? ''))) ?: null;
        $body['destination_reference'] = trim((string) ($body['destination_reference'] ?? ($order?->delivery_reference ?? ''))) ?: null;
        $body['dispatch_contact_name'] = trim((string) ($body['dispatch_contact_name'] ?? ($order?->dispatch_contact_name ?? ''))) ?: null;
        $body['dispatch_contact_phone'] = trim((string) ($body['dispatch_contact_phone'] ?? ($order?->dispatch_contact_phone ?? ''))) ?: null;
        $body['ubigeo'] = trim((string) ($body['ubigeo'] ?? ($order?->ubigeo ?? ''))) ?: null;
        $body['map_lat'] = $this->toNullableFloat($body['map_lat'] ?? ($order?->map_lat ?? null));
        $body['map_lng'] = $this->toNullableFloat($body['map_lng'] ?? ($order?->map_lng ?? null));
        $body['package_count'] = max(0, (int) ($body['package_count'] ?? 0));
        $body['gross_weight'] = $this->toFloat($body['gross_weight'] ?? 0);
        $body['observations'] = trim((string) ($body['observations'] ?? '')) ?: null;

        return $body;
    }

    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        DB::beginTransaction();
        try {
            ActivityItem::where('activity_id', $jpa->id)->delete();
            $inserted = 0;

            foreach ($this->itemsPayload as $row) {
                if (!is_array($row)) continue;
                $articleId = $this->toNullableInt($row['article_id'] ?? null);
                $orderItemId = $this->toNullableInt($row['commercial_order_item_id'] ?? null);
                $quantity = $this->toFloat($row['quantity'] ?? 0);
                $deliveredQuantity = $this->toFloat($row['delivered_quantity'] ?? 0);
                if ($quantity <= 0 && $deliveredQuantity <= 0) continue;

                $orderItem = $orderItemId ? CommercialOrderItem::with('article')->findOrFail($orderItemId) : null;
                $article = $articleId ? Article::findOrFail($articleId) : $orderItem?->article;

                ActivityItem::create([
                    'activity_id' => $jpa->id,
                    'commercial_order_item_id' => $orderItemId,
                    'article_id' => $article?->id,
                    'item_code' => trim((string) ($row['item_code'] ?? $article?->code)) ?: null,
                    'description' => trim((string) ($row['description'] ?? $article?->name)) ?: 'Item',
                    'quantity' => $quantity,
                    'delivered_quantity' => $deliveredQuantity,
                    'metadata' => is_array($row['metadata'] ?? null) ? $row['metadata'] : null,
                    'status' => true,
                ]);
                $inserted++;
            }

            if ($inserted === 0 && $jpa->commercial_order_id) {
                $order = CommercialOrder::with('items.article')->findOrFail($jpa->commercial_order_id);
                foreach ($order->items as $item) {
                    if (!$item->status) continue;
                    ActivityItem::create([
                        'activity_id' => $jpa->id,
                        'commercial_order_item_id' => $item->id,
                        'article_id' => $item->article_id,
                        'item_code' => $item->article?->code,
                        'description' => $item->article?->name ?: 'Articulo',
                        'quantity' => $item->quantity,
                        'delivered_quantity' => 0,
                        'metadata' => [
                            'presentation_id' => $item->presentation_id,
                            'warehouse_id' => $item->warehouse_id,
                        ],
                        'status' => true,
                    ]);
                }
            }

            ActivityLog::create([
                'activity_id' => $jpa->id,
                'activity_status' => $jpa->activity_status,
                'logged_at' => now(),
                'message' => $isNew
                    ? 'Actividad registrada'
                    : ($this->previousStatus !== $jpa->activity_status
                        ? "Estado actualizado a {$jpa->activity_status}"
                        : 'Actividad actualizada'),
                'payload' => [
                    'commercial_order_id' => $jpa->commercial_order_id,
                    'dispatch_id' => $jpa->dispatch_id,
                ],
                'status' => true,
                'created_by' => Auth::id(),
                'updated_by' => Auth::id(),
            ]);

            DB::commit();
            return $jpa->fresh([
                'business', 'branch', 'warehouse', 'commercialOrder.client', 'commercialOrder.eventualClient',
                'dispatch', 'client', 'eventualClient', 'driver', 'vehicle', 'zone',
                'items.article', 'logs', 'creator', 'updater',
            ]);
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

    public function delete(Request $request, string $id)
    {
        $response = new Response();
        DB::beginTransaction();
        try {
            $activity = Activity::findOrFail($id);
            $activity->update(['status' => null, 'updated_by' => Auth::id()]);
            ActivityItem::where('activity_id', $activity->id)->update(['status' => null]);
            ActivityLog::where('activity_id', $activity->id)->update(['status' => null, 'updated_by' => Auth::id()]);

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

    private function toNullableInt($value): ?int
    {
        if ($value === null) return null;
        $text = trim((string) $value);
        if ($text === '') return null;
        if (!ctype_digit(ltrim($text, '+'))) throw new \Exception("Valor entero invalido: {$value}");
        return (int) $text;
    }

    private function toFloat($value): float
    {
        $text = trim((string) $value);
        if ($text === '') return 0;
        if (!is_numeric($text)) throw new \Exception("Valor decimal invalido: {$value}");
        return round((float) $text, 3);
    }

    private function toNullableFloat($value): ?float
    {
        if ($value === null) return null;
        $text = trim((string) $value);
        if ($text === '') return null;
        if (!is_numeric($text)) throw new \Exception("Valor decimal invalido: {$value}");
        return round((float) $text, 8);
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

    private function normalizeStatus($value): string
    {
        $allowed = ['scheduled', 'assigned', 'in_progress', 'completed', 'incident', 'cancelled'];
        $normalized = mb_strtolower(trim((string) $value));
        return in_array($normalized, $allowed, true) ? $normalized : 'scheduled';
    }

    private function nextCode(): string
    {
        $next = 1;
        $latest = Activity::query()->latest('id')->value('code');
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) $next = ((int) $matches[1]) + 1;
        return 'ACT-' . str_pad((string) $next, 6, '0', STR_PAD_LEFT);
    }
}
