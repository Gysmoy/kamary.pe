<?php

namespace Database\Seeders;

use App\Models\Client;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Completa los datos de los clientes de Serv. Almacenamiento con el reporte del sistema anterior
 * (RUC, correo, celular y direccion).
 *
 * Los 232 clientes que se importaron sin RUC quedaron con un documento de catalogo (CAT-8622), asi
 * que NO se puede emparejar por documento: hacerlo crearia un cliente nuevo por cada uno. El
 * emparejamiento es por RAZON SOCIAL dentro del modulo de almacenamiento, que es lo unico estable
 * entre los dos sistemas.
 *
 * Es idempotente: correrlo dos veces no cambia nada la segunda vez.
 * Con DRY_RUN=1 solo informa lo que haria, sin escribir.
 */
class StorageClientsContactImportSeeder extends Seeder
{
    private const ARCHIVO = 'database/data/almacenamiento_clientes_contacto.json';

    public function run(): void
    {
        $dryRun = filter_var(getenv('DRY_RUN') ?: '0', FILTER_VALIDATE_BOOLEAN);
        $ruta = base_path(self::ARCHIVO);
        if (!is_file($ruta)) {
            $this->aviso('No existe ' . self::ARCHIVO);
            return;
        }

        $filas = json_decode((string) file_get_contents($ruta), true)['clientes'] ?? [];
        if (!$filas) {
            $this->aviso('El archivo no tiene clientes');
            return;
        }

        $existentes = Client::query()->where('module_scope', 'storage')->get();
        $porNombre = [];
        foreach ($existentes as $cliente) {
            $porNombre[$this->norm($cliente->full_name)] = $cliente;
        }
        $porDocumento = [];
        foreach ($existentes as $cliente) {
            $porDocumento[$cliente->document_type . '|' . $cliente->document_number] = (int) $cliente->id;
        }

        $actualizados = 0;
        $sinCambios = 0;
        $creados = 0;
        $omitidos = [];

        DB::beginTransaction();
        try {
            foreach ($filas as $fila) {
                $nombre = trim((string) ($fila['razon_social'] ?? ''));
                if ($nombre === '') continue;

                $tipo = mb_strtolower(trim((string) ($fila['tipo_documento'] ?? '')));
                $numero = preg_replace('/\D+/', '', (string) ($fila['n_documento'] ?? ''));

                if (!in_array($tipo, ['ruc', 'dni', 'ce'], true)
                    || ($tipo === 'ruc' && strlen($numero) !== 11)
                    || ($tipo === 'dni' && strlen($numero) !== 8)) {
                    $omitidos[] = $nombre . ': documento invalido';
                    continue;
                }

                $clave = $this->norm($nombre);
                $actual = $porNombre[$clave] ?? null;

                $dueno = $porDocumento[$tipo . '|' . $numero] ?? null;
                if ($dueno !== null && (!$actual || $dueno !== (int) $actual->id)) {
                    $omitidos[] = $nombre . ': el documento ' . $numero . ' ya lo tiene el cliente #' . $dueno;
                    continue;
                }

                $datos = ['document_type' => $tipo, 'document_number' => $numero];
                $correo = trim((string) ($fila['email'] ?? ''));
                if ($correo !== '') {
                    $datos['email'] = $correo;
                    $datos['billing_email'] = $correo;
                }
                $celular = preg_replace('/\D+/', '', (string) ($fila['celular'] ?? ''));
                if ($celular !== '') {
                    $datos['phone'] = $celular;
                    $datos['phone_prefix'] = '51';
                }
                $direccion = trim((string) ($fila['direccion'] ?? ''));
                if ($direccion !== '') {
                    $datos['full_address'] = $direccion;
                }
                $datos['status'] = mb_strtoupper(trim((string) ($fila['estado'] ?? 'Activo'))) === 'INACTIVO' ? 0 : 1;

                if ($actual) {
                    $hayCambio = false;
                    foreach ($datos as $campo => $valor) {
                        if (!$this->mismoValor($actual->{$campo}, $valor)) { $hayCambio = true; break; }
                    }
                    if (!$hayCambio) { $sinCambios++; continue; }
                    if (!$dryRun) $actual->fill($datos)->save();
                    $porDocumento[$tipo . '|' . $numero] = (int) $actual->id;
                    $actualizados++;
                } else {
                    if (!$dryRun) {
                        $nuevo = Client::query()->create($datos + [
                            'module_scope' => 'storage',
                            'client_kind' => 'regular',
                            'full_name' => $nombre,
                            'has_storage_service' => true,
                        ]);
                        $porNombre[$clave] = $nuevo;
                        $porDocumento[$tipo . '|' . $numero] = (int) $nuevo->id;
                    }
                    $creados++;
                }
            }

            if ($dryRun) { DB::rollBack(); } else { DB::commit(); }
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }

        $this->aviso(($dryRun ? '[SIMULACION, no se escribio nada]' : '[aplicado]')
            . ' reporte: ' . count($filas)
            . ' | actualizados: ' . $actualizados
            . ' | creados: ' . $creados
            . ' | sin cambios: ' . $sinCambios
            . ' | omitidos: ' . count($omitidos));
        foreach (array_slice($omitidos, 0, 10) as $motivo) $this->aviso('   - ' . $motivo);
    }

    private function aviso(string $texto): void
    {
        if ($this->command) { $this->command->getOutput()->writeln($texto); return; }
        echo $texto . PHP_EOL;
    }

    /**
     * El modelo castea status a booleano, y (string) false da cadena vacia: comparar asi contra '0'
     * daba siempre distinto y los clientes inactivos se volvian a guardar en cada corrida.
     */
    private function mismoValor($a, $b): bool
    {
        if (is_bool($a)) $a = $a ? '1' : '0';
        if (is_bool($b)) $b = $b ? '1' : '0';
        return (string) $a === (string) $b;
    }

    private function norm($valor): string
    {
        return mb_strtoupper(trim(preg_replace('/\s+/u', ' ', (string) $valor)), 'UTF-8');
    }
}
