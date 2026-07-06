<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

/**
 * Etapa 3 (cutover final): los formularios de Magistrales - Nota de Entrada y Salidas
 * (App\Http\Controllers\Admin\Magistrales\IncomeController / OutputController) ya leen y
 * escriben directamente sobre el ledger general (entry_notes/entry_note_items,
 * exit_notes/exit_note_items) en el almacen fijo de Magistrales, en vez de estas tablas.
 *
 * Se eliminan en orden por FKs: primero los items, luego las cabeceras.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('magistral_income_items');
        Schema::dropIfExists('magistral_incomes');
        Schema::dropIfExists('magistral_output_items');
        Schema::dropIfExists('magistral_outputs');
    }

    public function down(): void
    {
        // No se recrean automaticamente: los datos ya viven en entry_notes/exit_notes
        // (mirados por la migracion 2026_07_06_000004). Si se necesitara revertir el cutover,
        // restaurar estas tablas desde un backup previo a esta migracion.
    }
};
