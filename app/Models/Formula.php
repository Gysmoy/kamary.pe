<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Formula extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'name',
        'description',
        'correlative',
        'presentation_order',
        'status',
    ];

    public function supplies()
    {
        return $this->hasManyThrough(Supply::class, FormulaHasSupply::class, 'formula_id', 'id', 'id', 'supply_id');
    }
}
