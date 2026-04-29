<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activities', function (Blueprint $table) {
            $table->id();
            $table->string('code', 40)->unique();
            $table->foreignId('business_id')->constrained('businesses');
            $table->foreignId('business_branch_id')->nullable()->constrained('business_branches')->nullOnDelete();
            $table->foreignId('warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();
            $table->foreignId('commercial_order_id')->nullable()->constrained('commercial_orders')->nullOnDelete();
            $table->foreignId('dispatch_id')->nullable()->constrained('dispatches')->nullOnDelete();
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->foreignId('eventual_client_id')->nullable()->constrained('eventual_clients')->nullOnDelete();
            $table->foreignId('driver_id')->nullable()->constrained('drivers')->nullOnDelete();
            $table->foreignId('vehicle_id')->nullable()->constrained('vehicles')->nullOnDelete();
            $table->foreignId('zone_id')->nullable()->constrained('zones')->nullOnDelete();
            $table->string('activity_type', 40)->default('delivery');
            $table->string('activity_status', 40)->default('scheduled');
            $table->date('transfer_date')->nullable();
            $table->string('customer_name')->nullable();
            $table->string('document_number', 30)->nullable();
            $table->string('manifest_code', 40)->nullable();
            $table->text('origin_address')->nullable();
            $table->text('destination_address')->nullable();
            $table->text('destination_reference')->nullable();
            $table->string('dispatch_contact_name')->nullable();
            $table->string('dispatch_contact_phone', 40)->nullable();
            $table->string('ubigeo', 20)->nullable();
            $table->decimal('map_lat', 12, 8)->nullable();
            $table->decimal('map_lng', 12, 8)->nullable();
            $table->unsignedInteger('package_count')->default(0);
            $table->decimal('gross_weight', 12, 2)->default(0);
            $table->text('observations')->nullable();
            $table->boolean('status')->nullable()->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['business_id', 'transfer_date'], 'activities_business_date_idx');
            $table->index(['activity_status', 'status'], 'activities_status_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activities');
    }
};
