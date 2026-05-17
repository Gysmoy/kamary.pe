<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $appends = [
        'code',
    ];

    protected $fillable = [
        'business_id',
        'business_branch_id',
        'warehouse_id',
        'client_id',
        'document_type',
        'currency',
        'discount_percent',
        'delivery_address',
        'purchase_order',
        'guide_number',
        'dispatch_guide',
        'ubigeo',
        'map_lat',
        'map_lng',
        'subtotal',
        'discount_amount',
        'total',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'discount_percent' => 'float',
        'map_lat' => 'float',
        'map_lng' => 'float',
        'subtotal' => 'float',
        'discount_amount' => 'float',
        'total' => 'float',
        'status' => 'boolean',
    ];

    public function getCodeAttribute(): string
    {
        return 'P' . str_pad((string)$this->id, 6, '0', STR_PAD_LEFT);
    }

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function branch()
    {
        return $this->belongsTo(BusinessBranch::class, 'business_branch_id');
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
