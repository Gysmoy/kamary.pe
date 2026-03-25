<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use SoDe\Extend\Response;

class UnitController extends BasicController
{
    public $model = Unit::class;
    public $reactView = 'Admin/Units';
    public $prefix4filter = 'units';

    public function setPaginationInstance(string $model)
    {
        return $model::select('units.*')
        ->with([
            'creator:id,name,lastname,username,fullname',
            'updater:id,name,lastname,username,fullname',
        ])
            ->join('users as creator', 'creator.id', '=', 'units.created_by')
            ->join('users as updater', 'updater.id', '=', 'units.updated_by');
    }

    public function import(Request $request): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            $rows = $request->rows;
            $mapping = $request->mapping ?? [];
            $userId = Auth::id();

            if (!is_array($rows) || count($rows) === 0) {
                throw new \Exception('No hay registros para importar');
            }

            $symbolKey = $mapping['symbol'] ?? null;
            if (!$symbolKey) {
                throw new \Exception('Debes mapear el campo simbolo');
            }

            $nameKey = $mapping['name'] ?? null;
            $statusKey = $mapping['status'] ?? null;

            $created = 0;
            $updated = 0;
            $skipped = 0;
            $errors = [];

            DB::beginTransaction();

            $existingUnits = Unit::whereNotNull('symbol')->get(['id', 'symbol']);
            $existingBySymbol = [];
            foreach ($existingUnits as $unit) {
                $normalized = mb_strtolower(trim((string)$unit->symbol));
                if ($normalized !== '') {
                    $existingBySymbol[$normalized] = $unit->id;
                }
            }

            foreach ($rows as $idx => $row) {
                if (!is_array($row)) {
                    $skipped++;
                    $errors[] = "Fila " . ($idx + 1) . ": formato invalido";
                    continue;
                }

                $rawSymbol = $row[$symbolKey] ?? null;
                $symbol = trim((string)$rawSymbol);
                if ($symbol === '') {
                    $skipped++;
                    $errors[] = "Fila " . ($idx + 1) . ": simbolo vacio";
                    continue;
                }

                $name = $nameKey ? trim((string)($row[$nameKey] ?? '')) : '';
                if ($name === '') {
                    $name = $symbol;
                }

                $status = true;
                if ($statusKey && array_key_exists($statusKey, $row)) {
                    $status = $this->toBoolean($row[$statusKey]);
                }

                $normalizedSymbol = mb_strtolower($symbol);
                $unitId = $existingBySymbol[$normalizedSymbol] ?? null;

                if ($unitId) {
                    Unit::where('id', $unitId)->update([
                        'name' => $name,
                        'symbol' => $symbol,
                        'status' => $status,
                        'updated_by' => $userId,
                    ]);
                    $updated++;
                } else {
                    $unit = Unit::create([
                        'name' => $name,
                        'symbol' => $symbol,
                        'status' => $status,
                        'created_by' => $userId,
                        'updated_by' => $userId,
                    ]);
                    $existingBySymbol[$normalizedSymbol] = $unit->id;
                    $created++;
                }
            }

            DB::commit();

            $response->status = 200;
            $response->message = 'Importacion masiva completada';
            $response->data = [
                'created' => $created,
                'updated' => $updated,
                'skipped' => $skipped,
                'errors' => $errors,
            ];
        } catch (\Throwable $th) {
            DB::rollBack();
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $userId = Auth::id();
        $id = $body['id'] ?? null;

        $name = trim((string)($body['name'] ?? ''));
        $symbol = trim((string)($body['symbol'] ?? ''));

        if ($name === '') {
            throw new \Exception('El nombre de la unidad de medida es obligatorio');
        }
        if ($symbol === '') {
            throw new \Exception('El codigo/simbolo de la unidad de medida es obligatorio');
        }

        $existsSymbol = Unit::whereRaw('LOWER(symbol) = ?', [mb_strtolower($symbol)])
            ->when($id, fn($query) => $query->where('id', '!=', $id))
            ->exists();
        if ($existsSymbol) {
            throw new \Exception('Ya existe una unidad de medida con este codigo. Intenta seleccionarla de la lista o usa un codigo nuevo');
        }

        if (!isset($body['id']) || !$body['id']) {
            $body['created_by'] = $userId;
        }
        $body['updated_by'] = $userId;
        $body['name'] = $name;
        $body['symbol'] = Str::upper($symbol);

        return $body;
    }

    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        return $jpa;
    }

    public function boolean(Request $request)
    {
        $response = new Response();
        try {
            $data = [];
            $data[$request->field] = $request->value;
            $data['updated_by'] = Auth::id();

            $this->model::where($this->identifier, $request->id)->update($data);

            $response->status = 200;
            $response->message = 'Operacion correcta';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function status(Request $request)
    {
        $response = new Response();
        try {
            $this->model::where($this->identifier, $request->id)->update([
                'status' => $request->status ? 0 : 1,
                'updated_by' => Auth::id(),
            ]);

            $response->status = 200;
            $response->message = 'Operacion correcta';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    private function toBoolean($value): bool
    {
        if (is_bool($value)) return $value;
        if (is_numeric($value)) return (int)$value !== 0;

        $normalized = mb_strtolower(trim((string)$value));
        return in_array($normalized, ['1', 'true', 'si', 'sí', 'yes', 'y', 'activo', 'activa', 'on'], true);
    }
}
