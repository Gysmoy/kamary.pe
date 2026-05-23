<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (
            !Schema::hasTable('commercial_order_stock_movements')
            || !Schema::hasTable('commercial_order_items')
            || !Schema::hasColumn('commercial_order_items', 'reserved_quantity')
        ) {
            return;
        }

        DB::table('commercial_order_items as item')
            ->join('commercial_orders as order', 'order.id', '=', 'item.commercial_order_id')
            ->where('item.reserved_quantity', '>', 0)
            ->whereNotExists(function ($query) {
                $query->selectRaw('1')
                    ->from('commercial_order_stock_movements as movement')
                    ->whereColumn('movement.commercial_order_item_id', 'item.id')
                    ->where('movement.movement_type', 'reserved');
            })
            ->orderBy('item.id')
            ->select([
                'item.id',
                'item.commercial_order_id',
                'item.id as commercial_order_item_id',
                'order.business_id',
                'order.business_branch_id',
                DB::raw('COALESCE(item.warehouse_id, order.warehouse_id) as warehouse_id'),
                'item.article_id',
                'item.reserved_quantity as quantity',
                'order.code as reference_code',
                'item.created_at',
                'item.updated_at',
            ])
            ->chunkById(500, function ($rows) {
                $now = now();
                $payload = [];
                foreach ($rows as $row) {
                    $payload[] = [
                        'commercial_order_id' => $row->commercial_order_id,
                        'commercial_order_item_id' => $row->commercial_order_item_id,
                        'business_id' => $row->business_id,
                        'business_branch_id' => $row->business_branch_id,
                        'warehouse_id' => $row->warehouse_id,
                        'article_id' => $row->article_id,
                        'movement_type' => 'reserved',
                        'quantity' => $row->quantity,
                        'reference_code' => $row->reference_code,
                        'observations' => 'Migracion de reservas existentes',
                        'metadata' => null,
                        'status' => true,
                        'created_by' => null,
                        'updated_by' => null,
                        'created_at' => $row->created_at ?: $now,
                        'updated_at' => $row->updated_at ?: $now,
                    ];
                }

                if (!empty($payload)) {
                    DB::table('commercial_order_stock_movements')->insert($payload);
                }
            }, 'item.id', 'id');
    }

    public function down(): void
    {
        if (!Schema::hasTable('commercial_order_stock_movements')) return;

        DB::table('commercial_order_stock_movements')
            ->where('observations', 'Migracion de reservas existentes')
            ->delete();
    }
};
