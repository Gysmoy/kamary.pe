<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CommercialOrderTrackingEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'commercial_order_id',
        'dispatch_id',
        'referral_guide_id',
        'event_type',
        'event_status',
        'title',
        'description',
        'happened_at',
        'metadata',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'happened_at' => 'datetime',
        'metadata' => 'array',
        'status' => 'boolean',
    ];

    public function commercialOrder()
    {
        return $this->belongsTo(CommercialOrder::class);
    }

    public function dispatch()
    {
        return $this->belongsTo(Dispatch::class);
    }

    public function referralGuide()
    {
        return $this->belongsTo(ReferralGuide::class);
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
