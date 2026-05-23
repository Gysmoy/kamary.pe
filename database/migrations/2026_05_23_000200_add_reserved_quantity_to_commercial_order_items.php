<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('commercial_order_items', function (Blueprint $table) {
            if (!Schema::hasColumn('commercial_order_items', 'reserved_quantity')) {
                $table->decimal('reserved_quantity', 12, 3)->default(0)->after('stock_available');
            }
        });
    }

    public function down(): void
    {
        Schema::table('commercial_order_items', function (Blueprint $table) {
            if (Schema::hasColumn('commercial_order_items', 'reserved_quantity')) {
                $table->dropColumn('reserved_quantity');
            }
        });
    }
};
