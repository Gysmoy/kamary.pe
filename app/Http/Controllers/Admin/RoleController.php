<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Intervention\Image\Commands\ResponseCommand;
use SoDe\Extend\Response;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleController extends BasicController
{
    public $model = Role::class;
    public $reactView = 'Admin/Roles';
    public $softDeletion = false;

    public function setReactViewProperties(Request $request)
    {
        $permissions = Permission::all(['name', 'beauty_name']);
        return [
            'permissions' => $permissions
        ];
    }

    public function setPaginationInstance(string $model)
    {
        return $model::with(['permissions']);
    }

    public function save(Request $request): HttpResponse|ResponseFactory
    {
        $response = Response::simpleTryCatch(function () use ($request) {
            $role = Role::firstOrCreate(['name' => $request->name]);
            $role->syncPermissions($request->permissions);
        });
        return response($response->toArray(), $response->status);
    }
}
