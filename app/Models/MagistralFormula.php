<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MagistralFormula extends Model
{
    use HasFactory;

    protected $table = 'magistral_formulas';

    protected $fillable = [
        'article_id',
        'detail',
        'special_preparation_conditions',
        'specialized_equipment',
        'preparation_instructions',
        'preparation_method',
        'conservation',
        'stability',
        'usage',
        'others',
        'last_edited_by',
        'last_edited_at',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'last_edited_at' => 'datetime',
        'status' => 'boolean',
    ];

    public function article() { return $this->belongsTo(Article::class); }
    public function items() { return $this->hasMany(MagistralFormulaItem::class, 'magistral_formula_id')->orderBy('id'); }
    public function lastEditor() { return $this->belongsTo(User::class, 'last_edited_by'); }
    public function histories() { return $this->hasMany(MagistralFormulaHistory::class, 'magistral_formula_id')->latest('id'); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
    public function updater() { return $this->belongsTo(User::class, 'updated_by'); }
}
