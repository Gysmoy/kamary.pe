<?php

namespace App\Http\Controllers\Billing\Api;

use App\Http\Controllers\Controller;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class ItemController extends Controller
{
    private $table = 'items';
    private $columns = null;

    public function records(Request $request)
    {
        $perPage = $this->resolvePerPage($request);
        $query = DB::connection('tenant')->table($this->table);

        if ($this->hasColumn('is_set')) {
            $query->where('is_set', false);
        }

        $column = $request->input('column');
        $value = $request->input('value', '');

        if ($column === 'active' && $this->hasColumn('active')) {
            $query->where('active', true);
        } elseif ($column === 'inactive' && $this->hasColumn('active')) {
            $query->where('active', false);
        } elseif (!empty($column) && $value !== '' && in_array($column, $this->searchableColumns(), true)) {
            $query->where($column, 'like', '%' . $value . '%');
        }

        $type = strtoupper((string)$request->query('type', 'PRODUCTS'));
        if ($type === 'PRODUCTS') {
            $query->where('unit_type_id', '!=', 'ZZ');
        } elseif ($type === 'SERVICES') {
            $query->where('unit_type_id', 'ZZ');
        }

        if ($this->hasColumn('description')) {
            $query->orderBy('description');
        } else {
            $query->orderBy('id', 'desc');
        }

        $records = $query->paginate($perPage);
        $items = collect($records->items())->map(function ($row) {
            return $this->transformItem($row);
        })->values();

        return [
            'success' => true,
            'data' => $items,
            'meta' => $this->paginationMeta($records),
        ];
    }

    public function record($id)
    {
        $item = DB::connection('tenant')->table($this->table)->where('id', $id)->first();

        if (!$item) {
            return response()->json([
                'success' => false,
                'message' => 'Producto no encontrado',
            ], 404);
        }

        return [
            'success' => true,
            'data' => $this->transformItem($item),
        ];
    }

    public function store(Request $request)
    {
        $id = $request->input('id');

        $rules = [
            'id' => ['nullable', 'integer'],
            'description' => ['required', 'string', 'max:255'],
            'unit_type_id' => ['nullable', 'string', 'max:255'],
            'currency_type_id' => ['nullable', 'string', 'max:255'],
            'item_type_id' => ['nullable', 'string', 'max:2'],
            'sale_unit_price' => ['required', 'numeric', 'min:0.01'],
            'purchase_unit_price' => ['nullable', 'numeric', 'min:0'],
            'stock' => ['nullable', 'numeric'],
            'stock_min' => ['nullable', 'numeric'],
            'has_igv' => ['nullable', 'boolean'],
            'sale_affectation_igv_type_id' => ['nullable', 'string', 'max:255'],
            'purchase_affectation_igv_type_id' => ['nullable', 'string', 'max:255'],
            'internal_id' => ['nullable', 'string', 'max:30'],
            'item_code' => ['nullable', 'string', 'max:255'],
            'item_code_gs1' => ['nullable', 'string', 'max:255'],
        ];

        if ($this->hasColumn('internal_id')) {
            $rules['internal_id'][] = Rule::unique('items', 'internal_id')->ignore($id);
        }

        $validated = Validator::make($request->all(), $rules)->validate();

        $itemTypeId = $validated['item_type_id'] ?? $this->resolveCatalogId('item_types', '01');
        $unitTypeId = $validated['unit_type_id'] ?? $this->resolveCatalogId('cat_unit_types', 'NIU');
        $currencyTypeId = $validated['currency_type_id'] ?? $this->resolveCatalogId('cat_currency_types', 'PEN');
        $saleAffectation = $validated['sale_affectation_igv_type_id'] ?? $this->resolveCatalogId('cat_affectation_igv_types', '10');
        $purchaseAffectation = $validated['purchase_affectation_igv_type_id'] ?? $saleAffectation;

        if (!$itemTypeId || !$unitTypeId || !$currencyTypeId || !$saleAffectation || !$purchaseAffectation) {
            return response()->json([
                'success' => false,
                'message' => 'No se pudieron resolver catálogos base para registrar el producto.',
            ], 422);
        }

        $payload = [
            'description' => $validated['description'],
            'item_type_id' => $itemTypeId,
            'internal_id' => $validated['internal_id'] ?? null,
            'item_code' => $validated['item_code'] ?? null,
            'item_code_gs1' => $validated['item_code_gs1'] ?? null,
            'unit_type_id' => $unitTypeId,
            'currency_type_id' => $currencyTypeId,
            'sale_unit_price' => $validated['sale_unit_price'],
            'purchase_unit_price' => $validated['purchase_unit_price'] ?? $validated['sale_unit_price'],
            'sale_affectation_igv_type_id' => $saleAffectation,
            'purchase_affectation_igv_type_id' => $purchaseAffectation,
            'stock' => $validated['stock'] ?? 0,
            'stock_min' => $validated['stock_min'] ?? 0,
            'has_igv' => array_key_exists('has_igv', $validated) ? (bool)$validated['has_igv'] : true,
        ];

        if ($this->hasColumn('calculate_quantity') && !array_key_exists('calculate_quantity', $payload)) {
            $payload['calculate_quantity'] = 0;
        }
        if ($this->hasColumn('has_isc') && !array_key_exists('has_isc', $payload)) {
            $payload['has_isc'] = 0;
        }
        if ($this->hasColumn('percentage_isc') && !array_key_exists('percentage_isc', $payload)) {
            $payload['percentage_isc'] = 0;
        }
        if ($this->hasColumn('suggested_price') && !array_key_exists('suggested_price', $payload)) {
            $payload['suggested_price'] = 0;
        }

        $payload = $this->onlyExistingColumns($payload);
        $now = now();

        if (!empty($id)) {
            $exists = DB::connection('tenant')->table($this->table)->where('id', $id)->exists();
            if (!$exists) {
                return response()->json([
                    'success' => false,
                    'message' => 'Producto no encontrado',
                ], 404);
            }

            if ($this->hasColumn('updated_at')) {
                $payload['updated_at'] = $now;
            }
            DB::connection('tenant')->table($this->table)->where('id', $id)->update($payload);
            $itemId = (int)$id;
            $message = 'Producto actualizado con éxito';
        } else {
            if ($this->hasColumn('created_at')) {
                $payload['created_at'] = $now;
            }
            if ($this->hasColumn('updated_at')) {
                $payload['updated_at'] = $now;
            }

            $itemId = DB::connection('tenant')->table($this->table)->insertGetId($payload);
            $message = 'Producto registrado con éxito';
        }

        $item = DB::connection('tenant')->table($this->table)->where('id', $itemId)->first();

        return [
            'success' => true,
            'message' => $message,
            'id' => $itemId,
            'data' => $item ? $this->transformItem($item) : null,
        ];
    }

    public function destroy($id)
    {
        try {
            $deleted = DB::connection('tenant')->table($this->table)->where('id', $id)->delete();

            if ($deleted === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Producto no encontrado',
                ], 404);
            }

            return [
                'success' => true,
                'message' => 'Producto eliminado con éxito',
            ];
        } catch (QueryException $e) {
            return [
                'success' => false,
                'message' => 'El producto está siendo usado por otros registros, no se puede eliminar',
            ];
        }
    }

    private function transformItem($row)
    {
        return [
            'id' => (int)$row->id,
            'description' => $row->description,
            'internal_id' => $this->safeValue($row, 'internal_id'),
            'item_code' => $this->safeValue($row, 'item_code'),
            'item_code_gs1' => $this->safeValue($row, 'item_code_gs1'),
            'item_type_id' => $this->safeValue($row, 'item_type_id'),
            'unit_type_id' => $this->safeValue($row, 'unit_type_id'),
            'currency_type_id' => $this->safeValue($row, 'currency_type_id'),
            'sale_unit_price' => (float)$row->sale_unit_price,
            'purchase_unit_price' => (float)$row->purchase_unit_price,
            'stock' => (float)$row->stock,
            'stock_min' => (float)$row->stock_min,
            'has_igv' => (bool)$row->has_igv,
            'sale_affectation_igv_type_id' => $this->safeValue($row, 'sale_affectation_igv_type_id'),
            'purchase_affectation_igv_type_id' => $this->safeValue($row, 'purchase_affectation_igv_type_id'),
            'created_at' => $this->safeValue($row, 'created_at'),
            'updated_at' => $this->safeValue($row, 'updated_at'),
        ];
    }

    private function searchableColumns()
    {
        $allowed = [
            'description',
            'internal_id',
            'item_code',
            'item_code_gs1',
            'unit_type_id',
        ];

        return array_values(array_intersect($allowed, $this->getColumns()));
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
}


