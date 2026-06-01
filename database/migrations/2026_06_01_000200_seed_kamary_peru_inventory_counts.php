<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const BUSINESS_KEY = 'kamary_peru';
    private const MIN_ROWS = 10;

    public function up(): void
    {
        if (
            !Schema::hasTable('inventory_counts')
            || !Schema::hasTable('inventory_count_items')
            || !Schema::hasTable('businesses')
            || !Schema::hasTable('business_branches')
            || !Schema::hasTable('warehouses')
        ) {
            return;
        }

        $business = DB::table('businesses')
            ->where('business_key', self::BUSINESS_KEY)
            ->whereNotNull('status')
            ->first(['id']);

        if (!$business) {
            return;
        }

        if (DB::table('inventory_counts')->where('business_id', $business->id)->whereNotNull('status')->exists()) {
            return;
        }

        $warehouses = DB::table('warehouses')
            ->join('business_branches as branch', 'branch.id', '=', 'warehouses.business_branch_id')
            ->where('branch.business_id', $business->id)
            ->whereNotNull('branch.status')
            ->whereNotNull('warehouses.status')
            ->orderBy('warehouses.id')
            ->get(['warehouses.id', 'warehouses.business_branch_id', 'warehouses.name']);

        if ($warehouses->isEmpty()) {
            return;
        }

        $laboratories = Schema::hasTable('laboratories')
            ? DB::table('laboratories')->whereNotNull('status')->orderBy('id')->get(['id', 'name'])
            : collect();

        $articles = $this->articles($warehouses->pluck('id')->all());
        $userId = Schema::hasTable('users') ? DB::table('users')->orderBy('id')->value('id') : null;
        $now = now();

        for ($index = 0; $index < self::MIN_ROWS; $index++) {
            $warehouse = $warehouses[$index % $warehouses->count()];
            $laboratory = $laboratories->isNotEmpty() ? $laboratories[$index % $laboratories->count()] : null;
            $article = $articles->isNotEmpty() ? $articles[$index % $articles->count()] : null;
            $systemStock = round(8 + ($index * 1.75), 3);
            $costUnit = round(12.5 + ($index * 2.15), 4);

            $countId = DB::table('inventory_counts')->insertGetId($this->payload('inventory_counts', [
                'code' => $this->nextCode(),
                'business_id' => $business->id,
                'business_branch_id' => $warehouse->business_branch_id,
                'warehouse_id' => $warehouse->id,
                'laboratory_id' => $laboratory?->id,
                'count_date' => $now->copy()->subDays(self::MIN_ROWS - $index)->toDateString(),
                'inventory_status' => 'Sin diferencias',
                'status' => true,
                'created_by' => $userId,
                'updated_by' => $userId,
                'created_at' => $now,
                'updated_at' => $now,
            ]));

            $itemLaboratory = ($article?->laboratory_name ?? '') ?: ($laboratory?->name ?? null);
            $articleCode = ($article?->code ?? '') ?: 'ART-DEMO-' . str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT);
            $articleName = ($article?->name ?? '') ?: 'Articulo demo inventario ' . ($index + 1);
            $unitLabel = ($article?->unit_label ?? '') ?: 'UND';

            DB::table('inventory_count_items')->insert($this->payload('inventory_count_items', [
                'inventory_count_id' => $countId,
                'source_key' => 'demo-inventory-' . $countId,
                'article_id' => $article?->id,
                'warehouse_id' => $warehouse->id,
                'lot' => 'DEMO-' . str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT),
                'expiration_date' => $now->copy()->addMonths(6 + $index)->toDateString(),
                'article_code' => $articleCode,
                'article_name' => $articleName,
                'laboratory_name' => $itemLaboratory,
                'unit_label' => $unitLabel,
                'location' => 'RACK-' . str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT),
                'system_stock' => $systemStock,
                'real_stock' => $systemStock,
                'difference' => 0,
                'cost_unit' => $costUnit,
                'total_cost' => round($systemStock * $costUnit, 2),
                'status' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]));
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('inventory_counts') || !Schema::hasTable('inventory_count_items')) {
            return;
        }

        $ids = DB::table('inventory_counts')
            ->where('code', 'like', 'IP%')
            ->where('inventory_status', 'Sin diferencias')
            ->whereIn('id', function ($query) {
                $query->select('inventory_count_id')
                    ->from('inventory_count_items')
                    ->where('source_key', 'like', 'demo-inventory-%');
            })
            ->pluck('id');

        if ($ids->isEmpty()) {
            return;
        }

        if (Schema::hasTable('inventory_count_items')) {
            DB::table('inventory_count_items')->whereIn('inventory_count_id', $ids)->delete();
        }

        DB::table('inventory_counts')->whereIn('id', $ids)->delete();
    }

    private function articles(array $warehouseIds)
    {
        if (!Schema::hasTable('articles')) {
            return collect();
        }

        $query = DB::table('articles as article')
            ->whereNotNull('article.status')
            ->when(Schema::hasColumn('articles', 'warehouse_id'), fn($query) => $query->whereIn('article.warehouse_id', $warehouseIds))
            ->when(Schema::hasColumn('articles', 'module_scope'), function ($query) {
                $query->where(function ($scope) {
                    $scope->where('article.module_scope', 'standard')->orWhereNull('article.module_scope');
                });
            });

        $selects = ['article.id', 'article.code', 'article.name'];

        if (
            Schema::hasTable('laboratories')
            && Schema::hasColumn('articles', 'laboratory_id')
            && Schema::hasColumn('laboratories', 'name')
        ) {
            $query->leftJoin('laboratories as laboratory', 'laboratory.id', '=', 'article.laboratory_id');
            $selects[] = 'laboratory.name as laboratory_name';
        } else {
            $selects[] = DB::raw('NULL as laboratory_name');
        }

        if (
            Schema::hasTable('units')
            && Schema::hasColumn('articles', 'unit_id')
        ) {
            $query->leftJoin('units as unit', 'unit.id', '=', 'article.unit_id');
            $selects[] = DB::raw('COALESCE(unit.symbol, unit.name, "") as unit_label');
        } else {
            $selects[] = DB::raw('NULL as unit_label');
        }

        return $query->orderBy('article.id')
            ->limit(self::MIN_ROWS)
            ->get($selects);
    }

    private function nextCode(): string
    {
        $next = 1;
        $latest = DB::table('inventory_counts')->latest('id')->value('code');
        if ($latest && preg_match('/(\d+)$/', (string) $latest, $matches)) {
            $next = ((int) $matches[1]) + 1;
        }

        do {
            $code = 'IP' . str_pad((string) $next, 5, '0', STR_PAD_LEFT);
            $next++;
        } while (DB::table('inventory_counts')->where('code', $code)->exists());

        return $code;
    }

    private function payload(string $table, array $payload): array
    {
        return array_filter(
            $payload,
            fn($value, string $column) => Schema::hasColumn($table, $column),
            ARRAY_FILTER_USE_BOTH
        );
    }
};
