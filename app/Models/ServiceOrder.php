<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServiceOrder extends Model
{
    use HasFactory;

    protected $table = 'service_orders';

    protected $fillable = [
        'code', 'order_type', 'business_id', 'business_branch_id', 'client_id', 'seller_id',
        'expected_document_type', 'currency', 'billing_cycle', 'contract_label', 'payment_condition', 'installments',
        'billing_day', 'detraction_enabled',
        'issue_date', 'scheduled_at', 'first_due_date', 'order_status', 'billing_status',
        'subtotal', 'tax_amount', 'total', 'paid_amount', 'balance_amount', 'payment_status', 'billed_at',
        'observations', 'status', 'created_by', 'updated_by',
    ];

    protected $casts = [
        'installments' => 'integer',
        'billing_day' => 'integer',
        'detraction_enabled' => 'boolean',
        'issue_date' => 'date',
        'scheduled_at' => 'date',
        'first_due_date' => 'date',
        'subtotal' => 'float',
        'tax_amount' => 'float',
        'total' => 'float',
        'paid_amount' => 'float',
        'balance_amount' => 'float',
        'billed_at' => 'datetime',
        'status' => 'boolean',
    ];

    public function business() { return $this->belongsTo(Business::class); }
    public function branch() { return $this->belongsTo(BusinessBranch::class, 'business_branch_id'); }
    public function client() { return $this->belongsTo(Client::class); }
    public function seller() { return $this->belongsTo(User::class, 'seller_id'); }
    public function items() { return $this->hasMany(ServiceOrderItem::class)->orderBy('id'); }
    public function accountsReceivable() { return $this->hasOne(AccountsReceivable::class, 'service_order_id'); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
    public function updater() { return $this->belongsTo(User::class, 'updated_by'); }
}
