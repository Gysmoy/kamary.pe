<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArticlePresentation extends Model
{
    use HasFactory;

    protected $fillable = [
        'article_id',
        'name',
        'units',
        'price',
        'sort_order',
        'status',
    ];

    protected $casts = [
        'units' => 'float',
        'price' => 'float',
        'status' => 'boolean',
    ];

    public function article()
    {
        return $this->belongsTo(Article::class);
    }
}
