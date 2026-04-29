<?php

namespace App\Models\Billing\Catalogs;

use App\Support\Database\UsesTenantConnection;

class OperationType extends ModelCatalog
{
    use UsesTenantConnection;

    protected $table = "cat_operation_types";
    public $incrementing = false;
}

