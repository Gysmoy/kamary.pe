<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('commercial_orders')
            ->whereNotNull('external_source')
            ->whereIn('document_type', ['Factura', 'Boleta'])
            ->where('total', '>', 0)
            ->orderBy('id')
            ->select('id', 'total', 'paid_amount')
            ->chunk(100, function ($orders) {
                foreach ($orders as $order) {
                    $total = round((float) $order->total, 2);
                    $subtotal = round($total / 1.18, 2);
                    DB::table('commercial_orders')
                        ->where('id', $order->id)
                        ->update([
                            'subtotal' => $subtotal,
                            'tax_amount' => round($total - $subtotal, 2),
                            'balance_amount' => round(max(0, $total - (float) $order->paid_amount), 2),
                            'updated_at' => now(),
                        ]);
                }
            });
    }

    public function down(): void
    {
        //
    }
};
