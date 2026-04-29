<?php

namespace App\Models\Billing\Catalogs;

use App\Support\Database\UsesTenantConnection;

class AddressType extends ModelCatalog
{
    use UsesTenantConnection;

    protected $table = 'cat_address_types';

    public $incrementing = false;
    public $timestamps = false;
}

