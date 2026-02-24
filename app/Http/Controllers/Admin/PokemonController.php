<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Http\Controllers\Controller;
use App\Models\Pokemon;
use Illuminate\Http\Request;

class PokemonController extends BasicController
{
    public $model = Pokemon::class;
    public $reactView = 'Admin/Pokemons';

    public function setPaginationInstance(string $model)
    {
        return $model::with(['region']);
    }
}
