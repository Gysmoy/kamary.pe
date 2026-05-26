<?php

namespace App\Http\Controllers\Admin\Magistrales;

use App\Http\Controllers\BasicController;
use App\Models\MagistralResponsible;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ResponsibleController extends BasicController
{
    public $model = MagistralResponsible::class;
    public $reactView = 'Admin/Magistrales/Responsibles';
    public $prefix4filter = 'magistral_responsibles';

    public function setReactViewProperties(Request $request)
    {
        return [
            'moduleTitle' => 'Magistrales - Responsable',
            'requiredPermission' => ['magistrales-responsible', 'magistrales-warehouse'],
        ];
    }

    public function setPaginationInstance(string $model)
    {
        return $model::select('magistral_responsibles.*')
            ->with(['creator:id,name,lastname,username,fullname', 'updater:id,name,lastname,username,fullname'])
            ->leftJoin('users as creator', 'creator.id', '=', 'magistral_responsibles.created_by')
            ->leftJoin('users as updater', 'updater.id', '=', 'magistral_responsibles.updated_by');
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $id = $body['id'] ?? null;
        $documentNumber = preg_replace('/\D+/', '', (string)($body['document_number'] ?? ''));
        $name = trim((string)($body['name'] ?? ''));

        if ($documentNumber === '') throw new \Exception('El documento es obligatorio');
        if ($name === '') throw new \Exception('El nombre es obligatorio');

        $exists = MagistralResponsible::where('document_number', $documentNumber)
            ->when($id, fn($query) => $query->where('id', '!=', $id))
            ->exists();
        if ($exists) throw new \Exception('Ya existe un responsable con este documento');

        if (!$id) {
            $body['created_by'] = Auth::id();
            $body['status'] = true;
        }

        $body['updated_by'] = Auth::id();
        $body['document_number'] = $documentNumber;
        $body['name'] = $name;

        return $body;
    }
}
