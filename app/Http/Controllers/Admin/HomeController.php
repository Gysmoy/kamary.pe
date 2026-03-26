<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class HomeController extends BasicController
{
    public $reactView = 'Admin/Home';
    public $reactRootView = 'admin';

    public function setReactViewProperties(Request $request)
    {
        return [
            'metrics' => [
                [
                    'key' => 'articles',
                    'label' => 'Articulos',
                    'value' => $this->countRows('articles'),
                    'icon' => 'ti ti-box',
                    'route' => '/admin/articles',
                    'color' => 'primary',
                ],
                [
                    'key' => 'laboratories',
                    'label' => 'Laboratorios',
                    'value' => $this->countRows('laboratories'),
                    'icon' => 'ti ti-flask',
                    'route' => '/admin/laboratories',
                    'color' => 'info',
                ],
                [
                    'key' => 'units',
                    'label' => 'Und. de medida',
                    'value' => $this->countRows('units'),
                    'icon' => 'ti ti-ruler-measure',
                    'route' => '/admin/units',
                    'color' => 'success',
                ],
                [
                    'key' => 'suppliers',
                    'label' => 'Proveedores',
                    'value' => $this->countRows('suppliers'),
                    'icon' => 'ti ti-truck-delivery',
                    'route' => '/admin/suppliers',
                    'color' => 'warning',
                ],
                [
                    'key' => 'users',
                    'label' => 'Usuarios',
                    'value' => $this->countRows('users'),
                    'icon' => 'ti ti-users',
                    'route' => '/admin/users',
                    'color' => 'secondary',
                ],
                [
                    'key' => 'roles',
                    'label' => 'Roles',
                    'value' => $this->countRows('roles'),
                    'icon' => 'ti ti-user-check',
                    'route' => '/admin/roles',
                    'color' => 'dark',
                ],
            ],
        ];
    }

    private function countRows(string $table): ?int
    {
        if (!Schema::hasTable($table)) return null;

        $query = DB::table($table);
        if (Schema::hasColumn($table, 'status')) {
            $query->whereNotNull('status');
        }

        return $query->count();
    }
}
