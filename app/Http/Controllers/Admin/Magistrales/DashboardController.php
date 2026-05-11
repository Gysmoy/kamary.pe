<?php

namespace App\Http\Controllers\Admin\Magistrales;

use App\Http\Controllers\BasicController;
use App\Support\MagistralesStock;
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

        return [
            'moduleTitle' => 'Dashboard Magistrales',
            'magistralesDashboard' => [
                'period' => [
                    'label' => 'Mes actual',
                    'start' => $periodStart,
                    'end' => $periodEnd,
                ],
                'summary' => $this->summary($periodStart, $periodEnd),
                'salesByType' => $this->salesByType($periodStart, $periodEnd),
                'productionStatus' => $this->productionStatus($periodStart, $periodEnd),
                'inventory' => $this->inventory(),
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

        if ($this->hasTable('magistral_incomes')) {
            $activities = $activities->merge(DB::table('magistral_incomes')
                ->whereNotNull('status')
                ->whereDate('issue_date', '>=', $startDate)
                ->whereDate('issue_date', '<=', $endDate)
                ->orderByDesc('issue_date')
                ->limit(8)
                ->get(['code', 'issue_date as date', 'origin as subject', 'total'])
                ->map(fn($row) => [
                    'type' => 'Ingreso',
                    'code' => $row->code,
                    'date' => $row->date,
                    'subject' => $row->subject ?: 'Sin origen',
                    'amount' => round((float) $row->total, 2),
                ]));
        }

        if ($this->hasTable('magistral_outputs')) {
            $activities = $activities->merge(DB::table('magistral_outputs')
                ->whereNotNull('status')
                ->whereDate('output_date', '>=', $startDate)
                ->whereDate('output_date', '<=', $endDate)
                ->orderByDesc('output_date')
                ->limit(8)
                ->get(['code', 'output_date as date', 'reason as subject'])
                ->map(fn($row) => [
                    'type' => 'Salida',
                    'code' => $row->code,
                    'date' => $row->date,
                    'subject' => $row->subject ?: 'Sin motivo',
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
        if (!$this->hasTable('magistral_incomes')) return ['count' => 0, 'value' => 0];

        $query = DB::table('magistral_incomes')
            ->whereNotNull('status')
            ->whereDate('issue_date', '>=', $startDate)
            ->whereDate('issue_date', '<=', $endDate);

        return [
            'count' => (int) (clone $query)->count(),
            'value' => (float) (clone $query)->sum('total'),
        ];
    }

    private function outputTotals(string $startDate, string $endDate): array
    {
        if (!$this->hasTable('magistral_outputs')) return ['count' => 0, 'units' => 0];

        $count = (int) DB::table('magistral_outputs')
            ->whereNotNull('status')
            ->whereDate('output_date', '>=', $startDate)
            ->whereDate('output_date', '<=', $endDate)
            ->count();

        $units = 0;
        if ($this->hasTable('magistral_output_items')) {
            $units = (float) DB::table('magistral_output_items as item')
                ->join('magistral_outputs as output', 'output.id', '=', 'item.magistral_output_id')
                ->whereNotNull('output.status')
                ->whereNotNull('item.status')
                ->whereDate('output.output_date', '>=', $startDate)
                ->whereDate('output.output_date', '<=', $endDate)
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
