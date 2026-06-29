<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('sales_channels') || !Schema::hasTable('sales_subchannels')) return;

        $map = [
            'B2B' => ['SUR B2B', 'NORTE B2B', 'LIMA 4', 'LIMA 3', 'LIMA 2', 'LIMA 1', 'CENTRO ORIENTE B2B'],
            'DIRECTOS' => ['ESTADO', 'HUNTING', 'DIRECTOS 3', 'DIRECTOS 2', 'DIRECTOS 1'],
            'TRADICIONAL' => ['TRADICIONAL 2', 'TRADICIONAL 1', 'SUR TRAD', 'NORTE TRAD', 'CENTRO ORIENTE TRAD'],
            'TRADE' => ['TRADICIONAL', 'DIRECTOS', 'RETAIL', 'B2B'],
            'MKT' => ['NO TISSUE'],
            'COMMERCIAL EXCELLENCE' => ['COMMERCIAL EXCELLENCE'],
        ];

        foreach ($map as $channelName => $subnames) {
            $channelId = DB::table('sales_channels')->where('name', $channelName)->value('id');
            if (!$channelId) continue;

            foreach ($subnames as $subname) {
                $exists = DB::table('sales_subchannels')
                    ->where('sales_channel_id', $channelId)
                    ->where('name', $subname)
                    ->exists();
                if ($exists) continue;

                DB::table('sales_subchannels')->insert([
                    'id' => (string) Str::uuid(),
                    'sales_channel_id' => $channelId,
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
        // No revertimos los sub canales sembrados para no perder datos creados manualmente.
    }
};
