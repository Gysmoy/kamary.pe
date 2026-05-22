<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use Illuminate\Http\Request;

class PickingController extends BasicController
{
    public $reactView = 'Admin/Picking';

    public function setReactViewProperties(Request $request)
    {
        return ['requiredPermission' => 'dispatch'];
    }
}
