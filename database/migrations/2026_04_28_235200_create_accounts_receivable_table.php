<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accounts_receivable', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained('businesses');
            $table->foreignId('business_branch_id')->nullable()->constrained('business_branches')->nullOnDelete();
            $table->foreignId('warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->foreignId('eventual_client_id')->nullable()->constrained('eventual_clients')->nullOnDelete();
            $table->string('source_type', 40);
            $table->unsignedBigInteger('source_id');
            $table->string('code', 40)->unique();
            $table->string('document_type', 30)->default('Factura');
            $table->string('series', 20)->nullable();
            $table->string('sequence', 40)->nullable();
            $table->date('issue_date');
            $table->date('due_date')->nullable();
            $table->string('currency', 10)->default('PEN');
            $table->string('payment_condition', 20)->default('Contado');
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('tax_amount', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            $table->decimal('paid_amount', 12, 2)->default(0);
            $table->decimal('balance_amount', 12, 2)->default(0);
            $table->string('payment_status', 30)->default('pending');
            $table->text('observations')->nullable();
            $table->boolean('status')->nullable()->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['source_type', 'source_id'], 'accounts_receivable_source_unique');
            $table->index(['client_id', 'eventual_client_id'], 'accounts_receivable_customer_idx');
            $table->index(['payment_status', 'status'], 'accounts_receivable_flow_status_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accounts_receivable');
    }
};
