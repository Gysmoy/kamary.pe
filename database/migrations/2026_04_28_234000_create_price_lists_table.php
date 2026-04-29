<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('price_lists', function (Blueprint $table) {
            $table->id();
            $table->string('code', 40)->unique();
            $table->foreignId('business_id')->constrained('businesses');
            $table->foreignId('business_branch_id')->nullable()->constrained('business_branches')->nullOnDelete();
            $table->foreignId('warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->foreignId('eventual_client_id')->nullable()->constrained('eventual_clients')->nullOnDelete();
            $table->foreignId('client_distribution_network_id')->nullable()->constrained('client_distribution_networks')->nullOnDelete();
            $table->string('channel', 120)->nullable();
            $table->string('segment', 120)->nullable();
            $table->string('currency', 10)->default('PEN');
            $table->unsignedInteger('priority')->default(100);
            $table->date('starts_at')->nullable();
            $table->date('ends_at')->nullable();
            $table->text('observations')->nullable();
            $table->boolean('status')->nullable()->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['business_id', 'priority'], 'price_lists_business_priority_idx');
            $table->index(['client_id', 'eventual_client_id'], 'price_lists_client_eventual_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('price_lists');
    }
};
