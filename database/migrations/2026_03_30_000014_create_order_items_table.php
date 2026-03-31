<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('article_id')->constrained('articles');
            $table->foreignId('presentation_id')->nullable()->constrained('article_presentations')->nullOnDelete();
            $table->foreignId('warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();
            $table->decimal('stock', 12, 3)->default(0);
            $table->decimal('price_unit', 12, 4)->default(0);
            $table->decimal('presentation_units', 12, 3)->default(1);
            $table->decimal('quantity', 12, 3)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            $table->boolean('status')->nullable()->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
