<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private string $warehouseName = 'Almacen Muestras';

    public function up(): void
    {
        if (!Schema::hasTable('businesses') || !Schema::hasTable('business_branches') || !Schema::hasTable('warehouses')) {
            return;
        }

        $businessId = DB::table('businesses')->where('business_key', 'kamary_peru')->value('id');
        if (!$businessId) return;

        // Primera sede activa de Kamary Peru (la Principal)
        $branchId = DB::table('business_branches')
            ->where('business_id', $businessId)
            ->whereNotNull('status')
            ->orderBy('id')
            ->value('id');
        if (!$branchId) return;

        $userId = Schema::hasTable('users') ? DB::table('users')->orderBy('id')->value('id') : null;

        $existingId = DB::table('warehouses')
            ->where('business_branch_id', $branchId)
            ->where('name', $this->warehouseName)
            ->value('id');

        if ($existingId) {
            DB::table('warehouses')->where('id', $existingId)->update([
                'description' => 'Almacen fijo del modulo Muestras.',
                'status' => 1,
                'updated_at' => now(),
            ]);
            return;
        }

        DB::table('warehouses')->insert([
            'business_branch_id' => $branchId,
            'name' => $this->warehouseName,
            'description' => 'Almacen fijo del modulo Muestras.',
            'status' => 1,
            'created_by' => $userId,
            'updated_by' => $userId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        //
    }
};
