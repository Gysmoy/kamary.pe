<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Catalogo de tipos de detraccion. El porcentaje cambia segun el servicio y SUNAT lo actualiza
 * cada cierto tiempo, por eso vive en una tabla editable y no escrito en el codigo: asi se corrige
 * una tasa sin desplegar.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('detraction_types')) {
            Schema::create('detraction_types', function (Blueprint $table) {
                $table->id();
                $table->string('code', 10)->unique();
                $table->string('description');
                $table->decimal('percent', 6, 2)->default(0);
                $table->boolean('status')->nullable()->default(true)->index();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
            });
        }

        // Los tres que se usan hoy. Las tasas se pueden corregir desde la pantalla del catalogo.
        $now = now();
        foreach ([
            ['code' => '019', 'description' => 'Arrendamiento de bienes muebles', 'percent' => 10],
            ['code' => '027', 'description' => 'Servicio de transporte de carga', 'percent' => 4],
            ['code' => '037', 'description' => 'Demas servicios gravados con el IGV', 'percent' => 12],
        ] as $row) {
            $exists = DB::table('detraction_types')->where('code', $row['code'])->exists();
            if ($exists) continue;

            DB::table('detraction_types')->insert($row + [
                'status' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('detraction_types');
    }
};
