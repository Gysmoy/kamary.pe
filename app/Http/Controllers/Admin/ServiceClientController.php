<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Http\Request;

class ServiceClientController extends ClientController
{
    public function setReactViewProperties(Request $request)
    {
        return array_merge(parent::setReactViewProperties($request), [
            'sectionTitle' => 'Clientes',
            'requiredPermission' => 'services-client',
            'defaultClientKind' => 'regular',
            'initialQuickFilter' => 'regular',
            'serviceContext' => true,
        ]);
    }

    public function beforeSave(Request $request)
    {
        $request->merge([
            'client_kind' => 'regular',
        ]);

        return parent::beforeSave($request);
    }
}
