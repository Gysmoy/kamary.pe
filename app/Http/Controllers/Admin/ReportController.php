<?php

namespace App\Http\Controllers\Admin;

use App\Http\Classes\dxResponse;
use App\Http\Controllers\BasicController;
use App\Models\dxDataGrid;
use Illuminate\Database\Eloquent\Builder as EloquentBuilder;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\DB;
use SoDe\Extend\Response;

class ReportController extends BasicController
{
    public function paginate(Request $request): HttpResponse|ResponseFactory
    {
        $response = new dxResponse();
        try {
            $instance = $this->setPaginationInstance($this->model);

            if ($request->filter) {
                $instance->where(function ($query) use ($request) {
                    dxDataGrid::filter($query, $request->filter ?? [], false, null);
                });
            }

            if ($request->sort != null) {
                foreach ($request->sort as $sorting) {
                    $selector = $sorting['selector'] ?? null;
                    if (!$selector) continue;
                    $instance->orderBy($selector, ($sorting['desc'] ?? false) ? 'DESC' : 'ASC');
                }
            } else {
                $instance->orderByDesc('id');
            }

            $totalCount = 0;
            if ($request->requireTotalCount) {
                $instance4count = clone $instance;
                $this->clearReportPagination($instance4count);
                $totalCount = DB::query()->fromSub($instance4count, 'report_count')->count();
            }

            $jpas = $request->isLoadingAll
                ? $instance->get()
                : $instance->skip($request->skip ?? 0)->take($request->take ?? 10)->get();

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

    private function clearReportPagination(EloquentBuilder|QueryBuilder $query): void
    {
        $baseQuery = $query instanceof EloquentBuilder ? $query->getQuery() : $query;

        $baseQuery->orders = null;
        $baseQuery->unionOrders = null;
        $baseQuery->limit = null;
        $baseQuery->offset = null;
    }
}
