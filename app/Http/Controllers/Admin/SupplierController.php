<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use SoDe\Extend\Response;

class SupplierController extends BasicController
{
    public $model = Supplier::class;
    public $reactView = 'Admin/Suppliers';
    public $prefix4filter = 'suppliers';

    public function setPaginationInstance(string $model)
    {
        return $model::select('suppliers.*')
            ->with([
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ])
            ->join('users as creator', 'creator.id', '=', 'suppliers.created_by')
            ->join('users as updater', 'updater.id', '=', 'suppliers.updated_by');
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $userId = Auth::id();
        $id = $body['id'] ?? null;

        $ruc = preg_replace('/\D+/', '', (string)($body['ruc'] ?? ''));
        $businessName = trim((string)($body['business_name'] ?? ''));

        if ($ruc === '' || strlen($ruc) !== 11) {
            throw new \Exception('El RUC debe tener 11 digitos');
        }
        if ($businessName === '') {
            throw new \Exception('La razon social es obligatoria');
        }

        $existsRuc = Supplier::where('ruc', $ruc)
            ->when($id, fn($query) => $query->where('id', '!=', $id))
            ->exists();
        if ($existsRuc) {
            throw new \Exception('Ya existe un proveedor con este RUC');
        }

        if (!isset($body['id']) || !$body['id']) {
            $body['created_by'] = $userId;
            $body['status'] = true;
        }
        $body['updated_by'] = $userId;
        $body['ruc'] = $ruc;
        $body['business_name'] = $businessName;

        return $body;
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

            $rucKey = $mapping['ruc'] ?? null;
            if (!$rucKey) {
                throw new \Exception('Debes mapear el campo RUC');
            }

            $businessNameKey = $mapping['business_name'] ?? null;
            if (!$businessNameKey) {
                throw new \Exception('Debes mapear el campo razon social');
            }

            $addressKey = $mapping['address'] ?? null;
            $phoneKey = $mapping['phone'] ?? null;
            $emailKey = $mapping['email_1'] ?? null;
            $bankAccountKey = $mapping['bank_account_cci'] ?? null;
            $statusKey = $mapping['status'] ?? null;

            $created = 0;
            $updated = 0;
            $skipped = 0;
            $errors = [];

            DB::beginTransaction();

            $existingSuppliers = Supplier::whereNotNull('ruc')->get(['id', 'ruc']);
            $existingByRuc = [];
            foreach ($existingSuppliers as $supplier) {
                $normalized = preg_replace('/\D+/', '', (string)$supplier->ruc);
                if ($normalized !== '') {
                    $existingByRuc[$normalized] = $supplier->id;
                }
            }

            foreach ($rows as $idx => $row) {
                if (!is_array($row)) {
                    $skipped++;
                    $errors[] = "Fila " . ($idx + 1) . ": formato invalido";
                    continue;
                }

                $ruc = preg_replace('/\D+/', '', (string)($row[$rucKey] ?? ''));
                if (strlen($ruc) !== 11) {
                    $skipped++;
                    $errors[] = "Fila " . ($idx + 1) . ": RUC invalido";
                    continue;
                }

                $businessName = trim((string)($row[$businessNameKey] ?? ''));
                if ($businessName === '') {
                    $skipped++;
                    $errors[] = "Fila " . ($idx + 1) . ": razon social vacia";
                    continue;
                }

                $data = [
                    'ruc' => $ruc,
                    'business_name' => $businessName,
                    'address' => $addressKey ? (trim((string)($row[$addressKey] ?? '')) ?: null) : null,
                    'phone' => $phoneKey ? (trim((string)($row[$phoneKey] ?? '')) ?: null) : null,
                    'email_1' => $emailKey ? (trim((string)($row[$emailKey] ?? '')) ?: null) : null,
                    'bank_account_cci' => $bankAccountKey ? (trim((string)($row[$bankAccountKey] ?? '')) ?: null) : null,
                    'status' => $statusKey && array_key_exists($statusKey, $row) ? $this->toBoolean($row[$statusKey]) : true,
                    'updated_by' => $userId,
                ];

                $supplierId = $existingByRuc[$ruc] ?? null;
                if ($supplierId) {
                    Supplier::where('id', $supplierId)->update($data);
                    $updated++;
                } else {
                    $data['created_by'] = $userId;
                    $supplier = Supplier::create($data);
                    $existingByRuc[$ruc] = $supplier->id;
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

    public function lookupByRuc(Request $request, string $ruc): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            $normalizedRuc = preg_replace('/\D+/', '', (string)$ruc);
            if (strlen($normalizedRuc) !== 11) {
                throw new \Exception('El RUC debe tener 11 digitos');
            }

            $existing = Supplier::where('ruc', $normalizedRuc)->whereNotNull('status')->first();
            if ($existing) {
                throw new \Exception('El proveedor ya existe. Seleccionalo de la lista o usa otro RUC');
            }

            $token = env('DEVEX_PEOPLE_API_TOKEN');
            if (!$token) {
                throw new \Exception('No se ha configurado DEVEX_PEOPLE_API_TOKEN en .env');
            }

            $url = rtrim(env('DEVEX_PEOPLE_API_URL', 'https://devex.pe/client-api/people/ruc'), '/') . '/' . $normalizedRuc;
            $apiResponse = Http::acceptJson()
                ->withToken($token)
                ->timeout(15)
                ->get($url);

            if (!$apiResponse->ok()) {
                $response->status = 200;
                $response->message = 'No se encontro informacion para este RUC en el servicio externo';
                $response->data = [
                    'found' => false,
                    'provider' => null,
                ];
                return response($response->toArray(), $response->status);
            }

            $json = $apiResponse->json();
            $person = $json['data'] ?? null;
            if (!$person) {
                $response->status = 200;
                $response->message = 'No se encontro informacion para este RUC en el servicio externo';
                $response->data = [
                    'found' => false,
                    'provider' => null,
                ];
                return response($response->toArray(), $response->status);
            }

            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = [
                'found' => true,
                'provider' => [
                    'ruc' => $normalizedRuc,
                    'business_name' => trim((string)($person['fullname'] ?? $person['name'] ?? '')),
                    'address' => trim((string)($person['full_address'] ?? $person['address'] ?? '')),
                    'email_1' => trim((string)($person['email'] ?? '')) ?: null,
                    'mobile' => trim((string)($person['phone'] ?? '')) ?: null,
                ],
            ];
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
