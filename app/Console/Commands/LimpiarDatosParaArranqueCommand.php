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
 *      StockService). Borrando esas notas el kardex queda vacio y el stock en cero solo.
 *
 *      Va acotado por empresa, y por defecto SOLO Kamary Peru (que incluye el Almacen Muestras).
 *      Serv. Almacenamiento queda afuera a proposito: sus notas de entrada sostienen la mercaderia
 *      que los clientes tienen en custodia, y se cargaron de golpe el 2026-07-07. Borrarlas seria
 *      borrar el stock real de 33 clientes. Comparten tabla con las de Kamary Peru, asi que sin
 *      este filtro se irian todas juntas.
 *
 *   2. Clientes de Serv. Almacenamiento: SOLO si se pide con --clientes-almacenamiento. Esos
 *      clientes se importaron del sistema anterior del cliente, asi que no entran en la limpieza
 *      por defecto. Si se pide, se borran los clientes y todo lo que
 *      cuelga de ellos. No alcanza con borrar la fila del cliente: service_orders.client_id y
 *      orders.client_id son llaves foraneas sin borrado en cascada (la base lo rechaza), y
 *      billing_documents.client_id se pone en nulo (dejaria pre-facturas sin dueño). Por eso se
 *      borran los hijos primero, en orden.
 *
 *   3. Datos de prueba del modulo Muestras (--muestras-demo): los 20 productos MUESTRA-001 a
 *      MUESTRA-020 y la nota NE-MUESTRAS-TEST que sembraba SamplesTestStockSeeder en cada
 *      arranque del contenedor. Se crearon con module_scope 'standard', asi que aparecian en la
 *      lista de Articulos de Kamary Peru junto a los reales.
 *
 * Las ubicaciones de almacen NO se borran: son infraestructura, no datos del cliente. Solo se
 * liberan (se les quita el cliente y la orden de servicio) para poder reasignarlas.
 */
class LimpiarDatosParaArranqueCommand extends Command
{
    protected $signature = 'kamary:limpiar-para-arranque
        {--kardex : Movimientos de stock. Es lo que se limpia por defecto}
        {--empresa=kamary_peru : Empresa cuyos movimientos se limpian. "todas" incluye Serv. Almacenamiento}
        {--clientes-almacenamiento : OJO: borra los clientes importados del sistema anterior. No se hace solo}
        {--cliente= : Borra un solo cliente de almacenamiento, por id o por numero de documento}
        {--muestras-demo : Borra los 20 productos de prueba del modulo Muestras y su nota}
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

    /**
     * Productos de prueba que sembraba SamplesTestStockSeeder en cada arranque del contenedor.
     * Se crearon con module_scope 'standard', asi que salen en la lista de Articulos de Kamary
     * Peru mezclados con los reales. Los de verdad son MUESTRAS000001 en adelante, sin guion.
     */
    private const ARTICULOS_DEMO = [
        'MUESTRA-001', 'MUESTRA-002', 'MUESTRA-003', 'MUESTRA-004', 'MUESTRA-005',
        'MUESTRA-006', 'MUESTRA-007', 'MUESTRA-008', 'MUESTRA-009', 'MUESTRA-010',
        'MUESTRA-011', 'MUESTRA-012', 'MUESTRA-013', 'MUESTRA-014', 'MUESTRA-015',
        'MUESTRA-016', 'MUESTRA-017', 'MUESTRA-018', 'MUESTRA-019', 'MUESTRA-020',
    ];

    private const NOTA_DEMO = 'NE-MUESTRAS-TEST';

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

        // Por defecto se limpian SOLO los movimientos de stock. Los clientes de almacenamiento se
        // importaron del sistema anterior del cliente: no se tocan salvo que se pidan a proposito
        // con --clientes-almacenamiento.
        $clientes = (bool) $this->option('clientes-almacenamiento') || $this->option('cliente') !== null;
        $demo = (bool) $this->option('muestras-demo');
        $kardex = (bool) $this->option('kardex') || (!$clientes && !$demo);

        $this->newLine();
        $this->line('<options=bold>LIMPIEZA DE ARRANQUE</>');
        $this->line($aplicar
            ? '<fg=red;options=bold>MODO REAL: lo que se borre no se recupera.</>'
            : '<fg=yellow>Modo prueba: no se va a borrar nada. Agrega --aplicar para hacerlo.</>');
        $this->newLine();

        $idsClientes = $clientes ? $this->idsClientesAlmacenamiento() : collect();
        $idsEmpresas = $kardex ? $this->idsEmpresas() : collect();
        if ($kardex && $idsEmpresas->isEmpty()) {
            $this->error('No encontre la empresa "' . $this->option('empresa') . '". Revisa el business_key.');
            return self::FAILURE;
        }

        $plan = [];

        if ($kardex) {
            $this->line('<options=bold>1. Movimientos de stock de ' . $this->nombreDelAlcance() . '</>');
            foreach (self::TABLAS_KARDEX as $tabla => $etiqueta) {
                if (!Schema::hasTable($tabla)) continue;
                $plan[] = ['Kardex', $etiqueta, DB::table($tabla)->whereIn('business_id', $idsEmpresas)->count()];
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

        if ($demo) {
            $this->line('<options=bold>3. Datos de prueba del modulo Muestras</>');
            $plan[] = ['Muestras', 'Nota de prueba ' . self::NOTA_DEMO . ' (+ sus items)', $this->notasDemo()->count()];
            $plan[] = ['Muestras', 'Productos de prueba MUESTRA-001 a MUESTRA-020', $this->articulosDemo()->count()];
        }

        $this->newLine();
        $this->table(
            ['Area', 'Que se borra', 'Filas'],
            array_map(fn($fila) => [$fila[0], $fila[1], number_format($fila[2])], $plan)
        );

        $totalFilas = array_sum(array_column($plan, 2));
        $this->line('Filas a borrar: <options=bold>' . number_format($totalFilas) . '</>');

        if ($kardex) $this->mostrarDesgloseDeNotas($idsEmpresas);
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
            $borradas = DB::transaction(function () use ($kardex, $clientes, $demo, $idsClientes, $idsEmpresas) {
                $cuenta = 0;

                if ($kardex) {
                    foreach (self::TABLAS_KARDEX as $tabla => $etiqueta) {
                        if (!Schema::hasTable($tabla)) continue;
                        $filas = DB::table($tabla)->whereIn('business_id', $idsEmpresas)->delete();
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

                if ($demo) {
                    $notas = $this->notasDemo()->delete();
                    $articulos = $this->articulosDemo()->delete();
                    $cuenta += $notas + $articulos;
                    $this->line('   borrado:  ' . str_pad('Nota de prueba ' . self::NOTA_DEMO, 48) . number_format($notas));
                    $this->line('   borrado:  ' . str_pad('Productos de prueba de Muestras', 48) . number_format($articulos));
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
        if ($kardex) $this->line('El kardex y el stock de ' . $this->nombreDelAlcance() . ' quedan en cero.');
        if ($clientes) $this->line('Las ubicaciones siguen creadas, sin cliente asignado.');
        if ($demo) $this->line('El modulo Muestras queda solo con los productos reales.');

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

        // Un solo cliente: se acepta el id o el numero de documento, que es con lo que uno lo tiene
        // a mano cuando mira la pantalla.
        $uno = $this->option('cliente');
        if ($uno !== null) {
            $buscado = trim((string) $uno);
            $soloDigitos = preg_replace('/\D+/', '', $buscado);
            if ($soloDigitos === '') {
                $this->error('El valor de --cliente tiene que ser un id o un numero de documento.');
                return collect();
            }

            $query->where(function ($inner) use ($buscado, $soloDigitos) {
                $inner->where('document_number', $soloDigitos);
                if (ctype_digit($buscado)) $inner->orWhere('id', (int) $buscado);
            });

            $encontrados = $query->get(['id', 'full_name', 'document_number']);
            if ($encontrados->isEmpty()) {
                $this->error('No encontre ningun cliente de almacenamiento con "' . $buscado . '".');
                return collect();
            }

            $this->newLine();
            foreach ($encontrados as $cliente) {
                $this->line(sprintf('   cliente a borrar: #%s  %s  (%s)', $cliente->id, $cliente->full_name, $cliente->document_number));
            }

            return $encontrados->pluck('id');
        }

        return $query->pluck('id');
    }

    /**
     * De donde sale cada nota, antes de borrarlas.
     *
     * Importa porque no es lo mismo una nota de prueba que una con la que se cargo mercaderia real
     * en custodia: las notas con cliente de almacenamiento son las que sostienen ese stock. Si ahi
     * aparecen muchas, conviene revisarlas antes de borrar.
     */
    private function mostrarDesgloseDeNotas($idsEmpresas): void
    {
        $dentro = [];
        $fuera = [];
        $clavesEnAlcance = DB::table('businesses')->whereIn('id', $idsEmpresas)->pluck('business_key')->all();

        foreach (['entry_notes' => 'Notas de entrada', 'exit_notes' => 'Notas de salida'] as $tabla => $nombre) {
            if (!Schema::hasTable($tabla)) continue;

            $porAlmacen = DB::table($tabla . ' as nota')
                ->leftJoin('warehouses as almacen', 'almacen.id', '=', 'nota.warehouse_id')
                ->leftJoin('businesses as empresa', 'empresa.id', '=', 'nota.business_id')
                ->selectRaw('COALESCE(almacen.name, ?) as almacen, empresa.business_key as empresa, COUNT(*) as notas', ['(sin almacen)'])
                ->groupBy('almacen.name', 'empresa.business_key')
                ->orderByDesc('notas')
                ->get();

            foreach ($porAlmacen as $fila) {
                $linea = [$nombre, $fila->almacen, $fila->empresa ?: '-', number_format($fila->notas)];

                if (in_array($fila->empresa, $clavesEnAlcance, true)) {
                    $dentro[] = $linea;
                } else {
                    $fuera[] = $linea;
                }
            }
        }

        if ($dentro) {
            $this->newLine();
            $this->line('<options=bold>Notas que se borran, por almacen:</>');
            $this->table(['Tipo', 'Almacen', 'Empresa', 'Notas'], $dentro);
        }

        if ($fuera) {
            $this->newLine();
            $this->line('<fg=green;options=bold>Notas que NO se tocan (fuera del alcance):</>');
            $this->table(['Tipo', 'Almacen', 'Empresa', 'Notas'], $fuera);
            $this->line('<fg=green>Esas sostienen la mercaderia que los clientes tienen en custodia.</>');
        }
    }

    /** La nota que sembraba el seeder de prueba. Normalmente ya no existe. */
    private function notasDemo()
    {
        return DB::table('entry_notes')->where('code', self::NOTA_DEMO);
    }

    /** Los 20 productos de prueba, por codigo exacto para no rozar los reales. */
    private function articulosDemo()
    {
        $query = DB::table('articles')->whereIn('code', self::ARTICULOS_DEMO);

        if (Schema::hasColumn('articles', 'module_scope')) {
            $query->where('module_scope', 'standard');
        }

        return $query;
    }

    /** Empresas cuyos movimientos se van a limpiar. Por defecto, solo Kamary Peru. */
    private function idsEmpresas()
    {
        $pedida = trim((string) $this->option('empresa'));

        if ($pedida === '' || mb_strtolower($pedida) === 'todas') {
            return DB::table('businesses')->pluck('id');
        }

        return DB::table('businesses')->where('business_key', $pedida)->pluck('id');
    }

    private function nombreDelAlcance(): string
    {
        $pedida = trim((string) $this->option('empresa'));

        return ($pedida === '' || mb_strtolower($pedida) === 'todas')
            ? 'TODAS las empresas'
            : $pedida;
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
