<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventualClient extends Model
{
    use HasFactory;

    protected $fillable = [
        'document_type',
        'document_number',
        'business_name',
        'email',
        'phone_prefix',
        'phone',
        'address',
        'contact_name',
        'short_code',
        'contract_due_days',
        'notes',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'contract_due_days' => 'integer',
        'status' => 'boolean',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function commercialOrders()
    {
        return $this->hasMany(CommercialOrder::class);
    }
}
