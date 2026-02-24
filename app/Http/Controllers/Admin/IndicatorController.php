<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\Indicator;
use Illuminate\Http\Request;

class IndicatorController extends BasicController
{
    public $model = Indicator::class;
    public $reactView = 'Admin/Indicators';

    public function setReactViewProperties(Request $request)
    {
        return [];
    }
}
