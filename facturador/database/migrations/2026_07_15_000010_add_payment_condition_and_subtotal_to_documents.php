<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * El fork "lite" perdio estas columnas de la tabla documents; sin ellas
 * Facturalo::filterByExistingColumns() descarta los valores y el XML sale
 * incompleto (payment_condition_id vacio => SUNAT 3244; subtotal vacio => 0306).
 */
class AddPaymentConditionAndSubtotalToDocuments extends Migration
{
    public function up()
    {
        if (!Schema::hasColumn('documents', 'payment_condition_id')) {
            Schema::table('documents', function (Blueprint $table) {
                $table->string('payment_condition_id', 2)->nullable()->default('01');
            });
        }
        if (!Schema::hasColumn('documents', 'subtotal')) {
            Schema::table('documents', function (Blueprint $table) {
                $table->decimal('subtotal', 12, 2)->default(0);
            });
        }
    }

    public function down()
    {
        foreach (['payment_condition_id', 'subtotal'] as $column) {
            if (Schema::hasColumn('documents', $column)) {
                Schema::table('documents', function (Blueprint $table) use ($column) {
                    $table->dropColumn($column);
                });
            }
        }
    }
}
