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
        $permissionId = DB::table('permissions')->where('name', 'purchase-orders')->value('id');

        if (!$permissionId) {
            $permissionId = DB::table('permissions')->insertGetId([
                'name' => 'purchase-orders',
                'beauty_name' => 'Ordenes de compra',
                'guard_name' => 'web',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $adminRoleId = DB::table('roles')->whereRaw('LOWER(name) = ?', ['admin'])->value('id');
        if ($adminRoleId) {
            $exists = DB::table('role_has_permissions')
                ->where('role_id', $adminRoleId)
                ->where('permission_id', $permissionId)
                ->exists();

            if (!$exists) {
                DB::table('role_has_permissions')->insert([
                    'role_id' => $adminRoleId,
                    'permission_id' => $permissionId,
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $permissionId = DB::table('permissions')->where('name', 'purchase-orders')->value('id');
        if (!$permissionId) return;

        DB::table('role_has_permissions')->where('permission_id', $permissionId)->delete();
        DB::table('permissions')->where('id', $permissionId)->delete();
    }
};
