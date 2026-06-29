<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\User;
use Illuminate\Http\Request;

class SupervisorController extends BasicController
{
    public $model = User::class;

    public function beforeSave(Request $request)
    {
        $body = $request->all();

        $name = trim((string)($body['name'] ?? ''));
        if ($name === '') throw new \Exception('El nombre del supervisor es obligatorio');

        $body['name'] = $name;
        $body['lastname'] = trim((string)($body['lastname'] ?? ''));
        $body['fullname'] = trim($body['name'] . ' ' . $body['lastname']);
        $body['document_type'] = trim((string)($body['document_type'] ?? 'DNI')) ?: 'DNI';
        $body['document_number'] = trim((string)($body['document_number'] ?? '')) ?: null;
        $body['phone'] = trim((string)($body['phone'] ?? '')) ?: null;

        // Username y password se generan solo al crear; en edicion no se tocan.
        if (empty($body['id'])) {
            $base = preg_replace('/[^a-z0-9]/', '', strtolower((string)($body['document_number'] ?? $name)));
            if ($base === '') $base = 'supervisor';
            $username = $base;
            $i = 1;
            while (User::where('username', $username)->exists()) {
                $i++;
                $username = $base . $i;
            }
            $body['username'] = $username;
            // El cast 'hashed' del modelo se encarga de encriptar el password.
            $body['password'] = $body['document_number'] ?: 'kamary2026';
        } else {
            unset($body['username'], $body['password']);
        }

        return $body;
    }

    // Devuelve el supervisor creado/actualizado para seleccionarlo en el formulario.
    // makeVisible('id') porque el modelo User oculta el id por defecto.
    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        return $jpa->makeVisible('id');
    }
}
