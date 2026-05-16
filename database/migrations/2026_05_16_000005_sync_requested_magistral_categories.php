<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private array $categories = [
        ['code' => 'MAG-CAT-001', 'description' => 'GINECOLOGIA'],
        ['code' => 'MAG-CAT-002', 'description' => 'INSUMOS'],
        ['code' => 'MAG-CAT-003', 'description' => 'ANDROLOGIA'],
    ];

    public function up(): void
    {
        if (!Schema::hasTable('magistral_categories')) {
            return;
        }

        $activeIds = [];
        $userId = Schema::hasTable('users') ? DB::table('users')->value('id') : null;
        $warehouseId = Schema::hasTable('warehouses') ? DB::table('warehouses')->value('id') : null;

        foreach ($this->categories as $category) {
            $row = DB::table('magistral_categories')->where('code', $category['code'])->first()
                ?? DB::table('magistral_categories')
                    ->whereRaw('LOWER(TRIM(description)) = ?', [mb_strtolower($category['description'])])
                    ->orderBy('id')
                    ->first();

            if ($row) {
                DB::table('magistral_categories')
                    ->where('id', $row->id)
                    ->update([
                        'code' => $category['code'],
                        'description' => $category['description'],
                        'status' => true,
                        'updated_by' => $userId,
                        'updated_at' => now(),
                    ]);

                $activeIds[] = $row->id;
            } else {
                $activeIds[] = DB::table('magistral_categories')->insertGetId([
                    'code' => $category['code'],
                    'description' => $category['description'],
                    'warehouse_id' => $warehouseId,
                    'sale_material' => false,
                    'status' => true,
                    'created_by' => $userId,
                    'updated_by' => $userId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        DB::table('magistral_categories')
            ->whereNotIn('id', $activeIds)
            ->update([
                'status' => null,
                'updated_by' => $userId,
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        if (!Schema::hasTable('magistral_categories')) {
            return;
        }

        DB::table('magistral_categories')->update([
            'status' => true,
            'updated_at' => now(),
        ]);
    }

};
