<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('entry_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained('businesses');
            $table->foreignId('business_branch_id')->nullable()->constrained('business_branches')->nullOnDelete();
            $table->foreignId('warehouse_id')->constrained('warehouses');
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->string('document_type', 30)->default('Boleta');
            $table->string('document_series', 20)->nullable();
            $table->string('document_sequence', 40)->nullable();
            $table->string('document_file')->nullable();
            $table->string('currency', 10)->default('PEN');
            $table->text('observations')->nullable();
            $table->string('guide_series', 20)->nullable();
            $table->string('guide_sequence', 40)->nullable();
            $table->string('guide_ruc', 20)->nullable();
            $table->string('guide_file')->nullable();
            $table->boolean('status')->nullable()->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('entry_notes');
    }
};

