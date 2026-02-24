<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;

class PaymentMethodController extends BasicController
{
    public $model = PaymentMethod::class;
    public $reactView = 'Admin/PaymentMethods';
}
