<?php

use App\Support\BusinessScope;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();
        $userId = DB::table('users')->orderBy('id')->value('id');
        $branchIds = DB::table('business_branches')
            ->join('businesses', 'businesses.id', '=', 'business_branches.business_id')
            ->whereIn('businesses.business_key', BusinessScope::fixedKeys())
            ->whereNotNull('businesses.status')
            ->whereNotNull('business_branches.status')
            ->orderBy('business_branches.id')
            ->pluck('business_branches.id');

        $warehouses = [
            ['name' => 'Almacen A', 'description' => 'Almacen operativo A para pedidos.'],
            ['name' => 'Almacen B', 'description' => 'Almacen operativo B para pedidos.'],
            ['name' => 'Almacen C', 'description' => 'Almacen operativo C para pedidos.'],
            ['name' => 'Almacen D', 'description' => 'Almacen operativo D para pedidos.'],
        ];

        foreach ($branchIds as $branchId) {
            foreach ($warehouses as $warehouse) {
                $exists = DB::table('warehouses')
                    ->where('business_branch_id', $branchId)
                    ->whereRaw('LOWER(name) = ?', [mb_strtolower($warehouse['name'])])
                    ->exists();

                if ($exists) {
                    continue;
                }

                DB::table('warehouses')->insert([
                    'business_branch_id' => $branchId,
                    'name' => $warehouse['name'],
                    'description' => $warehouse['description'],
                    'status' => true,
                    'created_by' => $userId,
                    'updated_by' => $userId,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }

    public function down(): void
    {
        DB::table('warehouses')
            ->whereIn('name', ['Almacen A', 'Almacen B', 'Almacen C', 'Almacen D'])
            ->delete();
    }
};
