<?php

namespace App\Models\Billing;

use App\Support\Database\UsesTenantConnection;
use Illuminate\Database\Eloquent\Model;

class SaleNote extends Model
{
    use UsesTenantConnection;

    protected $table = 'sale_notes';

    protected $casts = [
        'customer' => 'array',
    ];

    protected $appends = [
        'number_full',
    ];

    public function getNumberFullAttribute()
    {
        $series = $this->attributes['series'] ?? null;
        $number = $this->attributes['number'] ?? null;

        if (!empty($series) && !empty($number)) {
            return "{$series}-{$number}";
        }

        $prefix = $this->attributes['prefix'] ?? 'NV';

        return "{$prefix}-{$this->id}";
    }

    public function getCollectionData(): array
    {
        $customer = $this->customer;

        return [
            'id' => $this->id,
            'external_id' => $this->external_id,
            'number_full' => $this->number_full,
            'customer_name' => is_array($customer) ? ($customer['name'] ?? null) : null,
            'total' => (float) ($this->total ?? 0),
            'state_type_id' => $this->state_type_id,
        ];
    }
}

