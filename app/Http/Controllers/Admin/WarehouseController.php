<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\BusinessBranch;
use App\Models\Warehouse;
use App\Support\BusinessScope;
use App\Support\MagistralesWarehouse;
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
        return [
            'fixedWarehouse' => MagistralesWarehouse::summary(),
        ];
    }

    public function setPaginationInstance(string $model)
    {
        $query = $model::select('warehouses.*')
            ->with([
                'branch:id,business_id,name,status',
                'branch.business:id,name,status',
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ])
            ->leftJoin('business_branches as branch', 'branch.id', '=', 'warehouses.business_branch_id')
            ->join('users as creator', 'creator.id', '=', 'warehouses.created_by')
            ->join('users as updater', 'updater.id', '=', 'warehouses.updated_by');

        $scopeKey = BusinessScope::scopedKeyForRequest(request(), [
            '/admin/entry-note',
            '/admin/warehouses',
        ]);
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

        if ($warehouseId && MagistralesWarehouse::isFixedWarehouseId($warehouseId)) {
            throw new \Exception('El almacen fijo de Magistrales no se puede editar');
        }

        $name = trim((string)($body['name'] ?? ''));
        $branchId = $body['business_branch_id'] ?? null;
        if ($name === '') {
            throw new \Exception('El nombre del almacen es obligatorio');
        }
        if ($branchId === '' || is_null($branchId)) {
            throw new \Exception('La sede es obligatoria');
        }

        $branch = BusinessScope::findFixedBranchForRequest($branchId, $request, [
            '/admin/warehouses',
        ]);

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

    public function boolean(Request $request)
    {
        $response = new Response();
        try {
            if (MagistralesWarehouse::isFixedWarehouseId($request->id)) {
                throw new \Exception('El almacen fijo de Magistrales no se puede editar');
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
            if (MagistralesWarehouse::isFixedWarehouseId($request->id)) {
                throw new \Exception('El almacen fijo de Magistrales no se puede editar');
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
        if (MagistralesWarehouse::isFixedWarehouseId($id)) {
            $response = new Response();
            $response->status = 400;
            $response->message = 'El almacen fijo de Magistrales no se puede eliminar';
            return response($response->toArray(), $response->status);
        }

        return parent::delete($request, $id);
    }
}
