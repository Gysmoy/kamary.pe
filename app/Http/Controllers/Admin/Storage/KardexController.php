<?php

namespace App\Http\Controllers\Admin\Storage;

use App\Http\Controllers\Admin\KardexController as BaseKardexController;
use Illuminate\Http\Request;

class KardexController extends BaseKardexController
{
    public function setReactViewProperties(Request $request)
    {
        return [
            'moduleTitle' => 'Serv. Almacenamiento - Kardex',
            'requiredPermission' => 'storage-kardex',
        ];
    }
}
