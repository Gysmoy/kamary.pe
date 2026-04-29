<?php

namespace App\Models\Billing\Catalogs;

use App\Support\Database\UsesTenantConnection;

class Country extends ModelCatalog
{
    use UsesTenantConnection;

    public $incrementing = false;
    public $timestamps = false;
}

