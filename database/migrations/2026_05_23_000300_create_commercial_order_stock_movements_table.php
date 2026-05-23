<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commercial_order_stock_movements', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('commercial_order_id');
            $table->unsignedBigInteger('commercial_order_item_id')->nullable();
            $table->unsignedBigInteger('business_id');
            $table->unsignedBigInteger('business_branch_id')->nullable();
            $table->unsignedBigInteger('warehouse_id');
            $table->unsignedBigInteger('article_id');
            $table->string('movement_type', 40);
            $table->decimal('quantity', 12, 3)->default(0);
            $table->string('reference_code', 60)->nullable();
            $table->text('observations')->nullable();
            $table->json('metadata')->nullable();
            $table->boolean('status')->nullable()->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->foreign('commercial_order_id', 'co_stock_order_fk')->references('id')->on('commercial_orders')->cascadeOnDelete();
            $table->foreign('commercial_order_item_id', 'co_stock_item_fk')->references('id')->on('commercial_order_items')->nullOnDelete();
            $table->foreign('business_id', 'co_stock_business_fk')->references('id')->on('businesses');
            $table->foreign('business_branch_id', 'co_stock_branch_fk')->references('id')->on('business_branches')->nullOnDelete();
            $table->foreign('warehouse_id', 'co_stock_warehouse_fk')->references('id')->on('warehouses');
            $table->foreign('article_id', 'co_stock_article_fk')->references('id')->on('articles');
            $table->index(['commercial_order_id', 'movement_type'], 'commercial_stock_order_type_idx');
            $table->index(['article_id', 'warehouse_id', 'created_at'], 'commercial_stock_article_time_idx');
            $table->index(['business_id', 'business_branch_id'], 'commercial_stock_business_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commercial_order_stock_movements');
    }
};
