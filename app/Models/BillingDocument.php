<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BillingDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'code', 'source_type', 'source_id', 'commercial_order_id', 'service_order_id', 'reference_billing_document_id',
        'business_id', 'business_branch_id', 'warehouse_id', 'client_id', 'eventual_client_id',
        'provider', 'document_type', 'series', 'sequence', 'issue_date', 'due_date', 'currency', 'payment_condition', 'payment_method', 'customer_email',
        'local_status', 'external_status', 'external_id', 'external_reference', 'provider_endpoint',
        'provider_mode', 'subtotal', 'tax_amount', 'total', 'request_payload', 'response_payload', 'error_message', 'metadata',
        'sent_at', 'accepted_at', 'cancelled_at', 'observations', 'status', 'created_by', 'updated_by',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'due_date' => 'date',
        'sent_at' => 'datetime',
        'accepted_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'subtotal' => 'float',
        'tax_amount' => 'float',
        'total' => 'float',
        'metadata' => 'array',
        'status' => 'boolean',
    ];

    protected $appends = [
        'fiscal_readiness',
    ];

    public function business() { return $this->belongsTo(Business::class); }
    public function branch() { return $this->belongsTo(BusinessBranch::class, 'business_branch_id'); }
    public function warehouse() { return $this->belongsTo(Warehouse::class); }
    public function client() { return $this->belongsTo(Client::class); }
    public function eventualClient() { return $this->belongsTo(EventualClient::class); }
    public function commercialOrder() { return $this->belongsTo(CommercialOrder::class); }
    public function serviceOrder() { return $this->belongsTo(ServiceOrder::class); }
    public function referenceDocument() { return $this->belongsTo(BillingDocument::class, 'reference_billing_document_id'); }
    public function creditNotes() { return $this->hasMany(BillingDocument::class, 'reference_billing_document_id')->orderBy('id'); }
    public function items() { return $this->hasMany(BillingDocumentItem::class)->orderBy('id'); }
    public function events() { return $this->hasMany(BillingEvent::class)->orderByDesc('id'); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
    public function updater() { return $this->belongsTo(User::class, 'updated_by'); }

    public function getFiscalReadinessAttribute(): array
    {
        return app(\App\Services\BillingDocumentService::class)->buildFiscalReadiness($this);
    }
}
