<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MagistralFormulaHistory extends Model
{
    use HasFactory;

    protected $table = 'magistral_formula_histories';

    protected $fillable = [
        'magistral_formula_id',
        'article_id',
        'detail',
        'change_reason',
        'special_preparation_conditions',
        'specialized_equipment',
        'preparation_instructions',
        'preparation_method',
        'conservation',
        'stability',
        'usage',
        'others',
        'items_snapshot',
        'edited_by',
    ];

    protected $casts = [
        'items_snapshot' => 'array',
    ];

    public function formula() { return $this->belongsTo(MagistralFormula::class, 'magistral_formula_id'); }
    public function article() { return $this->belongsTo(Article::class); }
    public function editor() { return $this->belongsTo(User::class, 'edited_by'); }
}
