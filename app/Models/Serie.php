<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Serie extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'language_id',
        'code',
        'name'
    ];

    public function language()
    {
        return $this->belongsTo(Language::class);
    }

    public function expansions()
    {
        return $this->hasMany(Expansion::class);
    }

    public function cards()
    {
        return $this->hasMany(Card::class);
    }
}
