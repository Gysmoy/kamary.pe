<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_id')->constrained('activities')->cascadeOnDelete();
            $table->foreignId('commercial_order_item_id')->nullable()->constrained('commercial_order_items')->nullOnDelete();
            $table->foreignId('article_id')->nullable()->constrained('articles')->nullOnDelete();
            $table->string('item_code', 60)->nullable();
            $table->string('description')->nullable();
            $table->decimal('quantity', 12, 3)->default(0);
            $table->decimal('delivered_quantity', 12, 3)->default(0);
            $table->json('metadata')->nullable();
            $table->boolean('status')->nullable()->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_items');
    }
};
