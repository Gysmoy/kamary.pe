<?php

namespace App\Services;

use App\Models\Article;
use App\Models\ArticlePresentation;
use App\Models\CommercialOrder;
use App\Models\CommercialOrderItem;
use App\Models\CommercialOrderStockMovement;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CommercialOrderStockService
{
    private const RELEASED_ORDER_STATUSES = ['cancelled', 'closed'];
    private const RELEASED_DISPATCH_STATUSES = ['delivered', 'cancelled'];

    public function supportsReservations(): bool
    {
        return Schema::hasColumn('commercial_order_items', 'reserved_quantity');
    }

    public function supportsReservationMovements(): bool
    {
        return Schema::hasTable('commercial_order_stock_movements');
    }

    public function buildReservationPlan(array $items, int $defaultWarehouseId, ?int $excludedOrderId = null): array
    {
        $usedByKey = [];
        $itemsPlan = [];
        $shortages = [];

        foreach ($items as $index => $item) {
            if (!is_array($item)) continue;

            $articleId = $this->toNullableInt($item['article_id'] ?? null);
            if (!$articleId) continue;

            $warehouseId = $this->toNullableInt($item['warehouse_id'] ?? null) ?? $defaultWarehouseId;
            $lineQuantity = max(0, $this->toDecimal($item['quantity'] ?? 0));
            $presentationUnits = $this->presentationUnitsForItem($item, $articleId);
            $quantity = $this->toBaseQuantity($lineQuantity, $presentationUnits);
            if ($quantity <= 0) continue;

            $article = Article::find($articleId);
            $articleName = $article?->name ?: "Articulo {$articleId}";
            $key = "{$articleId}:{$warehouseId}";
            $physicalStock = app(StockService::class)->getAvailableStockByWarehouse($articleId, $warehouseId);
            $reservedByOthers = $this->reservedByOtherOrders($articleId, $warehouseId, $excludedOrderId);
            $baseAvailable = max(0, round($physicalStock - $reservedByOthers, 3));
            $alreadyUsed = $usedByKey[$key] ?? 0;
            $availableForLine = max(0, round($baseAvailable - $alreadyUsed, 3));
            $reservedQuantity = min($quantity, $availableForLine);
            $shortageQuantity = max(0, round($quantity - $reservedQuantity, 3));

            $usedByKey[$key] = round($alreadyUsed + $reservedQuantity, 3);

            $row = [
                'index' => $index,
                'article_id' => $articleId,
                'article_name' => $articleName,
                'warehouse_id' => $warehouseId,
                'quantity' => $quantity,
                'line_quantity' => $lineQuantity,
                'presentation_units' => $presentationUnits,
                'physical_stock' => $physicalStock,
                'reserved_by_others' => $reservedByOthers,
                'available_for_reservation' => $availableForLine,
                'reserved_quantity' => $reservedQuantity,
                'shortage_quantity' => $shortageQuantity,
            ];

            $itemsPlan[$index] = $row;
            if ($shortageQuantity > 0.0001) {
                $shortages[] = $row;
            }
        }

        return [
            'items' => $itemsPlan,
            'shortages' => $shortages,
        ];
    }

    public function assertNoShortages(array $plan, string $prefix = 'Stock insuficiente para crear el pedido.'): void
    {
        if (!empty($plan['shortages'])) {
            throw new \Exception($this->shortageMessage($plan['shortages'], $prefix));
        }
    }

    public function assertOrderReadyForDispatch(CommercialOrder $order): void
    {
        $order->loadMissing('items.article');
        $items = $order->items
            ->filter(fn($item) => (bool)$item->status && (float)$item->quantity > 0)
            ->values();

        if ($items->isEmpty()) {
            throw new \Exception('El pedido no tiene items validos para preparacion');
        }

        $grouped = [];
        foreach ($items as $item) {
            $warehouseId = (int)($item->warehouse_id ?: $order->warehouse_id);
            $key = "{$item->article_id}:{$warehouseId}";
            if (!isset($grouped[$key])) {
                $grouped[$key] = [
                    'article_id' => (int)$item->article_id,
                    'article_name' => $item->article?->name ?: "Articulo {$item->article_id}",
                    'warehouse_id' => $warehouseId,
                    'quantity' => 0,
                    'reserved_quantity' => 0,
                ];
            }

            $grouped[$key]['quantity'] = round($grouped[$key]['quantity'] + $this->toBaseQuantity(
                (float)$item->quantity,
                (float)($item->presentation_units ?: 1)
            ), 3);
            $grouped[$key]['reserved_quantity'] = round($grouped[$key]['reserved_quantity'] + (float)($item->reserved_quantity ?? 0), 3);
        }

        $shortages = [];
        foreach ($grouped as $key => $row) {
            $physicalStock = app(StockService::class)->getAvailableStockByWarehouse($row['article_id'], $row['warehouse_id']);
            $reservedByOthers = $this->reservedByOtherOrders($row['article_id'], $row['warehouse_id'], (int)$order->id);
            $availableForOrder = max(0, round($physicalStock - $reservedByOthers, 3));
            $shortageQuantity = max(0, round($row['quantity'] - $availableForOrder, 3));

            if ($shortageQuantity > 0.0001) {
                $shortages[] = array_merge($row, [
                    'physical_stock' => $physicalStock,
                    'reserved_by_others' => $reservedByOthers,
                    'available_for_reservation' => $availableForOrder,
                    'shortage_quantity' => $shortageQuantity,
                ]);
            }
        }

        if (!empty($shortages)) {
            throw new \Exception($this->shortageMessage(
                $shortages,
                'No se puede marcar como listo. Falta stock para completar el pedido.'
            ));
        }

        if ($this->supportsReservations()) {
            foreach ($items as $item) {
                $quantity = $this->toBaseQuantity((float)$item->quantity, (float)($item->presentation_units ?: 1));
                $currentReserved = round((float)($item->reserved_quantity ?? 0), 3);
                if (abs($currentReserved - $quantity) > 0.0001) {
                    if ($quantity > $currentReserved) {
                        $this->recordReservationMovement(
                            $order,
                            $item,
                            'reserved',
                            round($quantity - $currentReserved, 3),
                            'Ajuste de reserva al finalizar preparacion'
                        );
                    } elseif ($currentReserved > $quantity) {
                        $this->recordReservationMovement(
                            $order,
                            $item,
                            'released',
                            round($currentReserved - $quantity, 3),
                            'Liberacion de reserva por ajuste de preparacion'
                        );
                    }
                    $item->update(['reserved_quantity' => $quantity]);
                }
            }
        }

        app(CommercialOrderTrackingService::class)->record(
            $order->fresh(),
            'stock_reservation',
            'Stock confirmado para preparacion',
            'reserved',
            'La reserva cubre todos los items del pedido.',
            ['items' => array_values($grouped)]
        );
    }

    public function recordOrderReservationMovements(CommercialOrder $order, string $reason = 'Reserva de stock por pedido'): void
    {
        if (!$this->supportsReservations() || !$this->supportsReservationMovements()) return;

        $order->loadMissing('items');
        foreach ($order->items as $item) {
            $quantity = round((float)($item->reserved_quantity ?? 0), 3);
            if ($quantity <= 0) continue;
            $this->recordReservationMovement($order, $item, 'reserved', $quantity, $reason);
        }
    }

    public function releaseOrderReservations(CommercialOrder $order, string $reason = 'Liberacion de reserva de stock'): void
    {
        if (!$this->supportsReservations()) return;

        $order->loadMissing('items');
        foreach ($order->items as $item) {
            $quantity = round((float)($item->reserved_quantity ?? 0), 3);
            if ($quantity <= 0) continue;
            $this->recordReservationMovement($order, $item, 'released', $quantity, $reason);
            $item->update(['reserved_quantity' => 0]);
        }
    }

    public function recordReservationTracking(CommercialOrder $order, array $plan): void
    {
        $items = array_values($plan['items'] ?? []);
        if (empty($items)) return;

        $hasShortages = !empty($plan['shortages']);
        app(CommercialOrderTrackingService::class)->record(
            $order,
            'stock_reservation',
            $hasShortages ? 'Stock reservado parcialmente' : 'Stock reservado',
            $hasShortages ? 'partial' : 'reserved',
            $hasShortages
                ? $this->shortageMessage($plan['shortages'], 'Pedido guardado con faltante de stock.')
                : 'La reserva cubre todos los items del pedido.',
            [
                'items' => $items,
                'shortages' => array_values($plan['shortages'] ?? []),
            ]
        );
    }

    public function shortageMessage(array $shortages, string $prefix): string
    {
        $lines = array_map(function ($row) {
            return "{$row['article_name']}: faltan {$this->formatQuantity($row['shortage_quantity'])} unidad(es) para completar {$this->formatQuantity($row['quantity'])}. Disponible para reservar: {$this->formatQuantity($row['available_for_reservation'])}";
        }, array_slice($shortages, 0, 6));

        $suffix = count($shortages) > 6 ? '; y otros ' . (count($shortages) - 6) . ' item(s)' : '';
        return trim($prefix . ' ' . implode('; ', $lines) . $suffix);
    }

    public function reservedByOtherOrders(int $articleId, int $warehouseId, $excludedOrderIds = null): float
    {
        if (!$this->supportsReservations()) return 0.0;

        $excludedOrderIds = array_values(array_filter(array_map(
            'intval',
            is_array($excludedOrderIds) ? $excludedOrderIds : [$excludedOrderIds]
        )));

        $query = DB::table('commercial_order_items as item')
            ->join('commercial_orders as commercial_order', 'commercial_order.id', '=', 'item.commercial_order_id')
            ->where('item.status', 1)
            ->where('commercial_order.status', 1)
            ->where('item.article_id', $articleId)
            ->whereRaw('COALESCE(item.warehouse_id, commercial_order.warehouse_id) = ?', [$warehouseId])
            ->whereNotIn('commercial_order.order_status', self::RELEASED_ORDER_STATUSES)
            ->whereNotIn('commercial_order.dispatch_status', self::RELEASED_DISPATCH_STATUSES);

        if (!empty($excludedOrderIds)) {
            $query->whereNotIn('commercial_order.id', $excludedOrderIds);
        }

        return round((float)$query->sum('item.reserved_quantity'), 3);
    }

    private function toDecimal($value): float
    {
        $text = trim((string)($value ?? ''));
        if ($text === '' || !is_numeric($text)) return 0.0;
        return (float)$text;
    }

    private function presentationUnitsForItem(array $item, int $articleId): float
    {
        $presentationId = $this->toNullableInt($item['presentation_id'] ?? null);
        if ($presentationId) {
            $units = ArticlePresentation::query()
                ->where('id', $presentationId)
                ->where('article_id', $articleId)
                ->value('units');

            if ((float)$units > 0) {
                return (float)$units;
            }
        }

        $units = $this->toDecimal($item['presentation_units'] ?? 1);
        return $units > 0 ? $units : 1.0;
    }

    private function toBaseQuantity(float $quantity, float $presentationUnits): float
    {
        $units = $presentationUnits > 0 ? $presentationUnits : 1.0;
        return round(max(0, $quantity) * $units, 3);
    }

    private function toNullableInt($value): ?int
    {
        $text = trim((string)($value ?? ''));
        if ($text === '' || !ctype_digit(ltrim($text, '+'))) return null;
        return (int)$text;
    }

    private function formatQuantity(float $value): string
    {
        $rounded = round($value, 3);
        if (abs($rounded - round($rounded)) < 0.0001) {
            return (string)(int)round($rounded);
        }

        return rtrim(rtrim(number_format($rounded, 3, '.', ''), '0'), '.');
    }

    private function recordReservationMovement(
        CommercialOrder $order,
        CommercialOrderItem $item,
        string $movementType,
        float $quantity,
        string $reason
    ): void {
        if (!$this->supportsReservationMovements() || $quantity <= 0) return;

        CommercialOrderStockMovement::create([
            'commercial_order_id' => $order->id,
            'commercial_order_item_id' => $item->id,
            'business_id' => $order->business_id,
            'business_branch_id' => $order->business_branch_id,
            'warehouse_id' => $item->warehouse_id ?: $order->warehouse_id,
            'article_id' => $item->article_id,
            'movement_type' => $movementType,
            'quantity' => $quantity,
            'reference_code' => $order->code,
            'observations' => $reason,
            'metadata' => [
                'order_code' => $order->code,
                'order_status' => $order->order_status,
                'dispatch_status' => $order->dispatch_status,
            ],
            'status' => true,
            'created_by' => Auth::id(),
            'updated_by' => Auth::id(),
        ]);
    }
}
