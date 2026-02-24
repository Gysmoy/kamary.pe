<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Http\Controllers\Controller;
use App\Models\TransactionCategory;
use Illuminate\Http\Request;

class TransactionCategoryController extends BasicController
{
    public $model = TransactionCategory::class;
    public $reactView = 'Admin/TransactionCategories';
}
