<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('storage_locations')) {
            return;
        }

        Schema::create('storage_locations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->string('code');
            $table->string('temperature_range', 40);
            $table->string('service_order_code')->nullable();
            $table->boolean('status')->nullable()->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['warehouse_id', 'code', 'status'], 'storage_locations_lookup_idx');
            $table->index(['client_id', 'status'], 'storage_locations_client_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('storage_locations');
    }
};
