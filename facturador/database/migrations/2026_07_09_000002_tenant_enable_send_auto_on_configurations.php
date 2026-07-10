<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Migrations\Migration;

class TenantEnableSendAutoOnConfigurations extends Migration
{
    /**
     * Sin send_auto los comprobantes quedan firmados pero nunca se transmiten a SUNAT.
     */
    public function up()
    {
        if (Schema::hasTable('configurations') && Schema::hasColumn('configurations', 'send_auto')) {
            DB::table('configurations')->update(['send_auto' => 1]);
        }
    }

    public function down()
    {
        // Intencionalmente vacio: no queremos volver a apagar el envio automatico.
    }
}
