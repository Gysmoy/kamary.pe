<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\Giro;
use Illuminate\Http\Request;

class GiroController extends BasicController
{
    public $model = Giro::class;

    // Devuelve el giro creado/actualizado para que el alta inline (boton +)
    // pueda seleccionarlo automaticamente en el formulario de pedido muestra.
    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        return $jpa;
    }
}
