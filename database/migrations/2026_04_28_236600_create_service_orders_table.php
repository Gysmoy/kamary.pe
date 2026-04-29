<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_orders', function (Blueprint $table) {
            $table->id();
            $table->string('code', 40)->unique();
            $table->foreignId('business_id')->constrained('businesses');
            $table->foreignId('business_branch_id')->nullable()->constrained('business_branches')->nullOnDelete();
            $table->foreignId('client_id')->constrained('clients');
            $table->foreignId('seller_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('expected_document_type', 30)->default('Factura');
            $table->string('currency', 10)->default('PEN');
            $table->string('billing_cycle', 60)->nullable();
            $table->string('payment_condition', 20)->default('Contado');
            $table->unsignedSmallInteger('installments')->default(1);
            $table->date('issue_date');
            $table->date('scheduled_at')->nullable();
            $table->date('first_due_date')->nullable();
            $table->string('order_status', 30)->default('draft');
            $table->string('billing_status', 30)->default('pending');
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('tax_amount', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            $table->text('observations')->nullable();
            $table->boolean('status')->nullable()->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['business_id', 'issue_date'], 'service_orders_business_issue_idx');
            $table->index(['client_id', 'order_status', 'status'], 'service_orders_client_status_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_orders');
    }
};
