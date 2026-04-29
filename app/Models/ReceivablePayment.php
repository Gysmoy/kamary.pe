<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReceivablePayment extends Model
{
    use HasFactory;

    protected $table = 'receivable_payments';

    protected $fillable = [
        'accounts_receivable_id',
        'amount',
        'payment_date',
        'payment_method',
        'bank',
        'operation_number',
        'payment_file',
        'observations',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'amount' => 'float',
        'payment_date' => 'date',
        'status' => 'boolean',
    ];

    public function accountsReceivable()
    {
        return $this->belongsTo(AccountsReceivable::class);
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
