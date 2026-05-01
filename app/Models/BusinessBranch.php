<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BusinessBranch extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_id',
        'name',
        'establishment_code',
        'ubigeo',
        'address',
        'email',
        'telephone',
        'facturador_establishment_id',
        'facturador_sync_status',
        'facturador_sync_message',
        'facturador_last_sync_at',
        'series_factura',
        'series_boleta',
        'series_nota_credito',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'status' => 'boolean',
        'facturador_establishment_id' => 'integer',
        'facturador_last_sync_at' => 'datetime',
    ];

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function warehouses()
    {
        return $this->hasMany(Warehouse::class, 'business_branch_id')->orderBy('name');
    }
}
