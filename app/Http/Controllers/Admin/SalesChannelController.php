<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\SalesChannel;
use Illuminate\Http\Request;

class SalesChannelController extends BasicController
{
    public $model = SalesChannel::class;

    // Devuelve el canal creado/actualizado para seleccionarlo en el formulario de pedido muestra.
    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        return $jpa;
    }
}
