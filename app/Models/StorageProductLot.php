<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StorageProductLot extends Model
{
    use HasFactory;

    protected $fillable = [
        'article_id',
        'lot',
        'expiration_date',
        'storage_condition',
        'manufacturer_id',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'expiration_date' => 'date',
        'status' => 'boolean',
    ];

    public function article()
    {
        return $this->belongsTo(Article::class);
    }

    public function manufacturer()
    {
        return $this->belongsTo(Laboratory::class, 'manufacturer_id');
    }
}
