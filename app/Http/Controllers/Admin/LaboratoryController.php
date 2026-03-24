<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\ActivePrinciple;
use App\Models\Laboratory;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use SoDe\Extend\Response;

class LaboratoryController extends BasicController
{
    public $model = Laboratory::class;
    public $reactView = 'Admin/Laboratories';
    public $prefix4filter = 'laboratories';


    public function setPaginationInstance(string $model)
    {
        return $model::select('laboratories.*')
        ->with([
            'creator:id,name,lastname,username,fullname',
            'updater:id,name,lastname,username,fullname',
        ])
        ->join('users as creator', 'creator.id', '=', 'laboratories.created_by')
        ->join('users as updater', 'updater.id', '=', 'laboratories.updated_by');
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

            $codeKey = $mapping['code'] ?? null;
            if (!$codeKey) {
                throw new \Exception('Debes mapear el campo codigo');
            }

            $nameKey = $mapping['name'] ?? null;
            $statusKey = $mapping['status'] ?? null;

            $created = 0;
            $updated = 0;
            $skipped = 0;
            $errors = [];

            DB::beginTransaction();

            $existing = Laboratory::whereNotNull('code')->get(['id', 'code']);
            $existingByCode = [];
            foreach ($existing as $lab) {
                $normalized = mb_strtolower(trim((string)$lab->code));
                if ($normalized !== '') $existingByCode[$normalized] = $lab->id;
            }

            foreach ($rows as $idx => $row) {
                if (!is_array($row)) {
                    $skipped++;
                    $errors[] = "Fila " . ($idx + 1) . ": formato invalido";
                    continue;
                }

                $code = trim((string)($row[$codeKey] ?? ''));
                if ($code === '') {
                    $skipped++;
                    $errors[] = "Fila " . ($idx + 1) . ": codigo vacio";
                    continue;
                }

                $name = $nameKey ? trim((string)($row[$nameKey] ?? '')) : '';
                if ($name === '') $name = $code;

                $status = true;
                if ($statusKey && array_key_exists($statusKey, $row)) {
                    $status = $this->toBoolean($row[$statusKey]);
                }

                $normalizedCode = mb_strtolower($code);
                $id = $existingByCode[$normalizedCode] ?? null;

                if ($id) {
                    Laboratory::where('id', $id)->update([
                        'name' => $name,
                        'code' => $code,
                        'status' => $status,
                        'updated_by' => $userId,
                    ]);
                    $updated++;
                } else {
                    $new = Laboratory::create([
                        'name' => $name,
                        'code' => $code,
                        'status' => $status,
                        'created_by' => $userId,
                        'updated_by' => $userId,
                    ]);
                    $existingByCode[$normalizedCode] = $new->id;
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

    public function principles(Request $request, string $id): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            $laboratory = Laboratory::findOrFail($id);
            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = $laboratory->activePrinciples()->orderBy('name')->get();
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function savePrinciple(Request $request, string $id): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            $laboratory = Laboratory::findOrFail($id);
            $userId = Auth::id();
            $principleName = trim((string)$request->name);
            if ($principleName === '') {
                throw new \Exception('El nombre del principio activo es obligatorio');
            }

            $principleId = $request->id;
            if ($principleId) {
                $principle = ActivePrinciple::where('laboratory_id', $laboratory->id)
                    ->where('id', $principleId)
                    ->firstOrFail();
                $principle->update([
                    'name' => $principleName,
                    'status' => $request->status ?? $principle->status,
                    'updated_by' => $userId,
                ]);
            } else {
                $principle = ActivePrinciple::create([
                    'laboratory_id' => $laboratory->id,
                    'name' => $principleName,
                    'status' => true,
                    'created_by' => $userId,
                    'updated_by' => $userId,
                ]);
            }

            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = $principle;
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function principleBoolean(Request $request, string $id, string $principleId): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            Laboratory::findOrFail($id);
            $data = [];
            $data[$request->field] = $request->value;

            ActivePrinciple::where('laboratory_id', $id)
                ->where('id', $principleId)
                ->update(array_merge($data, [
                    'updated_by' => Auth::id(),
                ]));

            $response->status = 200;
            $response->message = 'Operacion correcta';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function deletePrinciple(Request $request, string $id, string $principleId): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            Laboratory::findOrFail($id);
            $deleted = ActivePrinciple::where('laboratory_id', $id)
                ->where('id', $principleId)
                ->delete();

            if (!$deleted) throw new \Exception('No se ha eliminado ningun registro');

            $response->status = 200;
            $response->message = 'Operacion correcta';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function importPrinciples(Request $request, string $id): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            $laboratory = Laboratory::findOrFail($id);
            $rows = $request->rows;
            $mapping = $request->mapping ?? [];
            $userId = Auth::id();

            if (!is_array($rows) || count($rows) === 0) {
                throw new \Exception('No hay registros para importar');
            }

            $nameKey = $mapping['name'] ?? null;
            if (!$nameKey) {
                throw new \Exception('Debes mapear el campo nombre');
            }

            $statusKey = $mapping['status'] ?? null;

            $created = 0;
            $updated = 0;
            $skipped = 0;
            $errors = [];

            DB::beginTransaction();

            $existing = ActivePrinciple::where('laboratory_id', $laboratory->id)
                ->get(['id', 'name']);
            $existingByName = [];
            foreach ($existing as $principle) {
                $normalized = mb_strtolower(trim((string)$principle->name));
                if ($normalized !== '') $existingByName[$normalized] = $principle->id;
            }

            foreach ($rows as $idx => $row) {
                if (!is_array($row)) {
                    $skipped++;
                    $errors[] = "Fila " . ($idx + 1) . ": formato invalido";
                    continue;
                }

                $name = trim((string)($row[$nameKey] ?? ''));
                if ($name === '') {
                    $skipped++;
                    $errors[] = "Fila " . ($idx + 1) . ": nombre vacio";
                    continue;
                }

                $status = true;
                if ($statusKey && array_key_exists($statusKey, $row)) {
                    $status = $this->toBoolean($row[$statusKey]);
                }

                $normalizedName = mb_strtolower($name);
                $principleId = $existingByName[$normalizedName] ?? null;

                if ($principleId) {
                    ActivePrinciple::where('id', $principleId)->update([
                        'name' => $name,
                        'status' => $status,
                        'updated_by' => $userId,
                    ]);
                    $updated++;
                } else {
                    $new = ActivePrinciple::create([
                        'laboratory_id' => $laboratory->id,
                        'name' => $name,
                        'status' => $status,
                        'created_by' => $userId,
                        'updated_by' => $userId,
                    ]);
                    $existingByName[$normalizedName] = $new->id;
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

        if (!isset($body['id']) || !$body['id']) {
            $body['created_by'] = $userId;
        }
        $body['updated_by'] = $userId;

        return $body;
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
        return in_array($normalized, ['1', 'true', 'si', 'yes', 'y', 'activo', 'activa', 'on'], true);
    }
}
