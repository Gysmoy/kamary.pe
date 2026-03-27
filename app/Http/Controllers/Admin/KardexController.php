<?php

namespace App\Http\Controllers\Admin;

use App\Http\Classes\dxResponse;
use App\Http\Controllers\BasicController;
use App\Models\dxDataGrid;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\DB;

class KardexController extends BasicController
{
    public $reactView = 'Admin/Kardex';
    public $reactRootView = 'admin';

    public function paginate(Request $request): HttpResponse|ResponseFactory
    {
        $response = new dxResponse();
        try {
            $entryMovements = DB::table('entry_note_items as movement_item')
                ->join('entry_notes as movement_note', 'movement_note.id', '=', 'movement_item.entry_note_id')
                ->join('articles as article', 'article.id', '=', 'movement_item.article_id')
                ->leftJoin('laboratories as laboratory', 'laboratory.id', '=', 'article.laboratory_id')
                ->leftJoin('active_principles as active_principle', 'active_principle.id', '=', 'article.active_principle_id')
                ->leftJoin('units as unit', 'unit.id', '=', 'article.unit_id')
                ->leftJoin('warehouses as warehouse', 'warehouse.id', '=', 'movement_item.warehouse_id')
                ->leftJoin('businesses as business', 'business.id', '=', 'movement_note.business_id')
                ->leftJoin('business_branches as branch', 'branch.id', '=', 'movement_note.business_branch_id')
                ->whereNotNull('movement_note.status')
                ->whereNotNull('movement_item.status')
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
                    COALESCE(movement_item.batch_code, '') as batch_code,
                    COALESCE(movement_item.location, '') as location,
                    '' as destination_location,
                    movement_item.quantity as quantity_in,
                    0 as quantity_out,
                    movement_item.total as total
                ");

            $exitMovements = DB::table('exit_note_items as movement_item')
                ->join('exit_notes as movement_note', 'movement_note.id', '=', 'movement_item.exit_note_id')
                ->join('articles as article', 'article.id', '=', 'movement_item.article_id')
                ->leftJoin('laboratories as laboratory', 'laboratory.id', '=', 'article.laboratory_id')
                ->leftJoin('active_principles as active_principle', 'active_principle.id', '=', 'article.active_principle_id')
                ->leftJoin('units as unit', 'unit.id', '=', 'article.unit_id')
                ->leftJoin('warehouses as warehouse', 'warehouse.id', '=', 'movement_item.warehouse_id')
                ->leftJoin('businesses as business', 'business.id', '=', 'movement_note.business_id')
                ->leftJoin('business_branches as branch', 'branch.id', '=', 'movement_note.business_branch_id')
                ->whereNotNull('movement_note.status')
                ->whereNotNull('movement_item.status')
                ->selectRaw("
                    CONCAT('exit-', movement_item.id) as id,
                    movement_note.id as note_id,
                    movement_note.created_at as movement_date,
                    'Salida' as movement_type,
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
                    COALESCE(movement_item.batch_code, '') as batch_code,
                    COALESCE(movement_item.location, '') as location,
                    COALESCE(movement_item.destination_location, '') as destination_location,
                    0 as quantity_in,
                    movement_item.quantity as quantity_out,
                    movement_item.total as total
                ");

            $businessId = trim((string)($request->business_id ?? ''));
            $branchId = trim((string)($request->business_branch_id ?? ''));
            $laboratoryId = trim((string)($request->laboratory_id ?? ''));
            $articleId = trim((string)($request->article_id ?? ''));

            if ($businessId !== '') {
                $entryMovements->where('movement_note.business_id', $businessId);
                $exitMovements->where('movement_note.business_id', $businessId);
            }
            if ($branchId !== '') {
                $entryMovements->where('movement_note.business_branch_id', $branchId);
                $exitMovements->where('movement_note.business_branch_id', $branchId);
            }
            if ($laboratoryId !== '') {
                $entryMovements->where('article.laboratory_id', $laboratoryId);
                $exitMovements->where('article.laboratory_id', $laboratoryId);
            }
            if ($articleId !== '') {
                $entryMovements->where('movement_item.article_id', $articleId);
                $exitMovements->where('movement_item.article_id', $articleId);
            }

            $union = $entryMovements->unionAll($exitMovements);
            $instance = DB::query()->fromSub($union, 'kardex');

            if ($request->filter) {
                $instance->where(function ($query) use ($request) {
                    dxDataGrid::filter($query, $request->filter ?? [], false, null);
                });
            }

            $sortMap = [
                'movement_date' => 'movement_date',
                'movement_type' => 'movement_type',
                'business_name' => 'business_name',
                'branch_name' => 'branch_name',
                'article_code' => 'article_code',
                'article_name' => 'article_name',
                'laboratory_name' => 'laboratory_name',
                'warehouse_name' => 'warehouse_name',
                'batch_code' => 'batch_code',
                'quantity_in' => 'quantity_in',
                'quantity_out' => 'quantity_out',
                'total' => 'total',
            ];

            if ($request->sort) {
                foreach ($request->sort as $sorting) {
                    $selector = $sorting['selector'] ?? '';
                    if (!isset($sortMap[$selector])) continue;
                    $instance->orderBy($sortMap[$selector], ($sorting['desc'] ?? false) ? 'DESC' : 'ASC');
                }
            } else {
                $instance->orderBy('movement_date', 'DESC')->orderBy('id', 'DESC');
            }

            $totalCount = 0;
            if ($request->requireTotalCount) {
                $totalCount = (clone $instance)->count();
            }

            $jpas = $request->isLoadingAll
                ? $instance->get()
                : $instance->skip($request->skip ?? 0)->take($request->take ?? 25)->get();

            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = $jpas;
            $response->totalCount = $totalCount;
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage() . ' Ln.' . $th->getLine();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }
}
