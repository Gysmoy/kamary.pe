<?php

namespace App\Http\Controllers\Admin\Storage;

use App\Http\Controllers\Admin\ArticleController as BaseArticleController;
use App\Models\Article;
use App\Models\Warehouse;
use App\Support\BusinessScope;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use SoDe\Extend\Response;

class ProductController extends BaseArticleController
{
    protected string $moduleScope = 'storage';

    public function setReactViewProperties(Request $request)
    {
        return [
            'moduleTitle' => 'Serv. Almacenamiento - Creacion del producto',
            'requiredPermission' => 'storage-products',
            'moduleScope' => $this->moduleScope,
        ];
    }

    public function stockByWarehouse(Request $request, string $articleId): HttpResponse|ResponseFactory
    {
        $response = new Response();

        try {
            $article = Article::with([
                'presentations' => function ($query) {
                    $query->where('status', 1)->orderBy('sort_order')->orderBy('id');
                }
            ])->findOrFail($articleId);

            $incomingTotals = DB::table('entry_note_items as entry_item')
                ->join('entry_notes as entry_note', 'entry_note.id', '=', 'entry_item.entry_note_id')
                ->join('businesses as business', 'business.id', '=', 'entry_note.business_id')
                ->where('entry_note.status', 1)
                ->where('entry_note.entry_status', 'approved')
                ->where('entry_item.status', 1)
                ->where('business.business_key', BusinessScope::KAMARY_MEDICALS)
                ->where('entry_item.article_id', $article->id)
                ->selectRaw('
                    COALESCE(entry_item.warehouse_id, entry_note.warehouse_id) as warehouse_id,
                    COALESCE(SUM(entry_item.quantity), 0) as qty_in
                ')
                ->groupByRaw('COALESCE(entry_item.warehouse_id, entry_note.warehouse_id)');

            $outgoingTotals = DB::table('exit_note_items as exit_item')
                ->join('exit_notes as exit_note', 'exit_note.id', '=', 'exit_item.exit_note_id')
                ->join('businesses as business', 'business.id', '=', 'exit_note.business_id')
                ->where('exit_note.status', 1)
                ->where('exit_item.status', 1)
                ->where('business.business_key', BusinessScope::KAMARY_MEDICALS)
                ->where('exit_item.article_id', $article->id)
                ->when(Schema::hasColumn('exit_notes', 'exit_status'), fn($query) => $query->where('exit_note.exit_status', 'approved'))
                ->selectRaw('
                    COALESCE(exit_item.warehouse_id, exit_note.warehouse_id) as warehouse_id,
                    COALESCE(SUM(exit_item.quantity), 0) as qty_out
                ')
                ->groupByRaw('COALESCE(exit_item.warehouse_id, exit_note.warehouse_id)');

            $warehouses = Warehouse::query()
                ->selectRaw('
                    warehouses.id,
                    warehouses.name,
                    warehouses.business_branch_id,
                    warehouses.status,
                    COALESCE(branch.name, "") as branch_name,
                    COALESCE(business.name, "") as business_name,
                    COALESCE(entry_qty.qty_in, 0) as qty_in,
                    COALESCE(exit_qty.qty_out, 0) as qty_out,
                    (COALESCE(entry_qty.qty_in, 0) - COALESCE(exit_qty.qty_out, 0)) as stock
                ')
                ->leftJoinSub($incomingTotals, 'entry_qty', function ($join) {
                    $join->on('entry_qty.warehouse_id', '=', 'warehouses.id');
                })
                ->leftJoinSub($outgoingTotals, 'exit_qty', function ($join) {
                    $join->on('exit_qty.warehouse_id', '=', 'warehouses.id');
                })
                ->leftJoin('business_branches as branch', 'branch.id', '=', 'warehouses.business_branch_id')
                ->leftJoin('businesses as business', 'business.id', '=', 'branch.business_id')
                ->whereNotNull('warehouses.status')
                ->where('business.business_key', BusinessScope::KAMARY_MEDICALS)
                ->orderBy('business_name')
                ->orderBy('branch_name')
                ->orderBy('warehouses.name')
                ->get();

            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = [
                'article' => [
                    'id' => $article->id,
                    'code' => $article->code,
                    'name' => $article->name,
                    'presentations' => $article->presentations->map(fn($presentation) => [
                        'id' => $presentation->id,
                        'name' => $presentation->name,
                        'units' => (float)$presentation->units,
                        'price' => (float)$presentation->price,
                    ])->values(),
                ],
                'warehouses' => $warehouses,
            ];
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }
}
