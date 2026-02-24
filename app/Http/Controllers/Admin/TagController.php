<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\Tag;

class TagController extends BasicController
{
    public $model = Tag::class;
    public $reactView = 'Admin/Tags';
}
