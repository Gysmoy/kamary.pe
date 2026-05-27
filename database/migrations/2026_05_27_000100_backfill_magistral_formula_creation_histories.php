<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('magistral_formulas') || !Schema::hasTable('magistral_formula_histories')) {
            return;
        }

        $hasItems = Schema::hasTable('magistral_formula_items');
        $hasChangeReason = Schema::hasColumn('magistral_formula_histories', 'change_reason');
        $hasItemsSnapshot = Schema::hasColumn('magistral_formula_histories', 'items_snapshot');
        $structuredColumns = array_values(array_filter($this->structuredColumns(), fn($column) => (
            Schema::hasColumn('magistral_formulas', $column)
            && Schema::hasColumn('magistral_formula_histories', $column)
        )));

        DB::table('magistral_formulas')
            ->select('magistral_formulas.*')
            ->leftJoin('magistral_formula_histories as history', 'history.magistral_formula_id', '=', 'magistral_formulas.id')
            ->whereNull('history.id')
            ->orderBy('magistral_formulas.id')
            ->chunkById(100, function ($formulas) use ($hasItems, $hasChangeReason, $hasItemsSnapshot, $structuredColumns) {
                foreach ($formulas as $formula) {
                    $timestamp = $formula->created_at ?: ($formula->last_edited_at ?: now());
                    $history = [
                        'magistral_formula_id' => $formula->id,
                        'article_id' => $formula->article_id,
                        'detail' => $formula->detail,
                        'edited_by' => $formula->created_by ?: $formula->last_edited_by ?: $formula->updated_by,
                        'created_at' => $timestamp,
                        'updated_at' => $timestamp,
                    ];

                    if ($hasChangeReason) {
                        $history['change_reason'] = 'Creacion de formula';
                    }

                    foreach ($structuredColumns as $column) {
                        $history[$column] = $formula->{$column} ?? null;
                    }

                    if ($hasItemsSnapshot) {
                        $items = $hasItems
                            ? DB::table('magistral_formula_items')
                                ->where('magistral_formula_id', $formula->id)
                                ->orderBy('id')
                                ->get([
                                    'article_id',
                                    'total_units',
                                    'code',
                                    'description',
                                    'quantity',
                                    'presentation',
                                    'total_quantity',
                                    'unit_price',
                                    'subtotal',
                                ])
                                ->map(fn($item) => (array) $item)
                                ->values()
                                ->all()
                            : [];
                        $history['items_snapshot'] = json_encode($items);
                    }

                    DB::table('magistral_formula_histories')->insert($history);
                }
            }, 'magistral_formulas.id', 'id');
    }

    public function down(): void
    {
        // No eliminamos historiales en rollback para no borrar auditoria real de produccion.
    }

    private function structuredColumns(): array
    {
        return [
            'special_preparation_conditions',
            'specialized_equipment',
            'preparation_instructions',
            'preparation_method',
            'conservation',
            'stability',
            'usage',
            'others',
        ];
    }
};
