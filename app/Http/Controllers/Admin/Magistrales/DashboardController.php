<?php

namespace App\Http\Controllers\Admin\Magistrales;

use App\Http\Controllers\BasicController;
use App\Support\MagistralesStock;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DashboardController extends BasicController
{
    public $reactView = 'Admin/Magistrales/Dashboard';
    public $reactRootView = 'admin';

    public function setReactViewProperties(Request $request)
    {
        $periodStart = now()->startOfMonth()->toDateString();
        $periodEnd = now()->toDateString();
        $rotationStart = now()->subDays(89)->toDateString();

        return [
            'moduleTitle' => 'Dashboard Magistrales',
            'magistralesDashboard' => [
                'period' => [
                    'label' => 'Mes actual',
                    'start' => $periodStart,
                    'end' => $periodEnd,
                    'rotationStart' => $rotationStart,
                ],
                'summary' => $this->summary($periodStart, $periodEnd),
                'salesByType' => $this->salesByType($periodStart, $periodEnd),
                'profitability' => $this->profitability($periodStart, $periodEnd),
                'productionStatus' => $this->productionStatus($periodStart, $periodEnd),
                'inventory' => $this->inventory(),
                'inventoryRotation' => $this->inventoryRotationSummary($rotationStart, $periodEnd),
                'lowStock' => $this->lowStock(),
                'recentActivity' => $this->recentActivity($periodStart, $periodEnd),
            ],
        ];
    }

    private function summary(string $startDate, string $endDate): array
    {
        $sales = [
            'count' => 0,
            'value' => 0,
            'units' => 0,
            'quotes' => 0,
        ];

        if ($this->hasTable('magistral_sales')) {
            $sales['count'] = (int) $this->activeSales($startDate, $endDate)->count();
            $sales['value'] = (float) $this->activeSales($startDate, $endDate)->sum('total');

            if (Schema::hasColumn('magistral_sales', 'is_quote')) {
                $sales['quotes'] = (int) DB::table('magistral_sales')
                    ->whereNotNull('status')
                    ->where('is_quote', true)
                    ->whereDate('sale_date', '>=', $startDate)
                    ->whereDate('sale_date', '<=', $endDate)
                    ->count();
            }
        }

        if ($this->hasTables(['magistral_sales', 'magistral_sale_items'])) {
            $sales['units'] = (float) DB::table('magistral_sale_items as item')
                ->join('magistral_sales as sale', 'sale.id', '=', 'item.magistral_sale_id')
                ->whereNotNull('sale.status')
                ->whereNotNull('item.status')
                ->when(Schema::hasColumn('magistral_sales', 'is_quote'), fn($query) => $query->where('sale.is_quote', false))
                ->whereDate('sale.sale_date', '>=', $startDate)
                ->whereDate('sale.sale_date', '<=', $endDate)
                ->sum('item.quantity');
        }

        $incomes = $this->incomeTotals($startDate, $endDate);
        $outputs = $this->outputTotals($startDate, $endDate);
        $production = $this->productionTotals($startDate, $endDate);

        return [
            'salesCount' => $sales['count'],
            'salesValue' => round($sales['value'], 2),
            'salesUnits' => round($sales['units'], 3),
            'quotesCount' => $sales['quotes'],
            'incomesCount' => $incomes['count'],
            'incomesValue' => round($incomes['value'], 2),
            'outputsCount' => $outputs['count'],
            'outputsUnits' => round($outputs['units'], 3),
            'productionCount' => $production['count'],
            'productionUnits' => round($production['units'], 3),
            'finishedProductionCount' => $production['finishedCount'],
            'pendingProductionCount' => $production['pendingCount'],
        ];
    }

    private function salesByType(string $startDate, string $endDate): array
    {
        if (!$this->hasTable('magistral_sales')) return [];

        $typeColumn = Schema::hasColumn('magistral_sales', 'sale_type') ? 'sale_type' : 'pharmacy';

        return $this->activeSales($startDate, $endDate)
            ->groupBy($typeColumn)
            ->orderByDesc('sales_value')
            ->selectRaw("COALESCE(NULLIF({$typeColumn}, ''), 'Sin clasificar') as label")
            ->selectRaw('COUNT(*) as count')
            ->selectRaw('COALESCE(SUM(total), 0) as sales_value')
            ->get()
            ->map(fn($row) => [
                'label' => $row->label,
                'count' => (int) $row->count,
                'salesValue' => round((float) $row->sales_value, 2),
            ])
            ->values()
            ->all();
    }

    private function productionStatus(string $startDate, string $endDate): array
    {
        if (!$this->hasTable('magistral_production_orders')) return [];

        return DB::table('magistral_production_orders')
            ->whereNotNull('status')
            ->whereDate('registration_date', '>=', $startDate)
            ->whereDate('registration_date', '<=', $endDate)
            ->groupBy('order_status')
            ->selectRaw("COALESCE(NULLIF(order_status, ''), 'pending') as status")
            ->selectRaw('COUNT(*) as count')
            ->selectRaw('COALESCE(SUM(quantity), 0) as units')
            ->get()
            ->map(fn($row) => [
                'status' => $row->status,
                'count' => (int) $row->count,
                'units' => round((float) $row->units, 3),
            ])
            ->values()
            ->all();
    }

    private function inventory(): array
    {
        if (!$this->hasTable('articles')) {
            return [
                'stockValue' => 0,
                'stockUnits' => 0,
                'articleCount' => 0,
                'warehouseRows' => [],
            ];
        }

        $rows = MagistralesStock::valuationRows();

        $warehouseRows = $rows
            ->groupBy(fn($row) => $row['warehouse_name'] ?: 'Sin almacen')
            ->map(function ($items, $warehouseName) {
                return [
                    'warehouseName' => $warehouseName,
                    'articleCount' => $items->where('stock', '!=', 0)->count(),
                    'stockUnits' => round($items->sum('stock'), 3),
                    'stockValue' => round($items->sum('total_cost'), 2),
                ];
            })
            ->sortByDesc('stockValue')
            ->values()
            ->all();

        return [
            'stockValue' => round($rows->sum('total_cost'), 2),
            'stockUnits' => round($rows->sum('stock'), 3),
            'articleCount' => $rows->pluck('article_id')->unique()->count(),
            'warehouseRows' => $warehouseRows,
        ];
    }

    private function inventoryRotationSummary(string $rotationStart, string $endDate): array
    {
        if (!$this->hasTable('articles')) {
            return $this->emptyInventoryRotation($rotationStart, $endDate);
        }

        $rows = MagistralesStock::valuationRows();
        $monthlySales = $this->averageMonthlySalesMap($rotationStart, $endDate);
        $rotationDays = max(1, Carbon::parse($rotationStart)->diffInDays(Carbon::parse($endDate)) + 1);
        $rotationMonths = max(1, $rotationDays / 30);

        $products = $rows
            ->filter(fn($row) => (float) ($row['stock'] ?? 0) !== 0.0)
            ->map(function ($row) use ($monthlySales, $rotationMonths) {
                $key = ($row['warehouse_id'] ?? 0) . ':' . $row['article_id'];
                $avgMonthlyUnits = round((float) ($monthlySales[$key] ?? 0) / $rotationMonths, 3);
                $stock = (float) ($row['stock'] ?? 0);
                $dailySales = $avgMonthlyUnits > 0 ? $avgMonthlyUnits / 30 : 0;
                $coverageDays = $dailySales > 0 ? round($stock / $dailySales, 1) : ($stock > 0 ? 999 : 0);

                return [
                    'articleId' => (int) $row['article_id'],
                    'warehouseId' => $row['warehouse_id'] ?? null,
                    'stock' => round($stock, 3),
                    'stockValue' => round((float) ($row['total_cost'] ?? 0), 2),
                    'avgMonthlyUnits' => $avgMonthlyUnits,
                    'coverageDays' => $coverageDays >= 999 ? null : $coverageDays,
                    'stockStatus' => $this->stockStatus($coverageDays, $stock, $avgMonthlyUnits),
                ];
            })
            ->values();

        $totalItems = $products->count();
        $totalValue = round($products->sum('stockValue'), 2);
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
                'days' => $rotationDays,
            ],
            'totalItems' => $totalItems,
            'totalUnits' => round($products->sum('stock'), 3),
            'totalValue' => $totalValue,
            'statusRows' => $statusRows,
        ];
    }

    private function lowStock(): array
    {
        if (!$this->hasTable('articles')) return [];

        return MagistralesStock::valuationRows()
            ->filter(function ($row) {
                $min = (float) ($row['stock_min'] ?? 0);
                return $min > 0 && (float) $row['stock'] <= $min;
            })
            ->sortBy('stock')
            ->take(12)
            ->map(fn($row) => [
                'articleId' => $row['article_id'],
                'articleCode' => $row['article_code'],
                'articleName' => $row['article_name'],
                'warehouseName' => $row['warehouse_name'] ?: 'Sin almacen',
                'stock' => round((float) $row['stock'], 3),
                'stockMin' => round((float) $row['stock_min'], 3),
                'unitLabel' => $row['unit_label'],
            ])
            ->values()
            ->all();
    }

    private function profitability(string $startDate, string $endDate): array
    {
        if (!$this->hasTables(['magistral_sales', 'magistral_sale_items', 'articles'])) {
            return [
                'totals' => $this->profitabilityTotals(),
                'productRows' => [],
                'productWarehouseRows' => [],
                'warehouseRows' => [],
            ];
        }

        $costExpression = $this->articleCostExpression();
        $saleValueExpression = $this->saleValueExpression();

        $productRows = $this->saleItems($startDate, $endDate)
            ->groupBy('article.id', 'article.code', 'article.name')
            ->orderByDesc('sales_value')
            ->selectRaw('article.id as article_id')
            ->selectRaw("COALESCE(article.code, '') as article_code")
            ->selectRaw("COALESCE(article.name, '') as article_name")
            ->selectRaw('COUNT(DISTINCT item.warehouse_id) as warehouse_count')
            ->selectRaw('COALESCE(SUM(item.quantity), 0) as units')
            ->selectRaw("COALESCE(SUM({$saleValueExpression}), 0) as sales_value")
            ->selectRaw("COALESCE(SUM(item.quantity * {$costExpression}), 0) as cost_value")
            ->get()
            ->map(fn($row) => $this->profitabilityRow($row, [
                'articleId' => (int) $row->article_id,
                'articleCode' => $row->article_code,
                'articleName' => $row->article_name,
                'warehouseCount' => (int) $row->warehouse_count,
            ]))
            ->values();

        $productWarehouseRows = $this->saleItems($startDate, $endDate)
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
            ->selectRaw("COALESCE(SUM({$saleValueExpression}), 0) as sales_value")
            ->selectRaw("COALESCE(SUM(item.quantity * {$costExpression}), 0) as cost_value")
            ->get()
            ->map(fn($row) => $this->profitabilityRow($row, [
                'warehouseId' => $row->warehouse_id,
                'warehouseName' => $row->warehouse_name,
                'articleId' => (int) $row->article_id,
                'articleCode' => $row->article_code,
                'articleName' => $row->article_name,
            ]))
            ->values();

        $warehouseRows = $this->saleItems($startDate, $endDate)
            ->leftJoin('warehouses as warehouse', 'warehouse.id', '=', 'item.warehouse_id')
            ->groupBy('item.warehouse_id', 'warehouse.name')
            ->orderByDesc('sales_value')
            ->selectRaw('item.warehouse_id as warehouse_id')
            ->selectRaw("COALESCE(warehouse.name, 'Sin almacen') as warehouse_name")
            ->selectRaw('COALESCE(SUM(item.quantity), 0) as units')
            ->selectRaw("COALESCE(SUM({$saleValueExpression}), 0) as sales_value")
            ->selectRaw("COALESCE(SUM(item.quantity * {$costExpression}), 0) as cost_value")
            ->get()
            ->map(fn($row) => $this->profitabilityRow($row, [
                'warehouseId' => $row->warehouse_id,
                'warehouseName' => $row->warehouse_name,
            ]))
            ->values();

        return [
            'totals' => $this->profitabilityTotals($warehouseRows->all()),
            'productRows' => $productRows->all(),
            'productWarehouseRows' => $productWarehouseRows->all(),
            'warehouseRows' => $warehouseRows->all(),
        ];
    }

    private function recentActivity(string $startDate, string $endDate): array
    {
        $activities = collect();

        if ($this->hasTable('magistral_sales')) {
            $activities = $activities->merge($this->activeSales($startDate, $endDate)
                ->orderByDesc('sale_date')
                ->limit(8)
                ->get(['code', 'sale_date as date', 'patient as subject', 'total'])
                ->map(fn($row) => [
                    'type' => 'Venta',
                    'code' => $row->code,
                    'date' => $row->date,
                    'subject' => $row->subject ?: 'Sin paciente',
                    'amount' => round((float) $row->total, 2),
                ]));
        }

        if ($this->hasTable('magistral_production_orders')) {
            $activities = $activities->merge(DB::table('magistral_production_orders')
                ->whereNotNull('status')
                ->whereDate('registration_date', '>=', $startDate)
                ->whereDate('registration_date', '<=', $endDate)
                ->orderByDesc('registration_date')
                ->limit(8)
                ->get(['code', 'registration_date as date', 'order_status', 'quantity'])
                ->map(fn($row) => [
                    'type' => 'Produccion',
                    'code' => $row->code,
                    'date' => $row->date,
                    'subject' => $row->order_status,
                    'amount' => round((float) $row->quantity, 3),
                ]));
        }

        if ($this->hasTable('entry_notes')) {
            $activities = $activities->merge(DB::table('entry_notes as note')
                ->leftJoin(DB::raw('(select entry_note_id, coalesce(sum(quantity * cost_unit), 0) as total from entry_note_items group by entry_note_id) as agg'), 'agg.entry_note_id', '=', 'note.id')
                ->whereNotNull('note.status')
                ->where('note.code', 'like', 'ING-MAG-%')
                ->whereDate('note.entry_date', '>=', $startDate)
                ->whereDate('note.entry_date', '<=', $endDate)
                ->orderByDesc('note.entry_date')
                ->limit(8)
                ->get(['note.code as code', 'note.entry_date as date', 'note.observations as subject', DB::raw('COALESCE(agg.total, 0) as total')])
                ->map(fn($row) => [
                    'type' => 'Ingreso',
                    'code' => $row->code,
                    'date' => $row->date,
                    'subject' => $row->subject ?: 'Sin origen',
                    'amount' => round((float) $row->total, 2),
                ]));
        }

        if ($this->hasTable('exit_notes')) {
            $activities = $activities->merge(DB::table('exit_notes')
                ->whereNotNull('status')
                ->where('code', 'like', 'SAL-MAG-%')
                ->whereDate('exit_date', '>=', $startDate)
                ->whereDate('exit_date', '<=', $endDate)
                ->orderByDesc('exit_date')
                ->limit(8)
                ->get(['code', 'exit_date as date', 'motives'])
                ->map(fn($row) => [
                    'type' => 'Salida',
                    'code' => $row->code,
                    'date' => $row->date,
                    'subject' => $this->firstMotive($row->motives) ?: 'Sin motivo',
                    'amount' => null,
                ]));
        }

        return $activities
            ->sortByDesc('date')
            ->take(12)
            ->values()
            ->all();
    }

    private function activeSales(string $startDate, string $endDate)
    {
        return DB::table('magistral_sales')
            ->whereNotNull('status')
            ->when(Schema::hasColumn('magistral_sales', 'is_quote'), fn($query) => $query->where('is_quote', false))
            ->whereDate('sale_date', '>=', $startDate)
            ->whereDate('sale_date', '<=', $endDate);
    }

    private function incomeTotals(string $startDate, string $endDate): array
    {
        if (!$this->hasTable('entry_notes')) return ['count' => 0, 'value' => 0];

        $count = (int) DB::table('entry_notes')
            ->whereNotNull('status')
            ->where('code', 'like', 'ING-MAG-%')
            ->whereDate('entry_date', '>=', $startDate)
            ->whereDate('entry_date', '<=', $endDate)
            ->count();

        $value = 0;
        if ($this->hasTable('entry_note_items')) {
            $value = (float) DB::table('entry_note_items as item')
                ->join('entry_notes as note', 'note.id', '=', 'item.entry_note_id')
                ->whereNotNull('note.status')
                ->whereNotNull('item.status')
                ->where('note.code', 'like', 'ING-MAG-%')
                ->whereDate('note.entry_date', '>=', $startDate)
                ->whereDate('note.entry_date', '<=', $endDate)
                ->selectRaw('COALESCE(SUM(item.quantity * item.cost_unit), 0) as value')
                ->value('value');
        }

        return ['count' => $count, 'value' => $value];
    }

    private function outputTotals(string $startDate, string $endDate): array
    {
        if (!$this->hasTable('exit_notes')) return ['count' => 0, 'units' => 0];

        $count = (int) DB::table('exit_notes')
            ->whereNotNull('status')
            ->where('code', 'like', 'SAL-MAG-%')
            ->whereDate('exit_date', '>=', $startDate)
            ->whereDate('exit_date', '<=', $endDate)
            ->count();

        $units = 0;
        if ($this->hasTable('exit_note_items')) {
            $units = (float) DB::table('exit_note_items as item')
                ->join('exit_notes as note', 'note.id', '=', 'item.exit_note_id')
                ->whereNotNull('note.status')
                ->whereNotNull('item.status')
                ->where('note.code', 'like', 'SAL-MAG-%')
                ->whereDate('note.exit_date', '>=', $startDate)
                ->whereDate('note.exit_date', '<=', $endDate)
                ->sum('item.quantity');
        }

        return ['count' => $count, 'units' => $units];
    }

    private function productionTotals(string $startDate, string $endDate): array
    {
        if (!$this->hasTable('magistral_production_orders')) {
            return ['count' => 0, 'units' => 0, 'finishedCount' => 0, 'pendingCount' => 0];
        }

        $base = DB::table('magistral_production_orders')
            ->whereNotNull('status')
            ->whereDate('registration_date', '>=', $startDate)
            ->whereDate('registration_date', '<=', $endDate);

        return [
            'count' => (int) (clone $base)->count(),
            'units' => (float) (clone $base)->where('order_status', 'finished')->sum('quantity'),
            'finishedCount' => (int) (clone $base)->where('order_status', 'finished')->count(),
            'pendingCount' => (int) (clone $base)->whereIn('order_status', ['pending', 'in_process'])->count(),
        ];
    }

    private function averageMonthlySalesMap(string $startDate, string $endDate): array
    {
        if (!$this->hasTables(['magistral_sales', 'magistral_sale_items'])) return [];

        return DB::table('magistral_sale_items as item')
            ->join('magistral_sales as sale', 'sale.id', '=', 'item.magistral_sale_id')
            ->whereNotNull('sale.status')
            ->whereNotNull('item.status')
            ->when(Schema::hasColumn('magistral_sales', 'is_quote'), fn($query) => $query->where('sale.is_quote', false))
            ->whereDate('sale.sale_date', '>=', $startDate)
            ->whereDate('sale.sale_date', '<=', $endDate)
            ->groupBy('item.warehouse_id', 'item.article_id')
            ->selectRaw('item.warehouse_id')
            ->selectRaw('item.article_id')
            ->selectRaw('COALESCE(SUM(item.quantity), 0) as units')
            ->get()
            ->mapWithKeys(fn($row) => [($row->warehouse_id ?? 0) . ':' . $row->article_id => (float) $row->units])
            ->all();
    }

    private function saleItems(string $startDate, string $endDate)
    {
        return DB::table('magistral_sale_items as item')
            ->join('magistral_sales as sale', 'sale.id', '=', 'item.magistral_sale_id')
            ->leftJoin('articles as article', 'article.id', '=', 'item.article_id')
            ->whereNotNull('sale.status')
            ->whereNotNull('item.status')
            ->when(Schema::hasColumn('magistral_sales', 'is_quote'), fn($query) => $query->where('sale.is_quote', false))
            ->whereDate('sale.sale_date', '>=', $startDate)
            ->whereDate('sale.sale_date', '<=', $endDate);
    }

    private function articleCostExpression(string $articleAlias = 'article'): string
    {
        $columns = [];
        foreach (['cost_price', 'purchase_price_national', 'purchase_price_foreign'] as $column) {
            if (Schema::hasColumn('articles', $column)) {
                $columns[] = "NULLIF({$articleAlias}.{$column}, 0)";
            }
        }

        return count($columns) ? 'COALESCE(' . implode(', ', $columns) . ', 0)' : '0';
    }

    private function saleValueExpression(string $itemAlias = 'item'): string
    {
        if (Schema::hasColumn('magistral_sale_items', 'subtotal')) {
            return "{$itemAlias}.subtotal";
        }

        return "{$itemAlias}.quantity * {$itemAlias}.unit_price";
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

    private function stockStatus(float|int|null $coverageDays, float $stock, float $avgMonthlyUnits): string
    {
        if ($stock <= 0) return 'INFRASTOCK';
        if ($avgMonthlyUnits <= 0) return 'DEVOLUCION';
        if ($coverageDays < 15) return 'INFRASTOCK';
        if ($coverageDays <= 30) return 'NORMOSTOCK';
        return 'SOBRESTOCK';
    }

    private function emptyInventoryRotation(string $rotationStart, string $endDate): array
    {
        return [
            'period' => [
                'label' => 'Ultimos 90 dias',
                'start' => $rotationStart,
                'end' => $endDate,
                'days' => max(1, Carbon::parse($rotationStart)->diffInDays(Carbon::parse($endDate)) + 1),
            ],
            'totalItems' => 0,
            'totalUnits' => 0,
            'totalValue' => 0,
            'statusRows' => [],
        ];
    }

    private function firstMotive(?string $json): ?string
    {
        $decoded = json_decode((string) $json, true);
        return is_array($decoded) ? ($decoded[0] ?? null) : null;
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
