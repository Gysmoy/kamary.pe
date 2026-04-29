<?php

namespace App\Models\Billing\Catalogs;

use App\Support\Database\UsesTenantConnection;

class NoteCreditType extends ModelCatalog
{
    use UsesTenantConnection;
    
    protected $table = "cat_note_credit_types";
    public $incrementing = false;
}

