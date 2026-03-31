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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained('businesses');
            $table->foreignId('business_branch_id')->nullable()->constrained('business_branches')->nullOnDelete();
            $table->foreignId('warehouse_id')->constrained('warehouses');
            $table->foreignId('client_id')->constrained('clients');
            $table->string('document_type', 30)->default('Factura');
            $table->string('currency', 10)->default('PEN');
            $table->decimal('discount_percent', 5, 2)->default(1);
            $table->string('delivery_address')->nullable();
            $table->string('purchase_order', 60)->nullable();
            $table->string('guide_number', 60)->nullable();
            $table->string('dispatch_guide', 60)->nullable();
            $table->string('ubigeo', 12)->nullable();
            $table->decimal('map_lat', 11, 7)->nullable();
            $table->decimal('map_lng', 11, 7)->nullable();
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('discount_amount', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            $table->boolean('status')->nullable()->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
