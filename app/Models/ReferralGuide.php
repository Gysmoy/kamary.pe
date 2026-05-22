<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReferralGuide extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'business_id',
        'business_branch_id',
        'warehouse_id',
        'dispatch_id',
        'commercial_order_id',
        'billing_document_id',
        'driver_id',
        'vehicle_id',
        'document_type',
        'series',
        'sequence',
        'external_reference',
        'issue_date',
        'transfer_date',
        'guide_status',
        'external_status',
        'external_id',
        'provider',
        'provider_endpoint',
        'origin_ubigeo',
        'origin_address',
        'destination_ubigeo',
        'destination_address',
        'recipient_name',
        'recipient_document_type',
        'recipient_document_number',
        'recipient_phone',
        'driver_name',
        'driver_document_type',
        'driver_document_number',
        'driver_license_number',
        'vehicle_plate',
        'transfer_mode',
        'transfer_reason',
        'package_count',
        'gross_weight',
        'request_payload',
        'response_payload',
        'error_message',
        'metadata',
        'observations',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'transfer_date' => 'date',
        'package_count' => 'integer',
        'gross_weight' => 'float',
        'metadata' => 'array',
        'status' => 'boolean',
    ];

    public function business() { return $this->belongsTo(Business::class); }
    public function branch() { return $this->belongsTo(BusinessBranch::class, 'business_branch_id'); }
    public function warehouse() { return $this->belongsTo(Warehouse::class); }
    public function dispatch() { return $this->belongsTo(Dispatch::class); }
    public function commercialOrder() { return $this->belongsTo(CommercialOrder::class); }
    public function billingDocument() { return $this->belongsTo(BillingDocument::class); }
    public function driver() { return $this->belongsTo(Driver::class); }
    public function vehicle() { return $this->belongsTo(Vehicle::class); }
    public function items() { return $this->hasMany(ReferralGuideItem::class)->orderBy('id'); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
    public function updater() { return $this->belongsTo(User::class, 'updated_by'); }
}
