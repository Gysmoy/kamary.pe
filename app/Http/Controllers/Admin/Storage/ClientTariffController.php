<?php

namespace App\Http\Controllers\Admin\Storage;

use App\Http\Controllers\BasicController;
use App\Models\Client;
use App\Models\ClientStorageTariff;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use SoDe\Extend\Response;

class ClientTariffController extends BasicController
{
    public $model = ClientStorageTariff::class;
    public $prefix4filter = 'client_storage_tariffs';

    private const TEMPERATURES = [
        '-15C a -25C',
        '2C a 8C',
        '15C a 25C',
        '-15C a -40C',
    ];

    private const CURRENCIES = ['PEN', 'USD'];

    public function byClient(Request $request, string $clientId)
    {
        $response = new Response();
        try {
            $clientId = (int)$clientId;
            $this->assertClient($clientId);

            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = ClientStorageTariff::query()
                ->where('client_id', $clientId)
                ->whereNotNull('status')
                ->first();
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $userId = Auth::id();
        $clientId = (int)($body['client_id'] ?? 0);

        $this->assertClient($clientId);

        $temperature = trim((string)($body['temperature_range'] ?? ''));
        if (!in_array($temperature, self::TEMPERATURES, true)) {
            throw new \Exception('La temperatura es obligatoria');
        }

        $currency = strtoupper(trim((string)($body['currency'] ?? 'PEN')));
        if (!in_array($currency, self::CURRENCIES, true)) {
            throw new \Exception('La moneda es obligatoria');
        }

        $existing = ClientStorageTariff::query()->where('client_id', $clientId)->first();
        $isNew = empty($body['id']) && !$existing;
        if (empty($body['id']) && $existing) {
            $body['id'] = $existing->id;
        }

        if ($isNew) {
            $body['created_by'] = $userId;
        }

        if ($isNew || !$existing?->status) {
            $body['status'] = true;
        }

        $body['client_id'] = $clientId;
        $body['temperature_range'] = $temperature;
        $body['currency'] = $currency;
        $body['updated_by'] = $userId;

        if (Schema::hasColumn('clients', 'storage_tariff_enabled')) {
            Client::query()->whereKey($clientId)->update(['storage_tariff_enabled' => true]);
        }

        return $body;
    }

    private function assertClient(int $clientId): void
    {
        $clientExists = Client::query()
            ->whereKey($clientId)
            ->whereNotNull('status')
            ->where('client_kind', 'regular')
            ->exists();

        if (!$clientExists) {
            throw new \Exception('Cliente no encontrado');
        }
    }
}
