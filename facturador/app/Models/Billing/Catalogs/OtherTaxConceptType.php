<?php

namespace App\Models\Billing\Catalogs;

use App\Support\Database\UsesTenantConnection;

class OtherTaxConceptType extends ModelCatalog
{
    use UsesTenantConnection;

    protected $table = "cat_other_tax_concept_types";
    public $incrementing = false;
}

