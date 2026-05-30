<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('warehouse_locations')) {
            return;
        }

        Schema::create('warehouse_locations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->string('code', 120);
            $table->text('description')->nullable();
            $table->boolean('status')->nullable()->default(true)->index();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['warehouse_id', 'code'], 'warehouse_locations_unique_code');
            $table->index(['warehouse_id', 'status'], 'warehouse_locations_lookup_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('warehouse_locations');
    }
};
