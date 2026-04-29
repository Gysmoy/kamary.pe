<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\Vehicle;
use Illuminate\Http\Request;

class VehicleZoneController extends BasicController
{
    public $model = Vehicle::class;
    public $reactView = 'Admin/VehicleZones';

    public function setReactViewProperties(Request $request)
    {
        return ['requiredPermission' => 'vehicle-zone'];
    }
}
