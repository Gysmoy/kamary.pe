<?php

namespace App\Http\Controllers\Admin\Storage;

use App\Http\Controllers\Admin\EntryNoteController as BaseEntryNoteController;
use Illuminate\Http\Request;

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
