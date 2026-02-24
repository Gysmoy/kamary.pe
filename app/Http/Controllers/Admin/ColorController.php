<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\Color;

class ColorController extends BasicController
{
    public $model = Color::class;
    public $reactView = 'Admin/Colors';
    public $prefix4filter = 'colors';

    public function setPaginationInstance(string $model)
    {
        return $this->model::select('colors.*')
            ->with('item')
            ->join('items AS item', 'colors.item_id', 'item.id');
    }
}
