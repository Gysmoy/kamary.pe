<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DispatchAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'dispatch_id',
        'commercial_order_id',
        'commercial_order_code',
        'customer_name',
        'total',
        'assignment_status',
        'status',
    ];

    protected $casts = [
        'total' => 'float',
        'status' => 'boolean',
    ];

    public function dispatch() { return $this->belongsTo(Dispatch::class); }
    public function commercialOrder() { return $this->belongsTo(CommercialOrder::class); }
}
