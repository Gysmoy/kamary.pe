<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('receivable_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('accounts_receivable_id')->constrained('accounts_receivable')->cascadeOnDelete();
            $table->decimal('amount', 12, 2)->default(0);
            $table->date('payment_date');
            $table->string('payment_method', 60);
            $table->string('bank', 120)->nullable();
            $table->string('operation_number', 120)->nullable();
            $table->string('payment_file', 180)->nullable();
            $table->text('observations')->nullable();
            $table->boolean('status')->nullable()->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['accounts_receivable_id', 'payment_date'], 'receivable_payments_ar_date_idx');
            $table->index(['payment_method', 'status'], 'receivable_payments_method_status_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('receivable_payments');
    }
};
