<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MagistralOutput extends Model
{
    use HasFactory;

    protected $table = 'magistral_outputs';

    protected $fillable = [
        'code',
        'origin_warehouse_id',
        'destination',
        'reason',
        'observations',
        'output_date',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'output_date' => 'date',
        'status' => 'boolean',
    ];

    public function originWarehouse() { return $this->belongsTo(Warehouse::class, 'origin_warehouse_id'); }
    public function items() { return $this->hasMany(MagistralOutputItem::class, 'magistral_output_id')->with('article:id,code,name,unit_id'); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
    public function updater() { return $this->belongsTo(User::class, 'updated_by'); }
}
