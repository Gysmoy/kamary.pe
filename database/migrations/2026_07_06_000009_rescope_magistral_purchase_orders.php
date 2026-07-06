<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Al unificar la O. Compra de Magistrales con la O. Compra general (el almacen fijo 11 ahora
     * se opera desde el modulo general), las ordenes que quedaron marcadas como
     * purchase_orders.module_scope='magistrales' pasan a 'standard' para que aparezcan en el
     * listado general de O. Compra, filtrables por almacen (siguen apuntando al almacen fijo de
     * Magistrales, solo cambia el scope de la tabla).
     */
    public function up(): void
    {
        if (!Schema::hasColumn('purchase_orders', 'module_scope')) {
            return;
        }

        DB::table('purchase_orders')
            ->where('module_scope', 'magistrales')
            ->update(['module_scope' => 'standard']);
    }

    public function down(): void
    {
        // No-op: no se puede distinguir de forma confiable cuales ordenes 'standard' eran
        // originalmente magistrales (el almacen sigue siendo la unica fuente de verdad util).
    }
};
