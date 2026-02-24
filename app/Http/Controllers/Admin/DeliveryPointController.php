<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Http\Controllers\Controller;
use App\Models\DeliveryPoint;
use App\Models\User;
use Illuminate\Http\Request;

class DeliveryPointController extends BasicController
{
    public $model = DeliveryPoint::class;
    public $reactView = 'Admin/DeliveryPoints';

    public function setPaginationInstance(string $model)
    {
        return $model::with(['seller']);
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();

        if ($request->seller) {
            $userJpa = User::where('uuid', $request->seller)->first();
            $body['seller_id'] = $userJpa->id;
        }

        return $body;
    }
}
