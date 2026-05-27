<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('eventual_clients')) {
            return;
        }

        $hasShortCode = Schema::hasColumn('eventual_clients', 'short_code');
        $hasContractDueDays = Schema::hasColumn('eventual_clients', 'contract_due_days');

        if ($hasShortCode && $hasContractDueDays) {
            return;
        }

        Schema::table('eventual_clients', function (Blueprint $table) use ($hasShortCode, $hasContractDueDays) {
            if (!$hasShortCode) {
                $table->string('short_code', 40)->nullable()->after('contact_name');
            }

            if (!$hasContractDueDays) {
                $table->unsignedSmallInteger('contract_due_days')->nullable()->after('short_code');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('eventual_clients')) {
            return;
        }

        $columns = [];
        if (Schema::hasColumn('eventual_clients', 'contract_due_days')) {
            $columns[] = 'contract_due_days';
        }
        if (Schema::hasColumn('eventual_clients', 'short_code')) {
            $columns[] = 'short_code';
        }

        if (!$columns) {
            return;
        }

        Schema::table('eventual_clients', function (Blueprint $table) use ($columns) {
            $table->dropColumn($columns);
        });
    }
};
