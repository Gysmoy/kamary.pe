<?php

namespace App\Http\Controllers\Admin\Storage;

use App\Http\Controllers\Admin\InventoryController as BaseInventoryController;
use Illuminate\Http\Request;

class InventoryController extends BaseInventoryController
{
    public function setReactViewProperties(Request $request)
    {
        return [
            'moduleTitle' => 'Serv. Almacenamiento - Inventario',
            'requiredPermission' => 'storage-inventory',
        ];
    }
}
