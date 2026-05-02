<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $permissionGroups = [
            'magistrales-products' => [
                'beauty_name' => 'Magistrales / Productos',
                'source_permissions' => [
                    'articles',
                    'batches',
                    'laboratories',
                    'units-of-measure',
                    'magistrales-articles',
                    'magistrales-category',
                    'magistrales-formats',
                    'magistrales-formulas',
                    'magistrales-laboratory',
                    'magistrales-unit',
                ],
            ],
            'magistrales-procurement' => [
                'beauty_name' => 'Magistrales / Proveedores y compras',
                'source_permissions' => [
                    'suppliers',
                    'purchase-orders',
                    'purchase-receipts',
                    'accounts-payable',
                    'magistrales-incomes',
                    'magistrales-purchase-order',
                    'magistrales-supplier',
                ],
            ],
            'magistrales-warehouse' => [
                'beauty_name' => 'Magistrales / Almacen',
                'source_permissions' => [
                    'inventory',
                    'kardex',
                    'entry-note',
                    'exit-note',
                    'magistrales-inventory',
                    'magistrales-kardex',
                    'magistrales-outputs',
                    'magistrales-production-order',
                    'magistrales-responsible',
                ],
            ],
            'magistrales-billing' => [
                'beauty_name' => 'Magistrales / Facturacion',
                'source_permissions' => [
                    'businesses',
                    'services-billing',
                    'magistrales-sales',
                ],
            ],
        ];

        $adminRoleIds = DB::table('roles')
            ->whereRaw('LOWER(name) = ?', ['admin'])
            ->pluck('id');

        foreach ($permissionGroups as $permissionName => $config) {
            $permissionId = DB::table('permissions')->where('name', $permissionName)->value('id');

            if ($permissionId) {
                DB::table('permissions')
                    ->where('id', $permissionId)
                    ->update([
                        'beauty_name' => $config['beauty_name'],
                        'updated_at' => now(),
                    ]);
            } else {
                $permissionId = DB::table('permissions')->insertGetId([
                    'name' => $permissionName,
                    'beauty_name' => $config['beauty_name'],
                    'guard_name' => 'web',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            $roleIds = DB::table('role_has_permissions as role_permissions')
                ->join('permissions as permissions', 'permissions.id', '=', 'role_permissions.permission_id')
                ->whereIn('permissions.name', $config['source_permissions'])
                ->pluck('role_permissions.role_id')
                ->merge($adminRoleIds)
                ->unique()
                ->values();

            foreach ($roleIds as $roleId) {
                $exists = DB::table('role_has_permissions')
                    ->where('role_id', $roleId)
                    ->where('permission_id', $permissionId)
                    ->exists();

                if (!$exists) {
                    DB::table('role_has_permissions')->insert([
                        'role_id' => $roleId,
                        'permission_id' => $permissionId,
                    ]);
                }
            }
        }
    }

    public function down(): void
    {
        $permissionIds = DB::table('permissions')
            ->whereIn('name', [
                'magistrales-products',
                'magistrales-procurement',
                'magistrales-warehouse',
                'magistrales-billing',
            ])
            ->pluck('id');

        if ($permissionIds->isEmpty()) {
            return;
        }

        DB::table('role_has_permissions')
            ->whereIn('permission_id', $permissionIds)
            ->delete();

        DB::table('permissions')
            ->whereIn('id', $permissionIds)
            ->delete();
    }
};
