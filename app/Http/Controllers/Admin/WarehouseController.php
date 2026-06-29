<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\BusinessBranch;
use App\Models\Warehouse;
use App\Models\WarehouseLocation;
use App\Support\BusinessScope;
use App\Support\MagistralesWarehouse;
use App\Support\SamplesWarehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use SoDe\Extend\Response;

class WarehouseController extends BasicController
{
    public $model = Warehouse::class;
    public $reactView = 'Admin/Warehouses';
    public $prefix4filter = 'warehouses';

    public function setReactViewProperties(Request $request)
    {
        $business = BusinessScope::businessForKey(BusinessScope::KAMARY_PERU);
        $branch = $business
            ? BusinessBranch::query()
                ->where('business_id', $business->id)
                ->whereNotNull('status')
                ->orderBy('id')
                ->first(['id', 'business_id', 'name', 'status'])
            : null;

        return [
            'fixedWarehouse' => MagistralesWarehouse::summary(),
            'sampleWarehouse' => SamplesWarehouse::summary(),
            'businessScopeKey' => BusinessScope::KAMARY_PERU,
            'fixedBusiness' => $business ? [
                'id' => $business->id,
                'name' => $business->name,
                'business_key' => $business->business_key,
            ] : null,
            'defaultBranch' => $branch,
        ];
    }

    public function setPaginationInstance(string $model)
    {
        $query = $model::select('warehouses.*')
            ->with([
                'branch:id,business_id,name,status',
                'branch.business:id,name,status',
                'locations:id,warehouse_id,code,description,status',
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ])
            ->leftJoin('business_branches as branch', 'branch.id', '=', 'warehouses.business_branch_id')
            ->join('users as creator', 'creator.id', '=', 'warehouses.created_by')
            ->join('users as updater', 'updater.id', '=', 'warehouses.updated_by');

        $scopeKey = BusinessScope::scopedKeyForRequest(request()) ?: BusinessScope::KAMARY_PERU;
        $query->whereHas('branch.business', function ($business) use ($scopeKey) {
            $business->whereIn('business_key', BusinessScope::fixedKeys());
            if ($scopeKey) $business->where('business_key', $scopeKey);
        });

        return $query;
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $userId = Auth::id();
        $warehouseId = isset($body['id']) && $body['id'] !== '' ? (int) $body['id'] : null;

        if ($warehouseId && $this->isFixedWarehouse($warehouseId)) {
            throw new \Exception('Este almacen fijo no se puede editar');
        }

        $name = trim((string)($body['name'] ?? ''));
        $branchId = $body['business_branch_id'] ?? null;
        if ($name === '') {
            throw new \Exception('El nombre del almacen es obligatorio');
        }

        if ($branchId === '' || is_null($branchId)) {
            $branch = $this->defaultKamaryPeruBranch();
        } else {
            $branch = BusinessScope::findFixedBranchForRequest($branchId, $request);
            if ($branch->business?->business_key !== BusinessScope::KAMARY_PERU) {
                throw new \Exception('El almacen debe pertenecer a Kamary Peru');
            }
        }

        if (!isset($body['id']) || !$body['id']) {
            $body['created_by'] = $userId;
            $body['status'] = true;
        }
        $body['updated_by'] = $userId;
        $body['business_branch_id'] = (int)$branch->id;
        $body['name'] = $name;
        $body['description'] = isset($body['description']) ? trim((string)$body['description']) : null;

        return $body;
    }

    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        return $jpa;
    }

    // Almacenes fijos protegidos (no se editan ni eliminan): Magistrales y Muestras.
    private function isFixedWarehouse($id): bool
    {
        return MagistralesWarehouse::isFixedWarehouseId($id) || SamplesWarehouse::isFixedWarehouseId($id);
    }

    public function boolean(Request $request)
    {
        $response = new Response();
        try {
            if ($this->isFixedWarehouse($request->id)) {
                throw new \Exception('Este almacen fijo no se puede editar');
            }

            $field = $this->allowedBooleanFieldFromRequest($request);
            $data = [];
            $data[$field] = $request->value;
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
            if ($this->isFixedWarehouse($request->id)) {
                throw new \Exception('Este almacen fijo no se puede editar');
            }

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

    public function delete(Request $request, string $id)
    {
        if ($this->isFixedWarehouse($id)) {
            $response = new Response();
            $response->status = 400;
            $response->message = 'Este almacen fijo no se puede eliminar';
            return response($response->toArray(), $response->status);
        }

        return parent::delete($request, $id);
    }

    public function locations(Request $request, string $warehouseId)
    {
        $response = new Response();
        try {
            $this->assertKamaryPeruWarehouse((int)$warehouseId);

            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = WarehouseLocation::query()
                ->where('warehouse_id', $warehouseId)
                ->orderBy('code')
                ->get();
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function saveLocation(Request $request, string $warehouseId)
    {
        $response = new Response();
        try {
            $warehouse = $this->assertKamaryPeruWarehouse((int)$warehouseId);
            $id = $request->input('id');
            $code = trim((string)$request->input('code', ''));
            if ($code === '') throw new \Exception('La ubicacion es obligatoria');

            $duplicate = WarehouseLocation::query()
                ->where('warehouse_id', $warehouse->id)
                ->whereRaw('LOWER(TRIM(code)) = ?', [mb_strtolower($code)])
                ->when($id, fn($query) => $query->where('id', '!=', $id))
                ->exists();
            if ($duplicate) throw new \Exception('La ubicacion ya existe en este almacen');

            $payload = [
                'warehouse_id' => $warehouse->id,
                'code' => $code,
                'description' => trim((string)$request->input('description', '')) ?: null,
                'status' => $request->has('status') ? (bool)$request->input('status') : true,
                'updated_by' => Auth::id(),
            ];
            if (!$id) $payload['created_by'] = Auth::id();

            $location = WarehouseLocation::query()->updateOrCreate(
                ['id' => $id],
                $payload
            );

            $response->status = 200;
            $response->message = 'Ubicacion guardada correctamente';
            $response->data = $location;
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function deleteLocation(Request $request, string $warehouseId, string $locationId)
    {
        $response = new Response();
        try {
            $this->assertKamaryPeruWarehouse((int)$warehouseId);
            $updated = WarehouseLocation::query()
                ->where('warehouse_id', $warehouseId)
                ->whereKey($locationId)
                ->update([
                    'status' => null,
                    'updated_by' => Auth::id(),
                ]);
            if (!$updated) throw new \Exception('Ubicacion no encontrada');

            $response->status = 200;
            $response->message = 'Ubicacion eliminada correctamente';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    private function defaultKamaryPeruBranch(): BusinessBranch
    {
        $business = BusinessScope::businessForKey(BusinessScope::KAMARY_PERU);
        if (!$business) throw new \Exception('No existe empresa Kamary Peru activa');

        $branch = BusinessBranch::query()
            ->where('business_id', $business->id)
            ->whereNotNull('status')
            ->orderBy('id')
            ->first();
        if (!$branch) throw new \Exception('No existe sede activa para Kamary Peru');

        return $branch;
    }

    private function assertKamaryPeruWarehouse(int $warehouseId): Warehouse
    {
        $warehouse = Warehouse::query()
            ->with('branch.business')
            ->whereKey($warehouseId)
            ->whereNotNull('status')
            ->first();
        if (!$warehouse || $warehouse->branch?->business?->business_key !== BusinessScope::KAMARY_PERU) {
            throw new \Exception('El almacen no pertenece a Kamary Peru');
        }

        return $warehouse;
    }
}
