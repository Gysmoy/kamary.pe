<?php

namespace App\Http\Controllers\Admin;

use App\Http\Classes\dxResponse;
use App\Http\Controllers\BasicController;
use App\Models\Breakdown;
use App\Models\Color;
use App\Models\Formula;
use App\Models\Item;
use App\Models\Sale;
use App\Models\SaleDetail;
use App\Models\Transaction;
use App\Models\UserFormula;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use SoDe\Extend\Fetch;
use SoDe\Extend\Response;

class HomeController extends BasicController
{
    public $reactView = 'Admin/Home';
    public $reactRootView = 'admin';
}
