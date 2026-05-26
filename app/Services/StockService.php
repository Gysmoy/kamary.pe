<?php

namespace App\Services;

use App\Models\Batch;
use App\Models\PurchaseReceipt;
use App\Support\BusinessScope;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class StockService
{
    public function incomingArticleTotalsSubquery(?string $businessId = '', ?string $branchId = '')
    {
        $entryMovements = DB::table('entry_note_items as entry_item')
            ->join('entry_notes as entry_note', 'entry_note.id', '=', 'entry_item.entry_note_id')
            ->where('entry_note.status', 1)
            ->where('entry_note.entry_status', 'approved')
            ->where('entry_item.status', 1)
            ->selectRaw('entry_item.article_id as article_id, entry_item.quantity as quantity');

        $receiptMovements = DB::table('purchase_receipt_items as receipt_item')
            ->join('purchase_receipts as receipt', 'receipt.id', '=', 'receipt_item.purchase_receipt_id')
            ->where('receipt.status', 1)
            ->where('receipt.receipt_status', 'confirmed')
            ->where('receipt_item.status', 1)
            ->selectRaw('receipt_item.article_id as article_id, receipt_item.quantity as quantity');

        if ($businessId !== '') {
            $entryMovements->where('entry_note.business_id', $businessId);
            $receiptMovements->where('receipt.business_id', $businessId);
        }
        if ($branchId !== '') {
            $entryMovements->where('entry_note.business_branch_id', $branchId);
            $receiptMovements->where('receipt.business_branch_id', $branchId);
        }

        return DB::query()
            ->fromSub($entryMovements->unionAll($receiptMovements), 'incoming_movements')
            ->groupBy('article_id')
            ->selectRaw('article_id, COALESCE(SUM(quantity), 0) as qty_in');
    }

    public function incomingWarehouseTotalsForArticleSubquery(int $articleId)
    {
        $entryMovements = DB::table('entry_note_items as entry_item')
            ->join('entry_notes as entry_note', 'entry_note.id', '=', 'entry_item.entry_note_id')
            ->where('entry_note.status', 1)
            ->where('entry_note.entry_status', 'approved')
            ->where('entry_item.status', 1)
            ->where('entry_item.article_id', $articleId)
            ->selectRaw('entry_item.warehouse_id as warehouse_id, entry_item.quantity as quantity');

        $receiptMovements = DB::table('purchase_receipt_items as receipt_item')
            ->join('purchase_receipts as receipt', 'receipt.id', '=', 'receipt_item.purchase_receipt_id')
            ->where('receipt.status', 1)
            ->where('receipt.receipt_status', 'confirmed')
            ->where('receipt_item.status', 1)
            ->where('receipt_item.article_id', $articleId)
            ->selectRaw('receipt_item.warehouse_id as warehouse_id, receipt_item.quantity as quantity');

        return DB::query()
            ->fromSub($entryMovements->unionAll($receiptMovements), 'incoming_movements')
            ->groupBy('warehouse_id')
            ->selectRaw('warehouse_id, COALESCE(SUM(quantity), 0) as qty_in');
    }

    public function getAvailableStockByWarehouse(int $articleId, int $warehouseId, int $excludedExitNoteId = 0, ?int $excludedPurchaseReceiptId = null): float
    {
        return (float)max(0, $this->getNetStockByWarehouse($articleId, $warehouseId, $excludedExitNoteId, $excludedPurchaseReceiptId));
    }

    public function getAvailableStockByStorageKey(
        int $articleId,
        int $warehouseId,
        ?string $lot,
        ?string $expirationDate,
        ?string $location,
        int $excludedExitNoteId = 0,
        ?int $businessId = null,
        bool $includePurchaseReceipts = true
    ): float {
        $lot = $this->normalizeStockText($lot);
        $location = $this->normalizeStockText($location);
        $expirationDate = $this->normalizeStockDate($expirationDate);
        $dateKey = $expirationDate ?: '1000-01-01';

        $entryQty = (float)DB::table('entry_note_items as entry_item')
            ->join('entry_notes as entry_note', 'entry_note.id', '=', 'entry_item.entry_note_id')
            ->where('entry_note.status', 1)
            ->where('entry_note.entry_status', 'approved')
            ->where('entry_item.status', 1)
            ->where('entry_item.article_id', $articleId)
            ->whereRaw('COALESCE(entry_item.warehouse_id, entry_note.warehouse_id) = ?', [$warehouseId])
            ->whereRaw("COALESCE(NULLIF(entry_item.lot, ''), NULLIF(entry_item.batch_code, ''), '') = ?", [$lot])
            ->whereRaw("COALESCE(NULLIF(entry_item.location, ''), '') = ?", [$location])
            ->whereRaw("COALESCE(DATE(entry_item.expiration_date), '1000-01-01') = ?", [$dateKey])
            ->when($businessId, fn($query) => $query->where('entry_note.business_id', $businessId))
            ->sum('entry_item.quantity');

        $receiptQty = 0;
        if ($includePurchaseReceipts) {
            $receiptQty = (float)DB::table('purchase_receipt_items as receipt_item')
                ->join('purchase_receipts as receipt', 'receipt.id', '=', 'receipt_item.purchase_receipt_id')
                ->where('receipt.status', 1)
                ->where('receipt.receipt_status', 'confirmed')
                ->where('receipt_item.status', 1)
                ->where('receipt_item.article_id', $articleId)
                ->where('receipt_item.warehouse_id', $warehouseId)
                ->whereRaw("COALESCE(NULLIF(receipt_item.lot, ''), NULLIF(receipt_item.batch_code, ''), '') = ?", [$lot])
                ->whereRaw("COALESCE(NULLIF(receipt_item.location, ''), '') = ?", [$location])
                ->whereRaw("COALESCE(DATE(receipt_item.expiration_date), '1000-01-01') = ?", [$dateKey])
                ->when($businessId, fn($query) => $query->where('receipt.business_id', $businessId))
                ->sum('receipt_item.quantity');
        }

        $qtyOutQuery = DB::table('exit_note_items as exit_item')
            ->join('exit_notes as exit_note', 'exit_note.id', '=', 'exit_item.exit_note_id')
            ->where('exit_note.status', 1)
            ->where('exit_item.status', 1)
            ->where('exit_item.article_id', $articleId)
            ->whereRaw('COALESCE(exit_item.warehouse_id, exit_note.warehouse_id) = ?', [$warehouseId])
            ->whereRaw("COALESCE(NULLIF(exit_item.batch_code, ''), '') = ?", [$lot])
            ->whereRaw("COALESCE(NULLIF(exit_item.location, ''), '') = ?", [$location])
            ->whereRaw("COALESCE(DATE(exit_item.expiration_date), '1000-01-01') = ?", [$dateKey])
            ->when($businessId, fn($query) => $query->where('exit_note.business_id', $businessId));
        if (Schema::hasColumn('exit_notes', 'exit_status')) {
            $qtyOutQuery->where('exit_note.exit_status', 'approved');
        }

        if ($excludedExitNoteId > 0) {
            $qtyOutQuery->where('exit_note.id', '!=', $excludedExitNoteId);
        }

        $qtyOut = (float)$qtyOutQuery->sum('exit_item.quantity');

        return (float)max(0, round($entryQty + $receiptQty - $qtyOut, 3));
    }

    public function availableStorageStockRows(
        ?int $warehouseId = null,
        ?string $search = '',
        int $excludedExitNoteId = 0,
        ?string $businessKey = null
    ): array {
        $businessKey = BusinessScope::normalize($businessKey) ?: BusinessScope::KAMARY_MEDICALS;
        $needle = mb_strtolower(trim((string)$search));

        $entryMovements = DB::table('entry_note_items as entry_item')
            ->join('entry_notes as entry_note', 'entry_note.id', '=', 'entry_item.entry_note_id')
            ->join('businesses as entry_business', 'entry_business.id', '=', 'entry_note.business_id')
            ->where('entry_note.status', 1)
            ->where('entry_note.entry_status', 'approved')
            ->where('entry_item.status', 1)
            ->where('entry_business.business_key', $businessKey)
            ->selectRaw("
                CONCAT('entry-', entry_item.id) as source_key,
                entry_item.article_id as article_id,
                COALESCE(entry_item.warehouse_id, entry_note.warehouse_id) as warehouse_id,
                COALESCE(NULLIF(entry_item.lot, ''), NULLIF(entry_item.batch_code, ''), '') as lot,
                entry_item.expiration_date as expiration_date,
                COALESCE(NULLIF(entry_item.location, ''), '') as location,
                entry_item.quantity as quantity
            ");

        $incomingTotals = DB::query()
            ->fromSub($entryMovements, 'incoming')
            ->selectRaw('
                MIN(incoming.source_key) as source_key,
                incoming.article_id,
                incoming.warehouse_id,
                incoming.lot,
                incoming.expiration_date,
                incoming.location,
                COALESCE(SUM(incoming.quantity), 0) as qty_in
            ')
            ->groupBy('incoming.article_id', 'incoming.warehouse_id', 'incoming.lot', 'incoming.expiration_date', 'incoming.location');

        $outgoingTotals = DB::table('exit_note_items as exit_item')
            ->join('exit_notes as exit_note', 'exit_note.id', '=', 'exit_item.exit_note_id')
            ->join('businesses as exit_business', 'exit_business.id', '=', 'exit_note.business_id')
            ->where('exit_note.status', 1)
            ->where('exit_item.status', 1)
            ->where('exit_business.business_key', $businessKey)
            ->when($excludedExitNoteId > 0, fn($query) => $query->where('exit_note.id', '!=', $excludedExitNoteId))
            ->selectRaw("
                exit_item.article_id,
                COALESCE(exit_item.warehouse_id, exit_note.warehouse_id) as warehouse_id,
                COALESCE(NULLIF(exit_item.batch_code, ''), '') as lot,
                exit_item.expiration_date as expiration_date,
                COALESCE(NULLIF(exit_item.location, ''), '') as location,
                COALESCE(SUM(exit_item.quantity), 0) as qty_out
            ")
            ->groupBy('exit_item.article_id', 'warehouse_id', 'lot', 'exit_item.expiration_date', 'location');
        if (Schema::hasColumn('exit_notes', 'exit_status')) {
            $outgoingTotals->where('exit_note.exit_status', 'approved');
        }

        $query = DB::query()
            ->fromSub($incomingTotals, 'stock')
            ->join('articles as article', 'article.id', '=', 'stock.article_id')
            ->leftJoin('units as unit', 'unit.id', '=', 'article.unit_id')
            ->leftJoin('laboratories as laboratory', 'laboratory.id', '=', 'article.laboratory_id')
            ->leftJoin('active_principles as active_principle', 'active_principle.id', '=', 'article.active_principle_id')
            ->leftJoin('warehouses as warehouse', 'warehouse.id', '=', 'stock.warehouse_id')
            ->leftJoin('storage_locations as storage_location', function ($join) {
                $join->on('storage_location.warehouse_id', '=', 'stock.warehouse_id')
                    ->whereRaw('storage_location.code = stock.location')
                    ->whereNotNull('storage_location.status');
            })
            ->leftJoin('clients as client', 'client.id', '=', 'storage_location.client_id')
            ->leftJoinSub($outgoingTotals, 'outgoing', function ($join) {
                $join->on('outgoing.article_id', '=', 'stock.article_id')
                    ->on('outgoing.warehouse_id', '=', 'stock.warehouse_id')
                    ->whereRaw("COALESCE(outgoing.lot, '') = COALESCE(stock.lot, '')")
                    ->whereRaw("COALESCE(outgoing.location, '') = COALESCE(stock.location, '')")
                    ->whereRaw("COALESCE(outgoing.expiration_date, '1000-01-01') = COALESCE(stock.expiration_date, '1000-01-01')");
            })
            ->when($warehouseId, fn($query) => $query->where('stock.warehouse_id', $warehouseId))
            ->whereRaw('(COALESCE(stock.qty_in, 0) - COALESCE(outgoing.qty_out, 0)) > 0')
            ->when($needle !== '', function ($query) use ($needle) {
                $like = '%' . $needle . '%';
                $query->where(function ($inner) use ($like) {
                    $inner->whereRaw("LOWER(COALESCE(article.code, '')) LIKE ?", [$like])
                        ->orWhereRaw("LOWER(COALESCE(article.name, '')) LIKE ?", [$like])
                        ->orWhereRaw("LOWER(COALESCE(article.health_registration, '')) LIKE ?", [$like])
                        ->orWhereRaw("LOWER(COALESCE(stock.lot, '')) LIKE ?", [$like])
                        ->orWhereRaw("LOWER(COALESCE(stock.location, '')) LIKE ?", [$like])
                        ->orWhereRaw("LOWER(COALESCE(client.full_name, '')) LIKE ?", [$like]);
                });
            })
            ->orderBy('article.name')
            ->orderBy('stock.expiration_date')
            ->orderBy('stock.lot')
            ->selectRaw("
                stock.source_key,
                stock.article_id,
                stock.warehouse_id,
                COALESCE(article.code, '') as article_code,
                COALESCE(article.name, '') as article_name,
                COALESCE(article.health_registration, '') as health_registration,
                COALESCE(laboratory.name, '') as laboratory_name,
                COALESCE(active_principle.name, '') as principle_name,
                COALESCE(unit.symbol, unit.name, '') as unit_label,
                COALESCE(warehouse.name, '') as warehouse_name,
                COALESCE(stock.lot, '') as lot,
                stock.expiration_date,
                COALESCE(stock.location, '') as location,
                storage_location.temperature_range,
                storage_location.client_id,
                COALESCE(client.full_name, '') as client_name,
                COALESCE(stock.qty_in, 0) - COALESCE(outgoing.qty_out, 0) as stock
            ");

        return $query->get()
            ->values()
            ->map(function ($row, $index) {
                $expirationDate = $row->expiration_date ? substr((string)$row->expiration_date, 0, 10) : '';
                return [
                    'id' => implode('|', [
                        $row->article_id,
                        $row->warehouse_id,
                        (string)$row->lot,
                        $expirationDate,
                        (string)$row->location,
                    ]),
                    'source_key' => (string)$row->source_key,
                    'article_id' => $row->article_id,
                    'warehouse_id' => $row->warehouse_id,
                    'article_code' => (string)$row->article_code,
                    'article_name' => (string)$row->article_name,
                    'health_registration' => (string)$row->health_registration,
                    'laboratory_name' => (string)$row->laboratory_name,
                    'principle_name' => (string)$row->principle_name,
                    'unit_label' => (string)$row->unit_label,
                    'warehouse_name' => (string)$row->warehouse_name,
                    'lot' => (string)$row->lot,
                    'expiration_date' => $expirationDate,
                    'location' => (string)$row->location,
                    'temperature_range' => (string)($row->temperature_range ?? ''),
                    'client_id' => $row->client_id,
                    'client_name' => (string)$row->client_name,
                    'stock' => round((float)$row->stock, 3),
                ];
            })
            ->all();
    }

    public function storageLocationOccupancyRows(
        ?int $warehouseId = null,
        ?string $location = '',
        int $excludedEntryNoteId = 0,
        ?string $businessKey = null
    ): array {
        $businessKey = BusinessScope::normalize($businessKey) ?: BusinessScope::KAMARY_MEDICALS;
        $location = mb_strtolower($this->normalizeStockText($location));

        $entryMovements = DB::table('entry_note_items as entry_item')
            ->join('entry_notes as entry_note', 'entry_note.id', '=', 'entry_item.entry_note_id')
            ->join('businesses as entry_business', 'entry_business.id', '=', 'entry_note.business_id')
            ->leftJoin('clients as entry_client', 'entry_client.id', '=', 'entry_note.client_id')
            ->where('entry_note.status', 1)
            ->where('entry_note.entry_status', 'approved')
            ->where('entry_item.status', 1)
            ->where('entry_business.business_key', $businessKey)
            ->when($excludedEntryNoteId > 0, fn($query) => $query->where('entry_note.id', '!=', $excludedEntryNoteId))
            ->selectRaw("
                entry_item.article_id as article_id,
                COALESCE(entry_item.warehouse_id, entry_note.warehouse_id) as warehouse_id,
                COALESCE(NULLIF(entry_item.lot, ''), NULLIF(entry_item.batch_code, ''), '') as lot,
                entry_item.expiration_date as expiration_date,
                COALESCE(NULLIF(entry_item.location, ''), '') as location,
                entry_note.client_id as client_id,
                COALESCE(entry_client.full_name, '') as client_name,
                COALESCE(entry_note.entry_date, DATE(entry_note.created_at)) as occupied_from,
                entry_item.quantity as quantity
            ");

        $incomingTotals = DB::query()
            ->fromSub($entryMovements, 'incoming')
            ->selectRaw("
                incoming.article_id,
                incoming.warehouse_id,
                incoming.lot,
                incoming.expiration_date,
                incoming.location,
                MIN(incoming.client_id) as client_id,
                GROUP_CONCAT(DISTINCT NULLIF(incoming.client_name, '') SEPARATOR ', ') as client_name,
                MIN(incoming.occupied_from) as occupied_from,
                COALESCE(SUM(incoming.quantity), 0) as qty_in
            ")
            ->groupBy('incoming.article_id', 'incoming.warehouse_id', 'incoming.lot', 'incoming.expiration_date', 'incoming.location');

        $outgoingTotals = DB::table('exit_note_items as exit_item')
            ->join('exit_notes as exit_note', 'exit_note.id', '=', 'exit_item.exit_note_id')
            ->join('businesses as exit_business', 'exit_business.id', '=', 'exit_note.business_id')
            ->where('exit_note.status', 1)
            ->where('exit_item.status', 1)
            ->where('exit_business.business_key', $businessKey)
            ->selectRaw("
                exit_item.article_id,
                COALESCE(exit_item.warehouse_id, exit_note.warehouse_id) as warehouse_id,
                COALESCE(NULLIF(exit_item.batch_code, ''), '') as lot,
                exit_item.expiration_date as expiration_date,
                COALESCE(NULLIF(exit_item.location, ''), '') as location,
                COALESCE(SUM(exit_item.quantity), 0) as qty_out
            ")
            ->groupBy('exit_item.article_id', 'warehouse_id', 'lot', 'exit_item.expiration_date', 'location');
        if (Schema::hasColumn('exit_notes', 'exit_status')) {
            $outgoingTotals->where('exit_note.exit_status', 'approved');
        }

        $query = DB::query()
            ->fromSub($incomingTotals, 'stock')
            ->join('articles as article', 'article.id', '=', 'stock.article_id')
            ->leftJoin('units as unit', 'unit.id', '=', 'article.unit_id')
            ->leftJoin('warehouses as warehouse', 'warehouse.id', '=', 'stock.warehouse_id')
            ->leftJoinSub($outgoingTotals, 'outgoing', function ($join) {
                $join->on('outgoing.article_id', '=', 'stock.article_id')
                    ->on('outgoing.warehouse_id', '=', 'stock.warehouse_id')
                    ->whereRaw("COALESCE(outgoing.lot, '') = COALESCE(stock.lot, '')")
                    ->whereRaw("COALESCE(outgoing.location, '') = COALESCE(stock.location, '')")
                    ->whereRaw("COALESCE(outgoing.expiration_date, '1000-01-01') = COALESCE(stock.expiration_date, '1000-01-01')");
            })
            ->when($warehouseId, fn($query) => $query->where('stock.warehouse_id', $warehouseId))
            ->when($location !== '', fn($query) => $query->whereRaw("LOWER(COALESCE(stock.location, '')) = ?", [$location]))
            ->whereRaw('(COALESCE(stock.qty_in, 0) - COALESCE(outgoing.qty_out, 0)) > 0')
            ->orderBy('warehouse.name')
            ->orderBy('stock.location')
            ->orderBy('article.name')
            ->selectRaw("
                stock.article_id,
                stock.warehouse_id,
                COALESCE(article.code, '') as article_code,
                COALESCE(article.name, '') as article_name,
                COALESCE(unit.symbol, unit.name, '') as unit_label,
                COALESCE(warehouse.name, '') as warehouse_name,
                COALESCE(stock.lot, '') as lot,
                stock.expiration_date,
                COALESCE(stock.location, '') as location,
                stock.client_id,
                COALESCE(stock.client_name, '') as client_name,
                stock.occupied_from,
                stock.expiration_date as occupied_until,
                COALESCE(stock.qty_in, 0) - COALESCE(outgoing.qty_out, 0) as stock
            ");

        return $query->get()
            ->values()
            ->map(function ($row) {
                return [
                    'article_id' => $row->article_id,
                    'warehouse_id' => $row->warehouse_id,
                    'article_code' => (string)$row->article_code,
                    'article_name' => (string)$row->article_name,
                    'unit_label' => (string)$row->unit_label,
                    'warehouse_name' => (string)$row->warehouse_name,
                    'lot' => (string)$row->lot,
                    'expiration_date' => $row->expiration_date ? substr((string)$row->expiration_date, 0, 10) : '',
                    'location' => (string)$row->location,
                    'client_id' => $row->client_id,
                    'client_name' => (string)$row->client_name,
                    'occupied_from' => $row->occupied_from ? substr((string)$row->occupied_from, 0, 10) : '',
                    'occupied_until' => $row->occupied_until ? substr((string)$row->occupied_until, 0, 10) : '',
                    'stock' => round((float)$row->stock, 3),
                ];
            })
            ->all();
    }

    public function getNetStockByWarehouse(int $articleId, int $warehouseId, int $excludedExitNoteId = 0, ?int $excludedPurchaseReceiptId = null): float
    {
        $qtyIn = $this->sumIncomingStockByWarehouse($articleId, $warehouseId, $excludedPurchaseReceiptId);

        $qtyOutQuery = DB::table('exit_note_items as exit_item')
            ->join('exit_notes as exit_note', 'exit_note.id', '=', 'exit_item.exit_note_id')
            ->where('exit_note.status', 1)
            ->where('exit_item.status', 1)
            ->where('exit_item.article_id', $articleId)
            ->where('exit_item.warehouse_id', $warehouseId);
        if (Schema::hasColumn('exit_notes', 'exit_status')) {
            $qtyOutQuery->where('exit_note.exit_status', 'approved');
        }

        if ($excludedExitNoteId > 0) {
            $qtyOutQuery->where('exit_note.id', '!=', $excludedExitNoteId);
        }

        $qtyOut = (float)$qtyOutQuery->sum('exit_item.quantity');

        return round($qtyIn - $qtyOut, 3);
    }

    public function incomingKardexMovementsQuery()
    {
        $entryMovements = DB::table('entry_note_items as movement_item')
            ->join('entry_notes as movement_note', 'movement_note.id', '=', 'movement_item.entry_note_id')
            ->join('articles as article', 'article.id', '=', 'movement_item.article_id')
            ->leftJoin('laboratories as laboratory', 'laboratory.id', '=', 'article.laboratory_id')
            ->leftJoin('active_principles as active_principle', 'active_principle.id', '=', 'article.active_principle_id')
            ->leftJoin('units as unit', 'unit.id', '=', 'article.unit_id')
            ->leftJoin('warehouses as warehouse', 'warehouse.id', '=', 'movement_item.warehouse_id')
            ->leftJoin('businesses as business', 'business.id', '=', 'movement_note.business_id')
            ->leftJoin('business_branches as branch', 'branch.id', '=', 'movement_note.business_branch_id')
            ->where('movement_note.status', 1)
            ->where('movement_item.status', 1)
            ->selectRaw("
                CONCAT('entry-', movement_item.id) as id,
                movement_note.id as note_id,
                movement_note.created_at as movement_date,
                'Entrada' as movement_type,
                movement_note.business_id as business_id,
                COALESCE(business.name, '') as business_name,
                movement_note.business_branch_id as business_branch_id,
                COALESCE(branch.name, '') as branch_name,
                article.id as article_id,
                COALESCE(article.code, '') as article_code,
                COALESCE(article.name, '') as article_name,
                article.laboratory_id as laboratory_id,
                COALESCE(laboratory.name, '') as laboratory_name,
                COALESCE(active_principle.name, '') as principle_name,
                COALESCE(unit.symbol, unit.name, '') as unit_label,
                COALESCE(warehouse.name, '') as warehouse_name,
                COALESCE(movement_item.batch_code, movement_item.lot, '') as batch_code,
                COALESCE(movement_item.location, '') as location,
                '' as destination_location,
                movement_item.quantity as quantity_in,
                0 as quantity_out,
                movement_item.total as total
            ");

        $receiptMovements = DB::table('purchase_receipt_items as movement_item')
            ->join('purchase_receipts as movement_note', 'movement_note.id', '=', 'movement_item.purchase_receipt_id')
            ->join('articles as article', 'article.id', '=', 'movement_item.article_id')
            ->leftJoin('laboratories as laboratory', 'laboratory.id', '=', 'article.laboratory_id')
            ->leftJoin('active_principles as active_principle', 'active_principle.id', '=', 'article.active_principle_id')
            ->leftJoin('units as unit', 'unit.id', '=', 'article.unit_id')
            ->leftJoin('warehouses as warehouse', 'warehouse.id', '=', 'movement_item.warehouse_id')
            ->leftJoin('businesses as business', 'business.id', '=', 'movement_note.business_id')
            ->leftJoin('business_branches as branch', 'branch.id', '=', 'movement_note.business_branch_id')
            ->where('movement_note.status', 1)
            ->where('movement_note.receipt_status', 'confirmed')
            ->where('movement_item.status', 1)
            ->selectRaw("
                CONCAT('purchase-receipt-', movement_item.id) as id,
                movement_note.id as note_id,
                COALESCE(movement_note.confirmed_at, movement_note.updated_at, movement_note.created_at) as movement_date,
                'Recepcion compra' as movement_type,
                movement_note.business_id as business_id,
                COALESCE(business.name, '') as business_name,
                movement_note.business_branch_id as business_branch_id,
                COALESCE(branch.name, '') as branch_name,
                article.id as article_id,
                COALESCE(article.code, '') as article_code,
                COALESCE(article.name, '') as article_name,
                article.laboratory_id as laboratory_id,
                COALESCE(laboratory.name, '') as laboratory_name,
                COALESCE(active_principle.name, '') as principle_name,
                COALESCE(unit.symbol, unit.name, '') as unit_label,
                COALESCE(warehouse.name, '') as warehouse_name,
                COALESCE(movement_item.batch_code, movement_item.lot, '') as batch_code,
                COALESCE(movement_item.location, '') as location,
                '' as destination_location,
                movement_item.quantity as quantity_in,
                0 as quantity_out,
                movement_item.total as total
            ");

        return $entryMovements->unionAll($receiptMovements);
    }

    public function syncPurchaseReceiptBatches(PurchaseReceipt $receipt): void
    {
        $receipt->loadMissing('items.batch');

        if (!$receipt->status || $receipt->receipt_status !== 'confirmed') {
            return;
        }

        foreach ($receipt->items as $item) {
            if (!$item->status || !$item->article_id) continue;

            $lot = trim((string)($item->lot ?: $item->batch_code ?: $item->batch?->lot ?: ''));
            $expirationDate = $item->expiration_date?->format('Y-m-d');

            if ($item->batch_id) {
                $batch = $item->batch ?: Batch::find($item->batch_id);
                if ($batch) {
                    $updates = [];
                    if ($expirationDate && $batch->expiration_date?->format('Y-m-d') !== $expirationDate) {
                        $updates['expiration_date'] = $expirationDate;
                        $updates['updated_by'] = Auth::id();
                    }
                    if ($updates) {
                        $batch->update($updates);
                    }

                    $itemUpdates = [];
                    if ($item->batch_code !== $batch->lot) $itemUpdates['batch_code'] = $batch->lot;
                    if ($item->lot !== $batch->lot) $itemUpdates['lot'] = $batch->lot;
                    if (!$item->expiration_date && $batch->expiration_date) {
                        $itemUpdates['expiration_date'] = $batch->expiration_date->format('Y-m-d');
                    }
                    if ($itemUpdates) {
                        DB::table('purchase_receipt_items')->where('id', $item->id)->update($itemUpdates);
                    }
                    continue;
                }
            }

            if ($lot === '') {
                continue;
            }

            $batch = Batch::where('business_id', $receipt->business_id)
                ->where('article_id', $item->article_id)
                ->whereRaw('LOWER(lot) = ?', [mb_strtolower($lot)])
                ->first();

            if (!$batch && !$expirationDate) {
                if ($item->batch_code !== $lot || $item->lot !== $lot) {
                    DB::table('purchase_receipt_items')->where('id', $item->id)->update([
                        'batch_code' => $lot,
                        'lot' => $lot,
                    ]);
                }
                continue;
            }

            if (!$batch) {
                $batch = Batch::create([
                    'business_id' => $receipt->business_id,
                    'article_id' => $item->article_id,
                    'lot' => $lot,
                    'expiration_date' => $expirationDate,
                    'status' => true,
                    'created_by' => Auth::id(),
                    'updated_by' => Auth::id(),
                ]);
            } elseif ($expirationDate && $batch->expiration_date?->format('Y-m-d') !== $expirationDate) {
                $batch->update([
                    'expiration_date' => $expirationDate,
                    'updated_by' => Auth::id(),
                ]);
            }

            DB::table('purchase_receipt_items')->where('id', $item->id)->update([
                'batch_id' => $batch->id,
                'batch_code' => $batch->lot,
                'lot' => $batch->lot,
                'expiration_date' => $item->expiration_date?->format('Y-m-d') ?: $batch->expiration_date?->format('Y-m-d'),
            ]);
        }
    }

    private function sumIncomingStockByWarehouse(int $articleId, int $warehouseId, ?int $excludedPurchaseReceiptId = null): float
    {
        $entryQty = (float)DB::table('entry_note_items as entry_item')
            ->join('entry_notes as entry_note', 'entry_note.id', '=', 'entry_item.entry_note_id')
            ->where('entry_note.status', 1)
            ->where('entry_note.entry_status', 'approved')
            ->where('entry_item.status', 1)
            ->where('entry_item.article_id', $articleId)
            ->where('entry_item.warehouse_id', $warehouseId)
            ->sum('entry_item.quantity');

        $receiptQtyQuery = DB::table('purchase_receipt_items as receipt_item')
            ->join('purchase_receipts as receipt', 'receipt.id', '=', 'receipt_item.purchase_receipt_id')
            ->where('receipt.status', 1)
            ->where('receipt.receipt_status', 'confirmed')
            ->where('receipt_item.status', 1)
            ->where('receipt_item.article_id', $articleId)
            ->where('receipt_item.warehouse_id', $warehouseId);

        if (!is_null($excludedPurchaseReceiptId)) {
            $receiptQtyQuery->where('receipt.id', '!=', $excludedPurchaseReceiptId);
        }

        $receiptQty = (float)$receiptQtyQuery->sum('receipt_item.quantity');

        return round($entryQty + $receiptQty, 3);
    }

    private function normalizeStockText($value): string
    {
        return trim((string)($value ?? ''));
    }

    private function normalizeStockDate($value): ?string
    {
        $text = trim((string)($value ?? ''));
        if ($text === '') return null;
        $timestamp = strtotime($text);
        if ($timestamp === false) return null;
        return date('Y-m-d', $timestamp);
    }
}
