<?php

namespace App\Http\Controllers\Admin\Storage;

use App\Http\Controllers\Admin\ServiceOrderController as BaseServiceOrderController;
use Illuminate\Http\Request;

class ServiceOrderController extends BaseServiceOrderController
{
    public function setReactViewProperties(Request $request)
    {
        return [
            'moduleTitle' => 'Serv. Almacenamiento - O. Servicio',
            'requiredPermission' => 'storage-service-orders',
            'serviceOrderType' => $this->orderType(),
        ];
    }

    protected function orderType(): string
    {
        return 'storage_service';
    }
}
