<?php

namespace App\Http\Controllers\Billing\Api;

use App\Http\Controllers\Controller;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class PersonController extends Controller
{
    private $table = 'persons';
    private $columns = null;
    private $catalogColumns = [];

    public function records($type, Request $request)
    {
        if (!in_array($type, ['customers', 'suppliers'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Tipo de persona inválido',
            ], 422);
        }

        $perPage = $this->resolvePerPage($request);
        $query = DB::connection('tenant')
            ->table('persons as p')
            ->leftJoin('cat_identity_document_types as idt', 'idt.id', '=', 'p.identity_document_type_id')
            ->where('p.type', $type)
            ->select($this->personSelectColumns());

        $column = $request->input('column', 'name');
        $value = $request->input('value', '');

        if ($column === 'document_type') {
            $query->where('idt.description', 'like', '%' . $value . '%');
        } elseif (!empty($column) && $value !== '' && in_array($column, $this->searchableColumns(), true)) {
            $query->where('p.' . $column, 'like', '%' . $value . '%');
        }

        $query->orderBy('p.name');
        $records = $query->paginate($perPage);

        $items = collect($records->items())->map(function ($row) {
            return $this->transformPerson($row);
        })->values();

        return [
            'success' => true,
            'data' => $items,
            'meta' => $this->paginationMeta($records),
        ];
    }

    public function record($id)
    {
        $person = DB::connection('tenant')
            ->table('persons as p')
            ->leftJoin('cat_identity_document_types as idt', 'idt.id', '=', 'p.identity_document_type_id')
            ->where('p.id', $id)
            ->select($this->personSelectColumns())
            ->first();

        if (!$person) {
            return response()->json([
                'success' => false,
                'message' => 'Cliente/Proveedor no encontrado',
            ], 404);
        }

        return [
            'success' => true,
            'data' => $this->transformPerson($person),
        ];
    }

    public function store(Request $request)
    {
        $id = $request->input('id');
        $type = $request->input('type', 'customers');

        $rules = [
            'id' => ['nullable', 'integer'],
            'type' => ['required', 'in:customers,suppliers'],
            'number' => [
                'required',
                'string',
                'max:255',
                Rule::unique('persons', 'number')
                    ->where(function ($query) use ($type) {
                        return $query->where('type', $type);
                    })
                    ->ignore($id),
            ],
            'name' => ['required', 'string', 'max:255'],
            'identity_document_type_id' => ['nullable', 'string', 'max:255'],
            'country_id' => ['nullable', 'string', 'max:2'],
            'department_id' => ['nullable', 'string', 'max:2'],
            'province_id' => ['nullable', 'string', 'max:4'],
            'district_id' => ['nullable', 'string', 'max:6'],
            'address' => ['nullable', 'string', 'max:255'],
            'trade_name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'telephone' => ['nullable', 'string', 'max:255'],
        ];

        $validated = Validator::make($request->all(), $rules)->validate();

        $identityDocumentTypeId = $validated['identity_document_type_id'] ?? $this->defaultIdentityDocumentType($validated['number']);
        $countryId = $validated['country_id'] ?? $this->resolveCatalogId('countries', 'PE');

        if (!$identityDocumentTypeId || !$countryId) {
            return response()->json([
                'success' => false,
                'message' => 'No se pudieron resolver catálogos base para registrar el cliente/proveedor.',
            ], 422);
        }

        $payload = [
            'type' => $validated['type'],
            'identity_document_type_id' => $identityDocumentTypeId,
            'number' => $validated['number'],
            'name' => $validated['name'],
            'trade_name' => $validated['trade_name'] ?? null,
            'country_id' => $countryId,
            'department_id' => $validated['department_id'] ?? null,
            'province_id' => $validated['province_id'] ?? null,
            'district_id' => $validated['district_id'] ?? null,
            'address' => $validated['address'] ?? null,
            'email' => $validated['email'] ?? null,
            'telephone' => $validated['telephone'] ?? null,
        ];

        $payload = $this->onlyExistingColumns($payload);
        $now = now();

        if (!empty($id)) {
            $exists = DB::connection('tenant')->table($this->table)->where('id', $id)->exists();
            if (!$exists) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cliente/Proveedor no encontrado',
                ], 404);
            }

            if ($this->hasColumn('updated_at')) {
                $payload['updated_at'] = $now;
            }
            DB::connection('tenant')->table($this->table)->where('id', $id)->update($payload);
            $personId = (int)$id;
            $message = 'Registro actualizado con éxito';
        } else {
            if ($this->hasColumn('created_at')) {
                $payload['created_at'] = $now;
            }
            if ($this->hasColumn('updated_at')) {
                $payload['updated_at'] = $now;
            }
            $personId = DB::connection('tenant')->table($this->table)->insertGetId($payload);
            $message = 'Registro creado con éxito';
        }

        $person = DB::connection('tenant')
            ->table('persons as p')
            ->leftJoin('cat_identity_document_types as idt', 'idt.id', '=', 'p.identity_document_type_id')
            ->where('p.id', $personId)
            ->select($this->personSelectColumns())
            ->first();

        return [
            'success' => true,
            'message' => $message,
            'id' => $personId,
            'data' => $person ? $this->transformPerson($person) : null,
        ];
    }

    public function destroy($id)
    {
        try {
            $deleted = DB::connection('tenant')->table($this->table)->where('id', $id)->delete();

            if ($deleted === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cliente/Proveedor no encontrado',
                ], 404);
            }

            return [
                'success' => true,
                'message' => 'Registro eliminado con éxito',
            ];
        } catch (QueryException $e) {
            return [
                'success' => false,
                'message' => 'El registro está siendo usado por otros documentos, no se puede eliminar',
            ];
        }
    }

    private function transformPerson($row)
    {
        return [
            'id' => (int)$row->id,
            'type' => $row->type,
            'number' => $row->number,
            'name' => $row->name,
            'trade_name' => $this->safeValue($row, 'trade_name'),
            'identity_document_type_id' => $row->identity_document_type_id,
            'identity_document_type_code' => $this->safeValue($row, 'identity_document_type_code'),
            'document_type' => $this->safeValue($row, 'document_type'),
            'country_id' => $this->safeValue($row, 'country_id'),
            'department_id' => $this->safeValue($row, 'department_id'),
            'province_id' => $this->safeValue($row, 'province_id'),
            'district_id' => $this->safeValue($row, 'district_id'),
            'address' => $this->safeValue($row, 'address'),
            'email' => $this->safeValue($row, 'email'),
            'telephone' => $this->safeValue($row, 'telephone'),
            'created_at' => $this->safeValue($row, 'created_at'),
            'updated_at' => $this->safeValue($row, 'updated_at'),
        ];
    }

    private function searchableColumns()
    {
        $allowed = [
            'name',
            'number',
            'trade_name',
            'email',
            'telephone',
        ];

        return array_values(array_intersect($allowed, $this->getColumns()));
    }

    private function defaultIdentityDocumentType($number)
    {
        $preferred = strlen((string)$number) === 11 ? '6' : '1';
        return $this->resolveCatalogId('cat_identity_document_types', $preferred);
    }

    private function resolveCatalogId($table, $preferredId = null)
    {
        if (!Schema::connection('tenant')->hasTable($table)) {
            return null;
        }

        $query = DB::connection('tenant')->table($table);
        if (!empty($preferredId)) {
            $found = (clone $query)->where('id', $preferredId)->value('id');
            if (!empty($found)) {
                return $found;
            }
        }

        return $query->value('id');
    }

    private function resolvePerPage(Request $request)
    {
        $default = (int)config('tenant.items_per_page', 20);
        $perPage = (int)$request->input('per_page', $default);
        if ($perPage <= 0) {
            $perPage = $default;
        }

        return min($perPage, 100);
    }

    private function paginationMeta($records)
    {
        return [
            'current_page' => $records->currentPage(),
            'last_page' => $records->lastPage(),
            'per_page' => $records->perPage(),
            'total' => $records->total(),
        ];
    }

    private function onlyExistingColumns(array $payload)
    {
        return array_filter($payload, function ($value, $key) {
            return $this->hasColumn($key);
        }, ARRAY_FILTER_USE_BOTH);
    }

    private function getColumns()
    {
        if ($this->columns === null) {
            $this->columns = Schema::connection('tenant')->getColumnListing($this->table);
        }

        return $this->columns;
    }

    private function hasColumn($column)
    {
        return in_array($column, $this->getColumns(), true);
    }

    private function safeValue($row, $key, $default = null)
    {
        return property_exists($row, $key) ? $row->{$key} : $default;
    }

    private function personSelectColumns()
    {
        $columns = [
            'p.*',
            'idt.description as document_type',
        ];

        if ($this->catalogHasColumn('cat_identity_document_types', 'code')) {
            $columns[] = 'idt.code as identity_document_type_code';
        }

        return $columns;
    }

    private function catalogHasColumn($table, $column)
    {
        if (!array_key_exists($table, $this->catalogColumns)) {
            if (!Schema::connection('tenant')->hasTable($table)) {
                $this->catalogColumns[$table] = [];
            } else {
                $this->catalogColumns[$table] = Schema::connection('tenant')->getColumnListing($table);
            }
        }

        return in_array($column, $this->catalogColumns[$table], true);
    }
}


