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

        ExitNoteItem::where('exit_note_id', $exitNote->id)->delete();

        $grouped = [];
        foreach ($assignments as $assignment) {
            $order = $assignment->commercialOrder;
            if (!$order || !$order->status) continue;

            foreach ($order->items as $item) {
                if (!$item->status || (float)$item->quantity <= 0) continue;
                $key = $item->article_id . ':' . $order->warehouse_id;
                if (!isset($grouped[$key])) {
                    $grouped[$key] = [
                        'article_id' => $item->article_id,
                        'warehouse_id' => $order->warehouse_id,
                        'quantity' => 0,
                        'total' => 0,
                    ];
                }
                $grouped[$key]['quantity'] = round($grouped[$key]['quantity'] + (float)$item->quantity, 3);
                $grouped[$key]['total'] = round($grouped[$key]['total'] + (float)$item->total, 2);
            }
        }

        if (empty($grouped)) {
            throw new \Exception('El despacho no tiene items validos para generar salida');
        }

        $stockService = app(StockService::class);
        foreach ($grouped as $line) {
            $availableStock = $stockService->getAvailableStockByWarehouse((int)$line['article_id'], (int)$line['warehouse_id'], (int)$exitNote->id);
            if ((float)$line['quantity'] > $availableStock + 0.0001) {
                throw new \Exception("Stock insuficiente para cerrar el despacho. Articulo {$line['article_id']} disponible: {$availableStock}");
            }

            ExitNoteItem::create([
                'exit_note_id' => $exitNote->id,
                'batch_code' => null,
                'article_id' => $line['article_id'],
                'warehouse_id' => $line['warehouse_id'],
                'stock' => $availableStock,
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
                $nextStatus = 'dispatched';
            } elseif ($dispatches->contains(fn($status) => in_array($status, ['assigned', 'waiting'], true))) {
                $nextStatus = 'preparing';
            } elseif ($dispatches->contains('incident')) {
                $nextStatus = 'dispatched';
            }

            if ($order->dispatch_status !== $nextStatus) {
                $order->update(['dispatch_status' => $nextStatus]);
                app(ExternalOrderEventService::class)->recordOrderStatus($order->fresh(), 'dispatch_status_changed');
            }
        }
    }
}
