<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddEditWindowToConfigurationsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('configurations', function (Blueprint $table) {
            if (!Schema::hasColumn('configurations', 'restrict_receipt_date')) {
                $table->boolean('restrict_receipt_date')->default(true)->after('soap_url');
            }

            if (!Schema::hasColumn('configurations', 'shipping_time_days')) {
                $table->integer('shipping_time_days')->default(4)->after('restrict_receipt_date');
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
        Schema::table('configurations', function (Blueprint $table) {
            if (Schema::hasColumn('configurations', 'shipping_time_days')) {
                $table->dropColumn('shipping_time_days');
            }

            if (Schema::hasColumn('configurations', 'restrict_receipt_date')) {
                $table->dropColumn('restrict_receipt_date');
            }
        });
    }
}
