<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!$this->columnExists('articles', 'warehouse_id')) {
            Schema::table('articles', function (Blueprint $table) {
                $table->foreignId('warehouse_id')
                    ->nullable()
                    ->after($this->columnExists('articles', 'business_id') ? 'business_id' : 'module_scope')
                    ->constrained('warehouses')
                    ->nullOnDelete();
            });
        }

        if (
            $this->columnExists('articles', 'warehouse_id')
            && $this->columnExists('articles', 'module_scope')
            && $this->columnExists('articles', 'status')
            && !$this->indexExists('articles', 'articles_warehouse_scope_status_idx')
        ) {
            Schema::table('articles', function (Blueprint $table) {
                $table->index(['warehouse_id', 'module_scope', 'status'], 'articles_warehouse_scope_status_idx');
            });
        }

        if (
            $this->columnExists('articles', 'warehouse_id')
            && !$this->foreignKeyExists('articles', 'articles_warehouse_id_foreign')
            && !$this->hasInvalidWarehouseReferences()
        ) {
            Schema::table('articles', function (Blueprint $table) {
                $table->foreign('warehouse_id', 'articles_warehouse_id_foreign')
                    ->references('id')
                    ->on('warehouses')
                    ->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if ($this->columnExists('articles', 'warehouse_id')) {
            Schema::table('articles', function (Blueprint $table) {
                if ($this->indexExists('articles', 'articles_warehouse_scope_status_idx')) {
                    $table->dropIndex('articles_warehouse_scope_status_idx');
                }

                if ($this->foreignKeyExists('articles', 'articles_warehouse_id_foreign')) {
                    $table->dropForeign('articles_warehouse_id_foreign');
                }

                $table->dropColumn('warehouse_id');
            });
        }
    }

    private function columnExists(string $table, string $column): bool
    {
        return DB::table('information_schema.columns')
            ->where('table_schema', DB::raw('DATABASE()'))
            ->where('table_name', $table)
            ->where('column_name', $column)
            ->exists();
    }

    private function indexExists(string $table, string $index): bool
    {
        return DB::table('information_schema.statistics')
            ->where('table_schema', DB::raw('DATABASE()'))
            ->where('table_name', $table)
            ->where('index_name', $index)
            ->exists();
    }

    private function foreignKeyExists(string $table, string $foreignKey): bool
    {
        return DB::table('information_schema.table_constraints')
            ->where('constraint_schema', DB::raw('DATABASE()'))
            ->where('table_name', $table)
            ->where('constraint_name', $foreignKey)
            ->where('constraint_type', 'FOREIGN KEY')
            ->exists();
    }

    private function hasInvalidWarehouseReferences(): bool
    {
        return DB::table('articles')
            ->leftJoin('warehouses', 'warehouses.id', '=', 'articles.warehouse_id')
            ->whereNotNull('articles.warehouse_id')
            ->whereNull('warehouses.id')
            ->exists();
    }
};
