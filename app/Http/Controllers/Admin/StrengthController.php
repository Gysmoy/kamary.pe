<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\Strength;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class StrengthController extends BasicController
{
    public $model = Strength::class;
    public $reactView = 'Admin/Strength';
}
