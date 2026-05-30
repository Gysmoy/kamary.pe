<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            if (!Schema::hasColumn('articles', 'warehouse_id')) {
                $table->foreignId('warehouse_id')
                    ->nullable()
                    ->after(Schema::hasColumn('articles', 'business_id') ? 'business_id' : 'module_scope')
                    ->constrained('warehouses')
                    ->nullOnDelete();
                $table->index(['warehouse_id', 'module_scope', 'status'], 'articles_warehouse_scope_status_idx');
            }
        });
    }

    public function down(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            if (Schema::hasColumn('articles', 'warehouse_id')) {
                $table->dropIndex('articles_warehouse_scope_status_idx');
                $table->dropConstrainedForeignId('warehouse_id');
            }
        });
    }
};
