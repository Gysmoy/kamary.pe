<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddCustomerIdToEstablishmentsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (!Schema::hasTable('establishments')) {
            return;
        }

        if (!Schema::hasColumn('establishments', 'customer_id')) {
            Schema::table('establishments', function (Blueprint $table) {
                $table->unsignedInteger('customer_id')->nullable()->after('aditional_information');
            });
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        if (!Schema::hasTable('establishments')) {
            return;
        }

        if (Schema::hasColumn('establishments', 'customer_id')) {
            Schema::table('establishments', function (Blueprint $table) {
                $table->dropColumn('customer_id');
            });
        }
    }
}
