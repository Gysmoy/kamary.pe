<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Consultas enviadas desde los formularios de la web publica (contacto, cotizaciones, recetas, etc.).
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('web_inquiries', function (Blueprint $table) {
            $table->id();
            $table->string('type', 30);
            $table->string('name');
            $table->string('last_name')->nullable();
            $table->string('email');
            $table->string('phone', 30);
            $table->string('subject')->nullable();
            $table->text('message')->nullable();
            $table->string('file_path')->nullable();
            $table->json('payload')->nullable();
            $table->string('ip', 45)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->string('status', 20)->default('new');
            $table->timestamps();

            $table->index(['type', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('web_inquiries');
    }
};
