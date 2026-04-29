<?php

namespace App\Services;

use App\Models\Batch;
use App\Models\PurchaseReceipt;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class StockService
{
    public function incomingArticleTotalsSubquery(?string $businessId = '', ?string $branchId = '')
    {
        $entryMovements = DB::table('entry_note_items as entry_item')
            ->join('entry_notes as entry_note', 'entry_note.id', '=', 'entry_item.entry_note_id')
            ->where('entry_note.status', 1)
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

    public function getNetStockByWarehouse(int $articleId, int $warehouseId, int $excludedExitNoteId = 0, ?int $excludedPurchaseReceiptId = null): float
    {
        $qtyIn = $this->sumIncomingStockByWarehouse($articleId, $warehouseId, $excludedPurchaseReceiptId);

        $qtyOutQuery = DB::table('exit_note_items as exit_item')
            ->join('exit_notes as exit_note', 'exit_note.id', '=', 'exit_item.exit_note_id')
            ->where('exit_note.status', 1)
            ->where('exit_item.status', 1)
            ->where('exit_item.article_id', $articleId)
            ->where('exit_item.warehouse_id', $warehouseId);

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
}
