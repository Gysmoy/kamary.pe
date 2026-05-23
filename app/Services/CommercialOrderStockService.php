<?php

namespace App\Services;

use App\Models\Article;
use App\Models\CommercialOrder;
use App\Models\CommercialOrderItem;
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
            $quantity = max(0, $this->toDecimal($item['quantity'] ?? 0));
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

            $grouped[$key]['quantity'] = round($grouped[$key]['quantity'] + (float)$item->quantity, 3);
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
                $quantity = round((float)$item->quantity, 3);
                if (abs((float)($item->reserved_quantity ?? 0) - $quantity) > 0.0001) {
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

    public function releaseOrderReservations(CommercialOrder $order): void
    {
        if (!$this->supportsReservations()) return;

        CommercialOrderItem::where('commercial_order_id', $order->id)
            ->where('reserved_quantity', '>', 0)
            ->update(['reserved_quantity' => 0]);
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
}
