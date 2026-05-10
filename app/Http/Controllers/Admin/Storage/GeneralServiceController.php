<?php

namespace App\Http\Controllers\Admin\Storage;

use App\Http\Controllers\Admin\ServiceCatalogController as BaseServiceCatalogController;
use Illuminate\Http\Request;

class GeneralServiceController extends BaseServiceCatalogController
{
    public function setReactViewProperties(Request $request)
    {
        return [
            'moduleTitle' => 'Serv. Almacenamiento - Servicio General',
            'requiredPermission' => 'storage-general-service',
        ];
    }
}
