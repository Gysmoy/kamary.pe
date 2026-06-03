<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('clients')) {
            return;
        }

        Schema::table('clients', function (Blueprint $table) {
            if (!Schema::hasColumn('clients', 'birth_date')) {
                $table->date('birth_date')->nullable()->after('phone');
            }
            if (!Schema::hasColumn('clients', 'secondary_phone')) {
                $table->string('secondary_phone', 30)->nullable()->after('birth_date');
            }
            if (!Schema::hasColumn('clients', 'company_ruc')) {
                $table->string('company_ruc', 20)->nullable()->after('secondary_phone');
            }
            if (!Schema::hasColumn('clients', 'position')) {
                $table->string('position')->nullable()->after('company_ruc');
            }
            if (!Schema::hasColumn('clients', 'sex')) {
                $table->string('sex', 20)->nullable()->after('position');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('clients')) {
            return;
        }

        Schema::table('clients', function (Blueprint $table) {
            foreach (['sex', 'position', 'company_ruc', 'secondary_phone', 'birth_date'] as $column) {
                if (Schema::hasColumn('clients', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
