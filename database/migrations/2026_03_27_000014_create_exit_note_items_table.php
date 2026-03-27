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
        Schema::create('exit_note_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exit_note_id')->constrained('exit_notes')->cascadeOnDelete();
            $table->string('batch_code', 80)->nullable();
            $table->foreignId('article_id')->constrained('articles');
            $table->foreignId('warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();
            $table->decimal('stock', 12, 3)->default(0);
            $table->date('expiration_date')->nullable();
            $table->string('location')->nullable();
            $table->string('destination_location')->nullable();
            $table->decimal('quantity', 12, 3)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            $table->boolean('status')->nullable()->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exit_note_items');
    }
};

