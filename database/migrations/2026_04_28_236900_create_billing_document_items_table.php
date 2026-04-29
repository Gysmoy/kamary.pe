<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('billing_document_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('billing_document_id')->constrained('billing_documents')->cascadeOnDelete();
            $table->foreignId('commercial_order_item_id')->nullable()->constrained('commercial_order_items')->nullOnDelete();
            $table->foreignId('service_order_item_id')->nullable()->constrained('service_order_items')->nullOnDelete();
            $table->string('item_type', 30)->default('article');
            $table->string('item_code', 60)->nullable();
            $table->string('description');
            $table->decimal('quantity', 12, 3)->default(0);
            $table->decimal('unit_price', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            $table->json('metadata')->nullable();
            $table->boolean('status')->nullable()->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('billing_document_items');
    }
};
