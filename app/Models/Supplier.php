<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    use HasFactory;

    protected $fillable = [
        'ruc',
        'business_name',
        'address',
        'phone',
        'mobile',
        'email_1',
        'email_2',
        'business_line',
        'billing_type',
        'credit_type',
        'bank',
        'bank_account_cci',
        'payment_system',
        'evaluation',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
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
}
