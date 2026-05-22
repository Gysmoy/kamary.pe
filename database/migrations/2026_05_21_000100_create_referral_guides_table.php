<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('referral_guides', function (Blueprint $table) {
            $table->id();
            $table->string('code', 40)->unique();
            $table->foreignId('business_id')->constrained('businesses');
            $table->foreignId('business_branch_id')->nullable()->constrained('business_branches')->nullOnDelete();
            $table->foreignId('warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();
            $table->foreignId('dispatch_id')->nullable()->constrained('dispatches')->nullOnDelete();
            $table->foreignId('commercial_order_id')->nullable()->constrained('commercial_orders')->nullOnDelete();
            $table->foreignId('billing_document_id')->nullable()->constrained('billing_documents')->nullOnDelete();
            $table->foreignId('driver_id')->nullable()->constrained('drivers')->nullOnDelete();
            $table->foreignId('vehicle_id')->nullable()->constrained('vehicles')->nullOnDelete();
            $table->string('document_type', 40)->default('Guia de remision');
            $table->string('series', 20)->nullable();
            $table->string('sequence', 20)->nullable();
            $table->string('external_reference', 60)->nullable();
            $table->date('issue_date')->nullable();
            $table->date('transfer_date')->nullable();
            $table->string('guide_status', 30)->default('prepared');
            $table->string('external_status', 60)->nullable();
            $table->string('external_id', 120)->nullable();
            $table->string('provider', 60)->nullable();
            $table->string('provider_endpoint')->nullable();
            $table->string('origin_ubigeo', 20)->nullable();
            $table->string('origin_address')->nullable();
            $table->string('destination_ubigeo', 20)->nullable();
            $table->string('destination_address')->nullable();
            $table->string('recipient_name')->nullable();
            $table->string('recipient_document_type', 40)->nullable();
            $table->string('recipient_document_number', 40)->nullable();
            $table->string('recipient_phone', 40)->nullable();
            $table->string('driver_name')->nullable();
            $table->string('driver_document_type', 40)->nullable();
            $table->string('driver_document_number', 40)->nullable();
            $table->string('driver_license_number', 60)->nullable();
            $table->string('vehicle_plate', 20)->nullable();
            $table->string('transfer_mode', 40)->default('private');
            $table->string('transfer_reason', 80)->default('VENTA');
            $table->unsignedInteger('package_count')->default(1);
            $table->decimal('gross_weight', 12, 3)->default(0);
            $table->longText('request_payload')->nullable();
            $table->longText('response_payload')->nullable();
            $table->text('error_message')->nullable();
            $table->json('metadata')->nullable();
            $table->text('observations')->nullable();
            $table->boolean('status')->nullable()->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['dispatch_id', 'commercial_order_id'], 'referral_guides_dispatch_order_unique');
            $table->index(['business_id', 'issue_date', 'status'], 'referral_guides_business_issue_idx');
            $table->index(['guide_status', 'external_status'], 'referral_guides_status_idx');
        });

        Schema::create('referral_guide_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('referral_guide_id')->constrained('referral_guides')->cascadeOnDelete();
            $table->foreignId('commercial_order_item_id')->nullable()->constrained('commercial_order_items')->nullOnDelete();
            $table->foreignId('article_id')->nullable()->constrained('articles')->nullOnDelete();
            $table->string('item_code', 80)->nullable();
            $table->string('description');
            $table->string('unit', 40)->nullable();
            $table->decimal('quantity', 12, 3)->default(0);
            $table->decimal('gross_weight', 12, 3)->default(0);
            $table->json('metadata')->nullable();
            $table->boolean('status')->nullable()->default(true);
            $table->timestamps();

            $table->index(['referral_guide_id', 'article_id'], 'referral_guide_items_guide_article_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('referral_guide_items');
        Schema::dropIfExists('referral_guides');
    }
};
