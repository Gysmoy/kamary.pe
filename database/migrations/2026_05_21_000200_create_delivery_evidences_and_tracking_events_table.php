<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commercial_order_tracking_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('commercial_order_id')->constrained('commercial_orders')->cascadeOnDelete();
            $table->foreignId('dispatch_id')->nullable()->constrained('dispatches')->nullOnDelete();
            $table->foreignId('referral_guide_id')->nullable()->constrained('referral_guides')->nullOnDelete();
            $table->string('event_type', 60);
            $table->string('event_status', 60)->nullable();
            $table->string('title');
            $table->text('description')->nullable();
            $table->timestamp('happened_at')->nullable();
            $table->json('metadata')->nullable();
            $table->boolean('status')->nullable()->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['commercial_order_id', 'happened_at'], 'commercial_order_tracking_order_time_idx');
            $table->index(['event_type', 'event_status'], 'commercial_order_tracking_type_idx');
        });

        Schema::create('delivery_evidences', function (Blueprint $table) {
            $table->id();
            $table->string('code', 40)->unique();
            $table->foreignId('business_id')->constrained('businesses');
            $table->foreignId('dispatch_id')->nullable()->constrained('dispatches')->nullOnDelete();
            $table->foreignId('commercial_order_id')->constrained('commercial_orders')->cascadeOnDelete();
            $table->foreignId('driver_id')->nullable()->constrained('drivers')->nullOnDelete();
            $table->string('recipient_name')->nullable();
            $table->string('recipient_document_type', 40)->nullable();
            $table->string('recipient_document_number', 40)->nullable();
            $table->string('recipient_phone', 40)->nullable();
            $table->string('evidence_url')->nullable();
            $table->text('evidence_notes')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->json('metadata')->nullable();
            $table->boolean('status')->nullable()->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['dispatch_id', 'commercial_order_id'], 'delivery_evidences_dispatch_order_unique');
            $table->index(['business_id', 'delivered_at', 'status'], 'delivery_evidences_business_time_idx');
            $table->index(['commercial_order_id', 'status'], 'delivery_evidences_order_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_evidences');
        Schema::dropIfExists('commercial_order_tracking_events');
    }
};
