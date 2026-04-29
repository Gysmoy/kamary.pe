<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AccountsReceivableInstallment extends Model
{
    use HasFactory;

    protected $table = 'accounts_receivable_installments';

    protected $fillable = [
        'accounts_receivable_id',
        'installment_number',
        'due_date',
        'amount',
        'paid_amount',
        'balance_amount',
        'paid_at',
        'payment_status',
        'status',
    ];

    protected $casts = [
        'due_date' => 'date',
        'amount' => 'float',
        'paid_amount' => 'float',
        'balance_amount' => 'float',
        'paid_at' => 'datetime',
        'status' => 'boolean',
    ];

    public function accountsReceivable()
    {
        return $this->belongsTo(AccountsReceivable::class);
    }
}
