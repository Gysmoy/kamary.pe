<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\User;
use App\Support\StorageScope;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
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
        return $model::with(['roles'])
            ->select('users.*')
            ->selectRaw('users.id AS entity_id');
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();

        if (array_key_exists('storage_client_id', $body)) {
            if (Schema::hasColumn('users', 'storage_client_id')) {
                $body['storage_client_id'] = $body['storage_client_id'] === '' || $body['storage_client_id'] === null
                    ? null
                    : (int) $body['storage_client_id'];
                if ($body['storage_client_id']) {
                    StorageScope::assertClient((int)$body['storage_client_id']);
                }
            } else {
                unset($body['storage_client_id']);
            }
        }

        return $body;
    }

    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        if (!$request->has('roles')) return;

        $userJpa = User::find($jpa->id);
        $userJpa->syncRoles($request->roles);
    }
}
