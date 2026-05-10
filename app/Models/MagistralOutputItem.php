<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MagistralOutputItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'magistral_output_id',
        'article_id',
        'code',
        'name',
        'lot',
        'expiration_date',
        'stock',
        'unit_label',
        'quantity',
        'total',
        'status',
    ];

    protected $casts = [
        'expiration_date' => 'date',
        'stock' => 'float',
        'quantity' => 'float',
        'total' => 'float',
        'status' => 'boolean',
    ];

    public function output() { return $this->belongsTo(MagistralOutput::class, 'magistral_output_id'); }
    public function article() { return $this->belongsTo(Article::class); }
}
