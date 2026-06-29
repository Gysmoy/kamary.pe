<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\SalesSubchannel;
use Illuminate\Http\Request;

class SalesSubchannelController extends BasicController
{
    public $model = SalesSubchannel::class;

    // Devuelve el sub canal creado/actualizado para seleccionarlo en el formulario de pedido muestra.
    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        return $jpa;
    }
}
