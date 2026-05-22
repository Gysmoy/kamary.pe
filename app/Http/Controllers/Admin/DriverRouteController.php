<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use Illuminate\Http\Request;

class DriverRouteController extends BasicController
{
    public $reactView = 'Admin/DriverRoutes';

    public function setReactViewProperties(Request $request)
    {
        return ['requiredPermission' => 'dispatch'];
    }
}
