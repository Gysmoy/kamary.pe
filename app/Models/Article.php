<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Article extends Model
{
    use HasFactory;

    public const MAGISTRAL_PRESENTATION_OPTIONS = [
        'BOLSA',
        'CAJA',
        'CREMA',
        'FRASCO',
        'LIQUIDO',
        'POLVO',
        'POTE',
        'ROLLO',
        'TUBO',
        'UNIDAD',
    ];

    protected $fillable = [
        'code',
        'module_scope',
        'client_id',
        'name',
        'composition',
        'article_type',
        'administration_route',
        'magistral_category_id',
        'sub_category',
        'magistral_presentation',
        'magistral_format_id',
        'health_registration',
        'laboratory_id',
        'magistral_laboratory_id',
        'active_principle_id',
        'unit_id',
        'volume',
        'status',
        'magistral_status',
        'margin_rule',
        'igv_rule',
        'units_per_article',
        'unit_weight',
        'default_lot',
        'default_expiration_date',
        'stock_min',
        'stock_max',
        'currency',
        'stock_has_expiration',
        'stock_has_lot',
        'cost_price',
        'sale_price',
        'equivalence_exchange_rate',
        'equivalence_quantity',
        'equivalence_unit_id',
        'sale_price_national',
        'purchase_price_national',
        'purchase_price_foreign',
        'notes',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'status' => 'boolean',
        'margin_rule' => 'boolean',
        'igv_rule' => 'boolean',
        'stock_has_expiration' => 'boolean',
        'stock_has_lot' => 'boolean',
        'volume' => 'float',
        'unit_weight' => 'float',
        'stock_min' => 'float',
        'stock_max' => 'float',
        'cost_price' => 'float',
        'sale_price' => 'float',
        'equivalence_exchange_rate' => 'float',
        'equivalence_quantity' => 'float',
        'sale_price_national' => 'decimal:4',
        'purchase_price_national' => 'decimal:4',
        'purchase_price_foreign' => 'decimal:4',
        'default_expiration_date' => 'date',
    ];

    public function laboratory()
    {
        return $this->belongsTo(Laboratory::class);
    }

    public function magistralLaboratory()
    {
        return $this->belongsTo(MagistralLaboratory::class, 'magistral_laboratory_id');
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function activePrinciple()
    {
        return $this->belongsTo(ActivePrinciple::class);
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    public function equivalenceUnit()
    {
        return $this->belongsTo(Unit::class, 'equivalence_unit_id');
    }

    public function presentations()
    {
        return $this->hasMany(ArticlePresentation::class)->orderBy('sort_order')->orderBy('id');
    }

    public function storageLots()
    {
        return $this->hasMany(StorageProductLot::class)->orderBy('id');
    }

    public function magistralCategory()
    {
        return $this->belongsTo(MagistralCategory::class, 'magistral_category_id');
    }

    public function magistralFormat()
    {
        return $this->belongsTo(MagistralFormat::class, 'magistral_format_id');
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
