<?php

namespace App\Models\Billing\Catalogs;

use App\Support\Database\UsesTenantConnection;

class SummaryStatusType extends ModelCatalog
{
    use UsesTenantConnection;

    protected $table = "cat_summary_status_types";
    public $incrementing = false;
}

