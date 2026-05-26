<?php

namespace App\Http\Controllers\Admin\Magistrales;

use App\Http\Controllers\Admin\AccountsPayableController as BaseAccountsPayableController;
use Illuminate\Http\Request;

class AccountsPayableController extends BaseAccountsPayableController
{
    protected string $moduleScope = 'magistrales';

    public function setReactViewProperties(Request $request)
    {
        return [
            'moduleScope' => 'magistrales',
            'moduleTitle' => 'Magistrales - Cuentas por pagar',
            'requiredPermission' => ['magistrales-procurement'],
        ];
    }
}
