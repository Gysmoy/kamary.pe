<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Limpieza de arranque: deja el sistema sin los datos de prueba de la implementacion para que el
 * cliente empiece a cargar los suyos.
 *
 * Se ejecuta UNA vez, antes de que empiecen a usarlo. De ahi en adelante esto ya es informacion
 * sensible y no se vuelve a correr: por eso borra de verdad (no oculta), pide confirmacion escrita
 * y, sin --aplicar, solo muestra lo que haria.
 *
 * Que limpia y por que, en ese orden:
 *
 *   1. Movimientos de stock (--kardex): notas de entrada, notas de salida, recepciones de compra,
 *      despachos y reservas de pedidos. El kardex y el stock no se guardan en ninguna tabla propia:
 *      se calculan sumando entry_note_items + purchase_receipt_items - exit_note_items (ver
 *      StockService). Borrando esas notas el kardex queda vacio y el stock en cero solo, tanto el de
 *      Kamary Peru y Muestras como el de Serv. Almacenamiento, que comparten las mismas tablas.
 *
 *   2. Clientes de Serv. Almacenamiento (--clientes-almacenamiento): los clientes y todo lo que
 *      cuelga de ellos. No alcanza con borrar la fila del cliente: service_orders.client_id y
 *      orders.client_id son llaves foraneas sin borrado en cascada (la base lo rechaza), y
 *      billing_documents.client_id se pone en nulo (dejaria pre-facturas sin dueño). Por eso se
 *      borran los hijos primero, en orden.
 *
 * Las ubicaciones de almacen NO se borran: son infraestructura, no datos del cliente. Solo se
 * liberan (se les quita el cliente y la orden de servicio) para poder reasignarlas.
 */
class LimpiarDatosParaArranqueCommand extends Command
{
    protected $signature = 'kamary:limpiar-para-arranque
        {--kardex : Solo los movimientos de stock}
        {--clientes-almacenamiento : Solo los clientes de Serv. Almacenamiento}
        {--aplicar : Borra de verdad. Sin esta opcion solo muestra lo que haria}
        {--sin-confirmar : No pide escribir la palabra de confirmacion}';

    protected $description = 'Limpieza de arranque: borra los datos de prueba de kardex, notas y clientes de almacenamiento.';

    /** Movimientos de stock, en orden de borrado (los items caen en cascada). */
    private const TABLAS_KARDEX = [
        'dispatches' => 'Despachos (+ sus items)',
        'exit_notes' => 'Notas de salida (+ sus items)',
        'entry_notes' => 'Notas de entrada (+ sus items)',
        'purchase_receipts' => 'Recepciones de compra (+ sus items)',
        'commercial_order_stock_movements' => 'Reservas de stock de pedidos',
    ];

    /** Lo que cuelga de un cliente de almacenamiento, en orden de borrado. */
    private const TABLAS_CLIENTE = [
        'billing_documents' => ['client_id', 'Pre-facturas y comprobantes (+ items y eventos)'],
        'accounts_receivable' => ['client_id', 'Cuentas por cobrar'],
        'service_orders' => ['client_id', 'Ordenes de servicio (+ sus items)'],
        'orders' => ['client_id', 'Pedidos web'],
        'commercial_orders' => ['client_id', 'Pedidos comerciales'],
        'take_orders' => ['client_id', 'Tomas de pedido'],
        'price_lists' => ['client_id', 'Listas de precios'],
        'activities' => ['client_id', 'Actividades / seguimiento'],
        'client_distribution_networks' => ['client_id', 'Redes de distribucion'],
        'client_delivery_addresses' => ['client_id', 'Direcciones de entrega'],
        'storage_inventory_counts' => ['client_id', 'Conteos de inventario (+ sus items)'],
        'clients' => ['id', 'CLIENTES (arrastra contratos, anexos, tarifas, notificaciones y tokens)'],
    ];

    public function handle(): int
    {
        $aplicar = (bool) $this->option('aplicar');
        $kardex = (bool) $this->option('kardex');
        $clientes = (bool) $this->option('clientes-almacenamiento');
        if (!$kardex && !$clientes) $kardex = $clientes = true;

        $this->newLine();
        $this->line('<options=bold>LIMPIEZA DE ARRANQUE</>');
        $this->line($aplicar
            ? '<fg=red;options=bold>MODO REAL: lo que se borre no se recupera.</>'
            : '<fg=yellow>Modo prueba: no se va a borrar nada. Agrega --aplicar para hacerlo.</>');
        $this->newLine();

        $idsClientes = $clientes ? $this->idsClientesAlmacenamiento() : collect();
        $plan = [];

        if ($kardex) {
            $this->line('<options=bold>1. Movimientos de stock (kardex, notas, despachos)</>');
            foreach (self::TABLAS_KARDEX as $tabla => $etiqueta) {
                if (!Schema::hasTable($tabla)) continue;
                $plan[] = ['Kardex', $etiqueta, DB::table($tabla)->count()];
            }
        }

        if ($clientes) {
            $this->line('<options=bold>2. Clientes de Serv. Almacenamiento</>');
            if ($idsClientes->isEmpty()) {
                $this->warn('   No hay clientes de almacenamiento que borrar.');
            }
            foreach (self::TABLAS_CLIENTE as $tabla => [$columna, $etiqueta]) {
                if (!Schema::hasTable($tabla) || !Schema::hasColumn($tabla, $columna)) continue;
                $total = $idsClientes->isEmpty() ? 0 : DB::table($tabla)->whereIn($columna, $idsClientes)->count();
                $plan[] = ['Clientes', $etiqueta, $total];
            }
        }

        $this->newLine();
        $this->table(
            ['Area', 'Que se borra', 'Filas'],
            array_map(fn($fila) => [$fila[0], $fila[1], number_format($fila[2])], $plan)
        );

        $totalFilas = array_sum(array_column($plan, 2));
        $this->line('Filas a borrar: <options=bold>' . number_format($totalFilas) . '</>');

        $this->mostrarEfectosColaterales($idsClientes, $kardex, $clientes);

        if (!$aplicar) {
            $this->newLine();
            $this->warn('Nada se toco. Revisa la lista de arriba y, si esta bien, repite con --aplicar.');
            return self::SUCCESS;
        }

        if ($totalFilas === 0) {
            $this->info('No hay nada que borrar.');
            return self::SUCCESS;
        }

        if (!$this->option('sin-confirmar')) {
            $this->newLine();
            $this->error('Esto borra ' . number_format($totalFilas) . ' filas y no se puede deshacer.');
            $this->line('Antes de seguir conviene tener el respaldo de la base:');
            $this->line('  <fg=cyan>docker compose exec -T db sh -c \'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction "$MYSQL_DATABASE"\' > respaldo.sql</>');
            if (trim((string) $this->ask('Escribe LIMPIAR para confirmar')) !== 'LIMPIAR') {
                $this->warn('Cancelado. No se borro nada.');
                return self::FAILURE;
            }
        }

        try {
            $borradas = DB::transaction(function () use ($kardex, $clientes, $idsClientes) {
                $cuenta = 0;

                if ($kardex) {
                    foreach (self::TABLAS_KARDEX as $tabla => $etiqueta) {
                        if (!Schema::hasTable($tabla)) continue;
                        $filas = DB::table($tabla)->delete();
                        $cuenta += $filas;
                        $this->line('   borrado:  ' . str_pad($etiqueta, 48) . number_format($filas));
                    }
                }

                if ($clientes && $idsClientes->isNotEmpty()) {
                    // Las ubicaciones no se borran: se liberan para poder reasignarlas.
                    if (Schema::hasTable('storage_locations')) {
                        $liberadas = DB::table('storage_locations')
                            ->whereIn('client_id', $idsClientes)
                            ->update(['client_id' => null, 'service_order_code' => null, 'updated_at' => now()]);
                        $this->line('   liberado: ' . str_pad('Ubicaciones (siguen creadas, sin cliente)', 48) . number_format($liberadas));
                    }

                    foreach (self::TABLAS_CLIENTE as $tabla => [$columna, $etiqueta]) {
                        if (!Schema::hasTable($tabla) || !Schema::hasColumn($tabla, $columna)) continue;
                        $filas = DB::table($tabla)->whereIn($columna, $idsClientes)->delete();
                        $cuenta += $filas;
                        $this->line('   borrado:  ' . str_pad($etiqueta, 48) . number_format($filas));
                    }
                }

                return $cuenta;
            });
        } catch (\Throwable $e) {
            $this->newLine();
            $this->error('No se borro nada: la base rechazo la operacion y se deshizo todo.');
            $this->line($e->getMessage());
            return self::FAILURE;
        }

        $this->newLine();
        $this->info('Listo. Filas borradas: ' . number_format($borradas));
        $this->line('El kardex y el stock quedan en cero. Las ubicaciones siguen creadas, sin cliente asignado.');

        return self::SUCCESS;
    }

    /** Clientes de Serv. Almacenamiento, sin importar si estan activos u ocultos. */
    private function idsClientesAlmacenamiento()
    {
        $query = DB::table('clients');

        if (Schema::hasColumn('clients', 'module_scope')) {
            $query->where('module_scope', 'storage');
        } elseif (Schema::hasColumn('clients', 'has_storage_service')) {
            $query->where('has_storage_service', true);
        } else {
            return collect();
        }

        return $query->pluck('id');
    }

    /** Lo que no se borra pero cambia, para que no sorprenda despues. */
    private function mostrarEfectosColaterales($idsClientes, bool $kardex, bool $clientes): void
    {
        if (!$clientes || $idsClientes->isEmpty()) return;

        $avisos = [];

        if (Schema::hasTable('storage_locations')) {
            $total = DB::table('storage_locations')->whereIn('client_id', $idsClientes)->count();
            if ($total) $avisos[] = "{$total} ubicaciones quedan creadas pero libres (se les quita el cliente y la orden de servicio).";
        }

        if (Schema::hasTable('articles') && Schema::hasColumn('articles', 'client_id')) {
            $total = DB::table('articles')->whereIn('client_id', $idsClientes)->count();
            if ($total) $avisos[] = "{$total} productos de almacenamiento quedan sin cliente asignado (no se borran).";
        }

        if (Schema::hasColumn('users', 'storage_client_id')) {
            $total = DB::table('users')->whereIn('storage_client_id', $idsClientes)->count();
            if ($total) $avisos[] = "{$total} usuarios del portal pierden el vinculo con su cliente (la cuenta no se borra).";
        }

        if (!$kardex) {
            foreach (['entry_notes' => 'notas de entrada', 'exit_notes' => 'notas de salida'] as $tabla => $nombre) {
                if (!Schema::hasTable($tabla) || !Schema::hasColumn($tabla, 'client_id')) continue;
                $total = DB::table($tabla)->whereIn('client_id', $idsClientes)->count();
                if ($total) $avisos[] = "{$total} {$nombre} quedan sin cliente asignado (corre tambien --kardex si quieres borrarlas).";
            }
        }

        if (!$avisos) return;

        $this->newLine();
        $this->line('<options=bold>Ademas, sin borrarse:</>');
        foreach ($avisos as $aviso) $this->line('  - ' . $aviso);
    }
}
