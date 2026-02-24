<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Http\Controllers\SaleController as PublicSaleController;
use App\Jobs\SendSaleEmail;
use App\Models\Bundle;
use App\Models\Formula;
use App\Models\Fragrance;
use App\Models\General;
use App\Models\Item;
use App\Models\Sale;
use App\Models\SaleOrigin;
use App\Models\SaleUpsell;
use App\Models\Status;
use App\Models\UserFormula;
use Illuminate\Http\Request;
use SoDe\Extend\File;
use SoDe\Extend\JSON;
use SoDe\Extend\Response;
use Exception;
use Illuminate\Support\Facades\DB;

class SaleController extends BasicController
{
    public $model = Sale::class;
    public $reactView = 'Admin/Sales';
    public $prefix4filter = 'sales';

    public function setPaginationInstance(string $model)
    {
        $model::where('ready_for_pickup_at', '<=', now()->subDays(3))
            ->where('status_id', 'f47ac30d-58cc-11ef-8f8e-0242ac120002')
            ->update([
                'status_id' => 'f47ac40e-58cc-11ef-8f8e-0242ac120002'
            ]);
        return $model::select(['sales.*'])
            ->leftJoin('users as seller', 'sales.seller_id', 'seller.id')
            ->leftJoin('users as customer', 'sales.customer_id', 'customer.id')
            ->with(['details.card', 'status', 'seller', 'customer'])
            ->withCount(['details']);
    }

    public function delete(Request $request, string $id)
    {
        $response = Response::simpleTryCatch(function () use ($request, $id) {
            $deleted =  $this->model::where('id', $id)
                ->update(['status_id' => 'f47ac611-58cc-11ef-8f8e-0242ac120002']);

            if (!$deleted) throw new Exception('No se ha eliminado ningun registro');
        });
        return response($response->toArray(), $response->status);
    }
}
