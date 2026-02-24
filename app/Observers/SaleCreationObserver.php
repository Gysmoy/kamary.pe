<?php

namespace App\Observers;

use App\Models\Sale;
use SoDe\Extend\Math;

class SaleCreationObserver
{
    public function created(Sale $sale)
    {
        Sale::where('id', $sale->id)
            ->update([
                'fullname' => $sale->name . ' ' . $sale->lastname
            ]);
    }

    public function updated(Sale $sale)
    {
        if ($sale->isDirty('name') || $sale->isDirty('lastname')) {
            Sale::where('id', $sale->id)
                ->update([
                    'fullname' => $sale->name . ' ' . $sale->lastname
                ]);
        }
    }
}
