<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('take_orders', function (Blueprint $table) {
            if (!Schema::hasColumn('take_orders', 'order_profile')) {
                $table->string('order_profile', 30)->default('micro')->after('code');
            }
            if (!Schema::hasColumn('take_orders', 'map_lat')) {
                $table->decimal('map_lat', 12, 8)->nullable()->after('ubigeo');
            }
            if (!Schema::hasColumn('take_orders', 'map_lng')) {
                $table->decimal('map_lng', 12, 8)->nullable()->after('map_lat');
            }
        });
    }

    public function down(): void
    {
        Schema::table('take_orders', function (Blueprint $table) {
            $columns = [];
            if (Schema::hasColumn('take_orders', 'map_lng')) $columns[] = 'map_lng';
            if (Schema::hasColumn('take_orders', 'map_lat')) $columns[] = 'map_lat';
            if (Schema::hasColumn('take_orders', 'order_profile')) $columns[] = 'order_profile';
            if ($columns) $table->dropColumn($columns);
        });
    }
};
