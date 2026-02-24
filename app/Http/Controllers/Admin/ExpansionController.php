<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\Expansion;

class ExpansionController extends BasicController
{
    public $model = Expansion::class;
    public $reactView = 'Admin/Expansions';
    public $prefix4filter = 'expansions';

    public function setPaginationInstance(string $model)
    {
        return $model::with(['serie.language'])
        ->select('expansions.*')
        ->join('series as serie', 'expansions.serie_id', '=', 'serie.id')
        ->join('languages as language', 'serie.language_id', '=', 'language.id');
    }
}
