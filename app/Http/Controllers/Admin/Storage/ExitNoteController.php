<?php

namespace App\Http\Controllers\Admin\Storage;

use App\Http\Controllers\Admin\ExitNoteController as BaseExitNoteController;
use Illuminate\Http\Request;

class ExitNoteController extends BaseExitNoteController
{
    public function setReactViewProperties(Request $request)
    {
        return [
            'moduleTitle' => 'Serv. Almacenamiento - Nota de salida',
            'requiredPermission' => 'storage-exit-note',
        ];
    }
}
