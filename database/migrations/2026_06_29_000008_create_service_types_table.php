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
        if (!Schema::hasTable('service_types')) {
            Schema::create('service_types', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('name');
                $table->boolean('status')->nullable()->default(true);
                $table->timestamps();
            });
        }

        Schema::table('sample_orders', function (Blueprint $table) {
            if (!Schema::hasColumn('sample_orders', 'service_type_id')) $table->uuid('service_type_id')->nullable()->after('service_type');
        });

        // Sembramos los tipos de servicio que estaban hardcodeados para emparejar pedidos existentes por nombre.
        $seed = ['NEXT DAY', 'SAME DAY', 'PROGRAMADO'];
        foreach ($seed as $name) {
            if (!DB::table('service_types')->where('name', $name)->exists()) {
                DB::table('service_types')->insert([
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
            if (Schema::hasColumn('sample_orders', 'service_type_id')) $table->dropColumn('service_type_id');
        });
        Schema::dropIfExists('service_types');
    }
};
