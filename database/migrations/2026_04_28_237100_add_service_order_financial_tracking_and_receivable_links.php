<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('service_orders', function (Blueprint $table) {
            $table->decimal('paid_amount', 12, 2)->default(0)->after('total');
            $table->decimal('balance_amount', 12, 2)->default(0)->after('paid_amount');
            $table->string('payment_status', 20)->default('pending')->after('balance_amount');
            $table->dateTime('billed_at')->nullable()->after('payment_status');
        });

        Schema::table('accounts_receivable', function (Blueprint $table) {
            $table->foreignId('commercial_order_id')->nullable()->after('eventual_client_id')->constrained('commercial_orders')->nullOnDelete();
            $table->foreignId('service_order_id')->nullable()->after('commercial_order_id')->constrained('service_orders')->nullOnDelete();
            $table->index(['commercial_order_id', 'service_order_id'], 'accounts_receivable_source_links_idx');
        });

        DB::table('service_orders')->update([
            'paid_amount' => 0,
            'balance_amount' => DB::raw('total'),
            'payment_status' => 'pending',
        ]);

        DB::table('accounts_receivable')
            ->where('source_type', 'commercial_order')
            ->update([
                'commercial_order_id' => DB::raw('source_id'),
                'service_order_id' => null,
            ]);

        DB::table('accounts_receivable')
            ->where('source_type', 'service_order')
            ->update([
                'commercial_order_id' => null,
                'service_order_id' => DB::raw('source_id'),
            ]);
    }

    public function down(): void
    {
        Schema::table('accounts_receivable', function (Blueprint $table) {
            $table->dropIndex('accounts_receivable_source_links_idx');
            $table->dropConstrainedForeignId('service_order_id');
            $table->dropConstrainedForeignId('commercial_order_id');
        });

        Schema::table('service_orders', function (Blueprint $table) {
            $table->dropColumn(['paid_amount', 'balance_amount', 'payment_status', 'billed_at']);
        });
    }
};
