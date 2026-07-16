<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Limpieza one-time: durante las pruebas quedaron notas de credito (07) FANTASMA
 * registradas localmente en el facturador que NUNCA fueron aceptadas por SUNAT
 * (fallaron por bugs de template). Ocupan correlativos FC01 y bloquean la emision
 * real. Se borran solo las NO aceptadas (state_type_id != '05'); las aceptadas,
 * si existieran, se conservan intactas. Es segura y solo aplica una vez.
 */
class CleanupPhantomCreditNotes extends Migration
{
    public function up()
    {
        if (!Schema::hasTable('documents')) {
            return;
        }

        $ids = DB::table('documents')
            ->where('document_type_id', '07')
            ->where(function ($q) {
                $q->where('state_type_id', '!=', '05')->orWhereNull('state_type_id');
            })
            ->pluck('id');

        if ($ids->isEmpty()) {
            return;
        }

        // borrar hijos primero para no dejar huerfanos
        foreach (['document_items', 'notes'] as $child) {
            if (Schema::hasTable($child)) {
                DB::table($child)->whereIn('document_id', $ids)->delete();
            }
        }
        DB::table('documents')->whereIn('id', $ids)->delete();
    }

    public function down()
    {
        // No reversible (borrado de datos fantasma de prueba).
    }
}
