<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Http\Controllers\Controller;
use App\Models\Language;
use Illuminate\Http\Request;

class LanguageController extends BasicController
{
    public $model = Language::class;
    public $reactView = 'Admin/Languages';
}
