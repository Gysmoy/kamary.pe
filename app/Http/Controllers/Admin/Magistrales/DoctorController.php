<?php

namespace App\Http\Controllers\Admin\Magistrales;

use App\Http\Controllers\BasicController;
use App\Models\MagistralDoctor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DoctorController extends BasicController
{
    public $model = MagistralDoctor::class;
    public $prefix4filter = 'magistral_doctors';

    public function setPaginationInstance(string $model)
    {
        return $model::select('magistral_doctors.*')
            ->selectRaw("TRIM(CONCAT(COALESCE(magistral_doctors.paternal_lastname, ''), ' ', COALESCE(magistral_doctors.maternal_lastname, ''), ', ', COALESCE(magistral_doctors.names, ''))) AS full_name")
            ->selectRaw("TRIM(CONCAT(COALESCE(magistral_doctors.cmp, ''), ' | ', COALESCE(magistral_doctors.paternal_lastname, ''), ' ', COALESCE(magistral_doctors.maternal_lastname, ''), ', ', COALESCE(magistral_doctors.names, ''))) AS select_label")
            ->with(['creator:id,name,lastname,username,fullname', 'updater:id,name,lastname,username,fullname'])
            ->leftJoin('users as creator', 'creator.id', '=', 'magistral_doctors.created_by')
            ->leftJoin('users as updater', 'updater.id', '=', 'magistral_doctors.updated_by');
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $id = $body['id'] ?? null;
        $names = trim((string)($body['names'] ?? ''));
        $paternalLastname = trim((string)($body['paternal_lastname'] ?? ''));
        $maternalLastname = trim((string)($body['maternal_lastname'] ?? ''));
        $cmp = preg_replace('/\D+/', '', (string)($body['cmp'] ?? ''));

        if ($names === '') throw new \Exception('Los nombres son obligatorios');
        if ($paternalLastname === '') throw new \Exception('El apellido paterno es obligatorio');
        if ($cmp === '') throw new \Exception('El CMP numerico es obligatorio');

        $exists = MagistralDoctor::where('cmp', $cmp)
            ->when($id, fn($query) => $query->where('id', '!=', $id))
            ->exists();
        if ($exists) throw new \Exception('Ya existe un doctor con este CMP');

        if (!$id) {
            $body['created_by'] = Auth::id();
            $body['status'] = true;
        }

        $body['updated_by'] = Auth::id();
        $body['names'] = $names;
        $body['paternal_lastname'] = $paternalLastname;
        $body['maternal_lastname'] = $maternalLastname ?: null;
        $body['cmp'] = $cmp;
        $body['specialty'] = trim((string)($body['specialty'] ?? '')) ?: null;
        $body['medical_center'] = trim((string)($body['medical_center'] ?? '')) ?: null;

        return $body;
    }
}
