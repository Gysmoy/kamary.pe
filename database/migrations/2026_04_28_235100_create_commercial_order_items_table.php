<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commercial_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('commercial_order_id')->constrained('commercial_orders')->cascadeOnDelete();
            $table->foreignId('article_id')->constrained('articles');
            $table->foreignId('presentation_id')->nullable()->constrained('article_presentations')->nullOnDelete();
            $table->foreignId('warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();
            $table->foreignId('price_list_item_id')->nullable()->constrained('price_list_items')->nullOnDelete();
            $table->decimal('stock_available', 12, 3)->default(0);
            $table->decimal('cost_unit', 12, 4)->default(0);
            $table->decimal('price_unit', 12, 4)->default(0);
            $table->decimal('presentation_units', 12, 3)->default(1);
            $table->decimal('quantity', 12, 3)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            $table->string('price_source', 40)->nullable();
            $table->boolean('status')->nullable()->default(true);
            $table->timestamps();

            $table->index(['commercial_order_id', 'article_id'], 'commercial_order_items_order_article_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commercial_order_items');
    }
};
