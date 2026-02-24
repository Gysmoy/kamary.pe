<?php

namespace App\Observers;

use App\Jobs\SendSaleWhatsApp;
use App\Models\Sale;
use App\Models\SaleStatus;
use Illuminate\Support\Facades\Auth;

class SaleStatusObserver
{
    public function created(Sale $sale)
    {
        SaleStatus::create([
            'sale_id' => $sale->id,
            'status_id' => $sale->status_id,
            'user_id' => Auth::check() ? Auth::user()->id : null,
        ]);
    }

    // Registro de los cambios en el estado
    public function updating(Sale $sale)
    {
        if ($sale->isDirty('status_id')) {
            SaleStatus::create([
                'sale_id' => $sale->id,
                'status_id' => $sale->status_id,
                'user_id' => Auth::check() ? Auth::user()->id : null,
            ]);
        }
    }
}
