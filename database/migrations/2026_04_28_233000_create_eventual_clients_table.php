<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('eventual_clients', function (Blueprint $table) {
            $table->id();
            $table->string('document_type', 10);
            $table->string('document_number', 20);
            $table->string('business_name');
            $table->string('email')->nullable();
            $table->string('phone_prefix', 10)->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('address')->nullable();
            $table->string('contact_name')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('status')->nullable()->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['document_type', 'document_number'], 'eventual_clients_document_unique');
            $table->index(['business_name', 'status'], 'eventual_clients_name_status_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('eventual_clients');
    }
};
