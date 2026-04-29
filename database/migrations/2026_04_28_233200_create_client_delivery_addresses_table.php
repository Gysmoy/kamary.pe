<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client_delivery_addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_distribution_network_id')->constrained('client_distribution_networks')->cascadeOnDelete();
            $table->foreignId('client_id')->constrained('clients');
            $table->string('code', 40)->nullable();
            $table->string('name');
            $table->string('ubigeo', 20)->nullable();
            $table->string('department', 120)->nullable();
            $table->string('province', 120)->nullable();
            $table->string('district', 120)->nullable();
            $table->string('address');
            $table->string('reference')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->string('contact_name')->nullable();
            $table->string('contact_phone', 30)->nullable();
            $table->boolean('is_default')->default(false);
            $table->boolean('status')->nullable()->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['client_distribution_network_id', 'status'], 'client_delivery_network_status_idx');
            $table->index(['client_id', 'status'], 'client_delivery_client_status_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_delivery_addresses');
    }
};
