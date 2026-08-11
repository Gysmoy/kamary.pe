<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\DetractionType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DetractionTypeController extends BasicController
{
    public $model = DetractionType::class;
    public $reactView = 'Admin/DetractionTypes';
    public $prefix4filter = 'detraction_types';

    public function setPaginationInstance(string $model)
    {
        return $model::select('detraction_types.*')
            ->with([
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ])
            ->orderBy('detraction_types.code');
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $userId = Auth::id();
        $id = $body['id'] ?? null;

        $code = trim((string)($body['code'] ?? ''));
        $description = trim((string)($body['description'] ?? ''));
        $percent = $body['percent'] ?? null;

        if ($code === '') throw new \Exception('El codigo de detraccion es obligatorio');
        if ($description === '') throw new \Exception('La descripcion es obligatoria');

        $percentValue = $this->toPercent($percent);
        if ($percentValue === null) throw new \Exception('El porcentaje es obligatorio');
        // Un porcentaje fuera de rango deja mal el monto de detraccion del comprobante, que es
        // justo lo que se declara a SUNAT.
        if ($percentValue < 0 || $percentValue > 100) {
            throw new \Exception('El porcentaje debe estar entre 0 y 100');
        }

        $duplicated = DetractionType::where('code', $code)
            ->when($id, fn($query) => $query->where('id', '<>', $id))
            ->exists();
        if ($duplicated) throw new \Exception("Ya existe un tipo de detraccion con el codigo {$code}");

        $body['code'] = $code;
        $body['description'] = $description;
        $body['percent'] = $percentValue;

        if (!$id) {
            $body['created_by'] = $userId;
            if (!array_key_exists('status', $body)) $body['status'] = true;
        }
        $body['updated_by'] = $userId;

        return $body;
    }

    private function toPercent($value): ?float
    {
        if ($value === null) return null;
        $text = trim((string)$value);
        if ($text === '') return null;
        if (substr_count($text, ',') === 1 && substr_count($text, '.') === 0) {
            $text = str_replace(',', '.', $text);
        }
        if (!is_numeric($text)) throw new \Exception("Porcentaje invalido: {$value}");

        return round((float)$text, 2);
    }
}
