<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Http\Controllers\Controller;
use App\Models\Status;
use Illuminate\Http\Request;

class StatusController extends BasicController
{
    public $model = Status::class;
    public $reactView = 'Admin/Statuses';
}
