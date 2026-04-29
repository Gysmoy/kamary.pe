<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dispatches', function (Blueprint $table) {
            $table->id();
            $table->string('code', 40)->unique();
            $table->foreignId('business_id')->constrained('businesses');
            $table->foreignId('business_branch_id')->nullable()->constrained('business_branches')->nullOnDelete();
            $table->foreignId('warehouse_id')->constrained('warehouses');
            $table->date('scheduled_date');
            $table->string('shift', 40)->nullable();
            $table->string('driver_name')->nullable();
            $table->string('copilot_name')->nullable();
            $table->string('vehicle_label')->nullable();
            $table->string('vehicle_plate', 20)->nullable();
            $table->string('zone')->nullable();
            $table->string('manifest_code', 40)->nullable();
            $table->string('dispatch_status', 30)->default('waiting');
            $table->timestamp('departed_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->foreignId('exit_note_id')->nullable()->constrained('exit_notes')->nullOnDelete();
            $table->text('observations')->nullable();
            $table->boolean('status')->nullable()->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['business_id', 'scheduled_date'], 'dispatches_business_date_idx');
            $table->index(['warehouse_id', 'dispatch_status', 'status'], 'dispatches_flow_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dispatches');
    }
};
