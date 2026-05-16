<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->alterDecimal('article_presentations', 'price', 'DECIMAL(18,4)', 'NOT NULL DEFAULT 0.0000');
        $this->alterDecimal('article_presentations', 'purchase_price_national', 'DECIMAL(18,4)', 'NULL DEFAULT NULL');
        $this->alterDecimal('article_presentations', 'purchase_price_foreign', 'DECIMAL(18,4)', 'NULL DEFAULT NULL');
        $this->alterDecimal('articles', 'sale_price_national', 'DECIMAL(18,4)', 'NULL DEFAULT NULL');
        $this->alterDecimal('articles', 'purchase_price_national', 'DECIMAL(18,4)', 'NULL DEFAULT NULL');
        $this->alterDecimal('articles', 'purchase_price_foreign', 'DECIMAL(18,4)', 'NULL DEFAULT NULL');
    }

    public function down(): void
    {
        $this->alterDecimal('article_presentations', 'price', 'DECIMAL(12,2)', 'NOT NULL DEFAULT 0.00');
        $this->alterDecimal('article_presentations', 'purchase_price_national', 'DECIMAL(12,2)', 'NULL DEFAULT NULL');
        $this->alterDecimal('article_presentations', 'purchase_price_foreign', 'DECIMAL(12,2)', 'NULL DEFAULT NULL');
        $this->alterDecimal('articles', 'sale_price_national', 'DECIMAL(12,2)', 'NULL DEFAULT NULL');
        $this->alterDecimal('articles', 'purchase_price_national', 'DECIMAL(12,2)', 'NULL DEFAULT NULL');
        $this->alterDecimal('articles', 'purchase_price_foreign', 'DECIMAL(12,2)', 'NULL DEFAULT NULL');
    }

    private function alterDecimal(string $table, string $column, string $type, string $attributes): void
    {
        if (DB::getDriverName() !== 'mysql' || !Schema::hasTable($table) || !Schema::hasColumn($table, $column)) {
            return;
        }

        DB::statement("ALTER TABLE `{$table}` MODIFY COLUMN `{$column}` {$type} {$attributes}");
    }
};
