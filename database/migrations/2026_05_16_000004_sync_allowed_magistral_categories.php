<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private array $categories = [
        ['code' => 'MAG-CAT-001', 'description' => 'Capsulas'],
        ['code' => 'MAG-CAT-002', 'description' => 'Cosmetica'],
        ['code' => 'MAG-CAT-003', 'description' => 'Dermatologia'],
        ['code' => 'MAG-CAT-004', 'description' => 'Dolor'],
        ['code' => 'MAG-CAT-005', 'description' => 'Gastroenterologia'],
        ['code' => 'MAG-CAT-006', 'description' => 'Pediatria'],
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
            $matches = DB::table('magistral_categories')
                ->whereRaw('LOWER(TRIM(description)) = ?', [mb_strtolower($category['description'])])
                ->orderBy('id')
                ->get();

            if ($matches->isNotEmpty()) {
                $primary = $matches->first();
                $activeIds[] = $primary->id;

                DB::table('magistral_categories')
                    ->where('id', $primary->id)
                    ->update([
                        'description' => $category['description'],
                        'status' => true,
                        'updated_by' => $userId,
                        'updated_at' => now(),
                    ]);

                $duplicateIds = $matches->pluck('id')->filter(fn($id) => (int)$id !== (int)$primary->id)->values();
                if ($duplicateIds->isNotEmpty()) {
                    DB::table('magistral_categories')
                        ->whereIn('id', $duplicateIds)
                        ->update([
                            'status' => null,
                            'updated_by' => $userId,
                            'updated_at' => now(),
                        ]);
                }

                continue;
            }

            $activeIds[] = DB::table('magistral_categories')->insertGetId([
                'code' => $this->availableCode($category['code']),
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

    private function availableCode(string $baseCode): string
    {
        $code = $baseCode;
        $suffix = 2;

        while (DB::table('magistral_categories')->where('code', $code)->exists()) {
            $code = $baseCode . '-' . $suffix;
            $suffix++;
        }

        return $code;
    }
};
