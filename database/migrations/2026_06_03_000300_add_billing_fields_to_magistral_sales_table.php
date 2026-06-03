<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('magistral_sales', function (Blueprint $table) {
            if (!Schema::hasColumn('magistral_sales', 'billing_ruc')) {
                $table->string('billing_ruc', 11)->nullable()->after('document_number');
            }
            if (!Schema::hasColumn('magistral_sales', 'billing_business_name')) {
                $table->string('billing_business_name')->nullable()->after('billing_ruc');
            }
        });
    }

    public function down(): void
    {
        Schema::table('magistral_sales', function (Blueprint $table) {
            if (Schema::hasColumn('magistral_sales', 'billing_business_name')) {
                $table->dropColumn('billing_business_name');
            }
            if (Schema::hasColumn('magistral_sales', 'billing_ruc')) {
                $table->dropColumn('billing_ruc');
            }
        });
    }
};
