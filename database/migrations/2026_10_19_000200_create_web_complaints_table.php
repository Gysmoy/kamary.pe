<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Libro de Reclamaciones de la web publica. El code (LR-000001) se asigna tras insertar.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('web_complaints', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();
            $table->string('person_type', 10);
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('document_type', 5)->nullable();
            $table->string('document_number', 20)->nullable();
            $table->string('business_name')->nullable();
            $table->string('address');
            $table->string('district');
            $table->string('department');
            $table->string('phone', 30);
            $table->string('email');
            $table->string('claim_type', 10);
            $table->string('good_type', 10);
            $table->text('product_detail');
            $table->text('claim_detail')->nullable();
            $table->string('file_path')->nullable();
            $table->json('payload')->nullable();
            $table->string('ip', 45)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->string('status', 20)->default('new');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('web_complaints');
    }
};
