<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('articles', 'client_id')) {
            Schema::table('articles', function (Blueprint $table) {
                $table->foreignId('client_id')->nullable()->after('module_scope')->constrained('clients')->nullOnDelete();
                $table->index(['client_id', 'module_scope', 'status'], 'articles_storage_client_scope_idx');
            });
        }

        if (!Schema::hasTable('storage_product_lots')) {
            Schema::create('storage_product_lots', function (Blueprint $table) {
                $table->id();
                $table->foreignId('article_id')->constrained('articles')->cascadeOnDelete();
                $table->string('lot', 80);
                $table->date('expiration_date')->nullable();
                $table->string('storage_condition', 60)->nullable();
                $table->foreignId('manufacturer_id')->nullable()->constrained('laboratories')->nullOnDelete();
                $table->boolean('status')->nullable()->default(true);
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->index(['article_id', 'status'], 'storage_product_lots_article_status_idx');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('storage_product_lots');

        if (Schema::hasColumn('articles', 'client_id')) {
            Schema::table('articles', function (Blueprint $table) {
                $table->dropIndex('articles_storage_client_scope_idx');
                $table->dropConstrainedForeignId('client_id');
            });
        }
    }
};
