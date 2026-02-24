<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Expansion extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'serie_id',
        'code',
        'name',
        'release_date',
        'available'
    ];

    protected $casts = [
        'available' => 'boolean'
    ];

    public function serie()
    {
        return $this->belongsTo(Serie::class);
    }

    public function cards()
    {
        return $this->hasMany(Card::class);
    }
}
