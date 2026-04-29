<?php

namespace App\Traits;
use App\Models\Billing\Item;
use App\Models\Billing\Kardex;
use Illuminate\Support\Facades\Schema;
use Modules\Inventory\Models\ItemWarehouse;
use Modules\Inventory\Models\InventoryConfiguration;



trait KardexTrait
{

    public function saveKardex($type, $item_id, $id, $quantity, $relation) {
        if (!class_exists(Kardex::class) || !Schema::connection('tenant')->hasTable('kardex')) {
            return null;
        }

        $kardex = Kardex::create([
            'type' => $type,
            'date_of_issue' => date('Y-m-d'),
            'item_id' => $item_id,
            'document_id' => ($relation == 'document') ? $id : null,
            'purchase_id' => ($relation == 'purchase') ? $id : null,
            'sale_note_id' => ($relation == 'sale_note') ? $id : null,
            'quantity' => $quantity,
        ]);

        return $kardex;

    }

    public function updateStock($item_id, $quantity, $is_sale){

        $item = Item::find($item_id);
        if (!$item) {
            return;
        }
        $item->stock = ($is_sale) ? $item->stock - $quantity : $item->stock + $quantity;
        $item->save();

    }

    public function restoreStockInWarehpuse($item_id, $warehouse_id, $quantity)
    {
        $item_warehouse = ItemWarehouse::firstOrNew(['item_id' => $item_id, 'warehouse_id' => $warehouse_id]);
        $item_warehouse->stock = $item_warehouse->stock + $quantity;
        $item_warehouse->save();
    }

}
