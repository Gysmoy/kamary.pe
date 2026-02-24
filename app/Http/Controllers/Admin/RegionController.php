<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Http\Controllers\Controller;
use App\Models\Region;
use Illuminate\Http\Request;

class RegionController extends BasicController
{
    public $model = Region::class;
    public $reactView = 'Admin/Regions';

    public function setPaginationInstance(string $model)
    {
        return $model::withCount(['pokemons']);
    }
}
