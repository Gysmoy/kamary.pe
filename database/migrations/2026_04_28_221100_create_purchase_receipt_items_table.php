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
        Schema::create('purchase_receipt_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_receipt_id')->constrained('purchase_receipts')->cascadeOnDelete();
            $table->foreignId('purchase_order_item_id')->nullable()->constrained('purchase_order_items')->nullOnDelete();
            $table->foreignId('batch_id')->nullable()->constrained('batches')->nullOnDelete();
            $table->string('batch_code', 80)->nullable();
            $table->string('lot', 80)->nullable();
            $table->date('expiration_date')->nullable();
            $table->foreignId('article_id')->constrained('articles');
            $table->foreignId('warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();
            $table->decimal('stock_before', 12, 3)->default(0);
            $table->decimal('units_per_box', 12, 3)->default(0);
            $table->decimal('boxes_quantity', 12, 3)->default(0);
            $table->decimal('cost_unit', 12, 4)->default(0);
            $table->string('location')->nullable();
            $table->decimal('quantity', 12, 3)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            $table->boolean('status')->nullable()->default(true);
            $table->timestamps();

            $table->index(['purchase_receipt_id', 'article_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_receipt_items');
    }
};
