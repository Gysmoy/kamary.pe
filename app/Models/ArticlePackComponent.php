<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArticlePackComponent extends Model
{
    use HasFactory;

    protected $fillable = [
        'pack_article_id',
        'component_article_id',
        'quantity',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'quantity' => 'float',
        'status' => 'boolean',
    ];

    public function pack()
    {
        return $this->belongsTo(Article::class, 'pack_article_id');
    }

    public function component()
    {
        return $this->belongsTo(Article::class, 'component_article_id');
    }
}
