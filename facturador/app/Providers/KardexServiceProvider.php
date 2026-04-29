<?php

namespace App\Providers;

use App\Models\Billing\Item;
use App\Models\Billing\DocumentItem;
use App\Models\Billing\Document;
use App\Models\Billing\PurchaseItem;
use App\Models\Billing\SaleNoteItem;
use App\Models\Billing\Kardex;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Schema;
use App\Traits\KardexTrait;


/**
 * Se debe tener en cuenta este provider para llevar el control de Kardex
 */
class KardexServiceProvider extends ServiceProvider
{
    use KardexTrait;

    public function boot()
    {
        if (!class_exists(Kardex::class) || !Schema::connection('tenant')->hasTable('kardex')) {
            return;
        }

        $this->save_item();
        $this->sale();
        if (class_exists(PurchaseItem::class)) {
            $this->purchase();
        }
        if (class_exists(SaleNoteItem::class)) {
            $this->sale_note();
        }

    }

    public function register()
    {

    }

    /**
     * Cuando se realiza una venta
     */
    private function sale()
    {
        DocumentItem::created(function (DocumentItem $document_item) {
            $document = Document::whereIn('document_type_id',['01','03'])->find($document_item->document_id);
            if($document){

                $kardex = $this->saveKardex('sale', $document_item->item_id, $document_item->document_id, $document_item->quantity, 'document');

                if($document->state_type_id != 11){

                    $this->updateStock($document_item->item_id, $kardex->quantity, true);

                }

            }
        });
    }

    /**
     *Cuando se realiza una compra
     */
    private function purchase()
    {
        if (!class_exists(PurchaseItem::class)) {
            return;
        }

        PurchaseItem::created(function (PurchaseItem $purchase_item) {

            $kardex = $this->saveKardex('purchase', $purchase_item->item_id, $purchase_item->purchase_id, $purchase_item->quantity, 'purchase');

            $this->updateStock($purchase_item->item_id, $kardex->quantity, false);

        });
    }

    /**
     * Cuando se realiza una nota de compra
     */
    private function sale_note()
    {
        if (!class_exists(SaleNoteItem::class)) {
            return;
        }

        SaleNoteItem::created(function (SaleNoteItem $sale_note_item) {

            $kardex = $this->saveKardex('sale', $sale_note_item->item_id, $sale_note_item->sale_note_id, $sale_note_item->quantity, 'sale_note');

            $this->updateStock($sale_note_item->item_id, $kardex->quantity, true);

        });
    }

    /**
     * Cuando se guarda un item
     */
    private function save_item(){

        Item::created(function (Item $item) {

            $stock = ($item->stock) ? $item->stock : 0;
            $kardex = $this->saveKardex(null, $item->id, null, $stock, null);

        });

    }



}
