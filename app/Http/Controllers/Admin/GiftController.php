<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\Gift;

class GiftController extends BasicController
{
    public $model = Gift::class;
}
