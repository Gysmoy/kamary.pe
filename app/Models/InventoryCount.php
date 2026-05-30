<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryCount extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'business_id',
        'business_branch_id',
        'warehouse_id',
        'laboratory_id',
        'count_date',
        'inventory_status',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'count_date' => 'date',
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

    public function laboratory()
    {
        return $this->belongsTo(Laboratory::class);
    }

    public function items()
    {
        return $this->hasMany(InventoryCountItem::class)->orderBy('id');
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
