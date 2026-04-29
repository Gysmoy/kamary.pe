<?php

namespace App\Models\Billing;

use App\Models\Billing\Catalogs\CurrencyType;

class BankAccount extends ModelTenant
{
    public $timestamps = false;

    protected $fillable = [
        'bank_id',
        'description',
        'number',
        'currency_type_id',
        'cci',
        'status',
        'initial_balance',
        'show_in_documents',
    ];

    protected $casts = [
        'bank_id' => 'int',
        'status' => 'int',
        'initial_balance' => 'float',
        'show_in_documents' => 'bool',
    ];

    public function bank()
    {
        return $this->belongsTo(Bank::class);
    }

    public function currency_type()
    {
        return $this->belongsTo(CurrencyType::class, 'currency_type_id');
    }
}

