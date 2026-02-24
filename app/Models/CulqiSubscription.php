<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CulqiSubscription extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'renewal_id',
        'user_id',
        'cq_crd_id',
        'cq_pln_id',
        'cq_sxn_id',
        'sale_id',
        'already_paid',
        'current_payment',
        'total_payments',
        'status',
    ];
}
