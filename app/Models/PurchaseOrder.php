<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_id',
        'business_branch_id',
        'warehouse_id',
        'supplier_id',
        'code',
        'issue_date',
        'expected_date',
        'currency',
        'payment_condition',
        'order_status',
        'approval_status',
        'observations',
        'subtotal',
        'tax_amount',
        'total',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'expected_date' => 'date',
        'subtotal' => 'float',
        'tax_amount' => 'float',
        'total' => 'float',
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

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function items()
    {
        return $this->hasMany(PurchaseOrderItem::class)->orderBy('id');
    }

    public function receipts()
    {
        return $this->hasMany(PurchaseReceipt::class)->orderByDesc('id');
    }

    public function accountsPayable()
    {
        return $this->hasOne(AccountsPayable::class, 'source_id')->where('source_type', 'purchase_order');
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
