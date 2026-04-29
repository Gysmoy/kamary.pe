<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->string('code', 40)->unique();
            $table->string('name');
            $table->string('category', 120)->nullable();
            $table->string('subcategory', 120)->nullable();
            $table->string('service_type', 60)->nullable();
            $table->string('billing_unit', 60)->nullable();
            $table->decimal('unit_price_pen', 12, 2)->default(0);
            $table->decimal('unit_price_usd', 12, 2)->default(0);
            $table->string('applicable_zone')->nullable();
            $table->string('linked_vehicle_type')->nullable();
            $table->boolean('commissions_enabled')->default(false);
            $table->text('observations')->nullable();
            $table->boolean('status')->nullable()->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['category', 'subcategory', 'status'], 'services_category_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('services');
    }
};
