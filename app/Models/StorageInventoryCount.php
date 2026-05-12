<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StorageInventoryCount extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'business_branch_id',
        'warehouse_id',
        'client_id',
        'location',
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

    public function items()
    {
        return $this->hasMany(StorageInventoryCountItem::class)->orderBy('id');
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
