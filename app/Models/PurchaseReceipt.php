<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseReceipt extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_order_id',
        'business_id',
        'business_branch_id',
        'warehouse_id',
        'supplier_id',
        'code',
        'issue_date',
        'receipt_status',
        'confirmed_at',
        'document_type',
        'document_series',
        'document_sequence',
        'document_file',
        'currency',
        'payment_condition',
        'first_due_date',
        'installments',
        'observations',
        'guide_series',
        'guide_sequence',
        'guide_ruc',
        'guide_file',
        'subtotal',
        'tax_amount',
        'total',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'confirmed_at' => 'datetime',
        'first_due_date' => 'date',
        'installments' => 'integer',
        'subtotal' => 'float',
        'tax_amount' => 'float',
        'total' => 'float',
        'status' => 'boolean',
    ];

    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

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
        return $this->hasMany(PurchaseReceiptItem::class)->orderBy('id');
    }

    public function accountsPayable()
    {
        return $this->hasOne(AccountsPayable::class, 'source_id')->where('source_type', 'purchase_receipt');
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
