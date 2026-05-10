<?php

namespace App\Http\Controllers\Admin\Magistrales;

use App\Http\Controllers\Admin\LaboratoryController as BaseLaboratoryController;
use Illuminate\Http\Request;

class LaboratoryController extends BaseLaboratoryController
{
    public function setReactViewProperties(Request $request)
    {
        return [
            'moduleTitle' => 'Magistrales - Laboratorio',
            'requiredPermission' => 'magistrales-laboratory',
        ];
    }
}
