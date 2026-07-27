<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Support\ModulePermissions;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DocumentationController extends BasicController
{
    public $reactView = 'Admin/Documentation';

    /**
     * Manuales publicados. Para agregar uno nuevo basta con dejar el PDF en
     * resources/docs y sumar una entrada aqui.
     *
     * Los archivos viven en resources/docs (no en storage) porque en produccion
     * storage es un volumen de Docker y taparia los archivos de la imagen.
     */
    private function manuals(): array
    {
        return [
            [
                'key' => 'uso',
                'title' => 'Manual de Uso',
                'description' => 'Guia paso a paso del panel: como entrar, como se usa cada modulo y que se escribe en cada campo.',
                'audience' => 'Todo el personal',
                'version' => 'v2.0 · jul 2026',
                'file' => 'manual-uso.pdf',
                'adminOnly' => false,
            ],
            [
                'key' => 'programador',
                'title' => 'Manual del Programador',
                'description' => 'Documentacion tecnica: arquitectura, contratos de codigo, servicios, integraciones y despliegue.',
                'audience' => 'Equipo de desarrollo',
                'version' => 'v2.0 · jul 2026',
                'file' => 'manual-programador.pdf',
                'adminOnly' => true,
            ],
        ];
    }

    private function resolvePath(string $file): ?string
    {
        foreach ([resource_path("docs/{$file}"), storage_path("app/docs/{$file}")] as $path) {
            if (is_file($path)) {
                return $path;
            }
        }

        return null;
    }

    private function availableManuals(): array
    {
        $isAdmin = ModulePermissions::isSuperUser(Auth::user());

        return array_values(array_map(function (array $manual) {
            $path = $this->resolvePath($manual['file']);

            return [
                'key' => $manual['key'],
                'title' => $manual['title'],
                'description' => $manual['description'],
                'audience' => $manual['audience'],
                'version' => $manual['version'],
                'available' => (bool) $path,
                'size' => $path ? round(filesize($path) / 1024 / 1024, 1) : null,
            ];
        }, array_filter($this->manuals(), fn(array $manual) => !$manual['adminOnly'] || $isAdmin)));
    }

    public function setReactViewProperties(Request $request)
    {
        return ['manuals' => $this->availableManuals()];
    }

    public function file(Request $request, string $manual)
    {
        $isAdmin = ModulePermissions::isSuperUser(Auth::user());

        $found = collect($this->manuals())
            ->first(fn(array $item) => $item['key'] === $manual && (!$item['adminOnly'] || $isAdmin));

        abort_unless($found, 404, 'El manual solicitado no existe.');

        $path = $this->resolvePath($found['file']);
        abort_unless($path, 404, 'El manual aun no ha sido publicado.');

        $disposition = $request->boolean('download') ? 'attachment' : 'inline';
        $filename = "{$found['title']}.pdf";

        return response()->file($path, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "{$disposition}; filename=\"{$filename}\"",
            'Cache-Control' => 'private, max-age=3600',
        ]);
    }
}
