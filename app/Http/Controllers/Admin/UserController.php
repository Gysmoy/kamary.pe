<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\User;
use Illuminate\Http\Request;
use SoDe\Extend\File;
use SoDe\Extend\JSON;
use Spatie\Permission\Models\Role;

class UserController extends BasicController
{
    public $model = User::class;
    public $reactView = 'Admin/Users';
    public $ignoreStatusFilter = true;
    public $identifier = 'uuid';
    public $softDeletion = false;

    public function setReactViewProperties(Request $request)
    {
        $prefixes = JSON::parse(File::get(storage_path('app/utils/phone_prefixes.json')));
        $roles = Role::all(['name']);
        return [
            'prefixes' => $prefixes,
            'roles' => $roles
        ];
    }

    public function setPaginationInstance(string $model)
    {
        return $model::with(['roles']);
    }

    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        $userJpa = User::find($jpa->id);
        $userJpa->syncRoles($request->roles);
    }
}
