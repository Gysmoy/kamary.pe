<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Language extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'code',
        'name',
        'visible',
    ];

    protected $casts = [
        'visible' => 'bool'
    ];

    public function cards()
    {
        return $this->hasMany(Card::class);
    }

    public function series()
    {
        return $this->hasMany(Serie::class);
    }

    public function expansions()
    {
        return $this->hasMany(Expansion::class);
    }
}
