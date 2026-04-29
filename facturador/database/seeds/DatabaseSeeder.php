<?php

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        $this->call(UserSeeder::class);
        $this->call(TenantDemoLiteSeeder::class);

        // Legacy plan_documents seeding is optional and disabled by default in single-company mode.
        if (env('SEED_LEGACY_PLAN_DOCUMENTS', false) && Schema::connection('system')->hasTable('plan_documents')) {
            DB::connection('system')->table('plan_documents')->updateOrInsert(
                ['id' => 1],
                ['description' => 'Facturas, boletas, notas de debito y credito, resumenes y anulaciones']
            );
            DB::connection('system')->table('plan_documents')->updateOrInsert(
                ['id' => 2],
                ['description' => 'Guias de remision']
            );
            DB::connection('system')->table('plan_documents')->updateOrInsert(
                ['id' => 3],
                ['description' => 'Retenciones']
            );
            DB::connection('system')->table('plan_documents')->updateOrInsert(
                ['id' => 4],
                ['description' => 'Percepciones']
            );
        }
    }
}

