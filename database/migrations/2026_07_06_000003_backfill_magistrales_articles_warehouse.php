<?php

use App\Support\MagistralesWarehouse;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Etapa 2.0 (fundacion): los articulos magistrales tienen warehouse_id NULL. Como el
     * almacen fijo de Magistrales ya es un warehouse de KAMARY_PERU, se rellena warehouse_id
     * para que los modulos generales (Inventario/Kardex) los vean de forma consistente cuando
     * se retiren los filtros module_scope en etapas siguientes.
     */
    public function up(): void
    {
        if (!Schema::hasColumn('articles', 'warehouse_id') || !Schema::hasColumn('articles', 'module_scope')) {
            return;
        }

        $warehouseId = MagistralesWarehouse::idOrNull();
        if (!$warehouseId) {
            return;
        }

        DB::table('articles')
            ->where('module_scope', 'magistrales')
            ->whereNull('warehouse_id')
            ->update(['warehouse_id' => $warehouseId]);
    }

    public function down(): void
    {
        // No-op: no se revierte el backfill (dato consistente).
    }
};
