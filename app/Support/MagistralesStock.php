<?php

namespace App\Support;

use App\Models\Article;
use App\Models\Warehouse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class MagistralesStock
{
    public static function stock(?int $articleId = null, ?int $warehouseId = null, ?string $lot = null, ?string $expirationDate = null): float
    {
        if (!$articleId) return 0;

        $lot = self::normalizeLot($lot);
        $expirationDate = self::normalizeDateFilter($expirationDate);

        $in = self::incomes($articleId, $warehouseId, $lot, $expirationDate);
        $out = self::outputs($articleId, $warehouseId, $lot, $expirationDate);
        $sales = self::sales($articleId, $warehouseId, $lot, $expirationDate);
        $production = self::production($articleId, $warehouseId, $lot, $expirationDate);
        $productionConsumption = self::productionConsumption($articleId, $warehouseId, $lot, $expirationDate);

        return round($in + $production - $out - $sales - $productionConsumption, 3);
    }

    public static function valuationRows(?int $articleId = null, ?int $warehouseId = null): Collection
    {
        $articles = Article::query()
            ->select('articles.*')
            ->with(['unit:id,name,symbol'])
            ->when(Schema::hasColumn('articles', 'module_scope'), fn($query) => $query->where('module_scope', 'magistrales'))
            ->when($articleId, fn($query) => $query->where('id', $articleId))
            ->whereNotNull('status')
            ->orderBy('name')
            ->get();

        $warehouses = Warehouse::query()
            ->select('warehouses.*')
            ->with('branch:id,name,business_id')
            ->when($warehouseId, fn($query) => $query->where('id', $warehouseId))
            ->whereNotNull('status')
            ->orderBy('name')
            ->get();

        if (!$warehouseId && $warehouses->isEmpty()) {
            $warehouses = collect([(object)['id' => null, 'name' => null, 'branch' => null]]);
        }

        return $articles->flatMap(function ($article) use ($warehouses) {
            return $warehouses->map(function ($warehouse) use ($article) {
                $stock = self::stock((int)$article->id, $warehouse?->id ? (int)$warehouse->id : null);
                $cost = self::averageCost((int)$article->id, $warehouse?->id ? (int)$warehouse->id : null);
                if ($cost <= 0) $cost = (float)($article->cost_price ?? 0);

                return [
                    'article_id' => $article->id,
                    'article_code' => $article->code,
                    'article_name' => $article->name,
                    'stock' => $stock,
                    'unit_label' => $article->unit?->symbol ?: $article->unit?->name,
                    'stock_min' => (float)($article->stock_min ?? 0),
                    'stock_max' => (float)($article->stock_max ?? 0),
                    'currency' => $article->currency ?: 'PEN',
                    'cost_unit' => round($cost, 4),
                    'total_cost' => round($stock * $cost, 2),
                    'warehouse_id' => $warehouse?->id,
                    'warehouse_name' => $warehouse?->name,
                    'branch_name' => $warehouse?->branch?->name,
                ];
            });
        })->filter(fn($row) => $warehouseId || (float)$row['stock'] !== 0 || $row['warehouse_id'])->values();
    }

    public static function stockByWarehouseRows(int $articleId): Collection
    {
        return Warehouse::query()
            ->select('warehouses.*')
            ->with('branch.business:id,name')
            ->whereNotNull('warehouses.status')
            ->orderBy('name')
            ->get()
            ->map(function (Warehouse $warehouse) use ($articleId) {
                return [
                    'id' => $warehouse->id,
                    'name' => $warehouse->name,
                    'business_branch_id' => $warehouse->business_branch_id,
                    'status' => $warehouse->status,
                    'branch_name' => $warehouse->branch?->name ?? '',
                    'business_name' => $warehouse->branch?->business?->name ?? '',
                    'qty_in' => self::incomes($articleId, (int)$warehouse->id) + self::production($articleId, (int)$warehouse->id),
                    'qty_out' => self::outputs($articleId, (int)$warehouse->id) + self::sales($articleId, (int)$warehouse->id) + self::productionConsumption($articleId, (int)$warehouse->id),
                    'stock' => self::stock($articleId, (int)$warehouse->id),
                ];
            });
    }

    public static function movementRows(int $articleId, ?int $warehouseId = null): Collection
    {
        $rows = collect();

        if (Schema::hasTable('magistral_income_items') && Schema::hasTable('magistral_incomes')) {
            $rows = $rows->merge(DB::table('magistral_income_items as item')
                ->join('magistral_incomes as income', 'income.id', '=', 'item.magistral_income_id')
                ->leftJoin('articles as article', 'article.id', '=', 'item.article_id')
                ->leftJoin('units as unit', 'unit.id', '=', 'article.unit_id')
                ->where('item.article_id', $articleId)
                ->whereNotNull('income.status')
                ->whereNotNull('item.status')
                ->when($warehouseId, fn($query) => $query->where('income.warehouse_id', $warehouseId))
                ->get([
                    'income.id',
                    'income.code as document',
                    'income.issue_date as document_date',
                    'income.created_at',
                    'income.warehouse_id',
                    'item.lot',
                    'item.expiration_date',
                    'item.quantity',
                    DB::raw('COALESCE(unit.symbol, unit.name) as unit_label'),
                ])
                ->map(fn($row) => self::movementRow($row, 'Ingreso', (float)$row->quantity, 0)));
        }

        if (Schema::hasTable('magistral_output_items') && Schema::hasTable('magistral_outputs')) {
            $rows = $rows->merge(DB::table('magistral_output_items as item')
                ->join('magistral_outputs as output', 'output.id', '=', 'item.magistral_output_id')
                ->where('item.article_id', $articleId)
                ->whereNotNull('output.status')
                ->whereNotNull('item.status')
                ->when($warehouseId, fn($query) => $query->where('output.origin_warehouse_id', $warehouseId))
                ->get([
                    'output.id',
                    'output.code as document',
                    'output.output_date as document_date',
                    'output.created_at',
                    'output.origin_warehouse_id as warehouse_id',
                    'item.lot',
                    'item.expiration_date',
                    'item.quantity',
                    'item.unit_label',
                ])
                ->map(fn($row) => self::movementRow($row, 'Salida', 0, (float)$row->quantity)));
        }

        if (Schema::hasTable('magistral_sale_items') && Schema::hasTable('magistral_sales')) {
            $rows = $rows->merge(DB::table('magistral_sale_items as item')
                ->join('magistral_sales as sale', 'sale.id', '=', 'item.magistral_sale_id')
                ->leftJoin('articles as article', 'article.id', '=', 'item.article_id')
                ->leftJoin('units as unit', 'unit.id', '=', 'article.unit_id')
                ->where('item.article_id', $articleId)
                ->whereNotNull('sale.status')
                ->whereNotNull('item.status')
                ->when(Schema::hasColumn('magistral_sales', 'is_quote'), fn($query) => $query->where('sale.is_quote', false))
                ->when($warehouseId, fn($query) => $query->where('item.warehouse_id', $warehouseId))
                ->get([
                    'sale.id',
                    'sale.code as document',
                    'sale.sale_date as document_date',
                    'sale.created_at',
                    'item.warehouse_id',
                    DB::raw('NULL as lot'),
                    DB::raw('NULL as expiration_date'),
                    'item.quantity',
                    DB::raw('COALESCE(unit.symbol, unit.name) as unit_label'),
                ])
                ->map(fn($row) => self::movementRow($row, 'Venta', 0, (float)$row->quantity)));
        }

        if (Schema::hasTable('magistral_production_orders')) {
            $rows = $rows->merge(DB::table('magistral_production_orders as production')
                ->leftJoin('articles as article', 'article.id', '=', 'production.article_id')
                ->leftJoin('units as unit', 'unit.id', '=', 'article.unit_id')
                ->where('production.article_id', $articleId)
                ->where('production.order_status', 'finished')
                ->whereNotNull('production.status')
                ->when($warehouseId && Schema::hasColumn('magistral_production_orders', 'destination_warehouse_id'), fn($query) => $query->where('production.destination_warehouse_id', $warehouseId))
                ->get([
                    'production.id',
                    'production.code as document',
                    'production.registration_date as document_date',
                    'production.created_at',
                    'production.destination_warehouse_id as warehouse_id',
                    DB::raw('NULL as lot'),
                    DB::raw('NULL as expiration_date'),
                    'production.quantity',
                    DB::raw('COALESCE(unit.symbol, unit.name) as unit_label'),
                ])
                ->map(fn($row) => self::movementRow($row, 'Produccion', (float)$row->quantity, 0)));
        }

        if (Schema::hasTable('magistral_production_order_items') && Schema::hasTable('magistral_production_orders')) {
            $rows = $rows->merge(DB::table('magistral_production_order_items as item')
                ->join('magistral_production_orders as production', 'production.id', '=', 'item.magistral_production_order_id')
                ->leftJoin('articles as article', 'article.id', '=', 'item.article_id')
                ->leftJoin('units as unit', 'unit.id', '=', 'article.unit_id')
                ->where('item.article_id', $articleId)
                ->where('production.order_status', 'finished')
                ->whereNotNull('production.status')
                ->whereNotNull('item.status')
                ->when($warehouseId && Schema::hasColumn('magistral_production_orders', 'destination_warehouse_id'), fn($query) => $query->where('production.destination_warehouse_id', $warehouseId))
                ->get([
                    'item.id',
                    'production.code as document',
                    'production.registration_date as document_date',
                    'production.created_at',
                    'production.destination_warehouse_id as warehouse_id',
                    DB::raw('NULL as lot'),
                    'item.expiration_date',
                    DB::raw('COALESCE(item.total, item.quantity) as quantity'),
                    DB::raw('COALESCE(unit.symbol, unit.name) as unit_label'),
                ])
                ->map(fn($row) => self::movementRow($row, 'Consumo produccion', 0, (float)$row->quantity)));
        }

        $balance = 0;

        return $rows
            ->sortBy([
                ['sort_date', 'asc'],
                ['id', 'asc'],
            ])
            ->values()
            ->map(function (array $row) use (&$balance) {
                $balance += $row['quantity_in'] - $row['quantity_out'];
                $row['balance'] = round($balance, 3);
                return $row;
            });
    }

    private static function movementRow(object $row, string $operation, float $quantityIn, float $quantityOut): array
    {
        $movementDate = (string)($row->document_date ?: $row->created_at);
        $createdAt = (string)$row->created_at;
        $usesOnlyDate = preg_match('/^\d{4}-\d{2}-\d{2}( 00:00:00)?$/', $movementDate) === 1;
        $createdTime = preg_match('/[ T](\d{2}:\d{2}:\d{2})/', $createdAt, $matches) ? $matches[1] : '00:00:00';
        $sortDate = $usesOnlyDate
            ? trim(substr($movementDate, 0, 10) . ' ' . $createdTime)
            : $movementDate;

        return [
            'id' => $operation . '-' . $row->id,
            'transaction' => $operation . ' - ' . $row->document,
            'movement_date' => $movementDate,
            'sort_date' => $sortDate,
            'created_at' => $createdAt,
            'document' => $row->document,
            'operation' => $operation,
            'lot' => $row->lot,
            'expiration_date' => $row->expiration_date,
            'quantity_in' => round($quantityIn, 3),
            'quantity_out' => round($quantityOut, 3),
            'balance' => 0,
            'unit_label' => $row->unit_label,
            'warehouse_id' => $row->warehouse_id,
        ];
    }

    private static function incomes(int $articleId, ?int $warehouseId, ?string $lot = null, ?string $expirationDate = null): float
    {
        if (!Schema::hasTable('magistral_income_items') || !Schema::hasTable('magistral_incomes')) return 0;

        return (float) DB::table('magistral_income_items as item')
            ->join('magistral_incomes as income', 'income.id', '=', 'item.magistral_income_id')
            ->where('item.article_id', $articleId)
            ->whereNotNull('income.status')
            ->whereNotNull('item.status')
            ->when($warehouseId, fn($query) => $query->where('income.warehouse_id', $warehouseId))
            ->when($lot !== null, fn($query) => $query->where('item.lot', $lot))
            ->when($expirationDate !== null, fn($query) => $query->whereDate('item.expiration_date', $expirationDate))
            ->sum('item.quantity');
    }

    private static function outputs(int $articleId, ?int $warehouseId, ?string $lot = null, ?string $expirationDate = null): float
    {
        if (!Schema::hasTable('magistral_output_items') || !Schema::hasTable('magistral_outputs')) return 0;

        return (float) DB::table('magistral_output_items as item')
            ->join('magistral_outputs as output', 'output.id', '=', 'item.magistral_output_id')
            ->where('item.article_id', $articleId)
            ->whereNotNull('output.status')
            ->whereNotNull('item.status')
            ->when($warehouseId, fn($query) => $query->where('output.origin_warehouse_id', $warehouseId))
            ->when($lot !== null, fn($query) => $query->where('item.lot', $lot))
            ->when($expirationDate !== null, fn($query) => $query->whereDate('item.expiration_date', $expirationDate))
            ->sum('item.quantity');
    }

    private static function sales(int $articleId, ?int $warehouseId, ?string $lot = null, ?string $expirationDate = null): float
    {
        if (!Schema::hasTable('magistral_sale_items') || !Schema::hasTable('magistral_sales')) return 0;
        if ($lot !== null || $expirationDate !== null) return 0;

        return (float) DB::table('magistral_sale_items as item')
            ->join('magistral_sales as sale', 'sale.id', '=', 'item.magistral_sale_id')
            ->where('item.article_id', $articleId)
            ->whereNotNull('sale.status')
            ->whereNotNull('item.status')
            ->when(Schema::hasColumn('magistral_sales', 'is_quote'), fn($query) => $query->where('sale.is_quote', false))
            ->when($warehouseId, fn($query) => $query->where('item.warehouse_id', $warehouseId))
            ->sum('item.quantity');
    }

    private static function production(int $articleId, ?int $warehouseId, ?string $lot = null, ?string $expirationDate = null): float
    {
        if (!Schema::hasTable('magistral_production_orders')) return 0;
        if ($lot !== null || $expirationDate !== null) return 0;

        return (float) DB::table('magistral_production_orders')
            ->where('article_id', $articleId)
            ->where('order_status', 'finished')
            ->whereNotNull('status')
            ->when($warehouseId && Schema::hasColumn('magistral_production_orders', 'destination_warehouse_id'), fn($query) => $query->where('destination_warehouse_id', $warehouseId))
            ->sum('quantity');
    }

    private static function productionConsumption(int $articleId, ?int $warehouseId, ?string $lot = null, ?string $expirationDate = null): float
    {
        if (!Schema::hasTable('magistral_production_order_items') || !Schema::hasTable('magistral_production_orders')) return 0;
        if ($lot !== null) return 0;

        return (float) DB::table('magistral_production_order_items as item')
            ->join('magistral_production_orders as production', 'production.id', '=', 'item.magistral_production_order_id')
            ->where('item.article_id', $articleId)
            ->where('production.order_status', 'finished')
            ->whereNotNull('production.status')
            ->whereNotNull('item.status')
            ->when($warehouseId && Schema::hasColumn('magistral_production_orders', 'destination_warehouse_id'), fn($query) => $query->where('production.destination_warehouse_id', $warehouseId))
            ->when($expirationDate !== null, fn($query) => $query->whereDate('item.expiration_date', $expirationDate))
            ->sum(DB::raw('COALESCE(item.total, item.quantity)'));
    }

    private static function averageCost(int $articleId, ?int $warehouseId): float
    {
        if (!Schema::hasTable('magistral_income_items') || !Schema::hasTable('magistral_incomes')) return 0;

        $row = DB::table('magistral_income_items as item')
            ->join('magistral_incomes as income', 'income.id', '=', 'item.magistral_income_id')
            ->where('item.article_id', $articleId)
            ->whereNotNull('income.status')
            ->whereNotNull('item.status')
            ->when($warehouseId, fn($query) => $query->where('income.warehouse_id', $warehouseId))
            ->selectRaw('SUM(item.quantity) as qty, SUM(item.quantity * item.price_without_igv) as total_cost')
            ->first();

        $qty = (float)($row->qty ?? 0);
        if ($qty <= 0) return 0;

        return (float)($row->total_cost ?? 0) / $qty;
    }

    private static function normalizeLot(?string $value): ?string
    {
        if ($value === null) return null;
        $text = trim($value);
        return $text === '' ? null : $text;
    }

    private static function normalizeDateFilter(?string $value): ?string
    {
        if ($value === null) return null;
        $text = trim($value);
        if ($text === '') return null;
        $timestamp = strtotime($text);
        return $timestamp === false ? $text : date('Y-m-d', $timestamp);
    }
}
