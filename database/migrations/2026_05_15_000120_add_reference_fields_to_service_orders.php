<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('service_orders', function (Blueprint $table) {
            if (!Schema::hasColumn('service_orders', 'contract_label')) {
                $table->string('contract_label', 120)->nullable()->after('billing_cycle');
            }
            if (!Schema::hasColumn('service_orders', 'billing_day')) {
                $table->unsignedTinyInteger('billing_day')->nullable()->after('installments');
            }
            if (!Schema::hasColumn('service_orders', 'detraction_enabled')) {
                $table->boolean('detraction_enabled')->default(false)->after('billing_day');
            }
        });

        Schema::table('service_order_items', function (Blueprint $table) {
            if (!Schema::hasColumn('service_order_items', 'scope')) {
                $table->string('scope', 160)->nullable()->after('service_id');
            }
            if (!Schema::hasColumn('service_order_items', 'gloss')) {
                $table->text('gloss')->nullable()->after('scope');
            }
        });
    }

    public function down(): void
    {
        Schema::table('service_order_items', function (Blueprint $table) {
            if (Schema::hasColumn('service_order_items', 'gloss')) {
                $table->dropColumn('gloss');
            }
            if (Schema::hasColumn('service_order_items', 'scope')) {
                $table->dropColumn('scope');
            }
        });

        Schema::table('service_orders', function (Blueprint $table) {
            if (Schema::hasColumn('service_orders', 'detraction_enabled')) {
                $table->dropColumn('detraction_enabled');
            }
            if (Schema::hasColumn('service_orders', 'billing_day')) {
                $table->dropColumn('billing_day');
            }
            if (Schema::hasColumn('service_orders', 'contract_label')) {
                $table->dropColumn('contract_label');
            }
        });
    }
};
