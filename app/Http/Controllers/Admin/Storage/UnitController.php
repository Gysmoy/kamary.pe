<?php

namespace App\Http\Controllers\Admin\Storage;

use App\Http\Controllers\Admin\UnitController as BaseUnitController;
use Illuminate\Http\Request;

class UnitController extends BaseUnitController
{
    protected string $moduleScope = 'storage';

    public function setReactViewProperties(Request $request)
    {
        return [
            'moduleTitle' => 'Serv. Almacenamiento - Und. de medida',
            'requiredPermission' => 'storage-units',
        ];
    }
}
