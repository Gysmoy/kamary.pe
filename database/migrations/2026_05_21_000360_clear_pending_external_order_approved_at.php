<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('commercial_orders')
            ->where('order_status', 'pending')
            ->where('dispatch_status', 'pending')
            ->whereNotNull('external_source')
            ->update([
                'approved_at' => null,
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        //
    }
};
