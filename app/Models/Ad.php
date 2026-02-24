<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ad extends Model
{
    use HasFactory, HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'name',
        'description',
        'image',
        'link',
        'seconds',
        'date_begin',
        'date_end',
        'visible',
        'invasivo',
        'status',
    ];

    public static function today()
    {
        // Primero verificamos si hay anuncios invasivos activos
        $invasivos = self::where('status', true)
            ->where('visible', true)
            ->where('invasivo', true)
            ->where(function ($query) {
                $query->whereNull('date_begin')
                    ->whereNull('date_end')
                    ->orWhere(function ($query) {
                        $query->where('date_begin', '<=', Carbon::now())
                            ->where('date_end', '>=', Carbon::now());
                    });
            })
            ->get();

        // Si hay anuncios invasivos, retornamos solo esos
        if ($invasivos->count() > 0) {
            return $invasivos;
        }

        // Si no hay invasivos, seguimos con la lógica original
        return self::where('status', true)
            ->where('visible', true)
            ->where(function ($query) {
                $query->whereNull('date_begin')
                    ->whereNull('date_end')
                    ->orWhere(function ($query) {
                        $query->where('date_begin', '<=', Carbon::now())
                            ->where('date_end', '>=', Carbon::now());
                    });
            })
            ->get();
    }
}
