<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateClientsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (Schema::hasTable('clients')) {
            return;
        }

        $hasHostnamesTable = Schema::hasTable('hostnames');
        $hasPlansTable = Schema::hasTable('plans');

        Schema::create('clients', function (Blueprint $table) use ($hasHostnamesTable, $hasPlansTable) {
            $table->increments('id');
            $table->bigInteger ('hostname_id')->unsigned()->nullable();
            $table->string('number');
            $table->string('name');
            $table->string('email');
            $table->string('token');
            $table->boolean('locked')->default(false);
            $table->unsignedInteger('plan_id');

            $table->timestamps();

            if ($hasHostnamesTable) {
                $table->foreign('hostname_id')->references('id')->on('hostnames')->onDelete('cascade');
            }
            if ($hasPlansTable) {
                $table->foreign('plan_id')->references('id')->on('plans');
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
        Schema::dropIfExists('clients');
    }
}
