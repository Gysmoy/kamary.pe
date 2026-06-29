<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('request_reasons')) {
            Schema::create('request_reasons', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('name');
                $table->boolean('status')->default(true);
                $table->timestamps();
            });
        }

        Schema::table('sample_orders', function (Blueprint $table) {
            if (!Schema::hasColumn('sample_orders', 'request_reason_id')) $table->uuid('request_reason_id')->nullable()->after('request_reason');
        });

        // Sembramos los motivos que estaban hardcodeados para que los pedidos existentes
        // que guardaron el texto (request_reason) puedan emparejarse por nombre.
        $seed = ['CAPACITACIONES', 'NUEVO CLIENTE', 'PRUEBA PILOTO', 'CODIFICACION NUEVO SKU', 'EVENTOS', 'REPOSICION', 'PROMOCION', 'MUESTRA MEDICA'];
        foreach ($seed as $name) {
            if (!DB::table('request_reasons')->where('name', $name)->exists()) {
                DB::table('request_reasons')->insert([
                    'id' => (string) Str::uuid(),
                    'name' => $name,
                    'status' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('sample_orders', function (Blueprint $table) {
            if (Schema::hasColumn('sample_orders', 'request_reason_id')) $table->dropColumn('request_reason_id');
        });
        Schema::dropIfExists('request_reasons');
    }
};
