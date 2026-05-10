<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MagistralIncome extends Model
{
    use HasFactory;

    protected $table = 'magistral_incomes';

    protected $fillable = [
        'code',
        'purchase_order_code',
        'document_type',
        'document_series',
        'document_sequence',
        'guide_number',
        'guide_series',
        'guide_sequence',
        'guide_ruc',
        'guide_file_path',
        'business_id',
        'warehouse_id',
        'supplier_id',
        'payment_method',
        'file_path',
        'origin',
        'currency',
        'affects_igv',
        'issue_date',
        'observations',
        'subtotal',
        'igv',
        'total',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'affects_igv' => 'boolean',
        'subtotal' => 'float',
        'igv' => 'float',
        'total' => 'float',
        'status' => 'boolean',
    ];

    public function items() { return $this->hasMany(MagistralIncomeItem::class, 'magistral_income_id')->with('article:id,code,name'); }
    public function business() { return $this->belongsTo(Business::class); }
    public function warehouse() { return $this->belongsTo(Warehouse::class); }
    public function supplier() { return $this->belongsTo(Supplier::class); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
    public function updater() { return $this->belongsTo(User::class, 'updated_by'); }
}
