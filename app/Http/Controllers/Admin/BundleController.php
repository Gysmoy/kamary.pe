<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Http\Controllers\Controller;
use App\Models\Bundle;
use App\Models\BundleItem;
use App\Models\Item;
use Illuminate\Http\Request;

class BundleController extends BasicController
{
    public $model = Bundle::class;
    public $reactView = 'Bundles';
    public $reactRootView = 'admin';
    public $imageFields = ['image'];

    public function setReactViewProperties(Request $request)
    {
        $items = Item::query()
            ->where('status', true)
            ->where('visible', true)
            ->get();
        return [
            'items' => $items,
        ];
    }

    public function setPaginationInstance(string $model)
    {
        return $model::with(['itemsIncludes']);
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        if ($body['items']) {
            $body['items'] = explode(',', $body['items']);
        }
        $body['is_promoted'] = $body['is_promoted'] == 'true';
        return $body;
    }

    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        $items = $request->items_included ? explode(',', $request->items_included) : [];
        BundleItem::where('bundle_id', $jpa->id)->whereNotIn('item_id', $items)->delete();
        if (\count($items) > 0) {
            foreach ($items as $item) {
                BundleItem::updateOrCreate(['bundle_id' => $jpa->id, 'item_id' => $item]);
            }
            $jpa->includes_all_items = false;
        } else {
            $jpa->includes_all_items = true;
        }
        $jpa->save();
    }
}
