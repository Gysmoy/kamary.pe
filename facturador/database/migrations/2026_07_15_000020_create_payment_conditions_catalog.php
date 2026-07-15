<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * El fork "lite" no trae el catalogo payment_conditions, pero los modelos/plantillas
 * (Document::payment_condition) lo consultan. Sin esta tabla el PDF revienta y
 * revierte toda la emision. Se crea y siembra con los valores estandar SUNAT.
 */
class CreatePaymentConditionsCatalog extends Migration
{
    public function up()
    {
        if (!Schema::hasTable('payment_conditions')) {
            Schema::create('payment_conditions', function (Blueprint $table) {
                $table->string('id', 2)->primary();
                $table->string('name', 100);
                $table->integer('days')->default(0);
                $table->boolean('is_locked')->default(false);
                $table->boolean('is_active')->default(true);
            });
        }

        $rows = [
            ['id' => '01', 'name' => 'Contado', 'days' => 0, 'is_locked' => 0, 'is_active' => 1],
            ['id' => '02', 'name' => 'Credito', 'days' => 0, 'is_locked' => 0, 'is_active' => 1],
        ];
        foreach ($rows as $row) {
            $exists = DB::table('payment_conditions')->where('id', $row['id'])->exists();
            if (!$exists) {
                DB::table('payment_conditions')->insert($row);
            }
        }
    }

    public function down()
    {
        if (Schema::hasTable('payment_conditions')) {
            Schema::drop('payment_conditions');
        }
    }
}
