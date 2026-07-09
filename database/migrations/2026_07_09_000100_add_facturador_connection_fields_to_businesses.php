<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->string('facturador_base_url')->nullable()->after('facturador_company_id');
            $table->string('facturador_auth_mode', 10)->nullable()->after('facturador_base_url');
            $table->text('facturador_token')->nullable()->after('facturador_auth_mode');
            $table->string('facturador_api_email')->nullable()->after('facturador_token');
            $table->text('facturador_api_password')->nullable()->after('facturador_api_email');
        });
    }

    public function down(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->dropColumn([
                'facturador_base_url',
                'facturador_auth_mode',
                'facturador_token',
                'facturador_api_email',
                'facturador_api_password',
            ]);
        });
    }
};
