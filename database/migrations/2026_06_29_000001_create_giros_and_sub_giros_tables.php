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
        if (!Schema::hasTable('giros')) {
            Schema::create('giros', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('name');
                $table->boolean('status')->default(true);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('sub_giros')) {
            Schema::create('sub_giros', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('giro_id')->nullable()->index();
                $table->string('name');
                $table->boolean('status')->default(true);
                $table->timestamps();
            });
        }

        Schema::table('sample_orders', function (Blueprint $table) {
            if (!Schema::hasColumn('sample_orders', 'giro_id')) $table->uuid('giro_id')->nullable()->after('business_line');
            if (!Schema::hasColumn('sample_orders', 'sub_giro_id')) $table->uuid('sub_giro_id')->nullable()->after('business_subline');
        });

        // Sembramos los giros que estaban hardcodeados para que los pedidos existentes
        // que guardaron el texto (business_line) puedan emparejarse por nombre.
        $seed = ['EDUCACION', 'GASTRONOMIA', 'HOTELERIA', 'INDUSTRIAS', 'OFICINAS', 'BELLEZA', 'BTL', 'PROVEEDOR JABONES', 'MUESTRAS', 'REPOSICION', 'INSTITUCION', 'FARMACIA', 'RETAIL', 'CLINICA'];
        foreach ($seed as $name) {
            if (!DB::table('giros')->where('name', $name)->exists()) {
                DB::table('giros')->insert([
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
            if (Schema::hasColumn('sample_orders', 'giro_id')) $table->dropColumn('giro_id');
            if (Schema::hasColumn('sample_orders', 'sub_giro_id')) $table->dropColumn('sub_giro_id');
        });
        Schema::dropIfExists('sub_giros');
        Schema::dropIfExists('giros');
    }
};
