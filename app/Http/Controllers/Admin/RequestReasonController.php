<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\RequestReason;
use Illuminate\Http\Request;

class RequestReasonController extends BasicController
{
    public $model = RequestReason::class;

    // Devuelve el motivo creado/actualizado para que el alta inline (boton +)
    // pueda seleccionarlo automaticamente en el formulario de pedido muestra.
    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        return $jpa;
    }
}
