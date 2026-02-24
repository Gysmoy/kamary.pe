<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Http\Controllers\Controller;
use App\Models\Supply;
use Illuminate\Http\Request;

class SupplyController extends BasicController
{
    public $model = Supply::class;
    public $reactView = 'Admin/Supplies';
}
