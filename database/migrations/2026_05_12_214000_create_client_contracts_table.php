<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('client_contracts')) {
            return;
        }

        Schema::create('client_contracts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->string('contract_code', 80);
            $table->date('starts_at');
            $table->date('ends_at');
            $table->string('file_path')->nullable();
            $table->string('file_name')->nullable();
            $table->string('file_mime')->nullable();
            $table->boolean('status')->nullable()->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['client_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_contracts');
    }
};
