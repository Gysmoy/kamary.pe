<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WebInquiry extends Model
{
    use HasFactory;

    protected $table = 'web_inquiries';

    protected $fillable = [
        'type',
        'name',
        'last_name',
        'email',
        'phone',
        'subject',
        'message',
        'file_path',
        'payload',
        'ip',
        'user_agent',
        'status',
        'internal_notes',
    ];

    protected $casts = [
        'payload' => 'array',
    ];
}
