<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class TenantAddDecimalQuantityToConfigurations extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (Schema::hasColumn('configurations', 'decimal_quantity')) {
            return;
        }

        $afterColumn = 'id';
        if (Schema::hasColumn('configurations', 'plan')) {
            $afterColumn = 'plan';
        } elseif (Schema::hasColumn('configurations', 'locked_admin')) {
            $afterColumn = 'locked_admin';
        }

        Schema::table('configurations', function (Blueprint $table) use ($afterColumn) {
            $column = $table->tinyInteger('decimal_quantity')->default(2);
            $column->after($afterColumn);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('configurations', function (Blueprint $table) {
            $table->dropColumn('decimal_quantity');
        });
    }
}
