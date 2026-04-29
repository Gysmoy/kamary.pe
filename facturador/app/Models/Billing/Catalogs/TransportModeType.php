<?php

namespace App\Models\Billing\Catalogs;

use App\Support\Database\UsesTenantConnection;

class TransportModeType extends ModelCatalog
{
    use UsesTenantConnection;

    protected $table = "cat_transport_mode_types";
    public $incrementing = false;
}

