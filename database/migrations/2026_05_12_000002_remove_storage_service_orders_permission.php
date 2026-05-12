<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('permissions')) return;

        $permission = DB::table('permissions')->where('name', 'service-orders')->first();
        if (!$permission) return;

        if (Schema::hasTable('role_has_permissions')) {
            DB::table('role_has_permissions')->where('permission_id', $permission->id)->delete();
        }
        if (Schema::hasTable('model_has_permissions')) {
            DB::table('model_has_permissions')->where('permission_id', $permission->id)->delete();
        }

        DB::table('permissions')->where('id', $permission->id)->delete();
    }

    public function down(): void
    {
    }
};
