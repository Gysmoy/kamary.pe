<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\User;

class UserController extends BasicController
{
    public $model = User::class;
    public $reactView = 'Admin/Users';
    public $ignoreStatusFilter = true;
    public $identifier = 'uuid';
    public $softDeletion = false;

    public function setPaginationInstance(string $model)
    {
        return $model::with(['roles'])
            ->where('email', '<>', 'admin@ursa.pe');
    }
}
