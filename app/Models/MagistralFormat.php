<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MagistralFormat extends Model
{
    use HasFactory;

    protected $table = 'magistral_formats';

    protected $fillable = [
        'description',
        'quantity',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'quantity' => 'float',
        'status' => 'boolean',
    ];

    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
    public function updater() { return $this->belongsTo(User::class, 'updated_by'); }
}
