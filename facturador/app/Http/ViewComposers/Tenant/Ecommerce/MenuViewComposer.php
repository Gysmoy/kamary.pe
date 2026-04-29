<?php

namespace App\Http\ViewComposers\Tenant\Ecommerce;

use App\Models\Billing\Catalogs\Tag;
//use App\Http\Resources\Billing\ItemEcommerceCollection;


class MenuViewComposer
{
    public function compose($view)
    {
        $view->items = Tag::all();
    }
}

