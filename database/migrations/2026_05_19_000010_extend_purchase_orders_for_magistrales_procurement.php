<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            if (!Schema::hasColumn('purchase_orders', 'article_type')) {
                $table->string('article_type', 80)->nullable()->after('buyer_name');
            }
            if (!Schema::hasColumn('purchase_orders', 'max_delivery_date')) {
                $table->date('max_delivery_date')->nullable()->after('expected_date');
            }
            if (!Schema::hasColumn('purchase_orders', 'delivery_place')) {
                $table->string('delivery_place')->nullable()->after('max_delivery_date');
            }
            if (!Schema::hasColumn('purchase_orders', 'payment_method')) {
                $table->string('payment_method', 60)->nullable()->after('payment_condition');
            }
            if (!Schema::hasColumn('purchase_orders', 'document_type')) {
                $table->string('document_type', 30)->nullable()->after('payment_method');
            }
            if (!Schema::hasColumn('purchase_orders', 'affects_igv')) {
                $table->boolean('affects_igv')->nullable()->after('document_type');
            }
        });

        Schema::table('purchase_order_items', function (Blueprint $table) {
            if (!Schema::hasColumn('purchase_order_items', 'presentation_id')) {
                $table->foreignId('presentation_id')->nullable()->after('article_id')->constrained('article_presentations')->nullOnDelete();
            }
            if (!Schema::hasColumn('purchase_order_items', 'presentation_label')) {
                $table->string('presentation_label', 120)->nullable()->after('presentation_id');
            }
            if (!Schema::hasColumn('purchase_order_items', 'presentation_units')) {
                $table->decimal('presentation_units', 18, 6)->default(1)->after('presentation_label');
            }
            if (!Schema::hasColumn('purchase_order_items', 'last_price')) {
                $table->decimal('last_price', 18, 4)->nullable()->after('presentation_units');
            }
        });
    }

    public function down(): void
    {
        Schema::table('purchase_order_items', function (Blueprint $table) {
            if (Schema::hasColumn('purchase_order_items', 'last_price')) {
                $table->dropColumn('last_price');
            }
            if (Schema::hasColumn('purchase_order_items', 'presentation_units')) {
                $table->dropColumn('presentation_units');
            }
            if (Schema::hasColumn('purchase_order_items', 'presentation_label')) {
                $table->dropColumn('presentation_label');
            }
            if (Schema::hasColumn('purchase_order_items', 'presentation_id')) {
                $table->dropConstrainedForeignId('presentation_id');
            }
        });

        Schema::table('purchase_orders', function (Blueprint $table) {
            foreach (['affects_igv', 'document_type', 'payment_method', 'delivery_place', 'max_delivery_date', 'article_type'] as $column) {
                if (Schema::hasColumn('purchase_orders', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
