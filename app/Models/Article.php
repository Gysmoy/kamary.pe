<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Article extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'laboratory_id',
        'active_principle_id',
        'unit_id',
        'volume',
        'status',
        'margin_rule',
        'igv_rule',
        'units_per_article',
        'unit_weight',
        'notes',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'status' => 'boolean',
        'margin_rule' => 'boolean',
        'igv_rule' => 'boolean',
        'volume' => 'float',
        'unit_weight' => 'float',
    ];

    public function laboratory()
    {
        return $this->belongsTo(Laboratory::class);
    }

    public function activePrinciple()
    {
        return $this->belongsTo(ActivePrinciple::class);
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    public function presentations()
    {
        return $this->hasMany(ArticlePresentation::class)->orderBy('sort_order')->orderBy('id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
