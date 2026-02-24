<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Http\Controllers\Controller;
use App\Models\Serie;
use Illuminate\Http\Request;

class SerieController extends BasicController
{
    public $model = Serie::class;
    public $reactView = 'Admin/Series';

    public function setPaginationInstance(string $model)
    {
        return $model::with(['language'])->withCount(['expansions']);
    }
}
