<?php

namespace App\Services;

use App\Models\CommercialOrder;
use App\Models\Dispatch;
use App\Models\DispatchAssignment;
use App\Models\ExitNote;
use App\Models\ExitNoteItem;
use App\Services\Integrations\ExternalOrderEventService;
use Illuminate\Support\Facades\Auth;

class DispatchService
{
    public function syncExitNote(Dispatch $dispatch): void
    {
        $dispatch->loadMissing('assignments.commercialOrder.items', 'assignments.commercialOrder.client', 'assignments.commercialOrder.eventualClient', 'exitNote.items');

        $shouldGenerate = (bool) $dispatch->status && in_array($dispatch->dispatch_status, ['delivered', 'closed'], true);
        $existingExitNote = $dispatch->exit_note_id ? ExitNote::with('items')->find($dispatch->exit_note_id) : null;

        if (!$shouldGenerate) {
            if ($existingExitNote) {
                $existingExitNote->delete();
                $dispatch->update(['exit_note_id' => null]);
            }
            return;
        }

        $assignments = $dispatch->assignments->where('status', true)->values();
        if ($assignments->isEmpty()) {
            throw new \Exception('Debes agregar al menos un pedido para cerrar el despacho');
        }

        $clientName = $assignments->count() === 1
            ? ($assignments->first()->customer_name ?: 'Cliente despacho')
            : 'Despacho agrupado';

        $exitNote = $existingExitNote ?: ExitNote::create([
            'business_id' => $dispatch->business_id,
            'business_branch_id' => $dispatch->business_branch_id,
            'warehouse_id' => $dispatch->warehouse_id,
            'client_name' => $clientName,
            'motives' => ['Despacho'],
            'observations' => "Salida tecnica generada desde despacho {$dispatch->code}",
            'status' => true,
            'created_by' => Auth::id(),
            'updated_by' => Auth::id(),
        ]);

        $exitNote->update([
            'business_id' => $dispatch->business_id,
            'business_branch_id' => $dispatch->business_branch_id,
            'warehouse_id' => $dispatch->warehouse_id,
            'client_name' => $clientName,
            'motives' => ['Despacho'],
            'observations' => trim((string)($dispatch->observations ?: "Salida tecnica generada desde despacho {$dispatch->code}")),
            'updated_by' => Auth::id(),
        ]);

        $stockRows = $this->exitNoteStockRows($this->buildExitNoteLines($dispatch), (int)$exitNote->id);

        ExitNoteItem::where('exit_note_id', $exitNote->id)->delete();
        foreach ($stockRows as $line) {
            ExitNoteItem::create([
                'exit_note_id' => $exitNote->id,
                'batch_code' => null,
                'article_id' => $line['article_id'],
                'warehouse_id' => $line['warehouse_id'],
                'stock' => $line['stock'],
                'expiration_date' => null,
                'location' => null,
                'destination_location' => $dispatch->zone,
                'quantity' => $line['quantity'],
                'total' => $line['total'],
                'status' => true,
            ]);
        }

        if ((int)$dispatch->exit_note_id !== (int)$exitNote->id) {
            $dispatch->update(['exit_note_id' => $exitNote->id]);
        }
    }

    public function assertExitNoteStockAvailable(Dispatch $dispatch): void
    {
        $dispatch->loadMissing('assignments.commercialOrder.items');
        $this->exitNoteStockRows($this->buildExitNoteLines($dispatch), (int)($dispatch->exit_note_id ?? 0));
    }

    private function buildExitNoteLines(Dispatch $dispatch): array
    {
        $assignments = $dispatch->assignments->where('status', true)->values();
        if ($assignments->isEmpty()) {
            throw new \Exception('Debes agregar al menos un pedido para cerrar el despacho');
        }

        $grouped = [];
        foreach ($assignments as $assignment) {
            $order = $assignment->commercialOrder;
            if (!$order || !$order->status) continue;

            foreach ($order->items as $item) {
                if (!$item->status || (float)$item->quantity <= 0) continue;
                $warehouseId = (int)($item->warehouse_id ?: $order->warehouse_id);
                $key = $item->article_id . ':' . $warehouseId;
                $presentationUnits = (float)($item->presentation_units ?: 1);
                if ($presentationUnits <= 0) $presentationUnits = 1;
                $baseQuantity = round((float)$item->quantity * $presentationUnits, 3);
                if ($baseQuantity <= 0) continue;

                if (!isset($grouped[$key])) {
                    $grouped[$key] = [
                        'article_id' => $item->article_id,
                        'warehouse_id' => $warehouseId,
                        'quantity' => 0,
                        'total' => 0,
                        'order_ids' => [],
                    ];
                }
                $grouped[$key]['quantity'] = round($grouped[$key]['quantity'] + $baseQuantity, 3);
                $grouped[$key]['total'] = round($grouped[$key]['total'] + (float)$item->total, 2);
                $grouped[$key]['order_ids'][] = (int)$order->id;
            }
        }

        foreach ($grouped as &$line) {
            $line['order_ids'] = array_values(array_unique($line['order_ids']));
        }
        unset($line);

        return $grouped;
    }

    private function exitNoteStockRows(array $grouped, int $exitNoteId): array
    {
        if (empty($grouped)) {
            throw new \Exception('El despacho no tiene items validos para generar salida');
        }

        $stockService = app(StockService::class);
        $stockRows = [];
        foreach ($grouped as $line) {
            $physicalStock = $stockService->getAvailableStockByWarehouse((int)$line['article_id'], (int)$line['warehouse_id'], $exitNoteId);
            $reservedByOtherOrders = app(CommercialOrderStockService::class)->reservedByOtherOrders(
                (int)$line['article_id'],
                (int)$line['warehouse_id'],
                $line['order_ids'] ?? []
            );
            $availableStock = max(0, round($physicalStock - $reservedByOtherOrders, 3));
            if ((float)$line['quantity'] > $availableStock + 0.0001) {
                throw new \Exception("Stock insuficiente para cerrar el despacho. Articulo {$line['article_id']} disponible: {$availableStock}");
            }

            $line['stock'] = $availableStock;
            unset($line['order_ids']);
            $stockRows[] = $line;
        }

        return $stockRows;
    }

    public function syncCommercialOrderStatuses(array $orderIds): void
    {
        $orderIds = array_values(array_unique(array_filter(array_map('intval', $orderIds))));
        if (empty($orderIds)) return;

        foreach ($orderIds as $orderId) {
            $order = CommercialOrder::find($orderId);
            if (!$order || !$order->status || $order->order_status === 'cancelled') continue;

            $dispatches = DispatchAssignment::query()
                ->select('dispatches.dispatch_status')
                ->join('dispatches', 'dispatches.id', '=', 'dispatch_assignments.dispatch_id')
                ->where('dispatch_assignments.commercial_order_id', $orderId)
                ->where('dispatch_assignments.status', 1)
                ->where('dispatches.status', 1)
                ->pluck('dispatches.dispatch_status')
                ->filter()
                ->values();

            $nextStatus = 'pending';
            if ($dispatches->contains(fn($status) => in_array($status, ['delivered', 'closed'], true))) {
                $nextStatus = 'delivered';
            } elseif ($dispatches->contains('in_route')) {
                $nextStatus = 'in_route';
            } elseif ($dispatches->contains('dispatched')) {
                $nextStatus = 'dispatched';
            } elseif ($dispatches->contains(fn($status) => in_array($status, ['pending', 'preparing', 'assigned', 'waiting'], true))) {
                $nextStatus = 'preparing';
            } elseif ($dispatches->contains('incident')) {
                $nextStatus = 'in_route';
            }

            $payload = ['updated_by' => Auth::id()];
            if ($order->dispatch_status !== $nextStatus) {
                $payload['dispatch_status'] = $nextStatus;
            }

            $nextOrderStatus = $this->orderStatusFromDispatchStatus($nextStatus);
            if ($nextOrderStatus && !in_array($order->order_status, ['billed', 'closed', 'cancelled'], true) && $order->order_status !== $nextOrderStatus) {
                $payload['order_status'] = $nextOrderStatus;
            }

            $shouldReleaseReservations = in_array($nextStatus, ['delivered', 'cancelled'], true);
            if (count($payload) > 1) {
                $statusChanged = array_key_exists('dispatch_status', $payload);
                $orderStatusChanged = array_key_exists('order_status', $payload);
                $order->update($payload);
                $freshOrder = $order->fresh();
                if ($statusChanged) {
                    app(CommercialOrderTrackingService::class)->recordStatusChange($freshOrder, 'dispatch_status', $nextStatus);
                }
                if ($orderStatusChanged) {
                    app(CommercialOrderTrackingService::class)->recordStatusChange($freshOrder, 'order_status', $nextOrderStatus);
                }
                app(ExternalOrderEventService::class)->recordOrderStatus($freshOrder, 'dispatch_status_changed');
            }
            if ($shouldReleaseReservations) {
                app(CommercialOrderStockService::class)->releaseOrderReservations($order->fresh(['items']));
            }
        }
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
}
