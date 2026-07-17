<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Credenciales de la API GRE 2.0 (Guia de Remision Electronica por REST) por empresa.
 * Se sincronizan al facturador (Company.gre_client_id / gre_client_secret). El usuario y
 * clave SOL se reutilizan de soap_username / soap_password.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            if (!Schema::hasColumn('businesses', 'gre_client_id')) {
                $table->string('gre_client_id')->nullable()->after('integrated_query_client_secret');
            }
            if (!Schema::hasColumn('businesses', 'gre_client_secret')) {
                $table->string('gre_client_secret')->nullable()->after('gre_client_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            foreach (['gre_client_id', 'gre_client_secret'] as $column) {
                if (Schema::hasColumn('businesses', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
