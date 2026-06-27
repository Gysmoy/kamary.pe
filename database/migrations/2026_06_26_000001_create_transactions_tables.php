<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('transaction_categories')) {
            Schema::create('transaction_categories', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('name');
                $table->string('description')->nullable();
                $table->boolean('is_roas')->default(false);
                $table->boolean('status')->default(true);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('transactions')) {
            Schema::create('transactions', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('category_id')->nullable();
                $table->string('category')->nullable();
                $table->string('description')->nullable();
                $table->date('date')->nullable();
                $table->string('payment_method')->nullable();
                $table->boolean('automatically_created')->default(false);
                $table->string('issue')->nullable();
                $table->decimal('amount', 14, 2)->default(0);
                $table->text('note')->nullable();
                $table->timestamps();

                $table->index('category_id');
                $table->index('category');
                $table->index('date');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('transaction_categories');
    }
};
