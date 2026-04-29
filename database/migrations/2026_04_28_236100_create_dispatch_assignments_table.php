<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dispatch_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dispatch_id')->constrained('dispatches')->cascadeOnDelete();
            $table->foreignId('commercial_order_id')->constrained('commercial_orders');
            $table->string('commercial_order_code', 40);
            $table->string('customer_name')->nullable();
            $table->decimal('total', 12, 2)->default(0);
            $table->string('assignment_status', 30)->default('assigned');
            $table->boolean('status')->nullable()->default(true);
            $table->timestamps();

            $table->unique(['dispatch_id', 'commercial_order_id'], 'dispatch_assignments_unique');
            $table->index(['commercial_order_id', 'assignment_status', 'status'], 'dispatch_assignments_order_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dispatch_assignments');
    }
};
