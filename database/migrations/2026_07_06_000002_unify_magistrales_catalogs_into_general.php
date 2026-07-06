<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Unifica los catalogos de Magistrales con los generales de Almacen:
     *  - Unidad y Proveedor comparten tabla; se re-scopean de 'magistrales' a 'standard'.
     *  - Laboratorio era un fork (magistral_laboratories); se revierte hacia laboratories
     *    y se elimina la columna articles.magistral_laboratory_id y la tabla del fork.
     * No hay datos reales; solo demo/seed, por eso no se preserva historial adicional.
     */
    public function up(): void
    {
        // 1. Re-scopear catalogos globales (Unidad, Proveedor) a standard.
        if (Schema::hasColumn('units', 'module_scope')) {
            DB::table('units')->where('module_scope', 'magistrales')->update(['module_scope' => 'standard']);
        }
        if (Schema::hasColumn('suppliers', 'module_scope')) {
            DB::table('suppliers')->where('module_scope', 'magistrales')->update(['module_scope' => 'standard']);
        }

        // 2. Revertir el fork de Laboratorio hacia la tabla general 'laboratories'.
        if (Schema::hasTable('magistral_laboratories') && Schema::hasColumn('articles', 'magistral_laboratory_id')) {
            $map = [];
            foreach (DB::table('magistral_laboratories')->get() as $lab) {
                $code = $lab->code ?: ('MAGLAB-' . $lab->id);
                $laboratoryId = DB::table('laboratories')->where('code', $code)->value('id');
                if (!$laboratoryId) {
                    $laboratoryId = DB::table('laboratories')->insertGetId([
                        'name' => $lab->description ?? $code,
                        'code' => $code,
                        'country' => 'Perú',
                        'status' => $lab->status ?? 1,
                        'created_by' => $lab->created_by ?? null,
                        'updated_by' => $lab->updated_by ?? null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
                $map[$lab->id] = $laboratoryId;
            }

            foreach ($map as $magistralId => $laboratoryId) {
                DB::table('articles')
                    ->where('module_scope', 'magistrales')
                    ->where('magistral_laboratory_id', $magistralId)
                    ->update([
                        'laboratory_id' => $laboratoryId,
                        'active_principle_id' => null,
                    ]);
            }
        }

        // 3. Soltar FK + columna articles.magistral_laboratory_id.
        if (Schema::hasColumn('articles', 'magistral_laboratory_id')) {
            Schema::table('articles', function (Blueprint $table) {
                try {
                    $table->dropForeign(['magistral_laboratory_id']);
                } catch (\Throwable $e) {
                    // La FK pudo no existir; continuar con el drop de columna.
                }
                $table->dropColumn('magistral_laboratory_id');
            });
        }

        // 4. Eliminar la tabla del fork.
        Schema::dropIfExists('magistral_laboratories');
    }

    public function down(): void
    {
        // No-op: la unificacion no es reversible sin los datos del fork (demo).
    }
};
