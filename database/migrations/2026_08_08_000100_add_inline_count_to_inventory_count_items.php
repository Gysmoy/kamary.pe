<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * El conteo ahora se escribe directamente en la tabla del modal (ubicacion y stock real),
 * en vez de bajar y subir una hoja de Excel. Eso obliga a guardar dos cosas mas por linea:
 *
 * - system_location: la ubicacion con la que nacio la linea. Si el usuario la cambia hay que
 *   sacar el stock de la ubicacion vieja y meterlo en la nueva, y para eso hace falta saber
 *   cual era la original.
 * - counted: si esa linea ya fue contada. Al registrar, todas nacen en 0 y aplicar sin este
 *   flag borraria el stock de las lineas que nadie llego a contar.
 */
return new class extends Migration
{
    private array $tables = [
        'inventory_count_items' => ['inventory_counts', 'inventory_count_id'],
        'storage_inventory_count_items' => ['storage_inventory_counts', 'storage_inventory_count_id'],
    ];

    public function up(): void
    {
        foreach ($this->tables as $itemsTable => [$countsTable, $foreignKey]) {
            if (!Schema::hasTable($itemsTable) || !Schema::hasTable($countsTable)) continue;

            Schema::table($itemsTable, function (Blueprint $table) use ($itemsTable) {
                if (!Schema::hasColumn($itemsTable, 'system_location')) {
                    $table->string('system_location')->nullable()->after('location');
                }
                if (!Schema::hasColumn($itemsTable, 'counted')) {
                    $table->boolean('counted')->default(false)->after('real_stock');
                }
            });

            DB::table($itemsTable)
                ->whereNull('system_location')
                ->update(['system_location' => DB::raw("COALESCE(`location`, '')")]);

            // Los inventarios historicos que ya salieron de "En espera" son los que tuvieron su
            // hoja de conteo subida: esas lineas si estan contadas.
            DB::table($itemsTable)
                ->whereIn($foreignKey, fn($query) => $query
                    ->select('id')
                    ->from($countsTable)
                    ->where('inventory_status', '<>', 'En espera'))
                ->update(['counted' => 1]);
        }
    }

    public function down(): void
    {
        foreach (array_keys($this->tables) as $itemsTable) {
            if (!Schema::hasTable($itemsTable)) continue;

            Schema::table($itemsTable, function (Blueprint $table) use ($itemsTable) {
                if (Schema::hasColumn($itemsTable, 'system_location')) $table->dropColumn('system_location');
                if (Schema::hasColumn($itemsTable, 'counted')) $table->dropColumn('counted');
            });
        }
    }
};
