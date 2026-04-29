<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class TenantAddStatusToItem extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (Schema::hasColumn('items', 'status')) {
            return;
        }

        $afterColumn = Schema::hasColumn('items', 'warehouse_id') ? 'warehouse_id' : null;

        Schema::table('items', function (Blueprint $table) use ($afterColumn) {
            $column = $table->tinyInteger('status')->default(1);
            if ($afterColumn) {
                $column->after($afterColumn);
            }
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('items', function (Blueprint $table) {
              $table->dropColumn('status');
        });
    }
}
