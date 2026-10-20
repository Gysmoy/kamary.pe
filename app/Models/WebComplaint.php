<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WebComplaint extends Model
{
    use HasFactory;

    protected $table = 'web_complaints';

    protected $fillable = [
        'code',
        'person_type',
        'first_name',
        'last_name',
        'document_type',
        'document_number',
        'business_name',
        'address',
        'district',
        'department',
        'phone',
        'email',
        'claim_type',
        'good_type',
        'product_detail',
        'claim_detail',
        'file_path',
        'payload',
        'ip',
        'user_agent',
        'status',
    ];

    protected $casts = [
        'payload' => 'array',
    ];
}
