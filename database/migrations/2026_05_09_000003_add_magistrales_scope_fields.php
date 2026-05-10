<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            if (!Schema::hasColumn('articles', 'module_scope')) {
                $table->string('module_scope', 30)->default('standard')->after('id')->index();
            }
            if (!Schema::hasColumn('articles', 'article_type')) {
                $table->string('article_type', 80)->nullable()->after('name');
            }
            if (!Schema::hasColumn('articles', 'administration_route')) {
                $table->string('administration_route', 80)->nullable()->after('article_type');
            }
            if (!Schema::hasColumn('articles', 'magistral_category_id')) {
                $table->foreignId('magistral_category_id')->nullable()->after('administration_route')->constrained('magistral_categories')->nullOnDelete();
            }
            if (!Schema::hasColumn('articles', 'magistral_format_id')) {
                $table->foreignId('magistral_format_id')->nullable()->after('magistral_category_id')->constrained('magistral_formats')->nullOnDelete();
            }
            if (!Schema::hasColumn('articles', 'default_lot')) {
                $table->string('default_lot', 80)->nullable()->after('unit_weight');
            }
            if (!Schema::hasColumn('articles', 'default_expiration_date')) {
                $table->date('default_expiration_date')->nullable()->after('default_lot');
            }
        });

        Schema::table('suppliers', function (Blueprint $table) {
            if (!Schema::hasColumn('suppliers', 'module_scope')) {
                $table->string('module_scope', 30)->default('standard')->after('id')->index();
            }
            if (!Schema::hasColumn('suppliers', 'payment_condition')) {
                $table->string('payment_condition', 30)->nullable()->after('credit_type');
            }
        });

        Schema::table('purchase_orders', function (Blueprint $table) {
            if (!Schema::hasColumn('purchase_orders', 'module_scope')) {
                $table->string('module_scope', 30)->default('standard')->after('id')->index();
            }
            if (!Schema::hasColumn('purchase_orders', 'buyer_name')) {
                $table->string('buyer_name')->nullable()->after('supplier_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            if (Schema::hasColumn('purchase_orders', 'buyer_name')) {
                $table->dropColumn('buyer_name');
            }
            if (Schema::hasColumn('purchase_orders', 'module_scope')) {
                $table->dropIndex(['module_scope']);
                $table->dropColumn('module_scope');
            }
        });

        Schema::table('suppliers', function (Blueprint $table) {
            if (Schema::hasColumn('suppliers', 'payment_condition')) {
                $table->dropColumn('payment_condition');
            }
            if (Schema::hasColumn('suppliers', 'module_scope')) {
                $table->dropIndex(['module_scope']);
                $table->dropColumn('module_scope');
            }
        });

        Schema::table('articles', function (Blueprint $table) {
            if (Schema::hasColumn('articles', 'magistral_format_id')) {
                $table->dropConstrainedForeignId('magistral_format_id');
            }
            if (Schema::hasColumn('articles', 'magistral_category_id')) {
                $table->dropConstrainedForeignId('magistral_category_id');
            }
            foreach (['default_expiration_date', 'default_lot', 'administration_route', 'article_type'] as $column) {
                if (Schema::hasColumn('articles', $column)) {
                    $table->dropColumn($column);
                }
            }
            if (Schema::hasColumn('articles', 'module_scope')) {
                $table->dropIndex(['module_scope']);
                $table->dropColumn('module_scope');
            }
        });
    }
};
