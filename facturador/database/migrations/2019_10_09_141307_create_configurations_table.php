<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateConfigurationsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (Schema::hasTable('configurations')) {
            if (!Schema::hasColumn('configurations', 'locked_admin')) {
                Schema::table('configurations', function (Blueprint $table) {
                    $table->boolean('locked_admin')->default(false)->after('id');
                });
            }
            return;
        }

        Schema::create('configurations', function (Blueprint $table) {
            $table->increments('id');
            $table->boolean('locked_admin')->default(false);
            $table->timestamps();
        });

        DB::table('configurations')->insert([
            ['id' => '1', 'locked_admin' => false, 'created_at'=> now(), 'updated_at'=> now()], 
        ]);
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('configurations');
    }
}
