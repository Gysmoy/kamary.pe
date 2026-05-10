<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('magistral_categories', function (Blueprint $table) {
            $table->id();
            $table->string('code', 80)->unique();
            $table->string('description');
            $table->foreignId('warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();
            $table->boolean('sale_material')->default(false);
            $table->boolean('status')->nullable()->default(true)->index();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('magistral_formats', function (Blueprint $table) {
            $table->id();
            $table->string('description');
            $table->decimal('quantity', 12, 3)->default(0);
            $table->boolean('status')->nullable()->default(true)->index();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('magistral_formulas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->constrained('articles')->cascadeOnDelete();
            $table->longText('detail')->nullable();
            $table->foreignId('last_edited_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('last_edited_at')->nullable();
            $table->boolean('status')->nullable()->default(true)->index();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique('article_id');
        });

        Schema::create('magistral_formula_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('magistral_formula_id')->constrained('magistral_formulas')->cascadeOnDelete();
            $table->foreignId('article_id')->nullable()->constrained('articles')->nullOnDelete();
            $table->longText('detail')->nullable();
            $table->foreignId('edited_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('magistral_incomes', function (Blueprint $table) {
            $table->id();
            $table->string('code', 80)->unique();
            $table->string('document_type')->nullable();
            $table->string('document_series', 40)->nullable();
            $table->string('document_sequence', 60)->nullable();
            $table->string('guide_number')->nullable();
            $table->foreignId('business_id')->nullable()->constrained('businesses')->nullOnDelete();
            $table->foreignId('warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->date('issue_date')->nullable();
            $table->text('observations')->nullable();
            $table->boolean('status')->nullable()->default(true)->index();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('magistral_incomes');
        Schema::dropIfExists('magistral_formula_histories');
        Schema::dropIfExists('magistral_formulas');
        Schema::dropIfExists('magistral_formats');
        Schema::dropIfExists('magistral_categories');
    }
};
