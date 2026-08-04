<?php

namespace App\Http\Controllers\Admin\Storage;

use App\Http\Controllers\Admin\EntryNoteController as BaseEntryNoteController;
use Illuminate\Http\Request;

// La carga masiva de stock (import) vive en la clase base: sirve igual para almacenamiento
// (donde la mercaderia es de un cliente) y para Kamary Peru (donde es propia).
class EntryNoteController extends BaseEntryNoteController
{
    public function setReactViewProperties(Request $request)
    {
        return [
            'moduleTitle' => 'Serv. Almacenamiento - Nota de entrada',
            'requiredPermission' => 'storage-entry-note',
        ];
    }
}
