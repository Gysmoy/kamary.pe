<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Testimony extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'image',
        'name',
        'description',
        'country_id',
        'country',
        'visible',
        'status'
    ];

    static function lastTen()
    {
        return Testimony::select([
            'image',
            'name',
            'country',
            'description'
        ])
            ->where('visible', true)
            ->where('status', true)
            ->orderBy('updated_at', 'desc')
            ->take(10)
            ->get();
    }
}
