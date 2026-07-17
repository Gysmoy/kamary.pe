<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * La columna qr de dispatches quedo demasiado chica en produccion (fork lite) y el QR
 * base64 de la guia no cabe ("Data too long for column 'qr'"). Se fuerza a MEDIUMTEXT.
 */
class FixDispatchesQrColumnSize extends Migration
{
    public function up()
    {
        if (Schema::hasTable('dispatches') && Schema::hasColumn('dispatches', 'qr')) {
            DB::statement('ALTER TABLE `dispatches` MODIFY `qr` MEDIUMTEXT NULL');
        }
        // por las dudas, tambien hash/filename si existieran chicos
        if (Schema::hasTable('dispatches') && Schema::hasColumn('dispatches', 'hash')) {
            DB::statement('ALTER TABLE `dispatches` MODIFY `hash` TEXT NULL');
        }
    }

    public function down()
    {
        // No revertir (evitar truncar datos).
    }
}
