<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('sample_orders')) return;

        Schema::table('sample_orders', function (Blueprint $table) {
            if (!Schema::hasColumn('sample_orders', 'approved_at')) {
                $table->timestamp('approved_at')->nullable()->after('requested_at');
            }
        });

        if (Schema::hasColumn('sample_orders', 'approved_at')) {
            DB::table('sample_orders')
                ->whereIn('order_status', ['approved', 'preparing', 'in_route', 'delivered'])
                ->whereNull('approved_at')
                ->update(['approved_at' => DB::raw('COALESCE(updated_at, created_at)')]);
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('sample_orders') || !Schema::hasColumn('sample_orders', 'approved_at')) return;

        Schema::table('sample_orders', function (Blueprint $table) {
            $table->dropColumn('approved_at');
        });
    }
};
