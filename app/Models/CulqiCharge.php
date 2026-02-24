<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CulqiCharge extends Model
{
    use HasFactory;

    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'culqi_id',
        'amount',
        'sale_id',
        'culqi_subscription_id'
    ];

    public function culqiSubscription()
    {
        return $this->hasOne(CulqiSubscription::class, 'culqi_subscription_id', 'id');
    }
}
