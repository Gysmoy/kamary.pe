<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('articles', 'is_corporate_catalog')) {
            Schema::table('articles', function (Blueprint $table) {
                if (Schema::hasColumn('articles', 'is_pack')) {
                    $table->boolean('is_corporate_catalog')->default(false)->after('is_pack');
                    return;
                }

                $table->boolean('is_corporate_catalog')->default(false);
            });
        }

        if (!Schema::hasTable('article_pack_components')) {
            Schema::create('article_pack_components', function (Blueprint $table) {
                $table->id();
                $table->foreignId('pack_article_id')->constrained('articles')->cascadeOnDelete();
                $table->foreignId('component_article_id')->constrained('articles')->cascadeOnDelete();
                $table->decimal('quantity', 18, 6)->default(1);
                $table->boolean('status')->nullable()->default(true);
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->unique(['pack_article_id', 'component_article_id'], 'article_pack_component_unique');
                $table->index(['component_article_id', 'status'], 'article_pack_component_component_status_idx');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('article_pack_components');

        if (Schema::hasColumn('articles', 'is_corporate_catalog')) {
            Schema::table('articles', function (Blueprint $table) {
                $table->dropColumn('is_corporate_catalog');
            });
        }
    }
};
