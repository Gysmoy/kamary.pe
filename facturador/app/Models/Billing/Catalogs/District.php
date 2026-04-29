<?php

namespace App\Models\Billing\Catalogs;

use App\Support\Database\UsesTenantConnection;

class District extends ModelCatalog
{
    use UsesTenantConnection;

    public $incrementing = false;
    public $timestamps = false;

    static function idByDescription($description, $province_id)
    {
        $district = District::where('description', $description)
                            ->where('province_id', $province_id)
                            ->first();
        if ($district) {
            return $district->id;
        }
        return '150101';
    }

    public function province()
    {
        return $this->belongsTo(Province::class)->with('department');
    }

}

