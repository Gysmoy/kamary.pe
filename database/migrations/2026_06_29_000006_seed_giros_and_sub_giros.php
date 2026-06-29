<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('giros') || !Schema::hasTable('sub_giros')) return;

        // Normaliza para emparejar giros existentes sin importar tildes / mayusculas
        $normalize = function ($value) {
            $value = mb_strtoupper(trim((string)$value));
            return strtr($value, ['Á' => 'A', 'É' => 'E', 'Í' => 'I', 'Ó' => 'O', 'Ú' => 'U', 'Ñ' => 'N', 'Ü' => 'U']);
        };

        $map = [
            'EDUCACION' => ['SALAS CUNA', 'JARDINES INFANTILES', 'ESCUELAS TECNICAS', 'UNIVERSIDADES', 'COLEGIOS'],
            'GASTRONOMIA' => ['FAST FOOD', 'CARRITOS DE COMIDA', 'BARES RESTAURANTES', 'CAFETERIAS PASTELERIAS', 'CASINOS'],
            'HOTELERIA' => ['ALQUILERES PRIVADOS', 'HOSTALES ALBERGUES', 'CASAS DE HUESPEDES', 'HOTELES', 'HOSPEDAJE'],
            'INDUSTRIAS' => ['Industrias', 'INDUSTRIAS ALIMENTARIA', 'TELECOMUNICACIONES', 'TELECOMUNICACIOE', 'Seguridad', 'CLIENTES POTENCIALES', 'Retail', 'Flexible', 'CARTONERA', 'Agroindustria', 'PRODUCTORAS DE ALIMENTOS', 'TRATAMIENTO DE AGUA', 'MINERIA', 'INDUSTRIA PETROLERA', 'INDUSTRIA AUTOMOTRIZ'],
            'OFICINAS' => ['OFICINAS', 'BANCOS', 'SECTOR MINERO', 'CENTROS COMERCIALES', 'DISTRIBUIDORAS DE ALIMENTOS'],
            'INSTITUCIONES ALTO TRAFICO' => ['ESTACIONES DE SERVICIO', 'CINES', 'MUSEOS CINES', 'PARQUES DE DIVERSIONES', 'CC COMERCIALES', 'AEROPUERTOS'],
            'SALUD' => ['LABORATORIOS', 'CONSULTORIOS', 'CLINICAS VETERINARIAS', 'CLINICAS DENTALES', 'CLINICAS', 'HOSPITALES'],
            'DISTRIBUIDORA' => ['NUEVO CLIENTE', 'CAPACITACION', 'BONIFICACIÓN', 'VISITA'],
            'BELLEZA' => ['SALÓN DE BELLEZA'],
            'BTL' => ['Planta de producción'],
            'PROVEEDOR JABONES' => ['Envio de Muestras', 'Envio de Muestras proveedor jabones MyE'],
            'MUESTRAS' => ['MERCH', 'Material PDV', 'Material E', 'Muestras de Lanzamiento'],
            'REPOSICIÓN' => ['REPOSICIÓN DE PRODUCTO'],
            'INSTITUCIÓN' => ['INSTITUCIÓN'],
        ];

        $byNorm = [];
        foreach (DB::table('giros')->get(['id', 'name']) as $giro) {
            $byNorm[$normalize($giro->name)] = $giro->id;
        }

        foreach ($map as $giroName => $subnames) {
            $norm = $normalize($giroName);
            $giroId = $byNorm[$norm] ?? null;

            if (!$giroId) {
                $giroId = (string) Str::uuid();
                DB::table('giros')->insert([
                    'id' => $giroId,
                    'name' => $giroName,
                    'status' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $byNorm[$norm] = $giroId;
            }

            foreach ($subnames as $subname) {
                $exists = DB::table('sub_giros')
                    ->where('giro_id', $giroId)
                    ->where('name', $subname)
                    ->exists();
                if ($exists) continue;

                DB::table('sub_giros')->insert([
                    'id' => (string) Str::uuid(),
                    'giro_id' => $giroId,
                    'name' => $subname,
                    'status' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        // No revertimos los datos sembrados para no perder informacion creada manualmente.
    }
};
