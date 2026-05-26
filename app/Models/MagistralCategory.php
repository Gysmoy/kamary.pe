<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MagistralCategory extends Model
{
    use HasFactory;

    public const ALLOWED_DESCRIPTIONS = [
        'GINECOLOGIA',
        'INSUMOS',
        'ANDROLOGIA',
        'DERMATOLOGIA',
        'PEDIATRIA',
        'GASTROENTEROLOGIA',
        'DOLOR',
        'COSMETICA',
        'CAPSULAS',
        'NUTRICION',
    ];

    protected $table = 'magistral_categories';

    protected $fillable = [
        'code',
        'description',
        'warehouse_id',
        'sale_material',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'sale_material' => 'boolean',
        'status' => 'boolean',
    ];

    public function warehouse() { return $this->belongsTo(Warehouse::class); }
    public function subcategories() { return $this->hasMany(MagistralSubcategory::class, 'magistral_category_id'); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
    public function updater() { return $this->belongsTo(User::class, 'updated_by'); }
}
