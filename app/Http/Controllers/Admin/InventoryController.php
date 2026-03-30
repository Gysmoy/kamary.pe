<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\Article;
use Illuminate\Support\Facades\DB;

class InventoryController extends BasicController
{
    public $model = Article::class;
    public $reactView = 'Admin/Inventory';
    public $prefix4filter = 'articles';
    public $ignorePrefix = ['qty_in', 'qty_out', 'stock'];

    public function setPaginationInstance(string $model)
    {
        $businessId = trim((string)request('business_id', ''));
        $branchId = trim((string)request('business_branch_id', ''));

        $entryQtySubquery = DB::table('entry_note_items as entry_item')
            ->join('entry_notes as entry_note', 'entry_note.id', '=', 'entry_item.entry_note_id')
            ->where('entry_item.status', 1)
            ->where('entry_note.status', 1)
            ->groupBy('entry_item.article_id')
            ->selectRaw('entry_item.article_id, COALESCE(SUM(entry_item.quantity), 0) as qty_in');
        if ($businessId !== '') {
            $entryQtySubquery->where('entry_note.business_id', $businessId);
        }
        if ($branchId !== '') {
            $entryQtySubquery->where('entry_note.business_branch_id', $branchId);
        }

        $exitQtySubquery = DB::table('exit_note_items as exit_item')
            ->join('exit_notes as exit_note', 'exit_note.id', '=', 'exit_item.exit_note_id')
            ->where('exit_item.status', 1)
            ->where('exit_note.status', 1)
            ->groupBy('exit_item.article_id')
            ->selectRaw('exit_item.article_id, COALESCE(SUM(exit_item.quantity), 0) as qty_out');
        if ($businessId !== '') {
            $exitQtySubquery->where('exit_note.business_id', $businessId);
        }
        if ($branchId !== '') {
            $exitQtySubquery->where('exit_note.business_branch_id', $branchId);
        }

        $stockSubquery = DB::table('articles as stock_article')
            ->leftJoinSub($entryQtySubquery, 'entry_qty', function ($join) {
                $join->on('entry_qty.article_id', '=', 'stock_article.id');
            })
            ->leftJoinSub($exitQtySubquery, 'exit_qty', function ($join) {
                $join->on('exit_qty.article_id', '=', 'stock_article.id');
            })
            ->selectRaw('stock_article.id as article_id')
            ->selectRaw('COALESCE(entry_qty.qty_in, 0) as qty_in')
            ->selectRaw('COALESCE(exit_qty.qty_out, 0) as qty_out')
            ->selectRaw('(COALESCE(entry_qty.qty_in, 0) - COALESCE(exit_qty.qty_out, 0)) as stock');

        return $model::select('articles.*')
            ->with([
                'laboratory:id,name',
                'activePrinciple:id,name',
                'unit:id,name,symbol',
            ])
            ->leftJoinSub($stockSubquery, 'inventory_stock', function ($join) {
                $join->on('inventory_stock.article_id', '=', 'articles.id');
            })
            ->addSelect('inventory_stock.qty_in', 'inventory_stock.qty_out', 'inventory_stock.stock')
            ->join('laboratories as laboratory', 'laboratory.id', '=', 'articles.laboratory_id')
            ->join('active_principles as active_principle', 'active_principle.id', '=', 'articles.active_principle_id')
            ->join('units as unit', 'unit.id', '=', 'articles.unit_id');
    }
}
