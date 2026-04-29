<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('zones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->nullable()->constrained('businesses')->nullOnDelete();
            $table->string('code', 40)->unique();
            $table->string('name');
            $table->string('ubigeo', 20)->nullable();
            $table->string('department', 120)->nullable();
            $table->string('province', 120)->nullable();
            $table->string('district', 120)->nullable();
            $table->text('reference')->nullable();
            $table->text('observations')->nullable();
            $table->boolean('status')->nullable()->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['business_id', 'status'], 'zones_business_status_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('zones');
    }
};
