<?php

namespace App\Models\Billing\Catalogs;

use App\Support\Database\UsesTenantConnection;

class RelatedTaxDocumentType extends ModelCatalog
{
    use UsesTenantConnection;

    protected $table = "cat_related_tax_document_types";
    public $incrementing = false;
}

