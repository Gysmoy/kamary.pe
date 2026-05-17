<?php

namespace App\Console\Commands;

use App\Models\IntegrationMapping;
use Illuminate\Console\Command;

class IntegrationMapCommand extends Command
{
    protected $signature = 'integrations:map
        {provider : Proveedor, ejemplo ecomsur_oms}
        {entity_type : Tipo externo, ejemplo warehouse o account}
        {external_id : Id externo}
        {internal_type : Clase interna, ejemplo App\\Models\\Warehouse}
        {internal_id : Id interno}
        {--meta=* : Metadata opcional key=value}';

    protected $description = 'Crea o actualiza un mapeo de integracion externa contra un registro interno';

    public function handle(): int
    {
        $metadata = [];
        foreach ($this->option('meta') as $pair) {
            if (!str_contains($pair, '=')) continue;
            [$key, $value] = explode('=', $pair, 2);
            $metadata[$key] = $value;
        }

        $mapping = IntegrationMapping::updateOrCreate([
            'provider' => $this->argument('provider'),
            'entity_type' => $this->argument('entity_type'),
            'external_id' => $this->argument('external_id'),
            'internal_type' => $this->argument('internal_type'),
        ], [
            'internal_id' => (int)$this->argument('internal_id'),
            'metadata' => $metadata ?: null,
            'status' => true,
        ]);

        $this->info("Mapeo guardado: {$mapping->provider} {$mapping->entity_type} {$mapping->external_id} -> {$mapping->internal_type}#{$mapping->internal_id}");

        return self::SUCCESS;
    }
}
