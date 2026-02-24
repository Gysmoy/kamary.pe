<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Http\Controllers\Controller;
use App\Models\Card;
use Illuminate\Http\Request;

class CardController extends BasicController
{
    public $model = Card::class;
    public $reactView = 'Admin/Cards';

    public function setPaginationInstance(string $model)
    {
        return $model::query()
            ->with(['language', 'expansion.serie', 'pokemon'])
            ->withCount(['items']);
    }
}
