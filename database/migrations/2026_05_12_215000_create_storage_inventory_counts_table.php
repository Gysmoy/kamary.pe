<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('storage_inventory_counts')) {
            Schema::create('storage_inventory_counts', function (Blueprint $table) {
                $table->id();
                $table->string('code', 40)->unique();
                $table->foreignId('business_branch_id')->nullable()->constrained('business_branches')->nullOnDelete();
                $table->foreignId('warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();
                $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
                $table->string('location')->nullable();
                $table->date('count_date')->nullable();
                $table->string('inventory_status', 30)->default('En espera');
                $table->boolean('status')->nullable()->default(true)->index();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->index(['warehouse_id', 'client_id', 'status'], 'storage_inv_counts_lookup_idx');
            });
        }

        if (!Schema::hasTable('storage_inventory_count_items')) {
            Schema::create('storage_inventory_count_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('storage_inventory_count_id')
                    ->constrained('storage_inventory_counts', 'id', 'storage_inv_count_items_count_fk')
                    ->cascadeOnDelete();
                $table->string('source_key')->nullable();
                $table->foreignId('article_id')->nullable()->constrained('articles')->nullOnDelete();
                $table->foreignId('warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();
                $table->string('lot', 80)->nullable();
                $table->date('expiration_date')->nullable();
                $table->string('article_name')->nullable();
                $table->string('client_name')->nullable();
                $table->string('unit_label', 80)->nullable();
                $table->string('location')->nullable();
                $table->string('temperature_range', 40)->nullable();
                $table->decimal('system_stock', 14, 3)->default(0);
                $table->decimal('real_stock', 14, 3)->default(0);
                $table->decimal('difference', 14, 3)->default(0);
                $table->boolean('status')->nullable()->default(true)->index();
                $table->timestamps();

                $table->index(['storage_inventory_count_id', 'status'], 'storage_inv_count_items_status_idx');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('storage_inventory_count_items');
        Schema::dropIfExists('storage_inventory_counts');
    }
};
