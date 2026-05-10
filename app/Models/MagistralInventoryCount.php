<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MagistralInventoryCount extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'business_branch_id',
        'warehouse_id',
        'count_date',
        'observations',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'count_date' => 'date',
        'status' => 'boolean',
    ];

    public function branch() { return $this->belongsTo(BusinessBranch::class, 'business_branch_id'); }
    public function warehouse() { return $this->belongsTo(Warehouse::class); }
    public function items() { return $this->hasMany(MagistralInventoryCountItem::class, 'magistral_inventory_count_id')->with('article:id,code,name,sub_category,unit_id'); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
    public function updater() { return $this->belongsTo(User::class, 'updated_by'); }
}
