<?php

namespace App\Http\Controllers\Admin\Magistrales;

use App\Http\Controllers\Admin\UnitController as BaseUnitController;
use Illuminate\Http\Request;

class UnitController extends BaseUnitController
{
    protected string $moduleScope = 'magistrales';

    public function setReactViewProperties(Request $request)
    {
        return [
            'moduleScope' => 'magistrales',
            'moduleTitle' => 'Magistrales - Unidad',
            'requiredPermission' => ['magistrales-unit', 'magistrales-products'],
        ];
    }
}
