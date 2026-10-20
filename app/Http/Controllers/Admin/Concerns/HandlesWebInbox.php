<?php

namespace App\Http\Controllers\Admin\Concerns;

use App\Support\FriendlyError;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use SoDe\Extend\Response;

// Logica comun de las bandejas de la web publica (consultas y libro de reclamaciones).
trait HandlesWebInbox
{
    /** Carpeta (disco local, no publico) donde el formulario publico guarda los adjuntos. */
    abstract protected function fileFolder(): string;

    /** Descarga el adjunto del registro. Solo autenticado y con permiso (lo exige el middleware de la ruta). */
    public function file(Request $request, string $id)
    {
        $jpa = $this->model::find($id);
        if (!$jpa || !$jpa->file_path) {
            abort(404, 'El registro no tiene adjunto');
        }

        $path = (string) $jpa->file_path;
        $folder = $this->fileFolder();

        // El archivo debe vivir dentro de la carpeta del formulario: nada de rutas ajenas ni "../".
        $safe = str_starts_with($path, $folder . '/')
            && !str_contains($path, '..')
            && !str_contains($path, '\\')
            && basename($path) !== '';
        if (!$safe || !Storage::exists($path)) {
            abort(404, 'El archivo no existe');
        }

        return Storage::download($path, basename($path));
    }

    protected function respondUpdate(callable $callback)
    {
        $response = new Response();
        try {
            $response->data = $callback();
            $response->status = 200;
            $response->message = 'Operación correcta';
        } catch (\Illuminate\Validation\ValidationException $e) {
            $response->status = 400;
            $response->message = collect($e->errors())->flatten()->first();
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = FriendlyError::message($th, []);
        }
        return response($response->toArray(), $response->status);
    }
}
