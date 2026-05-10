<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sample_orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->string('order_status')->default('registered')->index();
            $table->string('email_status')->default('pending')->index();
            $table->string('referral_guide')->nullable();
            $table->decimal('total_gross_weight', 12, 3)->nullable();
            $table->string('channel')->nullable();
            $table->string('document_type', 20)->nullable();
            $table->string('document_number', 30)->nullable();
            $table->string('client_name');
            $table->boolean('order_complete')->default(false);
            $table->date('requested_at')->nullable();
            $table->date('delivered_at')->nullable();
            $table->string('supervisor_name')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->text('observations')->nullable();
            $table->boolean('status')->nullable()->default(true)->index();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['document_type', 'document_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sample_orders');
    }
};
