<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * El motivo de retraso de las muestras apuntaba a un catalogo hardcodeado. Se reemplaza por
 * delivery_delay_reasons, que ya existia y el negocio mantiene desde Pedidos comerciales.
 * Ningun pedido tenia motivo cargado, asi que no hay datos que migrar.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('sample_orders', 'delay_reason_id')) {
            Schema::table('sample_orders', function (Blueprint $table) {
                $table->unsignedBigInteger('delay_reason_id')->nullable()->after('delivered_at');
                $table->foreign('delay_reason_id')
                    ->references('id')
                    ->on('delivery_delay_reasons')
                    ->nullOnDelete();
            });
        }

        if (Schema::hasColumn('sample_orders', 'delay_reason')) {
            Schema::table('sample_orders', function (Blueprint $table) {
                $table->dropColumn('delay_reason');
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasColumn('sample_orders', 'delay_reason')) {
            Schema::table('sample_orders', function (Blueprint $table) {
                $table->string('delay_reason')->nullable()->after('delivered_at');
            });
        }

        if (Schema::hasColumn('sample_orders', 'delay_reason_id')) {
            Schema::table('sample_orders', function (Blueprint $table) {
                $table->dropForeign(['delay_reason_id']);
                $table->dropColumn('delay_reason_id');
            });
        }
    }
};
