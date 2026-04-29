<?php

namespace App\Models\Billing;

class Bank extends ModelTenant
{
    protected $fillable = [
        'description',
        'active',
    ];

    protected $casts = [
        'active' => 'bool',
    ];

    public function bank_accounts()
    {
        return $this->hasMany(BankAccount::class);
    }
}

