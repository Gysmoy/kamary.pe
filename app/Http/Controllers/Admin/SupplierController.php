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
use Illuminate\Support\Facades\Schema;
use SoDe\Extend\Response;

class SupplierController extends BasicController
{
    public $model = Supplier::class;
    public $reactView = 'Admin/Suppliers';
    public $prefix4filter = 'suppliers';
    protected string $moduleScope = 'standard';

    public function setPaginationInstance(string $model)
    {
        $query = $model::select('suppliers.*')
            ->with([
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ])
            ->join('users as creator', 'creator.id', '=', 'suppliers.created_by')
            ->join('users as updater', 'updater.id', '=', 'suppliers.updated_by');

        if (Schema::hasColumn('suppliers', 'module_scope')) {
            $query->where(function ($scope) {
                $scope->where('suppliers.module_scope', $this->moduleScope);
                if ($this->moduleScope === 'standard') {
                    $scope->orWhereNull('suppliers.module_scope');
                }
            });
        }

        return $query;
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $userId = Auth::id();
        $id = $body['id'] ?? null;

        if ($id && !$this->scopedSupplierMutationQuery($id)->exists()) {
            throw new \Exception('Proveedor no encontrado en este modulo');
        }

        $ruc = preg_replace('/\D+/', '', (string)($body['ruc'] ?? ''));
        $businessName = trim((string)($body['business_name'] ?? ''));

        if ($ruc === '' || strlen($ruc) !== 11) {
            throw new \Exception('El RUC debe tener 11 digitos');
        }
        if ($businessName === '') {
            throw new \Exception('La razon social es obligatoria');
        }

        $existsRuc = Supplier::where('ruc', $ruc)
            ->when(Schema::hasColumn('suppliers', 'module_scope'), fn($query) => $query->where('module_scope', $this->moduleScope))
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
        $body['module_scope'] = $this->moduleScope;
        $body['ruc'] = $ruc;
        $body['business_name'] = $businessName;
        $body['trade_name'] = trim((string)($body['trade_name'] ?? '')) ?: null;
        $body['address'] = trim((string)($body['address'] ?? '')) ?: null;
        $body['phone'] = trim((string)($body['phone'] ?? '')) ?: null;
        $body['mobile'] = trim((string)($body['mobile'] ?? '')) ?: null;
        $body['contact_name'] = trim((string)($body['contact_name'] ?? '')) ?: null;
        $body['contact_position'] = trim((string)($body['contact_position'] ?? '')) ?: null;
        $body['contact_phone'] = trim((string)($body['contact_phone'] ?? '')) ?: null;
        $body['contact_email'] = trim((string)($body['contact_email'] ?? '')) ?: null;
        $body['email_1'] = trim((string)($body['email_1'] ?? '')) ?: null;
        $body['email_2'] = trim((string)($body['email_2'] ?? '')) ?: null;
        $body['business_line'] = trim((string)($body['business_line'] ?? '')) ?: null;
        $body['billing_type'] = trim((string)($body['billing_type'] ?? '')) ?: null;
        $body['credit_type'] = trim((string)($body['credit_type'] ?? '')) ?: null;
        $body['payment_condition'] = $this->normalizePaymentCondition($body['payment_condition'] ?? null);
        $body['bank'] = trim((string)($body['bank'] ?? '')) ?: null;
        $body['bank_account_cci'] = trim((string)($body['bank_account_cci'] ?? '')) ?: null;
        $body['payment_system'] = trim((string)($body['payment_system'] ?? '')) ?: null;
        $body['payment_term_days'] = $this->toNullableInt($body['payment_term_days'] ?? null);
        $body['evaluation'] = trim((string)($body['evaluation'] ?? '')) ?: null;

        foreach (['module_scope', 'payment_condition'] as $column) {
            if (!Schema::hasColumn('suppliers', $column)) unset($body[$column]);
        }

        return $body;
    }

    public function import(Request $request): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            $rows = $request->rows;
            $mapping = $request->mapping ?? [];
            $userId = Auth::id();
            $hasSupplierModuleScope = Schema::hasColumn('suppliers', 'module_scope');
            $hasPaymentCondition = Schema::hasColumn('suppliers', 'payment_condition');

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
            $paymentConditionKey = $mapping['payment_condition'] ?? null;
            $statusKey = $mapping['status'] ?? null;

            $created = 0;
            $updated = 0;
            $skipped = 0;
            $errors = [];

            DB::beginTransaction();

            $existingSuppliers = Supplier::whereNotNull('ruc')
                ->when($hasSupplierModuleScope, fn($query) => $query->where('module_scope', $this->moduleScope))
                ->get(['id', 'ruc']);
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
                    $errors[] = 'Fila ' . ($idx + 1) . ': formato invalido';
                    continue;
                }

                $ruc = preg_replace('/\D+/', '', (string)($row[$rucKey] ?? ''));
                if (strlen($ruc) !== 11) {
                    $skipped++;
                    $errors[] = 'Fila ' . ($idx + 1) . ': RUC invalido';
                    continue;
                }

                $businessName = trim((string)($row[$businessNameKey] ?? ''));
                if ($businessName === '') {
                    $skipped++;
                    $errors[] = 'Fila ' . ($idx + 1) . ': razon social vacia';
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
                if ($hasSupplierModuleScope) $data['module_scope'] = $this->moduleScope;
                if ($hasPaymentCondition) {
                    $data['payment_condition'] = $paymentConditionKey
                        ? $this->normalizePaymentCondition($row[$paymentConditionKey] ?? null)
                        : null;
                }

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

            $updated = $this->scopedSupplierMutationQuery($request->id)->update($data);
            if (!$updated) throw new \Exception('Proveedor no encontrado en este modulo');

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
            $updated = $this->scopedSupplierMutationQuery($request->id)->update([
                'status' => $request->status ? 0 : 1,
                'updated_by' => Auth::id(),
            ]);
            if (!$updated) throw new \Exception('Proveedor no encontrado en este modulo');

            $response->status = 200;
            $response->message = 'Operacion correcta';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function delete(Request $request, string $id)
    {
        $response = new Response();
        try {
            $updated = $this->scopedSupplierMutationQuery($id)->update([
                'status' => null,
                'updated_by' => Auth::id(),
            ]);
            if (!$updated) throw new \Exception('Proveedor no encontrado en este modulo');

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

            $existing = Supplier::where('ruc', $normalizedRuc)
                ->when(Schema::hasColumn('suppliers', 'module_scope'), fn($query) => $query->where('module_scope', $this->moduleScope))
                ->whereNotNull('status')
                ->first();
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

    private function normalizePaymentCondition($value): ?string
    {
        $normalized = mb_strtolower(trim((string)$value));
        if ($normalized === '') return null;
        return str_contains($normalized, 'cred') ? 'Credito' : 'Contado';
    }

    private function toNullableInt($value): ?int
    {
        if ($value === null) return null;
        $text = trim((string)$value);
        if ($text === '') return null;
        if (!is_numeric($text)) {
            throw new \Exception("Valor numerico invalido: {$value}");
        }

        $number = (int)$text;
        if ($number < 0) {
            throw new \Exception('Los dias de plazo no pueden ser negativos');
        }

        return $number;
    }

    private function scopedSupplierMutationQuery($id)
    {
        return $this->model::query()
            ->where($this->identifier, $id)
            ->when(Schema::hasColumn('suppliers', 'module_scope'), function ($query) {
                $query->where(function ($scope) {
                    $scope->where('module_scope', $this->moduleScope);
                    if ($this->moduleScope === 'standard') {
                        $scope->orWhereNull('module_scope');
                    }
                });
            });
    }
}
