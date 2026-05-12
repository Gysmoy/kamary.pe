<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('services', 'service_scope')) {
            Schema::table('services', function (Blueprint $table) {
                $table->string('service_scope', 60)->default('services')->after('code');
                $table->index(['service_scope', 'status'], 'services_scope_status_idx');
            });

            DB::table('services')
                ->whereNull('service_scope')
                ->orWhere('service_scope', '')
                ->update(['service_scope' => 'services']);
        }

        if (!Schema::hasColumn('service_orders', 'order_type')) {
            Schema::table('service_orders', function (Blueprint $table) {
                $table->string('order_type', 60)->default('service')->after('code');
                $table->index(['order_type', 'status'], 'service_orders_type_status_idx');
            });

            DB::table('service_orders')
                ->whereNull('order_type')
                ->orWhere('order_type', '')
                ->update(['order_type' => 'service']);
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('service_orders', 'order_type')) {
            Schema::table('service_orders', function (Blueprint $table) {
                $table->dropIndex('service_orders_type_status_idx');
                $table->dropColumn('order_type');
            });
        }

        if (Schema::hasColumn('services', 'service_scope')) {
            Schema::table('services', function (Blueprint $table) {
                $table->dropIndex('services_scope_status_idx');
                $table->dropColumn('service_scope');
            });
        }
    }
};
