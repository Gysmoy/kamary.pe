<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PreUser extends Model
{
    use HasFactory;

    protected $fillable = [
        'email',
        'code',
        'expires_at',
        'verified'
    ];

    protected $hidden = [
        'code',
    ];

    protected $casts = [
        'code' => 'hashed',
        'verified' => 'bool'
    ];
}
