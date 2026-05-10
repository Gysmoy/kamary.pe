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
        'order_complete',
        'requested_at',
        'delivered_at',
        'supervisor_name',
        'cancellation_reason',
        'observations',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'total_gross_weight' => 'float',
        'order_complete' => 'boolean',
        'requested_at' => 'date',
        'delivered_at' => 'date',
        'status' => 'boolean',
    ];

    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
    public function updater() { return $this->belongsTo(User::class, 'updated_by'); }
}
