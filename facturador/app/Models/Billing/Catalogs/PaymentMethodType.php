<?php

namespace App\Models\Billing\Catalogs;

use App\Support\Database\UsesTenantConnection;

class PaymentMethodType extends ModelCatalog
{
    use UsesTenantConnection;

    protected $table = "cat_payment_method_types";
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'id',
        'active',
        'description',
    ];
}

