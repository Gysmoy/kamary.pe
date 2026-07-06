<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    /**
     * Al unificar los catalogos de Magistrales (Unidad, Proveedor, Laboratorio) con
     * los generales de Almacen, se concede el permiso general a todo rol que tuviera
     * el permiso magistrales equivalente (especifico o agrupador), para que ningun rol
     * pierda acceso a los catalogos ni a los combos de Articulos / O. Compra.
     */
    public function up(): void
    {
        $grants = [
            'units-of-measure' => ['magistrales-unit', 'magistrales-products'],
            'suppliers'        => ['magistrales-supplier', 'magistrales-procurement'],
            'laboratories'     => ['magistrales-laboratory', 'magistrales-products'],
        ];

        $adminRoleIds = DB::table('roles')
            ->whereRaw('LOWER(name) = ?', ['admin'])
            ->pluck('id');

        foreach ($grants as $targetPermission => $sourcePermissions) {
            $targetId = DB::table('permissions')->where('name', $targetPermission)->value('id');
            if (!$targetId) {
                continue;
            }

            $roleIds = DB::table('role_has_permissions as role_permissions')
                ->join('permissions', 'permissions.id', '=', 'role_permissions.permission_id')
                ->whereIn('permissions.name', $sourcePermissions)
                ->pluck('role_permissions.role_id')
                ->merge($adminRoleIds)
                ->unique()
                ->values();

            foreach ($roleIds as $roleId) {
                $exists = DB::table('role_has_permissions')
                    ->where('role_id', $roleId)
                    ->where('permission_id', $targetId)
                    ->exists();

                if (!$exists) {
                    DB::table('role_has_permissions')->insert([
                        'role_id' => $roleId,
                        'permission_id' => $targetId,
                    ]);
                }
            }
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        // No-op: no se revoca el acceso general concedido (puede estar en uso legitimo).
    }
};
