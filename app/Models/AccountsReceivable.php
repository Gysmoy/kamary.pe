<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AccountsReceivable extends Model
{
    use HasFactory;

    protected $table = 'accounts_receivable';

    protected $fillable = [
        'business_id',
        'business_branch_id',
        'warehouse_id',
        'client_id',
        'eventual_client_id',
        'commercial_order_id',
        'service_order_id',
        'source_type',
        'source_id',
        'code',
        'document_type',
        'series',
        'sequence',
        'issue_date',
        'due_date',
        'currency',
        'payment_condition',
        'subtotal',
        'tax_amount',
        'total',
        'paid_amount',
        'balance_amount',
        'payment_status',
        'observations',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'due_date' => 'date',
        'subtotal' => 'float',
        'tax_amount' => 'float',
        'total' => 'float',
        'paid_amount' => 'float',
        'balance_amount' => 'float',
        'status' => 'boolean',
    ];

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function branch()
    {
        return $this->belongsTo(BusinessBranch::class, 'business_branch_id');
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function eventualClient()
    {
        return $this->belongsTo(EventualClient::class);
    }

    public function commercialOrder()
    {
        return $this->belongsTo(CommercialOrder::class, 'commercial_order_id');
    }

    public function serviceOrder()
    {
        return $this->belongsTo(ServiceOrder::class, 'service_order_id');
    }

    public function installments()
    {
        return $this->hasMany(AccountsReceivableInstallment::class)->orderBy('installment_number');
    }

    public function payments()
    {
        return $this->hasMany(ReceivablePayment::class);
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
