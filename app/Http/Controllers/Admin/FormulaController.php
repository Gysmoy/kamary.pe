<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Http\Controllers\Controller;
use App\Models\Formula;
use App\Models\FormulaHasSupply;
use Illuminate\Http\Request;

class FormulaController extends BasicController
{
    public $model = Formula::class;
    public $reactView = 'Admin/Formula';


    public function setPaginationInstance(string $model)
    {
        return $model::with('supplies');
    }

    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        FormulaHasSupply::where('formula_id', $jpa->id)->delete();
        foreach ($request->supplies as $supplyId) {
            FormulaHasSupply::create([
                'formula_id' => $jpa->id,
                'supply_id' => $supplyId,
            ]);
        }
    }
}
