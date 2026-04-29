<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddIsEditableToDocumentsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (!Schema::hasColumn('documents', 'is_editable')) {
            Schema::table('documents', function (Blueprint $table) {
                $table->boolean('is_editable')->default(true)->after('total_canceled');
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
        if (Schema::hasColumn('documents', 'is_editable')) {
            Schema::table('documents', function (Blueprint $table) {
                $table->dropColumn('is_editable');
            });
        }
    }
}
