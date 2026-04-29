<?php

namespace App\Models\Billing\Catalogs;

use App\Support\Database\UsesTenantConnection;

class NoteDebitType extends ModelCatalog
{
    use UsesTenantConnection;
    
    protected $table = "cat_note_debit_types";
    public $incrementing = false;
}

