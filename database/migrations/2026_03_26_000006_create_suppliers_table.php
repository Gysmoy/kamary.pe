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
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('ruc', 11)->unique();
            $table->string('business_name');
            $table->string('address')->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('mobile', 30)->nullable();
            $table->string('email_1')->nullable();
            $table->string('email_2')->nullable();
            $table->string('business_line')->nullable();
            $table->string('billing_type')->nullable();
            $table->string('credit_type')->nullable();
            $table->string('bank')->nullable();
            $table->string('bank_account_cci')->nullable();
            $table->string('payment_system')->nullable();
            $table->text('evaluation')->nullable();
            $table->boolean('status')->nullable()->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('suppliers');
    }
};
