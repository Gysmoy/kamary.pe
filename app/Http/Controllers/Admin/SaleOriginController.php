<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Http\Controllers\Controller;
use App\Models\SaleOrigin;
use Illuminate\Http\Request;

class SaleOriginController extends BasicController
{
    public $model = SaleOrigin::class;
    public $reactView = 'Admin/SaleOrigins';
}
