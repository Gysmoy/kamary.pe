<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Activity extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'business_id',
        'business_branch_id',
        'warehouse_id',
        'commercial_order_id',
        'dispatch_id',
        'client_id',
        'eventual_client_id',
        'driver_id',
        'vehicle_id',
        'zone_id',
        'activity_type',
        'activity_status',
        'transfer_date',
        'customer_name',
        'document_number',
        'manifest_code',
        'origin_address',
        'destination_address',
        'destination_reference',
        'dispatch_contact_name',
        'dispatch_contact_phone',
        'ubigeo',
        'map_lat',
        'map_lng',
        'package_count',
        'gross_weight',
        'observations',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'transfer_date' => 'date',
        'map_lat' => 'float',
        'map_lng' => 'float',
        'package_count' => 'integer',
        'gross_weight' => 'float',
        'status' => 'boolean',
    ];

    public function business() { return $this->belongsTo(Business::class); }
    public function branch() { return $this->belongsTo(BusinessBranch::class, 'business_branch_id'); }
    public function warehouse() { return $this->belongsTo(Warehouse::class); }
    public function commercialOrder() { return $this->belongsTo(CommercialOrder::class); }
    public function dispatch() { return $this->belongsTo(Dispatch::class); }
    public function client() { return $this->belongsTo(Client::class); }
    public function eventualClient() { return $this->belongsTo(EventualClient::class); }
    public function driver() { return $this->belongsTo(Driver::class); }
    public function vehicle() { return $this->belongsTo(Vehicle::class); }
    public function zone() { return $this->belongsTo(Zone::class); }
    public function items() { return $this->hasMany(ActivityItem::class)->orderBy('id'); }
    public function logs() { return $this->hasMany(ActivityLog::class)->orderByDesc('id'); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
    public function updater() { return $this->belongsTo(User::class, 'updated_by'); }
}
