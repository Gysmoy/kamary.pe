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
        'expiration_date',
        'storage_condition',
        'manufacturer_id',
        'article_id',
        'warehouse_id',
        'stock',
        'cost_unit',
        'location',
        'requested_quantity',
        'received_quantity',
        'quantity',
        'total',
        'status',
    ];

    protected $casts = [
        'stock' => 'float',
        'cost_unit' => 'float',
        'requested_quantity' => 'float',
        'received_quantity' => 'float',
        'quantity' => 'float',
        'total' => 'float',
        'status' => 'boolean',
        'expiration_date' => 'date',
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

    public function manufacturer()
    {
        return $this->belongsTo(Laboratory::class, 'manufacturer_id');
    }
}
