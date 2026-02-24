<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Http\Controllers\Controller;
use App\Models\Fragrance;
use Illuminate\Http\Request;

class FragranceController extends BasicController
{
    public $model = Fragrance::class;
    public $reactView = 'Admin/Fragrance';
    public $imageFields = ['image', 'note'];
}
