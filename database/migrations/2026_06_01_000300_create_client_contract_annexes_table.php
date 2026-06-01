<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('client_contract_annexes')) {
            return;
        }

        Schema::create('client_contract_annexes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_contract_id')->constrained('client_contracts')->cascadeOnDelete();
            $table->string('file_path');
            $table->string('file_name')->nullable();
            $table->string('file_mime')->nullable();
            $table->boolean('status')->nullable()->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['client_contract_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_contract_annexes');
    }
};
