<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MagistralDoctor extends Model
{
    use HasFactory;

    protected $table = 'magistral_doctors';

    protected $fillable = [
        'names',
        'paternal_lastname',
        'maternal_lastname',
        'cmp',
        'specialty',
        'medical_center',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'status' => 'boolean',
    ];

    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
    public function updater() { return $this->belongsTo(User::class, 'updated_by'); }
}
