<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Limpieza one-time: durante las pruebas quedaron guias (dispatches) FANTASMA registradas
 * localmente en el facturador que nunca fueron aceptadas por SUNAT (fallaron por bugs).
 * Ocupan correlativos T001 y bloquean la emision. Se borran solo las NO aceptadas.
 */
class CleanupPhantomDispatches extends Migration
{
    public function up()
    {
        if (!Schema::hasTable('dispatches')) {
            return;
        }

        $ids = DB::table('dispatches')
            ->where(function ($q) {
                $q->where('state_type_id', '!=', '05')->orWhereNull('state_type_id');
            })
            ->pluck('id');

        if ($ids->isEmpty()) {
            return;
        }

        if (Schema::hasTable('dispatch_items')) {
            DB::table('dispatch_items')->whereIn('dispatch_id', $ids)->delete();
        }
        DB::table('dispatches')->whereIn('id', $ids)->delete();
    }

    public function down()
    {
        // No reversible (datos fantasma de prueba).
    }
}
