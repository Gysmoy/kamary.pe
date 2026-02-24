<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Http\Controllers\Controller;
use App\Models\SaleStatus;
use Illuminate\Http\Request;
use SoDe\Extend\Response;

class SaleStatusController extends BasicController
{
    public $model = SaleStatus::class;

    public function bySale(Request $request, string $saleId)
    {
        $response = Response::simpleTryCatch(function () use ($saleId) {
            $statuses = SaleStatus::with(['status', 'user'])
                ->where('sale_id', $saleId)
                ->orderBy('created_at', 'DESC')
                ->get();
            return $statuses;
        });
        return response($response->toArray(), $response->status);
    }
}
