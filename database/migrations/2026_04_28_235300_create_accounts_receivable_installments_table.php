<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accounts_receivable_installments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('accounts_receivable_id')->constrained('accounts_receivable')->cascadeOnDelete();
            $table->unsignedSmallInteger('installment_number');
            $table->date('due_date');
            $table->decimal('amount', 12, 2)->default(0);
            $table->decimal('paid_amount', 12, 2)->default(0);
            $table->decimal('balance_amount', 12, 2)->default(0);
            $table->timestamp('paid_at')->nullable();
            $table->string('payment_status', 30)->default('pending');
            $table->boolean('status')->nullable()->default(true);
            $table->timestamps();

            $table->unique(['accounts_receivable_id', 'installment_number'], 'ar_installments_number_unique');
            $table->index(['due_date', 'payment_status'], 'ar_installments_due_status_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accounts_receivable_installments');
    }
};
