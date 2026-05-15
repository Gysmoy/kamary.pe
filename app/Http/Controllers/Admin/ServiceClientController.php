<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Http\Request;

class ServiceClientController extends ClientController
{
    protected function clientModuleScope(): ?string
    {
        return 'services';
    }

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
            'module_scope' => 'services',
            'has_storage_service' => false,
        ]);

        return parent::beforeSave($request);
    }
}
