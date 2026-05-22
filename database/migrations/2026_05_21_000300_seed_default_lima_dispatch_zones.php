<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();
        $zones = [
            [
                'code' => 'ZON-LIM-NORTE',
                'name' => 'Lima Norte',
                'department' => 'Lima',
                'province' => 'Lima',
                'reference' => 'Ancon, Carabayllo, Comas, Independencia, Los Olivos, Puente Piedra, San Martin de Porres, Santa Rosa',
            ],
            [
                'code' => 'ZON-LIM-SUR',
                'name' => 'Lima Sur',
                'department' => 'Lima',
                'province' => 'Lima',
                'reference' => 'Chorrillos, Lurin, Pachacamac, Punta Hermosa, Punta Negra, San Bartolo, San Juan de Miraflores, Santa Maria del Mar, Villa El Salvador, Villa Maria del Triunfo',
            ],
            [
                'code' => 'ZON-LIM-ESTE',
                'name' => 'Lima Este',
                'department' => 'Lima',
                'province' => 'Lima',
                'reference' => 'Ate, Chaclacayo, Cieneguilla, El Agustino, La Molina, Lurigancho, San Juan de Lurigancho, San Luis, Santa Anita',
            ],
            [
                'code' => 'ZON-LIM-CENTRO',
                'name' => 'Lima Centro',
                'department' => 'Lima',
                'province' => 'Lima',
                'reference' => 'Lima, Brena, La Victoria, Rimac, Jesus Maria, Lince, Magdalena, Pueblo Libre, San Borja, San Isidro, San Miguel, Surquillo, Miraflores, Barranco, Santiago de Surco',
            ],
            [
                'code' => 'ZON-CALLAO',
                'name' => 'Callao',
                'department' => 'Callao',
                'province' => 'Callao',
                'reference' => 'Bellavista, Callao, Carmen de la Legua Reynoso, La Perla, La Punta, Mi Peru, Ventanilla',
            ],
        ];

        foreach ($zones as $zone) {
            if (DB::table('zones')->where('code', $zone['code'])->exists()) {
                continue;
            }

            DB::table('zones')->insert(array_merge($zone, [
                'business_id' => null,
                'ubigeo' => null,
                'district' => null,
                'observations' => 'Zona global inicial para despacho Lima/Callao.',
                'status' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]));
        }
    }

    public function down(): void
    {
        DB::table('zones')->whereIn('code', [
            'ZON-LIM-NORTE',
            'ZON-LIM-SUR',
            'ZON-LIM-ESTE',
            'ZON-LIM-CENTRO',
            'ZON-CALLAO',
        ])->delete();
    }
};
