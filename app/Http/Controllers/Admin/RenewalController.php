<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Http\Controllers\Controller;
use App\Models\Renewal;
use Illuminate\Http\Request;

class RenewalController extends BasicController
{
    public $model = Renewal::class;
    public $reactView = 'Admin/Renewals';
}
