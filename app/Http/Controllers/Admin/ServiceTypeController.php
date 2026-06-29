<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\ServiceType;
use Illuminate\Http\Request;

class ServiceTypeController extends BasicController
{
    public $model = ServiceType::class;

    // Devuelve el tipo de servicio creado/actualizado para seleccionarlo en el formulario de pedido muestra.
    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        return $jpa;
    }
}
