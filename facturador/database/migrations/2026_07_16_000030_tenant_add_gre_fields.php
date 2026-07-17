<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

/**
 * GRE 2.0 (Guia de Remision Electronica por API REST + OAuth2).
 *
 * SUNAT dio de baja el servicio SOAP de guias (codigo 1085) y ahora exige el
 * envio por la API REST /gem con token OAuth2. Esto requiere:
 *  - credenciales de la API GRE por empresa (client_id/secret del portal SOL);
 *  - guardar el numero de TICKET que devuelve el envio (flujo asincrono: primero
 *    se envia y se recibe un ticket, luego se consulta el ticket para el CDR).
 */
class TenantAddGreFields extends Migration
{
    public function up()
    {
        Schema::table('companies', function (Blueprint $table) {
            if (!Schema::hasColumn('companies', 'gre_client_id')) {
                $table->string('gre_client_id')->nullable()->after('integrated_query_client_secret');
            }
            if (!Schema::hasColumn('companies', 'gre_client_secret')) {
                $table->string('gre_client_secret')->nullable()->after('gre_client_id');
            }
        });

        if (Schema::hasTable('dispatches')) {
            Schema::table('dispatches', function (Blueprint $table) {
                if (!Schema::hasColumn('dispatches', 'ticket')) {
                    $table->string('ticket')->nullable()->after('external_id');
                }
                if (!Schema::hasColumn('dispatches', 'gre_response')) {
                    $table->text('gre_response')->nullable()->after('has_cdr');
                }
            });
        }
    }

    public function down()
    {
        Schema::table('companies', function (Blueprint $table) {
            foreach (['gre_client_id', 'gre_client_secret'] as $column) {
                if (Schema::hasColumn('companies', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        if (Schema::hasTable('dispatches')) {
            Schema::table('dispatches', function (Blueprint $table) {
                foreach (['ticket', 'gre_response'] as $column) {
                    if (Schema::hasColumn('dispatches', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }
}
