<?php

namespace Database\Seeders;

use App\Support\BusinessScope;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Carga el maestro de ubicaciones del sistema anterior (almacen, codigo, temperatura, orden de
 * servicio y cliente ocupante).
 *
 * Hoy el sistema solo tiene las 132 ubicaciones que tenian stock el dia del export: las libres, o
 * las asignadas sin mercaderia, nunca entraron. Por eso un cliente con dos almacenes se veia con
 * uno solo.
 *
 * No borra nada: actualiza las que ya existen y agrega las que faltan. Es idempotente.
 * Con DRY_RUN=1 solo informa lo que haria, sin escribir.
 */
class StorageLocationsImportSeeder extends Seeder
{
    private const ARCHIVO = 'database/data/almacenamiento_ubicaciones.json';

    /** Mismos valores que acepta el sistema (ver KardexController::TEMPERATURES). */
    private const TEMPERATURAS = ["-15\u{00B0}C a -25\u{00B0}C", "2\u{00B0}C a 8\u{00B0}C", "15\u{00B0}C a 25\u{00B0}C", "-15\u{00B0}C a -40\u{00B0}C"];

    public function run(): void
    {
        $dryRun = filter_var(getenv('DRY_RUN') ?: '0', FILTER_VALIDATE_BOOLEAN);
        $ruta = base_path(self::ARCHIVO);
        if (!is_file($ruta)) {
            $this->aviso('No existe ' . self::ARCHIVO);
            return;
        }

        $filas = json_decode((string) file_get_contents($ruta), true)['ubicaciones'] ?? [];
        if (!$filas) {
            $this->aviso('El archivo no tiene ubicaciones');
            return;
        }

        // Almacenes del negocio de almacenamiento, indexados por nombre normalizado.
        $almacenes = [];
        $rows = DB::table('warehouses')
            ->leftJoin('business_branches as branch', 'branch.id', '=', 'warehouses.business_branch_id')
            ->leftJoin('businesses as business', 'business.id', '=', 'branch.business_id')
            ->where('business.business_key', BusinessScope::KAMARY_MEDICALS)
            ->whereNotNull('warehouses.status')
            ->get(['warehouses.id', 'warehouses.name']);
        foreach ($rows as $w) {
            $almacenes[$this->norm($w->name)] = (int) $w->id;
        }

        // Clientes del modulo, indexados por numero de documento.
        $clientes = [];
        foreach (DB::table('clients')->where('module_scope', 'storage')->get(['id', 'document_number']) as $c) {
            $clientes[preg_replace('/\D+/', '', (string) $c->document_number)] = (int) $c->id;
        }

        $userId = (int) (DB::table('users')->whereNotNull('status')->min('id') ?: 1);

        // Se agrupa por almacen + codigo, porque una ubicacion es un espacio fisico.
        $grupos = [];
        $omitidos = [];
        foreach ($filas as $fila) {
            $almacenId = $almacenes[$this->norm($fila['almacen'] ?? '')] ?? null;
            if (!$almacenId) {
                $omitidos[] = 'almacen desconocido: ' . ($fila['almacen'] ?? '');
                continue;
            }

            $codigo = trim((string) ($fila['ubicacion'] ?? ''));
            if ($codigo === '') continue;

            $ruc = preg_replace('/\D+/', '', (string) ($fila['ruc'] ?? ''));
            $clienteId = $ruc !== '' ? ($clientes[$ruc] ?? null) : null;
            if ($ruc !== '' && !$clienteId) {
                $omitidos[] = 'cliente no encontrado: ' . $ruc . ' (' . ($fila['razon_social'] ?? '') . ')';
                continue;
            }

            $temperatura = trim((string) ($fila['temperatura'] ?? ''));
            if (!in_array($temperatura, self::TEMPERATURAS, true)) $temperatura = '';

            $grupos[$almacenId . '|' . mb_strtoupper($codigo)][] = [
                'warehouse_id' => $almacenId,
                'client_id' => $clienteId,
                'code' => $codigo,
                'temperature_range' => $temperatura,
                'service_order_code' => trim((string) ($fila['orden_servicio'] ?? '')) ?: null,
            ];
        }

        $creados = 0;
        $actualizados = 0;
        $sinCambios = 0;
        $sobrantes = 0;

        DB::beginTransaction();
        try {
            foreach ($grupos as $entradas) {
                // La misma ubicacion aparece dos veces cuando el reporte la lista ocupada y libre:
                // se queda la ocupada. Si son dos clientes distintos, se conservan las dos.
                $conCliente = array_values(array_filter($entradas, fn($e) => $e['client_id'] !== null));
                $deseadas = $conCliente ?: array_slice($entradas, 0, 1);

                $vistos = [];
                $deseadas = array_values(array_filter($deseadas, function ($e) use (&$vistos) {
                    $clave = (string) $e['client_id'];
                    if (isset($vistos[$clave])) return false;
                    $vistos[$clave] = true;
                    return true;
                }));

                $existentes = DB::table('storage_locations')
                    ->where('warehouse_id', $deseadas[0]['warehouse_id'])
                    ->where('code', $deseadas[0]['code'])
                    ->orderBy('id')
                    ->get();

                foreach ($deseadas as $i => $datos) {
                    $actual = $existentes[$i] ?? null;
                    if ($actual) {
                        $cambio = (int) $actual->client_id !== (int) $datos['client_id']
                            || (string) $actual->temperature_range !== (string) $datos['temperature_range']
                            || (string) $actual->service_order_code !== (string) $datos['service_order_code']
                            || $actual->status === null;
                        if (!$cambio) {
                            $sinCambios++;
                            continue;
                        }
                        if (!$dryRun) {
                            DB::table('storage_locations')->where('id', $actual->id)->update($datos + [
                                'status' => 1,
                                'updated_by' => $userId,
                                'updated_at' => now(),
                            ]);
                        }
                        $actualizados++;
                    } else {
                        if (!$dryRun) {
                            DB::table('storage_locations')->insert($datos + [
                                'status' => 1,
                                'created_by' => $userId,
                                'updated_by' => $userId,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        }
                        $creados++;
                    }
                }

                $sobrantes += max(0, count($existentes) - count($deseadas));
            }

            if ($dryRun) {
                DB::rollBack();
            } else {
                DB::commit();
            }
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }

        $this->aviso(($dryRun ? '[SIMULACION, no se escribio nada]' : '[aplicado]')
            . ' filas del reporte: ' . count($filas)
            . ' | creadas: ' . $creados
            . ' | actualizadas: ' . $actualizados
            . ' | sin cambios: ' . $sinCambios
            . ' | omitidas: ' . count($omitidos)
            . ' | existentes que el reporte no lista (no se tocan): ' . $sobrantes);

        foreach (array_slice(array_unique($omitidos), 0, 10) as $motivo) {
            $this->aviso('   - ' . $motivo);
        }
    }

    private function aviso(string $texto): void
    {
        if ($this->command) {
            $this->command->getOutput()->writeln($texto);
            return;
        }
        echo $texto . PHP_EOL;
    }

    private function norm($valor): string
    {
        return mb_strtoupper(trim(preg_replace('/\s+/u', ' ', (string) $valor)), 'UTF-8');
    }
}
