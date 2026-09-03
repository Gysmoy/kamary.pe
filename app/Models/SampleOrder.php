<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SampleOrder extends Model
{
    use HasFactory;

    protected $table = 'sample_orders';

    protected $fillable = [
        'order_number',
        'order_status',
        'email_status',
        'referral_guide',
        'total_gross_weight',
        'channel',
        'document_type',
        'document_number',
        'client_name',
        'client_id',
        'supervisor_id',
        'request_reason',
        'request_reason_id',
        'sales_channel',
        'sales_subchannel',
        'sales_channel_id',
        'sales_subchannel_id',
        'business_line',
        'business_subline',
        'giro_id',
        'sub_giro_id',
        'ubigeo',
        'delivery_address',
        'delivery_reference',
        'service_type',
        'service_type_id',
        'contact_document',
        'contact_name',
        'contact_phone',
        'map_lat',
        'map_lng',
        'order_complete',
        'requested_at',
        'approved_at',
        'delivered_at',
        'delay_reason',
        'delay_reason_notes',
        'supervisor_name',
        'cancellation_reason',
        'observations',
        'evidence_url',
        'evidence_notes',
        'items',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'total_gross_weight' => 'float',
        'map_lat' => 'float',
        'map_lng' => 'float',
        'order_complete' => 'boolean',
        'requested_at' => 'date',
        'approved_at' => 'datetime',
        'delivered_at' => 'date',
        'items' => 'array',
        'status' => 'boolean',
    ];

    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
    public function updater() { return $this->belongsTo(User::class, 'updated_by'); }
}
