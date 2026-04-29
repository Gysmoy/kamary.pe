<?php

namespace App\Models\Billing\Catalogs;

use App\Support\Database\UsesTenantConnection;

class RelatedDocumentType extends ModelCatalog
{
    use UsesTenantConnection;

    protected $table = "cat_related_documents_types";
    public $incrementing = false;
}

