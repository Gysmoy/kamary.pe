<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Support\ModulePermissions;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class DocumentationController extends BasicController
{
    public $reactView = 'Admin/Documentation';

    /**
     * Manuales publicados. Para agregar uno nuevo basta con dejar el PDF en
     * storage/app/docs y sumar una entrada aqui.
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
                'file' => 'docs/manual-uso.pdf',
                'adminOnly' => false,
            ],
            [
                'key' => 'programador',
                'title' => 'Manual del Programador',
                'description' => 'Documentacion tecnica: arquitectura, contratos de codigo, servicios, integraciones y despliegue.',
                'audience' => 'Equipo de desarrollo',
                'version' => 'v2.0 · jul 2026',
                'file' => 'docs/manual-programador.pdf',
                'adminOnly' => true,
            ],
        ];
    }

    private function availableManuals(): array
    {
        $isAdmin = ModulePermissions::isSuperUser(Auth::user());

        return array_values(array_map(function (array $manual) {
            return [
                'key' => $manual['key'],
                'title' => $manual['title'],
                'description' => $manual['description'],
                'audience' => $manual['audience'],
                'version' => $manual['version'],
                'available' => Storage::exists($manual['file']),
                'size' => Storage::exists($manual['file'])
                    ? round(Storage::size($manual['file']) / 1024 / 1024, 1)
                    : null,
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
        abort_unless(Storage::exists($found['file']), 404, 'El manual aun no ha sido publicado.');

        $disposition = $request->boolean('download') ? 'attachment' : 'inline';
        $filename = "{$found['title']}.pdf";

        return response(Storage::get($found['file']), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "{$disposition}; filename=\"{$filename}\"",
            'Cache-Control' => 'private, max-age=3600',
        ]);
    }
}
