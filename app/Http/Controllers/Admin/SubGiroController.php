<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\SubGiro;
use Illuminate\Http\Request;

class SubGiroController extends BasicController
{
    public $model = SubGiro::class;

    // Devuelve el sub giro creado/actualizado para que el alta inline (boton +)
    // pueda seleccionarlo automaticamente en el formulario de pedido muestra.
    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        return $jpa;
    }
}
