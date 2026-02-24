<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Http\Controllers\Controller;
use App\Models\Coupon;
use Illuminate\Http\Request;

class CouponController extends BasicController
{
    public $model  = Coupon::class;
    public $reactView = 'Admin/Coupons';
    public $softDeletion = false;
}
