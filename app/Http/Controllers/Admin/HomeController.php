<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Support\ModulePermissions;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class HomeController extends BasicController
{
    public $reactView = 'Admin/Home';
    public $reactRootView = 'admin';

    public function setReactViewProperties(Request $request)
    {
        if (!ModulePermissions::userCan($request->user(), 'dashboard')) {
            return redirect(ModulePermissions::homePathForUser($request->user()));
        }

        $periodStart = now()->startOfMonth()->toDateString();
        $periodEnd = now()->toDateString();
        $rotationStart = now()->subDays(89)->toDateString();
        $stockByWarehouse = $this->stockByWarehouse($rotationStart, $periodEnd);

        return [
            'catalogMetrics' => [
                [
                    'key' => 'articles',
                    'label' => 'Articulos',
                    'value' => $this->countRows('articles'),
                    'icon' => 'ti ti-box',
                    'route' => '/admin/articles',
                    'color' => 'primary',
                ],
                [
                    'key' => 'laboratories',
                    'label' => 'Laboratorios',
                    'value' => $this->countRows('laboratories'),
                    'icon' => 'ti ti-flask',
                    'route' => '/admin/laboratories',
                    'color' => 'info',
                ],
                [
                    'key' => 'units',
                    'label' => 'Und. de medida',
                    'value' => $this->countRows('units'),
                    'icon' => 'ti ti-ruler-measure',
                    'route' => '/admin/units',
                    'color' => 'success',
                ],
                [
                    'key' => 'suppliers',
                    'label' => 'Proveedores',
                    'value' => $this->countRows('suppliers'),
                    'icon' => 'ti ti-truck-delivery',
                    'route' => '/admin/suppliers',
                    'color' => 'warning',
                ],
                [
                    'key' => 'users',
                    'label' => 'Usuarios',
                    'value' => $this->countRows('users'),
                    'icon' => 'ti ti-users',
                    'route' => '/admin/users',
                    'color' => 'secondary',
                ],
                [
                    'key' => 'roles',
                    'label' => 'Roles',
                    'value' => $this->countRows('roles'),
                    'icon' => 'ti ti-user-check',
                    'route' => '/admin/roles',
                    'color' => 'dark',
                ],
            ],
            'salesDashboard' => [
                'period' => [
                    'label' => 'Mes actual',
                    'start' => $periodStart,
                    'end' => $periodEnd,
                    'rotationStart' => $rotationStart,
                ],
                'summary' => $this->salesSummary($periodStart, $periodEnd),
                'warehouseSales' => $this->warehouseSales($periodStart, $periodEnd),
                'stockByWarehouse' => $stockByWarehouse,
                'inventoryRotation' => $this->inventoryRotationSummary($stockByWarehouse, $rotationStart, $periodEnd),
                'profitability' => $this->profitability($periodStart, $periodEnd),
                'dispatch' => $this->dispatchKpis($periodStart, $periodEnd),
            ],
        ];
    }

    private function countRows(string $table): ?int
    {
        if (!Schema::hasTable($table)) return null;

        $query = DB::table($table);
        if (Schema::hasColumn($table, 'status')) {
            $query->whereNotNull('status');
        }

        return $query->count();
    }

    private function salesSummary(string $startDate, string $endDate): array
    {
        $commercial = [
            'orders' => 0,
            'salesValue' => 0,
            'salesUnits' => 0,
            'salesCost' => 0,
        ];

        if ($this->hasTables(['commercial_orders', 'commercial_order_items'])) {
            $commercial['orders'] = (int) $this->activeCommercialOrders($startDate, $endDate)->count();
            $commercial['salesValue'] = (float) $this->activeCommercialOrders($startDate, $endDate)->sum('total');

            $items = $this->commercialItems($startDate, $endDate)
                ->selectRaw('COALESCE(SUM(item.quantity), 0) as units')
                ->selectRaw('COALESCE(SUM(item.quantity * ' . $this->costUnitExpression() . '), 0) as cost')
                ->first();

            $commercial['salesUnits'] = (float) ($items->units ?? 0);
            $commercial['salesCost'] = (float) ($items->cost ?? 0);
        }

        $service = [
            'orders' => 0,
            'salesValue' => 0,
        ];

        if ($this->hasTable('service_orders')) {
            $service['orders'] = (int) $this->activeServiceOrders($startDate, $endDate)->count();
            $service['salesValue'] = (float) $this->activeServiceOrders($startDate, $endDate)->sum('total');
        }

        $totalSales = $commercial['salesValue'] + $service['salesValue'];
        $profit = $commercial['salesValue'] - $commercial['salesCost'];

        return [
            'salesValue' => round($totalSales, 2),
            'commercialSalesValue' => round($commercial['salesValue'], 2),
            'serviceSalesValue' => round($service['salesValue'], 2),
            'salesUnits' => round($commercial['salesUnits'], 3),
            'salesCost' => round($commercial['salesCost'], 2),
            'grossProfit' => round($profit, 2),
            'grossMarginPct' => $commercial['salesValue'] > 0 ? round(($profit / $commercial['salesValue']) * 100, 2) : 0,
            'ordersCount' => $commercial['orders'] + $service['orders'],
            'commercialOrdersCount' => $commercial['orders'],
            'serviceOrdersCount' => $service['orders'],
        ];
    }

    private function warehouseSales(string $startDate, string $endDate): array
    {
        if (!$this->hasTables(['commercial_orders', 'commercial_order_items', 'warehouses'])) return [];

        return $this->commercialItems($startDate, $endDate)
            ->leftJoin('warehouses as warehouse', 'warehouse.id', '=', 'item.warehouse_id')
            ->groupBy('item.warehouse_id', 'warehouse.name')
            ->orderByDesc('sales_value')
            ->limit(8)
            ->selectRaw('item.warehouse_id as warehouseId')
            ->selectRaw("COALESCE(warehouse.name, 'Sin almacen') as warehouseName")
            ->selectRaw('COUNT(DISTINCT sale.id) as ordersCount')
            ->selectRaw('COALESCE(SUM(item.quantity), 0) as units')
            ->selectRaw('COALESCE(SUM(item.total), 0) as sales_value')
            ->selectRaw('COALESCE(SUM(item.quantity * ' . $this->costUnitExpression() . '), 0) as cost_value')
            ->get()
            ->map(function ($row) {
                $sales = (float) $row->sales_value;
                $cost = (float) $row->cost_value;

                return [
                    'warehouseId' => $row->warehouseId,
                    'warehouseName' => $row->warehouseName,
                    'ordersCount' => (int) $row->ordersCount,
                    'units' => round((float) $row->units, 3),
                    'salesValue' => round($sales, 2),
                    'costValue' => round($cost, 2),
                    'profitValue' => round($sales - $cost, 2),
                    'profitPct' => $sales > 0 ? round((($sales - $cost) / $sales) * 100, 2) : 0,
                ];
            })
            ->values()
            ->all();
    }

    private function stockByWarehouse(string $rotationStart, string $endDate): array
    {
        if (!$this->hasTables(['articles', 'warehouses'])) return [];

        $stockMovements = $this->stockMovementsQuery();
        if (!$stockMovements) return [];

        $fallbackCost = $this->articleCostFallbackExpression('article', true);
        $stockRows = DB::query()
            ->fromSub($stockMovements, 'movement')
            ->join('articles as article', 'article.id', '=', 'movement.article_id')
            ->leftJoin('warehouses as warehouse', 'warehouse.id', '=', 'movement.warehouse_id')
            ->selectRaw('movement.warehouse_id as warehouse_id')
            ->selectRaw("COALESCE(warehouse.name, 'Sin almacen') as warehouse_name")
            ->selectRaw('article.id as article_id')
            ->selectRaw("COALESCE(article.code, '') as article_code")
            ->selectRaw("COALESCE(article.name, '') as article_name")
            ->selectRaw('ROUND(COALESCE(SUM(movement.quantity_in), 0), 3) as qty_in')
            ->selectRaw('ROUND(COALESCE(SUM(movement.quantity_out), 0), 3) as qty_out')
            ->selectRaw('ROUND(COALESCE(SUM(movement.quantity_in), 0) - COALESCE(SUM(movement.quantity_out), 0), 3) as stock')
            ->selectRaw("
                ROUND(
                    CASE
                        WHEN COALESCE(SUM(movement.quantity_in), 0) > 0 THEN COALESCE(SUM(movement.total_in), 0) / COALESCE(SUM(movement.quantity_in), 0)
                        ELSE {$fallbackCost}
                    END,
                    4
                ) as reference_cost_unit
            ")
            ->groupBy('movement.warehouse_id', 'warehouse.name', 'article.id', 'article.code', 'article.name')
            ->havingRaw('(COALESCE(SUM(movement.quantity_in), 0) - COALESCE(SUM(movement.quantity_out), 0)) != 0')
            ->get();

        $monthlySales = $this->averageMonthlySalesMap($rotationStart, $endDate);
        $rotationDays = max(1, Carbon::parse($rotationStart)->diffInDays(Carbon::parse($endDate)) + 1);
        $rotationMonths = max(1, $rotationDays / 30);

        return $stockRows
            ->groupBy(fn($row) => (string) ($row->warehouse_id ?? '0'))
            ->map(function ($rows) use ($monthlySales, $rotationMonths) {
                $first = $rows->first();
                $products = $rows->map(function ($row) use ($monthlySales, $rotationMonths) {
                    $key = ($row->warehouse_id ?? 0) . ':' . $row->article_id;
                    $avgMonthlyUnits = round((float) ($monthlySales[$key] ?? 0) / $rotationMonths, 3);
                    $stock = (float) $row->stock;
                    $dailySales = $avgMonthlyUnits > 0 ? $avgMonthlyUnits / 30 : 0;
                    $coverageDays = $dailySales > 0 ? round($stock / $dailySales, 1) : ($stock > 0 ? 999 : 0);
                    $referenceCost = (float) $row->reference_cost_unit;

                    return [
                        'articleId' => (int) $row->article_id,
                        'articleCode' => $row->article_code,
                        'articleName' => $row->article_name,
                        'avgMonthlyUnits' => $avgMonthlyUnits,
                        'stock' => round($stock, 3),
                        'stockValue' => round($stock * $referenceCost, 2),
                        'referenceCostUnit' => round($referenceCost, 4),
                        'coverageDays' => $coverageDays >= 999 ? null : $coverageDays,
                        'stockStatus' => $this->stockStatus($coverageDays, $stock, $avgMonthlyUnits),
                    ];
                })
                    ->sortByDesc('stockValue')
                    ->values();

                return [
                    'warehouseId' => $first->warehouse_id,
                    'warehouseName' => $first->warehouse_name,
                    'totalStockValue' => round($products->sum('stockValue'), 2),
                    'productCount' => $products->count(),
                    'statusSummary' => [
                        'DEVOLUCION' => $products->where('stockStatus', 'DEVOLUCION')->count(),
                        'INFRASTOCK' => $products->where('stockStatus', 'INFRASTOCK')->count(),
                        'NORMOSTOCK' => $products->where('stockStatus', 'NORMOSTOCK')->count(),
                        'SOBRESTOCK' => $products->where('stockStatus', 'SOBRESTOCK')->count(),
                    ],
                    'products' => $products->values()->all(),
                ];
            })
            ->sortByDesc('totalStockValue')
            ->values()
            ->all();
    }

    private function inventoryRotationSummary(array $stockByWarehouse, string $rotationStart, string $endDate): array
    {
        $products = collect($stockByWarehouse)
            ->flatMap(fn($warehouse) => $warehouse['products'] ?? [])
            ->values();

        $totalItems = $products->count();
        $totalValue = round($products->sum('stockValue'), 2);
        $totalUnits = round($products->sum('stock'), 3);
        $statusOrder = [
            'DEVOLUCION' => 'Devolucion',
            'SOBRESTOCK' => 'Sobre stock',
            'INFRASTOCK' => 'Infra stock',
            'NORMOSTOCK' => 'Normal',
        ];

        $statusRows = collect($statusOrder)
            ->map(function ($label, $status) use ($products, $totalItems, $totalValue) {
                $rows = $products->where('stockStatus', $status);
                $items = $rows->count();
                $value = round($rows->sum('stockValue'), 2);

                return [
                    'status' => $status,
                    'label' => $label,
                    'items' => $items,
                    'stockUnits' => round($rows->sum('stock'), 3),
                    'stockValue' => $value,
                    'pctItems' => $totalItems > 0 ? round(($items / $totalItems) * 100, 2) : 0,
                    'pctValue' => $totalValue > 0 ? round(($value / $totalValue) * 100, 2) : 0,
                ];
            })
            ->values()
            ->all();

        return [
            'period' => [
                'label' => 'Ultimos 90 dias',
                'start' => $rotationStart,
                'end' => $endDate,
                'days' => max(1, Carbon::parse($rotationStart)->diffInDays(Carbon::parse($endDate)) + 1),
            ],
            'totalItems' => $totalItems,
            'totalUnits' => $totalUnits,
            'totalValue' => $totalValue,
            'statusRows' => $statusRows,
        ];
    }

    private function profitability(string $startDate, string $endDate): array
    {
        if (!$this->hasTables(['commercial_orders', 'commercial_order_items', 'articles'])) {
            return [
                'totals' => $this->profitabilityTotals(),
                'productRows' => [],
                'productWarehouseRows' => [],
                'warehouseRows' => [],
            ];
        }

        $baseProductRows = $this->commercialItems($startDate, $endDate)
            ->groupBy('article.id', 'article.code', 'article.name')
            ->orderByDesc('sales_value')
            ->selectRaw('article.id as article_id')
            ->selectRaw("COALESCE(article.code, '') as article_code")
            ->selectRaw("COALESCE(article.name, '') as article_name")
            ->selectRaw('COUNT(DISTINCT item.warehouse_id) as warehouse_count')
            ->selectRaw('COALESCE(SUM(item.quantity), 0) as units')
            ->selectRaw('COALESCE(SUM(item.total), 0) as sales_value')
            ->selectRaw('COALESCE(SUM(item.quantity * ' . $this->costUnitExpression() . '), 0) as cost_value')
            ->get()
            ->map(fn($row) => $this->profitabilityRow($row, [
                'articleId' => (int) $row->article_id,
                'articleCode' => $row->article_code,
                'articleName' => $row->article_name,
                'warehouseCount' => (int) $row->warehouse_count,
            ]))
            ->values();

        $productWarehouseRows = $this->commercialItems($startDate, $endDate)
            ->leftJoin('warehouses as warehouse', 'warehouse.id', '=', 'item.warehouse_id')
            ->groupBy('item.warehouse_id', 'warehouse.name', 'article.id', 'article.code', 'article.name')
            ->orderByRaw("COALESCE(warehouse.name, 'Sin almacen')")
            ->orderByDesc('sales_value')
            ->selectRaw('item.warehouse_id as warehouse_id')
            ->selectRaw("COALESCE(warehouse.name, 'Sin almacen') as warehouse_name")
            ->selectRaw('article.id as article_id')
            ->selectRaw("COALESCE(article.code, '') as article_code")
            ->selectRaw("COALESCE(article.name, '') as article_name")
            ->selectRaw('COALESCE(SUM(item.quantity), 0) as units')
            ->selectRaw('COALESCE(SUM(item.total), 0) as sales_value')
            ->selectRaw('COALESCE(SUM(item.quantity * ' . $this->costUnitExpression() . '), 0) as cost_value')
            ->get()
            ->map(fn($row) => $this->profitabilityRow($row, [
                'warehouseId' => $row->warehouse_id,
                'warehouseName' => $row->warehouse_name,
                'articleId' => (int) $row->article_id,
                'articleCode' => $row->article_code,
                'articleName' => $row->article_name,
            ]))
            ->values();

        $warehouseRows = $this->commercialItems($startDate, $endDate)
            ->leftJoin('warehouses as warehouse', 'warehouse.id', '=', 'item.warehouse_id')
            ->groupBy('item.warehouse_id', 'warehouse.name')
            ->orderByDesc('sales_value')
            ->selectRaw('item.warehouse_id as warehouse_id')
            ->selectRaw("COALESCE(warehouse.name, 'Sin almacen') as warehouse_name")
            ->selectRaw('COALESCE(SUM(item.quantity), 0) as units')
            ->selectRaw('COALESCE(SUM(item.total), 0) as sales_value')
            ->selectRaw('COALESCE(SUM(item.quantity * ' . $this->costUnitExpression() . '), 0) as cost_value')
            ->get()
            ->map(fn($row) => $this->profitabilityRow($row, [
                'warehouseId' => $row->warehouse_id,
                'warehouseName' => $row->warehouse_name,
            ]))
            ->values();

        return [
            'totals' => $this->profitabilityTotals($warehouseRows->all()),
            'productRows' => $baseProductRows->all(),
            'productWarehouseRows' => $productWarehouseRows->all(),
            'warehouseRows' => $warehouseRows->all(),
        ];
    }

    private function dispatchKpis(string $startDate, string $endDate): array
    {
        if (!$this->hasTables(['dispatches', 'dispatch_assignments', 'commercial_orders'])) {
            return [
                'totalDelivered' => 0,
                'onTimeDelivered' => 0,
                'delayedDelivered' => 0,
                'efficiencyPct' => 0,
                'delayPct' => 0,
                'efficiencyRows' => [],
                'delayReasons' => [],
                'recentRows' => [],
            ];
        }

        $rows = DB::table('dispatch_assignments as assignment')
            ->join('dispatches as dispatch', 'dispatch.id', '=', 'assignment.dispatch_id')
            ->join('commercial_orders as sale', 'sale.id', '=', 'assignment.commercial_order_id')
            ->where('assignment.status', 1)
            ->where('dispatch.status', 1)
            ->whereIn('dispatch.dispatch_status', ['delivered', 'closed'])
            ->whereNotNull('dispatch.delivered_at')
            ->whereDate('dispatch.delivered_at', '>=', $startDate)
            ->whereDate('dispatch.delivered_at', '<=', $endDate)
            ->orderByDesc('dispatch.delivered_at')
            ->select([
                'dispatch.id',
                'dispatch.code',
                'dispatch.created_at',
                'dispatch.scheduled_date',
                'dispatch.delivered_at',
                'dispatch.observations',
                'assignment.commercial_order_code',
                'assignment.customer_name',
                'sale.promised_delivery_at',
            ])
            ->get()
            ->map(function ($row) {
                $requestedDate = $row->promised_delivery_at ?: $row->scheduled_date;
                $delayDays = $this->delayDays($requestedDate, $row->delivered_at);
                $reason = trim((string) $row->observations);

                return [
                    'id' => (int) $row->id,
                    'code' => $row->code,
                    'orderCode' => $row->commercial_order_code,
                    'customerName' => $row->customer_name,
                    'registeredDate' => $this->dateOnly($row->created_at),
                    'requestedDate' => $this->dateOnly($requestedDate),
                    'deliveredDate' => $this->dateOnly($row->delivered_at),
                    'delayDays' => $delayDays,
                    'delayReason' => $delayDays > 0 ? ($reason ?: 'Sin motivo registrado') : '',
                ];
            });

        $total = $rows->count();
        $delayed = $rows->where('delayDays', '>', 0)->count();
        $onTime = $total - $delayed;
        $efficiencyPct = $total > 0 ? round(($onTime / $total) * 100, 2) : 0;
        $delayPct = $total > 0 ? round(($delayed / $total) * 100, 2) : 0;
        $delayReasons = $rows
            ->where('delayDays', '>', 0)
            ->groupBy('delayReason')
            ->map(function ($items, $reason) use ($delayed) {
                $count = $items->count();
                return [
                    'reason' => $reason ?: 'Sin motivo registrado',
                    'count' => $count,
                    'pct' => $delayed > 0 ? round(($count / $delayed) * 100, 2) : 0,
                ];
            })
            ->sortByDesc('count')
            ->values()
            ->all();

        return [
            'totalDelivered' => $total,
            'onTimeDelivered' => $onTime,
            'delayedDelivered' => $delayed,
            'efficiencyPct' => $efficiencyPct,
            'delayPct' => $delayPct,
            'efficiencyRows' => [
                [
                    'status' => 'ON_TIME',
                    'label' => 'A tiempo',
                    'count' => $onTime,
                    'pct' => $efficiencyPct,
                    'color' => '#198754',
                ],
                [
                    'status' => 'DELAYED',
                    'label' => 'Con demora',
                    'count' => $delayed,
                    'pct' => $delayPct,
                    'color' => '#dc3545',
                ],
            ],
            'delayReasons' => $delayReasons,
            'recentRows' => $rows->take(30)->values()->all(),
        ];
    }

    private function activeCommercialOrders(string $startDate, string $endDate)
    {
        return DB::table('commercial_orders')
            ->where('status', 1)
            ->whereNotIn('order_status', ['draft', 'cancelled'])
            ->whereDate('issue_date', '>=', $startDate)
            ->whereDate('issue_date', '<=', $endDate);
    }

    private function activeServiceOrders(string $startDate, string $endDate)
    {
        return DB::table('service_orders')
            ->where('status', 1)
            ->whereNotIn('order_status', ['draft', 'cancelled'])
            ->whereDate('issue_date', '>=', $startDate)
            ->whereDate('issue_date', '<=', $endDate);
    }

    private function commercialItems(string $startDate, string $endDate)
    {
        $query = DB::table('commercial_order_items as item')
            ->join('commercial_orders as sale', 'sale.id', '=', 'item.commercial_order_id')
            ->leftJoin('articles as article', 'article.id', '=', 'item.article_id')
            ->where('item.status', 1)
            ->where('sale.status', 1)
            ->whereNotIn('sale.order_status', ['draft', 'cancelled'])
            ->whereDate('sale.issue_date', '>=', $startDate)
            ->whereDate('sale.issue_date', '<=', $endDate);

        if (Schema::hasColumn('articles', 'module_scope')) {
            $query->where(function ($scope) {
                $scope->where('article.module_scope', 'standard')
                    ->orWhereNull('article.module_scope');
            });
        }

        return $query;
    }

    private function stockMovementsQuery()
    {
        $queries = [];

        if ($this->hasTables(['entry_notes', 'entry_note_items'])) {
            $queries[] = DB::table('entry_note_items as item')
                ->join('entry_notes as note', 'note.id', '=', 'item.entry_note_id')
                ->where('note.status', 1)
                ->where('item.status', 1)
                ->selectRaw('item.article_id as article_id')
                ->selectRaw('COALESCE(item.warehouse_id, note.warehouse_id) as warehouse_id')
                ->selectRaw('item.quantity as quantity_in')
                ->selectRaw('0 as quantity_out')
                ->selectRaw('item.total as total_in');
        }

        if ($this->hasTables(['purchase_receipts', 'purchase_receipt_items'])) {
            $queries[] = DB::table('purchase_receipt_items as item')
                ->join('purchase_receipts as note', 'note.id', '=', 'item.purchase_receipt_id')
                ->where('note.status', 1)
                ->where('note.receipt_status', 'confirmed')
                ->where('item.status', 1)
                ->selectRaw('item.article_id as article_id')
                ->selectRaw('COALESCE(item.warehouse_id, note.warehouse_id) as warehouse_id')
                ->selectRaw('item.quantity as quantity_in')
                ->selectRaw('0 as quantity_out')
                ->selectRaw('item.total as total_in');
        }

        if ($this->hasTables(['exit_notes', 'exit_note_items'])) {
            $queries[] = DB::table('exit_note_items as item')
                ->join('exit_notes as note', 'note.id', '=', 'item.exit_note_id')
                ->where('note.status', 1)
                ->where('item.status', 1)
                ->selectRaw('item.article_id as article_id')
                ->selectRaw('COALESCE(item.warehouse_id, note.warehouse_id) as warehouse_id')
                ->selectRaw('0 as quantity_in')
                ->selectRaw('item.quantity as quantity_out')
                ->selectRaw('0 as total_in');
        }

        if (count($queries) === 0) return null;

        $union = array_shift($queries);
        foreach ($queries as $query) {
            $union->unionAll($query);
        }

        return $union;
    }

    private function averageMonthlySalesMap(string $startDate, string $endDate): array
    {
        if (!$this->hasTables(['commercial_orders', 'commercial_order_items'])) return [];

        return $this->commercialItems($startDate, $endDate)
            ->groupBy('item.warehouse_id', 'item.article_id')
            ->selectRaw('item.warehouse_id')
            ->selectRaw('item.article_id')
            ->selectRaw('COALESCE(SUM(item.quantity), 0) as units')
            ->get()
            ->mapWithKeys(fn($row) => [($row->warehouse_id ?? 0) . ':' . $row->article_id => (float) $row->units])
            ->all();
    }

    private function costUnitExpression(string $itemAlias = 'item', string $articleAlias = 'article'): string
    {
        return "COALESCE(NULLIF({$itemAlias}.cost_unit, 0), " . $this->articleCostFallbackExpression($articleAlias) . ', 0)';
    }

    private function articleCostFallbackExpression(string $articleAlias = 'article', bool $aggregate = false): string
    {
        $columns = [];
        foreach (['cost_price', 'purchase_price_national', 'purchase_price_foreign'] as $column) {
            if (Schema::hasColumn('articles', $column)) {
                $columnRef = "{$articleAlias}.{$column}";
                if ($aggregate) {
                    $columnRef = "MAX({$columnRef})";
                }
                $columns[] = "NULLIF({$columnRef}, 0)";
            }
        }

        return count($columns) ? 'COALESCE(' . implode(', ', $columns) . ', 0)' : '0';
    }

    private function stockStatus(float|int|null $coverageDays, float $stock, float $avgMonthlyUnits): string
    {
        if ($stock <= 0) return 'INFRASTOCK';
        if ($avgMonthlyUnits <= 0) return 'DEVOLUCION';
        if ($coverageDays < 15) return 'INFRASTOCK';
        if ($coverageDays <= 30) return 'NORMOSTOCK';
        return 'SOBRESTOCK';
    }

    private function profitabilityRow(object $row, array $extra = []): array
    {
        $units = (float) ($row->units ?? 0);
        $sales = (float) ($row->sales_value ?? 0);
        $cost = (float) ($row->cost_value ?? 0);
        $profit = $sales - $cost;

        return array_merge($extra, [
            'units' => round($units, 3),
            'salesValue' => round($sales, 2),
            'costValue' => round($cost, 2),
            'profitValue' => round($profit, 2),
            'avgSalePrice' => $units > 0 ? round($sales / $units, 4) : 0,
            'avgCostPrice' => $units > 0 ? round($cost / $units, 4) : 0,
            'unitProfitValue' => $units > 0 ? round(($sales / $units) - ($cost / $units), 4) : 0,
            'profitPct' => $sales > 0 ? round(($profit / $sales) * 100, 2) : 0,
        ]);
    }

    private function profitabilityTotals(array $rows = []): array
    {
        $units = array_sum(array_column($rows, 'units'));
        $sales = array_sum(array_column($rows, 'salesValue'));
        $cost = array_sum(array_column($rows, 'costValue'));
        $profit = $sales - $cost;

        return [
            'units' => round($units, 3),
            'salesValue' => round($sales, 2),
            'costValue' => round($cost, 2),
            'profitValue' => round($profit, 2),
            'avgSalePrice' => $units > 0 ? round($sales / $units, 4) : 0,
            'avgCostPrice' => $units > 0 ? round($cost / $units, 4) : 0,
            'unitProfitValue' => $units > 0 ? round(($sales / $units) - ($cost / $units), 4) : 0,
            'profitPct' => $sales > 0 ? round(($profit / $sales) * 100, 2) : 0,
        ];
    }

    private function delayDays(?string $requestedDate, ?string $deliveredDate): int
    {
        if (!$requestedDate || !$deliveredDate) return 0;

        $requested = Carbon::parse($requestedDate)->startOfDay();
        $delivered = Carbon::parse($deliveredDate)->startOfDay();

        return (int) $requested->diffInDays($delivered, false);
    }

    private function dateOnly(?string $date): ?string
    {
        if (!$date) return null;

        return Carbon::parse($date)->toDateString();
    }

    private function hasTable(string $table): bool
    {
        return Schema::hasTable($table);
    }

    private function hasTables(array $tables): bool
    {
        foreach ($tables as $table) {
            if (!$this->hasTable($table)) return false;
        }

        return true;
    }
}
