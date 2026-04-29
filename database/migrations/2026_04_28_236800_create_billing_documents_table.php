<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('billing_documents', function (Blueprint $table) {
            $table->id();
            $table->string('code', 40)->unique();
            $table->string('source_type', 40);
            $table->unsignedBigInteger('source_id');
            $table->foreignId('commercial_order_id')->nullable()->constrained('commercial_orders')->nullOnDelete();
            $table->foreignId('service_order_id')->nullable()->constrained('service_orders')->nullOnDelete();
            $table->foreignId('business_id')->constrained('businesses');
            $table->foreignId('business_branch_id')->nullable()->constrained('business_branches')->nullOnDelete();
            $table->foreignId('warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->foreignId('eventual_client_id')->nullable()->constrained('eventual_clients')->nullOnDelete();
            $table->string('provider', 40)->default('facturadorpro5');
            $table->string('document_type', 30)->default('Factura');
            $table->string('series', 20)->nullable();
            $table->string('sequence', 30)->nullable();
            $table->date('issue_date');
            $table->string('currency', 10)->default('PEN');
            $table->string('local_status', 30)->default('pending');
            $table->string('external_status', 30)->default('draft');
            $table->string('external_id')->nullable();
            $table->string('external_reference')->nullable();
            $table->string('provider_endpoint')->nullable();
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('tax_amount', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            $table->longText('request_payload')->nullable();
            $table->longText('response_payload')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->text('observations')->nullable();
            $table->boolean('status')->nullable()->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['source_type', 'source_id'], 'billing_documents_source_idx');
            $table->index(['provider', 'local_status', 'external_status'], 'billing_documents_state_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('billing_documents');
    }
};
