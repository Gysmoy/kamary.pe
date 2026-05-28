<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_delay_reasons', function (Blueprint $table) {
            $table->id();
            $table->string('description');
            $table->boolean('status')->nullable()->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        $now = now();
        DB::table('delivery_delay_reasons')->insert([
            ['description' => 'Quiebre en Softys', 'status' => true, 'created_at' => $now, 'updated_at' => $now],
            ['description' => 'Quiebre en Kamary Reposicion', 'status' => true, 'created_at' => $now, 'updated_at' => $now],
            ['description' => 'Retraso del currier Provincia', 'status' => true, 'created_at' => $now, 'updated_at' => $now],
            ['description' => 'Reprogramado por el cliente', 'status' => true, 'created_at' => $now, 'updated_at' => $now],
            ['description' => 'Validacion de transferencia', 'status' => true, 'created_at' => $now, 'updated_at' => $now],
            ['description' => 'Migracion atrasada del pedido por Multivende', 'status' => true, 'created_at' => $now, 'updated_at' => $now],
            ['description' => 'Reprogramacion por kamary', 'status' => true, 'created_at' => $now, 'updated_at' => $now],
            ['description' => 'Entrega conforme - Error de sistema', 'status' => true, 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_delay_reasons');
    }
};
