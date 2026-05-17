<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('commercial_orders', function (Blueprint $table) {
            $table->string('external_source', 40)->nullable()->after('code');
            $table->string('external_order_id', 120)->nullable()->after('external_source');
            $table->string('external_checkout_id', 120)->nullable()->after('external_order_id');
            $table->string('external_delivery_order_id', 120)->nullable()->after('external_checkout_id');
            $table->string('external_channel', 120)->nullable()->after('external_delivery_order_id');
            $table->string('external_ecommerce', 120)->nullable()->after('external_channel');
            $table->string('external_subservice', 120)->nullable()->after('external_ecommerce');
            $table->string('external_payment_type', 60)->nullable()->after('external_subservice');
            $table->string('external_store_id', 120)->nullable()->after('external_payment_type');
            $table->string('external_warehouse_id', 120)->nullable()->after('external_store_id');
            $table->string('external_account_id', 120)->nullable()->after('external_warehouse_id');
            $table->string('external_sync_status', 40)->nullable()->after('external_account_id');
            $table->timestamp('external_last_synced_at')->nullable()->after('external_sync_status');
            $table->json('external_payload')->nullable()->after('external_last_synced_at');

            $table->unique(['external_source', 'external_order_id'], 'commercial_orders_external_unique');
            $table->index(['external_source', 'external_sync_status'], 'commercial_orders_external_status_idx');
            $table->index('external_checkout_id', 'commercial_orders_external_checkout_idx');
            $table->index('external_delivery_order_id', 'commercial_orders_external_delivery_idx');
        });

        Schema::table('commercial_order_items', function (Blueprint $table) {
            $table->unsignedInteger('external_item_number')->nullable()->after('price_list_item_id');
            $table->string('external_sku', 120)->nullable()->after('external_item_number');
            $table->json('external_payload')->nullable()->after('external_sku');

            $table->index(['external_sku', 'commercial_order_id'], 'commercial_order_items_external_sku_idx');
        });
    }

    public function down(): void
    {
        Schema::table('commercial_order_items', function (Blueprint $table) {
            $table->dropIndex('commercial_order_items_external_sku_idx');
            $table->dropColumn(['external_item_number', 'external_sku', 'external_payload']);
        });

        Schema::table('commercial_orders', function (Blueprint $table) {
            $table->dropUnique('commercial_orders_external_unique');
            $table->dropIndex('commercial_orders_external_status_idx');
            $table->dropIndex('commercial_orders_external_checkout_idx');
            $table->dropIndex('commercial_orders_external_delivery_idx');
            $table->dropColumn([
                'external_source',
                'external_order_id',
                'external_checkout_id',
                'external_delivery_order_id',
                'external_channel',
                'external_ecommerce',
                'external_subservice',
                'external_payment_type',
                'external_store_id',
                'external_warehouse_id',
                'external_account_id',
                'external_sync_status',
                'external_last_synced_at',
                'external_payload',
            ]);
        });
    }
};
