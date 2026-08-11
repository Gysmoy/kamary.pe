<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DetractionType extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'description',
        'percent',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'percent' => 'float',
        'status' => 'boolean',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
