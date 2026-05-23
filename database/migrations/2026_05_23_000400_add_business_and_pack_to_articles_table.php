<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            if (!Schema::hasColumn('articles', 'business_id')) {
                $table->foreignId('business_id')
                    ->nullable()
                    ->after('module_scope')
                    ->constrained('businesses')
                    ->nullOnDelete();
                $table->index(['business_id', 'module_scope', 'status'], 'articles_business_scope_status_idx');
            }

            if (!Schema::hasColumn('articles', 'is_pack')) {
                $table->boolean('is_pack')->default(false)->after('unit_weight');
            }
        });
    }

    public function down(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            if (Schema::hasColumn('articles', 'is_pack')) {
                $table->dropColumn('is_pack');
            }

            if (Schema::hasColumn('articles', 'business_id')) {
                $table->dropIndex('articles_business_scope_status_idx');
                $table->dropConstrainedForeignId('business_id');
            }
        });
    }
};
