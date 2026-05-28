<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('businesses', 'payment_accounts')) {
            Schema::table('businesses', function (Blueprint $table) {
                $table->json('payment_accounts')->nullable()->after('detraction_account');
            });
        }

        DB::table('businesses')
            ->where('business_key', 'kamary_peru')
            ->whereNull('payment_accounts')
            ->update([
                'payment_accounts' => json_encode([
                    'title' => 'KAMARY PERU SAC',
                    'subtitle' => 'Cuentas Soles',
                    'lines' => [
                        'Banco Continental 0011-0341-0100042961',
                        'CCI 011-341-000100042961-51',
                        'Banco Crédito 191-8971815-0-91',
                        'CCI 002-191-008971815091-58',
                        'Interbank 200-3005034190',
                        'CCI: 003-200-003005034190-35',
                    ],
                ], JSON_UNESCAPED_UNICODE),
            ]);
    }

    public function down(): void
    {
        if (Schema::hasColumn('businesses', 'payment_accounts')) {
            Schema::table('businesses', function (Blueprint $table) {
                $table->dropColumn('payment_accounts');
            });
        }
    }
};
