<?php

namespace App\Http\Controllers\Admin\Storage;

use App\Http\Controllers\Admin\ArticleController as BaseArticleController;
use Illuminate\Http\Request;

class ProductController extends BaseArticleController
{
    public function setReactViewProperties(Request $request)
    {
        return [
            'moduleTitle' => 'Serv. Almacenamiento - Creacion del producto',
            'requiredPermission' => 'storage-products',
        ];
    }
}
