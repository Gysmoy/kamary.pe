<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MagistralLaboratory extends Model
{
    use HasFactory;

    protected $table = 'magistral_laboratories';

    protected $fillable = [
        'description',
        'code',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
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

    public function articles()
    {
        return $this->hasMany(Article::class, 'magistral_laboratory_id');
    }
}
