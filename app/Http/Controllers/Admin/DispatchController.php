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
use App\Services\ReferralGuideService;
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
                'assignments.commercialOrder:id,code,client_id,eventual_client_id,document_type,dispatch_status,billing_status,total,dispatch_contact_name,dispatch_contact_phone,delivery_address,delivery_reference,ubigeo,observations',
                'assignments.commercialOrder.client:id,full_name,document_number',
                'assignments.commercialOrder.eventualClient:id,business_name,document_number',
                'assignments.commercialOrder.billingDocuments:id,commercial_order_id,code,document_type,series,sequence,external_reference,local_status,status',
                'referralGuides:id,code,business_id,business_branch_id,warehouse_id,dispatch_id,commercial_order_id,billing_document_id,driver_id,vehicle_id,series,sequence,external_reference,issue_date,transfer_date,guide_status,external_status,origin_ubigeo,origin_address,destination_ubigeo,destination_address,recipient_name,recipient_document_type,recipient_document_number,recipient_phone,driver_name,driver_document_type,driver_document_number,driver_license_number,vehicle_plate,transfer_reason,package_count,gross_weight,metadata,observations,status',
                'referralGuides.billingDocument:id,code,document_type,series,sequence,external_reference,local_status,status',
                'referralGuides.business:id,name,tax_number',
                'referralGuides.branch:id,business_id,name,ubigeo,address',
                'referralGuides.driver:id,full_name,document_type,document_number,license_number',
                'referralGuides.vehicle:id,plate,label',
                'referralGuides.commercialOrder:id,code',
                'referralGuides.items:id,referral_guide_id,item_code,description,unit,quantity,gross_weight,status',
                'deliveryEvidences:id,code,business_id,dispatch_id,commercial_order_id,driver_id,recipient_name,recipient_document_type,recipient_document_number,recipient_phone,evidence_url,evidence_notes,delivered_at,latitude,longitude,status,created_at',
                'deliveryEvidences.commercialOrder:id,code',
                'deliveryEvidences.driver:id,full_name,license_number',
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
        $dispatchStatus = $this->normalizeStatus($body['dispatch_status'] ?? 'pending');
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

        if (!$zoneId) {
            $zoneId = $this->resolveZoneIdFromAssignments((int) $business->id, $rawAssignments);
        }
        $zone = $zoneId ? Zone::findOrFail($zoneId) : null;

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
        if ($body['manifest_code'] && in_array($dispatchStatus, ['waiting', 'assigned', 'dispatched'], true)) {
            $dispatchStatus = 'in_route';
        }
        if (!$body['manifest_code'] && in_array($dispatchStatus, ['in_route', 'delivered', 'closed'], true)) {
            $body['manifest_code'] = $this->nextManifestCode();
        }
        $assignmentOrderIds = $this->assignmentOrderIds($rawAssignments);
        if (empty($assignmentOrderIds)) throw new \Exception('Debes asignar al menos un pedido al despacho');
        $this->assertAssignmentsAvailableForDispatch($assignmentOrderIds, (int) ($id ?? 0), $businessId, $warehouseId);
        $this->assertRouteAssets($dispatchStatus, $driver, $vehicle, $zone);
        $this->assertDeliveredHasEvidences((int) ($id ?? 0), $dispatchStatus, $assignmentOrderIds);

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
            if ($jpa->manifest_code || in_array($jpa->dispatch_status, ['in_route', 'delivered', 'closed'], true)) {
                app(ReferralGuideService::class)->prepareForDispatch($jpa->fresh(['assignments.commercialOrder.items']));
            }

            DB::commit();
            return $jpa->fresh(['business', 'branch', 'warehouse', 'driver', 'vehicle', 'zoneMaster', 'exitNote', 'assignments.commercialOrder.client', 'assignments.commercialOrder.eventualClient', 'assignments.commercialOrder.billingDocuments', 'referralGuides.billingDocument', 'referralGuides.items', 'creator', 'updater']);
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
        $allowed = ['pending', 'preparing', 'dispatched', 'waiting', 'assigned', 'in_route', 'delivered', 'incident', 'closed', 'cancelled'];
        $normalized = mb_strtolower(trim((string) $value));
        return in_array($normalized, $allowed, true) ? $normalized : 'pending';
    }

    private function nextCode(): string
    {
        $next = 1;
        $latest = Dispatch::query()->latest('id')->value('code');
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) $next = ((int) $matches[1]) + 1;
        return 'DSP-' . str_pad((string) $next, 6, '0', STR_PAD_LEFT);
    }

    private function nextManifestCode(): string
    {
        $next = 1;
        $latest = Dispatch::query()
            ->whereNotNull('manifest_code')
            ->where('manifest_code', 'like', 'MNF-%')
            ->latest('id')
            ->value('manifest_code');
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) $next = ((int) $matches[1]) + 1;
        return 'MNF-' . str_pad((string) $next, 6, '0', STR_PAD_LEFT);
    }

    private function resolveZoneIdFromAssignments(int $businessId, array $assignments): ?int
    {
        $orderIds = collect($assignments)
            ->map(fn($row) => is_array($row) ? $this->toNullableInt($row['commercial_order_id'] ?? null) : null)
            ->filter()
            ->values()
            ->all();
        if (empty($orderIds)) return null;

        $orders = CommercialOrder::query()
            ->whereIn('id', $orderIds)
            ->orderBy('id')
            ->get(['id', 'ubigeo', 'delivery_address']);

        $zones = Zone::query()
            ->whereNotNull('status')
            ->where(function ($scope) use ($businessId) {
                $scope->where('business_id', $businessId)
                    ->orWhereNull('business_id');
            })
            ->orderByRaw('CASE WHEN business_id IS NULL THEN 1 ELSE 0 END')
            ->get(['id', 'business_id', 'ubigeo', 'name', 'district', 'reference', 'observations']);

        foreach ($orders as $order) {
            $zone = $this->matchZoneForOrder($zones, $order);
            if ($zone) return (int) $zone->id;
        }

        return null;
    }

    private function matchZoneForOrder($zones, CommercialOrder $order): ?Zone
    {
        $ubigeo = $this->normalizeLocationText($order->ubigeo);
        $address = $this->normalizeLocationText(trim(implode(' ', array_filter([
            $order->delivery_address,
            $order->delivery_reference,
        ]))));

        if ($ubigeo !== '') {
            $exact = $zones->first(fn($zone) => $this->normalizeLocationText($zone->ubigeo) === $ubigeo);
            if ($exact) return $exact;
        }

        foreach ($zones as $zone) {
            $district = $this->normalizeLocationText($zone->district);
            $name = $this->normalizeLocationText($zone->name);
            $reference = $this->normalizeLocationText($zone->reference);
            $observations = $this->normalizeLocationText($zone->observations);
            $zoneText = trim("{$district} {$name} {$reference} {$observations}");

            if ($ubigeo !== '' && $zoneText !== '' && str_contains($zoneText, $ubigeo)) return $zone;
            if ($district !== '' && $address !== '' && str_contains($address, $district)) return $zone;
            foreach ($this->zoneDistrictTokens($zone) as $token) {
                if ($address !== '' && str_contains($address, $token)) return $zone;
            }
        }

        return null;
    }

    private function normalizeLocationText($value): string
    {
        $text = mb_strtolower(trim((string) ($value ?? '')));
        return strtr($text, [
            'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u',
            'à' => 'a', 'è' => 'e', 'ì' => 'i', 'ò' => 'o', 'ù' => 'u',
            'ä' => 'a', 'ë' => 'e', 'ï' => 'i', 'ö' => 'o', 'ü' => 'u',
            'ñ' => 'n',
        ]);
    }

    private function zoneDistrictTokens(Zone $zone): array
    {
        $text = $this->normalizeLocationText(trim(implode(' ', array_filter([
            $zone->district,
            $zone->reference,
            $zone->observations,
        ]))));
        $parts = preg_split('/[,;|\\n]+/', $text) ?: [];
        return collect($parts)
            ->map(fn($part) => trim($part))
            ->filter(fn($part) => mb_strlen($part) >= 4 && !in_array($part, ['lima', 'peru'], true))
            ->unique()
            ->values()
            ->all();
    }

    private function assertRouteAssets(string $dispatchStatus, ?Driver $driver, ?Vehicle $vehicle, ?Zone $zone): void
    {
        if (!in_array($dispatchStatus, ['in_route', 'delivered', 'closed'], true)) {
            return;
        }

        $errors = [];
        if (!$driver) $errors[] = 'conductor';
        if (!$vehicle) $errors[] = 'vehiculo';
        if (!$zone) $errors[] = 'zona';

        if (!empty($errors)) {
            throw new \Exception('Para poner el despacho en ruta o entregado falta: ' . implode(', ', $errors) . '.');
        }
    }

    private function assignmentOrderIds(array $assignments): array
    {
        return collect($assignments)
            ->map(fn($row) => is_array($row) ? $this->toNullableInt($row['commercial_order_id'] ?? null) : null)
            ->filter()
            ->map(fn($value) => (int) $value)
            ->unique()
            ->values()
            ->all();
    }

    private function assertAssignmentsAvailableForDispatch(array $orderIds, int $dispatchId, int $businessId, int $warehouseId): void
    {
        $orders = CommercialOrder::query()
            ->whereIn('id', $orderIds)
            ->get(['id', 'code', 'business_id', 'warehouse_id', 'order_status', 'dispatch_status', 'status'])
            ->keyBy('id');

        foreach ($orderIds as $orderId) {
            $order = $orders->get($orderId);
            if (!$order) throw new \Exception("El pedido {$orderId} no existe");
            if (!$order->status || in_array($order->order_status, ['draft', 'cancelled'], true)) {
                throw new \Exception("El pedido {$order->code} no esta disponible para despacho");
            }
            if ($order->dispatch_status !== 'dispatched') {
                throw new \Exception("El pedido {$order->code} debe estar listo en Preparacion antes de asignarlo a despacho");
            }
            if ((int) $order->business_id !== $businessId) {
                throw new \Exception("El pedido {$order->code} no pertenece a la empresa seleccionada");
            }
            if ((int) $order->warehouse_id !== $warehouseId) {
                throw new \Exception("El pedido {$order->code} no corresponde al almacen del despacho");
            }
        }

        $assigned = DispatchAssignment::query()
            ->select('dispatch_assignments.commercial_order_id', 'dispatches.code as dispatch_code')
            ->join('dispatches', 'dispatches.id', '=', 'dispatch_assignments.dispatch_id')
            ->whereIn('dispatch_assignments.commercial_order_id', $orderIds)
            ->where('dispatch_assignments.status', 1)
            ->where('dispatches.status', 1)
            ->whereNotIn('dispatches.dispatch_status', ['cancelled'])
            ->where('dispatches.id', '!=', $dispatchId)
            ->get()
            ->keyBy('commercial_order_id');

        foreach ($orderIds as $orderId) {
            $assignment = $assigned->get($orderId);
            if (!$assignment) continue;
            $order = $orders->get($orderId);
            throw new \Exception("El pedido {$order->code} ya esta asignado al despacho {$assignment->dispatch_code}");
        }
    }

    private function assertDeliveredHasEvidences(int $dispatchId, string $dispatchStatus, array $orderIds): void
    {
        if (!in_array($dispatchStatus, ['delivered', 'closed'], true)) {
            return;
        }

        if ($dispatchId <= 0) {
            throw new \Exception('Primero guarda el despacho y registra evidencias antes de marcarlo como entregado');
        }

        $coveredOrderIds = DB::table('delivery_evidences')
            ->where('dispatch_id', $dispatchId)
            ->whereIn('commercial_order_id', $orderIds)
            ->whereNotNull('status')
            ->pluck('commercial_order_id')
            ->map(fn($value) => (int) $value)
            ->unique()
            ->all();

        $missing = array_values(array_diff(array_map('intval', $orderIds), $coveredOrderIds));
        if (!empty($missing)) {
            $codes = CommercialOrder::query()->whereIn('id', $missing)->pluck('code')->all();
            throw new \Exception('Registra evidencia de entrega antes de cerrar el despacho. Pendientes: ' . implode(', ', $codes));
        }
    }
}
