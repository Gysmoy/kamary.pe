<?php

namespace App\Http\Controllers\Admin\Magistrales;

use App\Http\Controllers\Admin\SupplierController as BaseSupplierController;
use Illuminate\Http\Request;

class SupplierController extends BaseSupplierController
{
    protected string $moduleScope = 'magistrales';

    public function setReactViewProperties(Request $request)
    {
        return [
            'moduleScope' => 'magistrales',
            'moduleTitle' => 'Magistrales - Proveedor',
            'requiredPermission' => ['magistrales-supplier', 'magistrales-procurement'],
        ];
    }
}
