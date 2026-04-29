<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BillingEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'billing_document_id', 'event_type', 'local_status', 'external_status',
        'request_payload', 'response_payload', 'message', 'status', 'created_by', 'updated_by',
    ];

    protected $casts = [
        'status' => 'boolean',
    ];

    public function document() { return $this->belongsTo(BillingDocument::class, 'billing_document_id'); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
    public function updater() { return $this->belongsTo(User::class, 'updated_by'); }
}
