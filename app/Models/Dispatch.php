<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Dispatch extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'business_id',
        'business_branch_id',
        'warehouse_id',
        'scheduled_date',
        'shift',
        'driver_id',
        'driver_name',
        'copilot_name',
        'vehicle_id',
        'vehicle_label',
        'vehicle_plate',
        'zone_id',
        'zone',
        'manifest_code',
        'dispatch_status',
        'departed_at',
        'delivered_at',
        'exit_note_id',
        'observations',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'scheduled_date' => 'date',
        'departed_at' => 'datetime',
        'delivered_at' => 'datetime',
        'status' => 'boolean',
    ];

    public function business() { return $this->belongsTo(Business::class); }
    public function branch() { return $this->belongsTo(BusinessBranch::class, 'business_branch_id'); }
    public function warehouse() { return $this->belongsTo(Warehouse::class); }
    public function driver() { return $this->belongsTo(Driver::class); }
    public function vehicle() { return $this->belongsTo(Vehicle::class); }
    public function zoneMaster() { return $this->belongsTo(Zone::class, 'zone_id'); }
    public function exitNote() { return $this->belongsTo(ExitNote::class); }
    public function assignments() { return $this->hasMany(DispatchAssignment::class)->orderBy('id'); }
    public function referralGuides() { return $this->hasMany(ReferralGuide::class)->orderByDesc('id'); }
    public function deliveryEvidences() { return $this->hasMany(DeliveryEvidence::class)->orderByDesc('delivered_at')->orderByDesc('id'); }
    public function trackingEvents() { return $this->hasMany(CommercialOrderTrackingEvent::class)->orderBy('happened_at')->orderBy('id'); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
    public function updater() { return $this->belongsTo(User::class, 'updated_by'); }
}
