<?php

namespace App\Models\Billing;

class DispatchItem extends ModelTenant
{
    public $timestamps = false;

    protected $fillable = [
        'dispatch_id',
        'item_id',
        'item',
        'quantity',
        'name_product_pdf',
    ];

    public function getItemAttribute($value)
    {
        return is_null($value) ? null : (object) json_decode($value);
    }

    public function setItemAttribute($value)
    {
        $this->attributes['item'] = is_null($value) ? null : json_encode($value);
    }

    public function dispatch()
    {
        return $this->belongsTo(Dispatch::class);
    }
}
