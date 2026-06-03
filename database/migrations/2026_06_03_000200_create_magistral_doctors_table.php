<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('magistral_doctors')) {
            return;
        }

        Schema::create('magistral_doctors', function (Blueprint $table) {
            $table->id();
            $table->string('names');
            $table->string('paternal_lastname');
            $table->string('maternal_lastname')->nullable();
            $table->string('cmp', 30)->unique();
            $table->string('specialty')->nullable();
            $table->string('medical_center')->nullable();
            $table->boolean('status')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('magistral_doctors');
    }
};
