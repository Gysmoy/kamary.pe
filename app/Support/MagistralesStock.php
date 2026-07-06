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
        $warehouseId = $warehouseId ?: MagistralesWarehouse::idOrNull();

        $in = self::ledgerIn($articleId, $warehouseId, $lot, $expirationDate);
        $out = self::ledgerOut($articleId, $warehouseId, $lot, $expirationDate);

        return round($in - $out, 3);
    }

    public static function valuationRows(?int $articleId = null, ?int $warehouseId = null): Collection
    {
        $warehouseId = $warehouseId ?: MagistralesWarehouse::id();

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
            ->where('id', $warehouseId)
            ->whereNotNull('status')
            ->orderBy('name')
            ->get();

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
        })->filter(fn($row) => (float)$row['stock'] !== 0 || $row['warehouse_id'])->values();
    }

    public static function stockByWarehouseRows(int $articleId): Collection
    {
        $warehouse = Warehouse::query()
            ->select('warehouses.*')
            ->with('branch.business:id,name')
            ->whereKey(MagistralesWarehouse::id())
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
                    'qty_in' => self::ledgerIn($articleId, (int)$warehouse->id),
                    'qty_out' => self::ledgerOut($articleId, (int)$warehouse->id),
                    'stock' => self::stock($articleId, (int)$warehouse->id),
                ];
            });

        return $warehouse->values();
    }

    public static function movementRows(int $articleId, ?int $warehouseId = null): Collection
    {
        $warehouseId = $warehouseId ?: MagistralesWarehouse::idOrNull();
        $rows = collect();

        if (Schema::hasTable('entry_note_items') && Schema::hasTable('entry_notes')) {
            $rows = $rows->merge(DB::table('entry_note_items as item')
                ->join('entry_notes as note', 'note.id', '=', 'item.entry_note_id')
                ->leftJoin('articles as article', 'article.id', '=', 'item.article_id')
                ->leftJoin('units as unit', 'unit.id', '=', 'article.unit_id')
                ->where('item.article_id', $articleId)
                ->where('note.entry_status', 'approved')
                ->where('note.status', 1)
                ->where('item.status', 1)
                ->when($warehouseId, fn($query) => $query->where('item.warehouse_id', $warehouseId))
                ->get([
                    'item.id',
                    'note.code as document',
                    DB::raw('COALESCE(note.entry_date, note.document_date) as document_date'),
                    'note.created_at',
                    'item.warehouse_id',
                    DB::raw('COALESCE(item.lot, item.batch_code) as lot'),
                    'item.expiration_date',
                    'item.quantity',
                    DB::raw('COALESCE(unit.symbol, unit.name) as unit_label'),
                ])
                ->map(fn($row) => self::movementRow($row, 'Ingreso', (float)$row->quantity, 0)));
        }

        if (Schema::hasTable('exit_note_items') && Schema::hasTable('exit_notes')) {
            $rows = $rows->merge(DB::table('exit_note_items as item')
                ->join('exit_notes as note', 'note.id', '=', 'item.exit_note_id')
                ->leftJoin('articles as article', 'article.id', '=', 'item.article_id')
                ->leftJoin('units as unit', 'unit.id', '=', 'article.unit_id')
                ->where('item.article_id', $articleId)
                ->where('note.exit_status', 'approved')
                ->where('note.status', 1)
                ->where('item.status', 1)
                ->when($warehouseId, fn($query) => $query->where('item.warehouse_id', $warehouseId))
                ->get([
                    'item.id',
                    'note.code as document',
                    DB::raw('COALESCE(note.exit_date, note.document_date) as document_date'),
                    'note.created_at',
                    'item.warehouse_id',
                    'item.batch_code as lot',
                    'item.expiration_date',
                    'item.quantity',
                    DB::raw('COALESCE(unit.symbol, unit.name) as unit_label'),
                ])
                ->map(fn($row) => self::movementRow($row, 'Salida', 0, (float)$row->quantity)));
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

    private static function ledgerIn(int $articleId, ?int $warehouseId, ?string $lot = null, ?string $expirationDate = null): float
    {
        if (!Schema::hasTable('entry_note_items') || !Schema::hasTable('entry_notes')) return 0;

        return (float) DB::table('entry_note_items as item')
            ->join('entry_notes as note', 'note.id', '=', 'item.entry_note_id')
            ->where('item.article_id', $articleId)
            ->where('note.entry_status', 'approved')
            ->where('note.status', 1)
            ->where('item.status', 1)
            ->when($warehouseId, fn($query) => $query->where('item.warehouse_id', $warehouseId))
            ->when($lot !== null, fn($query) => $query->where(function ($inner) use ($lot) {
                $inner->where('item.lot', $lot)->orWhere('item.batch_code', $lot);
            }))
            ->when($expirationDate !== null, fn($query) => $query->whereDate('item.expiration_date', $expirationDate))
            ->sum('item.quantity');
    }

    private static function ledgerOut(int $articleId, ?int $warehouseId, ?string $lot = null, ?string $expirationDate = null): float
    {
        if (!Schema::hasTable('exit_note_items') || !Schema::hasTable('exit_notes')) return 0;

        return (float) DB::table('exit_note_items as item')
            ->join('exit_notes as note', 'note.id', '=', 'item.exit_note_id')
            ->where('item.article_id', $articleId)
            ->where('note.exit_status', 'approved')
            ->where('note.status', 1)
            ->where('item.status', 1)
            ->when($warehouseId, fn($query) => $query->where('item.warehouse_id', $warehouseId))
            ->when($lot !== null, fn($query) => $query->where('item.batch_code', $lot))
            ->when($expirationDate !== null, fn($query) => $query->whereDate('item.expiration_date', $expirationDate))
            ->sum('item.quantity');
    }

    private static function averageCost(int $articleId, ?int $warehouseId): float
    {
        if (!Schema::hasTable('entry_note_items') || !Schema::hasTable('entry_notes')) return 0;

        $warehouseId = $warehouseId ?: MagistralesWarehouse::idOrNull();

        $row = DB::table('entry_note_items as item')
            ->join('entry_notes as note', 'note.id', '=', 'item.entry_note_id')
            ->where('item.article_id', $articleId)
            ->where('note.entry_status', 'approved')
            ->where('note.status', 1)
            ->where('item.status', 1)
            ->when($warehouseId, fn($query) => $query->where('item.warehouse_id', $warehouseId))
            ->selectRaw('SUM(item.quantity) as qty, SUM(item.quantity * item.cost_unit) as total_cost')
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
