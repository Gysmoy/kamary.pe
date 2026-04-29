<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddIsSubjectToIgv31556ToEstablishmentsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (!Schema::hasTable('establishments') || Schema::hasColumn('establishments', 'is_subject_to_igv_31556')) {
            return;
        }

        $afterColumn = Schema::hasColumn('establishments', 'customer_id')
            ? 'customer_id'
            : (Schema::hasColumn('establishments', 'aditional_information') ? 'aditional_information' : 'code');

        Schema::table('establishments', function (Blueprint $table) use ($afterColumn) {
            $table->boolean('is_subject_to_igv_31556')->default(false)->after($afterColumn);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        if (!Schema::hasTable('establishments') || !Schema::hasColumn('establishments', 'is_subject_to_igv_31556')) {
            return;
        }

        Schema::table('establishments', function (Blueprint $table) {
            $table->dropColumn('is_subject_to_igv_31556');
        });
    }
}
