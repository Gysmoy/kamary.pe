<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->alterDecimal('article_presentations', 'units', 'DECIMAL(18,6)', '1.000000');
        $this->alterDecimal('order_items', 'presentation_units', 'DECIMAL(18,6)', '1.000000');
        $this->alterDecimal('commercial_order_items', 'presentation_units', 'DECIMAL(18,6)', '1.000000');
    }

    public function down(): void
    {
        $this->alterDecimal('article_presentations', 'units', 'DECIMAL(12,3)', '1.000');
        $this->alterDecimal('order_items', 'presentation_units', 'DECIMAL(12,3)', '1.000');
        $this->alterDecimal('commercial_order_items', 'presentation_units', 'DECIMAL(12,3)', '1.000');
    }

    private function alterDecimal(string $table, string $column, string $type, string $default): void
    {
        if (DB::getDriverName() !== 'mysql' || !Schema::hasTable($table) || !Schema::hasColumn($table, $column)) {
            return;
        }

        DB::statement("ALTER TABLE `{$table}` MODIFY COLUMN `{$column}` {$type} NOT NULL DEFAULT {$default}");
    }
};
