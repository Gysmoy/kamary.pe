<?php

namespace App\Models\Billing\Catalogs;

use App\Support\Database\UsesTenantConnection;

class DetractionType extends ModelCatalog
{
    use UsesTenantConnection;

    protected $table = "cat_detraction_types";
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'id',
        'active',
        'percentage',
        'operation_type_id',
        'description',
    ];

}

