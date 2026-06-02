<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('businesses', 'fiscal_address')) {
            Schema::table('businesses', function (Blueprint $table) {
                $table->string('fiscal_address')->nullable()->after('trade_name');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('businesses', 'fiscal_address')) {
            Schema::table('businesses', function (Blueprint $table) {
                $table->dropColumn('fiscal_address');
            });
        }
    }
};
