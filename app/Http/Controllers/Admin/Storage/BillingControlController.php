<?php

namespace App\Http\Controllers\Admin\Storage;

use App\Http\Controllers\Admin\BillingDocumentController as BaseBillingDocumentController;
use Illuminate\Http\Request;

class BillingControlController extends BaseBillingDocumentController
{
    public function setReactViewProperties(Request $request)
    {
        return [
            'moduleTitle' => 'Serv. Almacenamiento - Control de Facturacion',
            'requiredPermission' => 'storage-billing-control',
        ];
    }
}
