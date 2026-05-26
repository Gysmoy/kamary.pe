<?php

namespace App\Http\Controllers\Admin\Magistrales;

use App\Http\Controllers\BasicController;
use App\Models\MagistralFormat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FormatController extends BasicController
{
    public $model = MagistralFormat::class;
    public $reactView = 'Admin/Magistrales/Formats';
    public $prefix4filter = 'magistral_formats';

    public function setReactViewProperties(Request $request)
    {
        return [
            'moduleTitle' => 'Magistrales - Formatos',
            'requiredPermission' => ['magistrales-formats', 'magistrales-products'],
        ];
    }

    public function setPaginationInstance(string $model)
    {
        return $model::select('magistral_formats.*')
            ->with([
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ])
            ->leftJoin('users as creator', 'creator.id', '=', 'magistral_formats.created_by')
            ->leftJoin('users as updater', 'updater.id', '=', 'magistral_formats.updated_by');
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $id = $body['id'] ?? null;
        $description = trim((string)($body['description'] ?? ''));
        if ($description === '') throw new \Exception('La descripcion es obligatoria');

        if (!$id) {
            $body['created_by'] = Auth::id();
            $body['status'] = array_key_exists('status', $body)
                ? $this->toBoolean($body['status'])
                : true;
        } elseif (array_key_exists('status', $body)) {
            $body['status'] = $this->toBoolean($body['status']);
        }

        $body['updated_by'] = Auth::id();
        $body['description'] = $description;
        $body['quantity'] = $this->toDecimal($body['quantity'] ?? 0);

        return $body;
    }

    private function toDecimal($value): float
    {
        $text = trim((string)$value);
        if ($text === '') return 0;
        if (!is_numeric($text)) throw new \Exception("Valor numerico invalido: {$value}");
        return round((float)$text, 3);
    }

    private function toBoolean($value): bool
    {
        if (is_bool($value)) return $value;
        if (is_numeric($value)) return (int)$value !== 0;
        return in_array(mb_strtolower(trim((string)$value)), ['1', 'true', 'si', 'yes', 'on'], true);
    }
}
