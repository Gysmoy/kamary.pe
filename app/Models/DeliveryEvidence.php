<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeliveryEvidence extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'business_id',
        'dispatch_id',
        'commercial_order_id',
        'driver_id',
        'recipient_name',
        'recipient_document_type',
        'recipient_document_number',
        'recipient_phone',
        'evidence_url',
        'evidence_notes',
        'delivered_at',
        'latitude',
        'longitude',
        'metadata',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'delivered_at' => 'datetime',
        'latitude' => 'float',
        'longitude' => 'float',
        'metadata' => 'array',
        'status' => 'boolean',
    ];

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function dispatch()
    {
        return $this->belongsTo(Dispatch::class);
    }

    public function commercialOrder()
    {
        return $this->belongsTo(CommercialOrder::class);
    }

    public function driver()
    {
        return $this->belongsTo(Driver::class);
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
