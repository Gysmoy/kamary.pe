<?php

namespace App\Http\Controllers\Admin\Storage;

use App\Http\Controllers\Admin\ServiceOrderController as BaseServiceOrderController;
use Illuminate\Http\Request;

class GeneralServiceOrderController extends BaseServiceOrderController
{
    public function setReactViewProperties(Request $request)
    {
        return [
            'moduleTitle' => 'Serv. Almacenamiento - O. Servicio General',
            'requiredPermission' => 'storage-general-service-orders',
            'serviceOrderType' => $this->orderType(),
        ];
    }

    protected function orderType(): string
    {
        return 'storage_general';
    }

    protected function codePrefix(): string
    {
        return 'OSG';
    }
}
