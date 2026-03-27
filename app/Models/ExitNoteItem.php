<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExitNoteItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'exit_note_id',
        'batch_code',
        'article_id',
        'warehouse_id',
        'stock',
        'expiration_date',
        'location',
        'destination_location',
        'quantity',
        'total',
        'status',
    ];

    protected $casts = [
        'stock' => 'float',
        'expiration_date' => 'date',
        'quantity' => 'float',
        'total' => 'float',
        'status' => 'boolean',
    ];

    public function exitNote()
    {
        return $this->belongsTo(ExitNote::class);
    }

    public function article()
    {
        return $this->belongsTo(Article::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }
}

