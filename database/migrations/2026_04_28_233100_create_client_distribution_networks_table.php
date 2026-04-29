<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client_distribution_networks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients');
            $table->string('code', 40)->unique();
            $table->string('name');
            $table->string('commercial_channel', 120)->nullable();
            $table->string('segment', 120)->nullable();
            $table->string('contact_name')->nullable();
            $table->string('contact_phone', 30)->nullable();
            $table->string('contact_email')->nullable();
            $table->text('observations')->nullable();
            $table->boolean('is_default')->default(false);
            $table->boolean('status')->nullable()->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['client_id', 'status'], 'client_distribution_client_status_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_distribution_networks');
    }
};
