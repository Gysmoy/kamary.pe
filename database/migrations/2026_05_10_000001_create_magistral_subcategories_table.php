<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('magistral_subcategories')) return;

        Schema::create('magistral_subcategories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('magistral_category_id')->constrained('magistral_categories')->cascadeOnDelete();
            $table->string('description');
            $table->boolean('status')->nullable()->default(true)->index();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['magistral_category_id', 'description'], 'mag_subcategories_category_description_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('magistral_subcategories');
    }
};
