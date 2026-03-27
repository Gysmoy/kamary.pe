<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EntryNoteItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'entry_note_id',
        'batch_code',
        'lot',
        'article_id',
        'warehouse_id',
        'stock',
        'cost_unit',
        'location',
        'quantity',
        'total',
        'status',
    ];

    protected $casts = [
        'stock' => 'float',
        'cost_unit' => 'float',
        'quantity' => 'float',
        'total' => 'float',
        'status' => 'boolean',
    ];

    public function entryNote()
    {
        return $this->belongsTo(EntryNote::class);
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

