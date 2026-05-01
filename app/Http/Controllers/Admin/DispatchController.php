<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\CommercialOrder;
use App\Models\Dispatch;
use App\Models\DispatchAssignment;
use App\Models\Driver;
use App\Models\Vehicle;
use App\Models\Warehouse;
use App\Models\Zone;
use App\Services\DispatchService;
use App\Support\BusinessScope;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use SoDe\Extend\Response;

class DispatchController extends BasicController
{
    public $model = Dispatch::class;
    public $reactView = 'Admin/Dispatches';
    public $prefix4filter = 'dispatches';

    private array $assignmentsPayload = [];
    private array $previousOrderIds = [];

    public function setReactViewProperties(Request $request)
    {
        return ['requiredPermission' => 'dispatch'];
    }

    public function setPaginationInstance(string $model)
    {
        $query = $model::select('dispatches.*')
            ->with([
                'business:id,name', 'branch:id,business_id,name', 'warehouse:id,name',
                'driver:id,full_name,license_number', 'vehicle:id,plate,label,vehicle_type', 'zoneMaster:id,name,code',
                'exitNote:id,business_id,business_branch_id,warehouse_id,client_name,status',
                'assignments:id,dispatch_id,commercial_order_id,commercial_order_code,customer_name,total,assignment_status,status',
                'assignments.commercialOrder:id,code,client_id,eventual_client_id,dispatch_status,billing_status,total',
                'assignments.commercialOrder.client:id,full_name,document_number',
                'assignments.commercialOrder.eventualClient:id,business_name,document_number',
                'creator:id,name,lastname,username,fullname', 'updater:id,name,lastname,username,fullname',
            ])
            ->join('users as creator', 'creator.id', '=', 'dispatches.created_by')
            ->join('users as updater', 'updater.id', '=', 'dispatches.updated_by');

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
        $businessId = (int) ($body['business_id'] ?? 0);
        $branchId = $this->toNullableInt($body['business_branch_id'] ?? null);
        $warehouseId = (int) ($body['warehouse_id'] ?? 0);
        $scheduledDate = $this->normalizeDate($body['scheduled_date'] ?? now()->toDateString());
        $dispatchStatus = $this->normalizeStatus($body['dispatch_status'] ?? 'waiting');
        $driverId = $this->toNullableInt($body['driver_id'] ?? null);
        $vehicleId = $this->toNullableInt($body['vehicle_id'] ?? null);
        $zoneId = $this->toNullableInt($body['zone_id'] ?? null);

        if ($businessId <= 0) throw new \Exception('La empresa es obligatoria');
        if ($warehouseId <= 0) throw new \Exception('El almacen es obligatorio');
        if (!$scheduledDate) throw new \Exception('La fecha programada es obligatoria');

        $business = BusinessScope::findFixedBusinessForRequest($businessId, $request);
        $warehouse = Warehouse::findOrFail($warehouseId);
        $driver = $driverId ? Driver::findOrFail($driverId) : null;
        $vehicle = $vehicleId ? Vehicle::findOrFail($vehicleId) : null;
        if (!$zoneId && $vehicle?->zone_id) $zoneId = (int) $vehicle->zone_id;
        $zone = $zoneId ? Zone::findOrFail($zoneId) : null;

        $branchId = BusinessScope::branchIdFromWarehouse($business, $warehouse, $branchId);

        $rawAssignments = $body['assignments'] ?? [];
        if (is_string($rawAssignments)) {
            $decoded = json_decode($rawAssignments, true);
            $rawAssignments = is_array($decoded) ? $decoded : [];
        }
        if (!is_array($rawAssignments)) $rawAssignments = [];
        $this->assignmentsPayload = $rawAssignments;
        unset($body['assignments']);

        if ($id) {
            $persisted = Dispatch::with('assignments')->findOrFail($id);
            $this->previousOrderIds = $persisted->assignments->pluck('commercial_order_id')->filter()->map(fn($value) => (int) $value)->all();
        }

        if (!$id) {
            $body['code'] = $this->nextCode();
            $body['created_by'] = $userId;
            $body['status'] = true;
        }

        $body['updated_by'] = $userId;
        $body['business_id'] = $businessId;
        $body['business_branch_id'] = $branchId;
        $body['warehouse_id'] = $warehouseId;
        $body['scheduled_date'] = $scheduledDate;
        $body['shift'] = trim((string) ($body['shift'] ?? '')) ?: null;
        $body['driver_id'] = $driver?->id;
        $body['driver_name'] = $driver?->full_name ?: (trim((string) ($body['driver_name'] ?? '')) ?: null);
        $body['copilot_name'] = trim((string) ($body['copilot_name'] ?? '')) ?: null;
        $body['vehicle_id'] = $vehicle?->id;
        $body['vehicle_label'] = $vehicle?->label ?: ($vehicle?->plate ?: (trim((string) ($body['vehicle_label'] ?? '')) ?: null));
        $body['vehicle_plate'] = $vehicle?->plate ?: (trim((string) ($body['vehicle_plate'] ?? '')) ?: null);
        $body['zone_id'] = $zone?->id;
        $body['zone'] = $zone?->name ?: (trim((string) ($body['zone'] ?? '')) ?: null);
        $body['manifest_code'] = trim((string) ($body['manifest_code'] ?? '')) ?: null;
        $body['dispatch_status'] = $dispatchStatus;
        $body['departed_at'] = in_array($dispatchStatus, ['in_route', 'delivered', 'closed'], true) ? ($body['departed_at'] ?? now()) : null;
        $body['delivered_at'] = in_array($dispatchStatus, ['delivered', 'closed'], true) ? ($body['delivered_at'] ?? now()) : null;
        $body['observations'] = trim((string) ($body['observations'] ?? '')) ?: null;

        return $body;
    }

    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        DB::beginTransaction();
        try {
            DispatchAssignment::where('dispatch_id', $jpa->id)->delete();
            $currentOrderIds = [];
            $inserted = 0;

            foreach ($this->assignmentsPayload as $assignment) {
                if (!is_array($assignment)) continue;
                $commercialOrderId = $this->toNullableInt($assignment['commercial_order_id'] ?? null);
                if (!$commercialOrderId) continue;

                $order = CommercialOrder::with(['client', 'eventualClient', 'items'])->findOrFail($commercialOrderId);
                if (!$order->status || in_array($order->order_status, ['draft', 'cancelled'], true)) throw new \Exception("El pedido {$order->code} no esta disponible para despacho");
                if ((int) $order->business_id !== (int) $jpa->business_id) throw new \Exception("El pedido {$order->code} no pertenece a la empresa seleccionada");
                if ((int) $order->warehouse_id !== (int) $jpa->warehouse_id) throw new \Exception("El pedido {$order->code} no corresponde al almacen del despacho");

                $otherDispatch = DispatchAssignment::query()
                    ->join('dispatches', 'dispatches.id', '=', 'dispatch_assignments.dispatch_id')
                    ->where('dispatch_assignments.commercial_order_id', $order->id)
                    ->where('dispatch_assignments.status', 1)
                    ->where('dispatches.status', 1)
                    ->whereNotIn('dispatches.dispatch_status', ['cancelled'])
                    ->where('dispatches.id', '!=', $jpa->id)
                    ->exists();
                if ($otherDispatch) throw new \Exception("El pedido {$order->code} ya esta asignado a otro despacho activo");

                DispatchAssignment::create([
                    'dispatch_id' => $jpa->id,
                    'commercial_order_id' => $order->id,
                    'commercial_order_code' => $order->code,
                    'customer_name' => $order->client?->full_name ?: $order->eventualClient?->business_name,
                    'total' => $order->total,
                    'assignment_status' => $jpa->dispatch_status,
                    'status' => true,
                ]);

                $currentOrderIds[] = (int) $order->id;
                $inserted++;
            }

            if ($inserted === 0) throw new \Exception('Debes asignar al menos un pedido al despacho');

            app(DispatchService::class)->syncExitNote($jpa->fresh(['assignments.commercialOrder.items', 'exitNote.items']));
            app(DispatchService::class)->syncCommercialOrderStatuses(array_merge($this->previousOrderIds, $currentOrderIds));

            DB::commit();
            return $jpa->fresh(['business', 'branch', 'warehouse', 'driver', 'vehicle', 'zoneMaster', 'exitNote', 'assignments.commercialOrder.client', 'assignments.commercialOrder.eventualClient', 'creator', 'updater']);
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
            $dispatch = Dispatch::with('assignments')->findOrFail($id);
            $orderIds = $dispatch->assignments->pluck('commercial_order_id')->filter()->map(fn($value) => (int) $value)->all();

            DispatchAssignment::where('dispatch_id', $dispatch->id)->delete();
            if ($dispatch->exit_note_id) DB::table('exit_notes')->where('id', $dispatch->exit_note_id)->delete();
            $dispatch->update(['status' => null, 'exit_note_id' => null, 'updated_by' => Auth::id()]);

            app(DispatchService::class)->syncCommercialOrderStatuses($orderIds);
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
        $allowed = ['waiting', 'assigned', 'in_route', 'delivered', 'incident', 'closed', 'cancelled'];
        $normalized = mb_strtolower(trim((string) $value));
        return in_array($normalized, $allowed, true) ? $normalized : 'waiting';
    }

    private function nextCode(): string
    {
        $next = 1;
        $latest = Dispatch::query()->latest('id')->value('code');
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) $next = ((int) $matches[1]) + 1;
        return 'DSP-' . str_pad((string) $next, 6, '0', STR_PAD_LEFT);
    }
}
