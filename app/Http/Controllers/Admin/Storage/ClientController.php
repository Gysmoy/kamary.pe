<?php

namespace App\Http\Controllers\Admin\Storage;

use App\Http\Controllers\Admin\ClientController as BaseClientController;
use Illuminate\Http\Request;

class ClientController extends BaseClientController
{
    public function setReactViewProperties(Request $request)
    {
        return array_merge(parent::setReactViewProperties($request), [
            'sectionTitle' => 'Clientes de almacenamiento',
            'requiredPermission' => 'storage-clients',
            'defaultClientKind' => 'regular',
            'initialQuickFilter' => 'all',
            'storageContext' => true,
        ]);
    }

    public function beforeSave(Request $request)
    {
        $request->merge([
            'client_kind' => 'regular',
            'has_storage_service' => true,
        ]);

        return parent::beforeSave($request);
    }
}
