<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $adminRoleIds = DB::table('roles')
            ->whereRaw('LOWER(name) = ?', ['admin'])
            ->pluck('id');

        if ($adminRoleIds->isEmpty()) {
            return;
        }

        $permissionIds = DB::table('permissions')
            ->whereIn('name', ['accounts-payable', 'purchase-orders', 'purchase-receipts'])
            ->pluck('id');

        foreach ($adminRoleIds as $roleId) {
            foreach ($permissionIds as $permissionId) {
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

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $adminRoleIds = DB::table('roles')
            ->whereRaw('LOWER(name) = ?', ['admin'])
            ->pluck('id');

        if ($adminRoleIds->isEmpty()) {
            return;
        }

        $permissionIds = DB::table('permissions')
            ->whereIn('name', ['accounts-payable', 'purchase-orders', 'purchase-receipts'])
            ->pluck('id');

        DB::table('role_has_permissions')
            ->whereIn('role_id', $adminRoleIds)
            ->whereIn('permission_id', $permissionIds)
            ->delete();
    }
};
