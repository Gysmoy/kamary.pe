<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('magistral_sales', function (Blueprint $table) {
            if (!Schema::hasColumn('magistral_sales', 'observations')) {
                $table->text('observations')->nullable()->after('sale_date');
            }
        });
    }

    public function down(): void
    {
        Schema::table('magistral_sales', function (Blueprint $table) {
            if (Schema::hasColumn('magistral_sales', 'observations')) {
                $table->dropColumn('observations');
            }
        });
    }
};
