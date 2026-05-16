<?php

namespace App\Http\Controllers\Admin\Magistrales;

use App\Http\Controllers\BasicController;
use App\Models\MagistralLaboratory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LaboratoryController extends BasicController
{
    public $model = MagistralLaboratory::class;
    public $reactView = 'Admin/Magistrales/Laboratories';
    public $prefix4filter = 'magistral_laboratories';

    public function setReactViewProperties(Request $request)
    {
        return [
            'moduleTitle' => 'Magistrales - Laboratorio',
            'requiredPermission' => 'magistrales-laboratory',
        ];
    }

    public function setPaginationInstance(string $model)
    {
        return $model::select('magistral_laboratories.*')
            ->with([
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ])
            ->leftJoin('users as creator', 'creator.id', '=', 'magistral_laboratories.created_by')
            ->leftJoin('users as updater', 'updater.id', '=', 'magistral_laboratories.updated_by');
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $id = $body['id'] ?? null;

        $description = trim((string)($body['description'] ?? ''));
        $code = trim((string)($body['code'] ?? ''));

        if ($description === '') throw new \Exception('La descripcion es obligatoria');
        if ($code === '') throw new \Exception('El codigo es obligatorio');

        $existsCode = MagistralLaboratory::query()
            ->whereRaw('LOWER(code) = ?', [mb_strtolower($code)])
            ->when($id, fn($query) => $query->where('id', '!=', $id))
            ->exists();
        if ($existsCode) throw new \Exception('El codigo de laboratorio magistral ya existe');

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
        $body['code'] = $code;

        return $body;
    }

    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        return $jpa->fresh();
    }

    private function toBoolean($value): bool
    {
        if (is_bool($value)) return $value;
        if (is_numeric($value)) return (int)$value !== 0;
        return in_array(mb_strtolower(trim((string)$value)), ['1', 'true', 'si', 'yes', 'on', 'activo'], true);
    }
}
