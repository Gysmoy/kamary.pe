<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\BusinessBranch;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use SoDe\Extend\Response;

class WarehouseController extends BasicController
{
    public $model = Warehouse::class;
    public $reactView = 'Admin/Warehouses';
    public $prefix4filter = 'warehouses';

    public function setPaginationInstance(string $model)
    {
        return $model::select('warehouses.*')
            ->with([
                'branch:id,business_id,name,status',
                'branch.business:id,name,status',
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ])
            ->leftJoin('business_branches as branch', 'branch.id', '=', 'warehouses.business_branch_id')
            ->join('users as creator', 'creator.id', '=', 'warehouses.created_by')
            ->join('users as updater', 'updater.id', '=', 'warehouses.updated_by');
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $userId = Auth::id();

        $name = trim((string)($body['name'] ?? ''));
        $branchId = $body['business_branch_id'] ?? null;
        if ($name === '') {
            throw new \Exception('El nombre del almacen es obligatorio');
        }
        if ($branchId === '' || is_null($branchId)) {
            throw new \Exception('La sede es obligatoria');
        }

        $branch = BusinessBranch::where('id', $branchId)->whereNotNull('status')->first();
        if (!$branch) {
            throw new \Exception('La sede seleccionada no existe o esta inactiva');
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
}
