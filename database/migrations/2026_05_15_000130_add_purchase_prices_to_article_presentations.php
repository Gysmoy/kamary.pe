<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('article_presentations', function (Blueprint $table) {
            if (!Schema::hasColumn('article_presentations', 'purchase_price_national')) {
                $table->decimal('purchase_price_national', 12, 2)->nullable()->after('price');
            }
            if (!Schema::hasColumn('article_presentations', 'purchase_price_foreign')) {
                $table->decimal('purchase_price_foreign', 12, 2)->nullable()->after('purchase_price_national');
            }
        });
    }

    public function down(): void
    {
        Schema::table('article_presentations', function (Blueprint $table) {
            foreach (['purchase_price_foreign', 'purchase_price_national'] as $column) {
                if (Schema::hasColumn('article_presentations', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
