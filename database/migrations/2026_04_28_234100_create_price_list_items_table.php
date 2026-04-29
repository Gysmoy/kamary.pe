<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('price_list_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('price_list_id')->constrained('price_lists')->cascadeOnDelete();
            $table->foreignId('article_id')->nullable()->constrained('articles')->nullOnDelete();
            $table->foreignId('laboratory_id')->nullable()->constrained('laboratories')->nullOnDelete();
            $table->string('category', 120)->nullable();
            $table->string('subcategory', 120)->nullable();
            $table->decimal('fixed_price', 12, 4)->nullable();
            $table->decimal('margin_percent', 8, 3)->nullable();
            $table->decimal('minimum_quantity', 12, 3)->default(1);
            $table->boolean('status')->nullable()->default(true);
            $table->timestamps();

            $table->index(['price_list_id', 'article_id'], 'price_list_items_article_idx');
            $table->index(['price_list_id', 'laboratory_id'], 'price_list_items_lab_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('price_list_items');
    }
};
