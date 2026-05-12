<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('clients', 'storage_tariff_enabled')) {
            Schema::table('clients', function (Blueprint $table) {
                $table->boolean('storage_tariff_enabled')->default(false)->after('has_storage_service');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('clients', 'storage_tariff_enabled')) {
            Schema::table('clients', function (Blueprint $table) {
                $table->dropColumn('storage_tariff_enabled');
            });
        }
    }
};
