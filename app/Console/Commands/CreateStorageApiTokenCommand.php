<?php

namespace App\Console\Commands;

use App\Models\StorageApiToken;
use App\Support\StorageScope;
use Illuminate\Console\Command;

class CreateStorageApiTokenCommand extends Command
{
    protected $signature = 'storage-api:token
        {client : ID o numero de documento del cliente de almacenamiento}
        {--name= : Nombre descriptivo del token}
        {--abilities=stock:read,orders:read,orders:write : Permisos separados por coma o *}
        {--expires= : Fecha de expiracion YYYY-MM-DD}';

    protected $description = 'Genera un token para la API externa de clientes de almacenamiento.';

    public function handle(): int
    {
        $client = $this->findClient((string) $this->argument('client'));
        if (!$client) {
            $this->error('Cliente de almacenamiento no encontrado.');
            return self::FAILURE;
        }

        $plainToken = StorageApiToken::makePlainToken();
        $abilities = $this->parseAbilities((string) $this->option('abilities'));
        $expiresAt = $this->parseExpiresAt($this->option('expires'));

        StorageApiToken::create([
            'client_id' => $client->id,
            'name' => trim((string) $this->option('name')) ?: 'Integracion externa',
            'token_prefix' => substr($plainToken, 0, 12),
            'token_hash' => StorageApiToken::hashToken($plainToken),
            'encrypted_token' => StorageApiToken::encryptedToken($plainToken),
            'abilities' => $abilities,
            'expires_at' => $expiresAt,
            'status' => true,
        ]);

        $this->info('Token creado. Copialo ahora; no se volvera a mostrar.');
        $this->line('Cliente: ' . $client->document_number . ' - ' . $client->full_name);
        $this->line('Permisos: ' . implode(', ', $abilities));
        $this->line('Token: ' . $plainToken);

        return self::SUCCESS;
    }

    private function findClient(string $value)
    {
        $value = trim($value);
        if ($value === '') return null;

        if (ctype_digit($value)) {
            $byId = StorageScope::clientQuery()->whereKey((int) $value)->first();
            if ($byId) return $byId;
        }

        return StorageScope::clientQuery()
            ->where('document_number', $value)
            ->first();
    }

    private function parseAbilities(string $value): array
    {
        $abilities = array_values(array_filter(array_map('trim', explode(',', $value))));
        return count($abilities) ? $abilities : ['stock:read', 'orders:read', 'orders:write'];
    }

    private function parseExpiresAt($value): ?string
    {
        $text = trim((string) ($value ?? ''));
        if ($text === '') return null;

        $timestamp = strtotime($text);
        if ($timestamp === false) {
            throw new \InvalidArgumentException('Fecha de expiracion invalida.');
        }

        return date('Y-m-d 23:59:59', $timestamp);
    }
}
