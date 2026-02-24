<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'customer_id',
        'seller_id',
        'document_type',
        'document_number',
        'name',
        'lastname',
        'fullname',
        'phone_prefix',
        'phone',
        'email',
        'date',
        'delivery_point_id',
        'delivery_point_name',
        'delivery_point_department',
        'delivery_point_province',
        'delivery_point_district',
        'delivery_point_address',
        'delivery_point_number',
        'delivery_point_reference',
        'billing',
        'receipt',
        'status_id',
        'total_amount',
        'reject_reason',
        'ready_for_pickup_at',
        'paid_to_seller'
    ];

    protected $casts = [
        'paid_to_seller' => 'boolean'
    ];

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function deliveryPoint()
    {
        return $this->belongsTo(DeliveryPoint::class, 'delivery_point_id');
    }

    public function status()
    {
        return $this->belongsTo(Status::class, 'status_id');
    }

    public function details()
    {
        return $this->hasMany(SaleDetail::class);
    }
}
