<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\Business;
use App\Models\BusinessBranch;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Auth;
use SoDe\Extend\Response;

class BusinessController extends BasicController
{
    public $model = Business::class;
    public $reactView = 'Admin/Businesses';
    public $prefix4filter = 'businesses';

    public function setPaginationInstance(string $model)
    {
        return $model::select('businesses.*')
            ->with([
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ])
            ->join('users as creator', 'creator.id', '=', 'businesses.created_by')
            ->join('users as updater', 'updater.id', '=', 'businesses.updated_by');
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $userId = Auth::id();

        $name = trim((string)($body['name'] ?? ''));
        if ($name === '') {
            throw new \Exception('El nombre de la empresa es obligatorio');
        }

        if (!isset($body['id']) || !$body['id']) {
            $body['created_by'] = $userId;
            $body['status'] = true;
        }
        $body['updated_by'] = $userId;
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

    public function branches(Request $request, string $id): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            $business = Business::findOrFail($id);
            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = $business->branches()->orderBy('name')->get(['id', 'business_id', 'name', 'status']);
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function saveBranch(Request $request, string $id): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            $business = Business::findOrFail($id);
            $userId = Auth::id();
            $name = trim((string)$request->name);
            $mode = trim((string)($request->mode ?? ''));
            $isUpdate = $mode === 'update';

            if ($name === '') {
                throw new \Exception('El nombre de la sede es obligatorio');
            }

            $branchId = $isUpdate && is_numeric($request->id) ? (int)$request->id : null;
            $branch = null;
            if ($branchId) {
                $branch = BusinessBranch::where('business_id', $business->id)
                    ->where('id', $branchId)
                    ->first();
                if (!$branch) $branchId = null;
            }

            $exists = BusinessBranch::where('business_id', $business->id)
                ->whereRaw('LOWER(name) = ?', [mb_strtolower($name)])
                ->when($branchId, fn($query) => $query->where('id', '!=', $branchId))
                ->exists();
            if ($exists) {
                throw new \Exception('Ya existe una sede con ese nombre para esta empresa');
            }

            if ($isUpdate && $branch) {
                $branch->update([
                    'name' => $name,
                    'status' => $request->status ?? $branch->status,
                    'updated_by' => $userId,
                ]);
            } else {
                $branch = BusinessBranch::create([
                    'business_id' => $business->id,
                    'name' => $name,
                    'status' => true,
                    'created_by' => $userId,
                    'updated_by' => $userId,
                ]);
            }

            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = $branch;
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function branchBoolean(Request $request, string $id, string $branchId): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            Business::findOrFail($id);
            $data = [];
            $data[$request->field] = $request->value;

            BusinessBranch::where('business_id', $id)
                ->where('id', $branchId)
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

    public function deleteBranch(Request $request, string $id, string $branchId): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            Business::findOrFail($id);
            $deleted = BusinessBranch::where('business_id', $id)
                ->where('id', $branchId)
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
}
