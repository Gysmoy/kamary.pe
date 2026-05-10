<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('units', function (Blueprint $table) {
            if (!Schema::hasColumn('units', 'module_scope')) {
                $table->string('module_scope', 30)->default('standard')->after('id')->index();
            }
        });

        Schema::create('magistral_responsibles', function (Blueprint $table) {
            $table->id();
            $table->string('document_number', 30)->unique();
            $table->string('name');
            $table->boolean('status')->nullable()->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('magistral_production_orders', function (Blueprint $table) {
            $table->id();
            $table->string('code', 40)->unique();
            $table->string('order_status', 40)->default('pending');
            $table->foreignId('responsible_id')->nullable()->constrained('magistral_responsibles')->nullOnDelete();
            $table->string('destination')->nullable();
            $table->foreignId('article_id')->nullable()->constrained('articles')->nullOnDelete();
            $table->decimal('quantity', 12, 3)->default(0);
            $table->date('registration_date')->nullable();
            $table->text('observations')->nullable();
            $table->boolean('status')->nullable()->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('magistral_outputs', function (Blueprint $table) {
            $table->id();
            $table->string('code', 40)->unique();
            $table->foreignId('origin_warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();
            $table->string('destination')->nullable();
            $table->string('reason')->nullable();
            $table->text('observations')->nullable();
            $table->date('output_date')->nullable();
            $table->boolean('status')->nullable()->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('magistral_sales', function (Blueprint $table) {
            $table->id();
            $table->string('code', 40)->unique();
            $table->string('pharmacy')->nullable();
            $table->foreignId('business_id')->nullable()->constrained('businesses')->nullOnDelete();
            $table->string('payment_status', 40)->default('pending');
            $table->string('document_type', 40)->nullable();
            $table->string('document_number', 80)->nullable();
            $table->string('patient')->nullable();
            $table->decimal('total', 12, 2)->default(0);
            $table->date('sale_date')->nullable();
            $table->boolean('status')->nullable()->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('magistral_sales');
        Schema::dropIfExists('magistral_outputs');
        Schema::dropIfExists('magistral_production_orders');
        Schema::dropIfExists('magistral_responsibles');

        Schema::table('units', function (Blueprint $table) {
            if (Schema::hasColumn('units', 'module_scope')) {
                $table->dropIndex(['module_scope']);
                $table->dropColumn('module_scope');
            }
        });
    }
};
