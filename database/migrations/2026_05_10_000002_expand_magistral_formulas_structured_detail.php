<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('magistral_formulas', function (Blueprint $table) {
            foreach ($this->structuredColumns() as $column) {
                if (!Schema::hasColumn('magistral_formulas', $column)) {
                    $table->longText($column)->nullable()->after('detail');
                }
            }
        });

        Schema::table('magistral_formula_histories', function (Blueprint $table) {
            if (!Schema::hasColumn('magistral_formula_histories', 'change_reason')) {
                $table->text('change_reason')->nullable()->after('detail');
            }

            foreach ($this->structuredColumns() as $column) {
                if (!Schema::hasColumn('magistral_formula_histories', $column)) {
                    $table->longText($column)->nullable()->after('change_reason');
                }
            }

            if (!Schema::hasColumn('magistral_formula_histories', 'items_snapshot')) {
                $table->json('items_snapshot')->nullable()->after('others');
            }
        });

        if (!Schema::hasTable('magistral_formula_items')) {
            Schema::create('magistral_formula_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('magistral_formula_id')->constrained('magistral_formulas', 'id', 'mag_formula_items_formula_fk')->cascadeOnDelete();
                $table->foreignId('article_id')->nullable()->constrained('articles')->nullOnDelete();
                $table->decimal('total_units', 14, 3)->default(0);
                $table->string('code')->nullable();
                $table->string('description')->nullable();
                $table->decimal('quantity', 14, 3)->default(0);
                $table->string('presentation', 80)->nullable();
                $table->decimal('total_quantity', 14, 3)->default(0);
                $table->decimal('unit_price', 12, 2)->default(0);
                $table->decimal('subtotal', 12, 2)->default(0);
                $table->boolean('status')->nullable()->default(true)->index();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('magistral_formula_items');

        Schema::table('magistral_formula_histories', function (Blueprint $table) {
            foreach (array_merge(['change_reason'], $this->structuredColumns(), ['items_snapshot']) as $column) {
                if (Schema::hasColumn('magistral_formula_histories', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::table('magistral_formulas', function (Blueprint $table) {
            foreach ($this->structuredColumns() as $column) {
                if (Schema::hasColumn('magistral_formulas', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
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
