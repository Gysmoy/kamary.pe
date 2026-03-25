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
        Schema::create('articles', function (Blueprint $table) {
            $table->id();
            $table->string('code', 60)->unique();
            $table->string('name');
            $table->foreignId('laboratory_id')->constrained('laboratories');
            $table->foreignId('active_principle_id')->nullable()->constrained('active_principles')->nullOnDelete();
            $table->foreignId('unit_id')->constrained('units');
            $table->decimal('volume', 12, 3)->nullable();
            $table->boolean('status')->nullable()->default(true);
            $table->boolean('margin_rule')->default(false);
            $table->boolean('igv_rule')->default(false);
            $table->unsignedInteger('units_per_article')->default(1);
            $table->decimal('unit_weight', 12, 4)->nullable();
            $table->text('notes')->nullable();
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
        Schema::dropIfExists('articles');
    }
};
