<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('purchase_receipts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_order_id')->nullable()->constrained('purchase_orders')->nullOnDelete();
            $table->foreignId('business_id')->constrained('businesses');
            $table->foreignId('business_branch_id')->nullable()->constrained('business_branches')->nullOnDelete();
            $table->foreignId('warehouse_id')->constrained('warehouses');
            $table->foreignId('supplier_id')->constrained('suppliers');
            $table->string('code', 40)->unique();
            $table->date('issue_date');
            $table->string('receipt_status', 30)->default('draft');
            $table->timestamp('confirmed_at')->nullable();
            $table->string('document_type', 30)->default('Factura');
            $table->string('document_series', 20)->nullable();
            $table->string('document_sequence', 40)->nullable();
            $table->string('document_file')->nullable();
            $table->string('currency', 10)->default('PEN');
            $table->string('payment_condition', 20)->default('Contado');
            $table->date('first_due_date')->nullable();
            $table->unsignedSmallInteger('installments')->nullable();
            $table->text('observations')->nullable();
            $table->string('guide_series', 20)->nullable();
            $table->string('guide_sequence', 40)->nullable();
            $table->string('guide_ruc', 20)->nullable();
            $table->string('guide_file')->nullable();
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('tax_amount', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            $table->boolean('status')->nullable()->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['purchase_order_id', 'receipt_status']);
            $table->index(['supplier_id', 'issue_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_receipts');
    }
};
