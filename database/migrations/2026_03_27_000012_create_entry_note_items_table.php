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
        Schema::create('entry_note_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entry_note_id')->constrained('entry_notes')->cascadeOnDelete();
            $table->string('batch_code', 80)->nullable();
            $table->string('lot', 80)->nullable();
            $table->foreignId('article_id')->constrained('articles');
            $table->foreignId('warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();
            $table->decimal('stock', 12, 3)->default(0);
            $table->decimal('cost_unit', 12, 4)->default(0);
            $table->string('location')->nullable();
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
        Schema::dropIfExists('entry_note_items');
    }
};

