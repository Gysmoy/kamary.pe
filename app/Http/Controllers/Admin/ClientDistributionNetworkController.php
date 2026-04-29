<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\Client;
use App\Models\ClientDeliveryAddress;
use App\Models\ClientDistributionNetwork;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use SoDe\Extend\Response;

class ClientDistributionNetworkController extends BasicController
{
    public $model = ClientDistributionNetwork::class;
    public $reactView = 'Admin/ClientDistributionNetworks';
    public $prefix4filter = 'client_distribution_networks';

    private array $addressesPayload = [];

    public function setReactViewProperties(Request $request)
    {
        return [
            'requiredPermission' => 'client-distribution',
        ];
    }

    public function setPaginationInstance(string $model)
    {
        return $model::select('client_distribution_networks.*')
            ->with([
                'client:id,document_type,document_number,full_name,short_code,commercial_channel,segment,status',
                'addresses' => function ($query) {
                    $query->whereNotNull('status')->select([
                        'id',
                        'client_distribution_network_id',
                        'client_id',
                        'code',
                        'name',
                        'ubigeo',
                        'department',
                        'province',
                        'district',
                        'address',
                        'reference',
                        'latitude',
                        'longitude',
                        'contact_name',
                        'contact_phone',
                        'is_default',
                        'status',
                    ]);
                },
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ])
            ->withCount(['addresses as active_addresses_count' => function ($query) {
                $query->whereNotNull('status');
            }])
            ->join('clients', 'clients.id', '=', 'client_distribution_networks.client_id')
            ->join('users as creator', 'creator.id', '=', 'client_distribution_networks.created_by')
            ->join('users as updater', 'updater.id', '=', 'client_distribution_networks.updated_by');
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $userId = Auth::id();
        $id = $body['id'] ?? null;

        $clientId = (int)($body['client_id'] ?? 0);
        $name = trim((string)($body['name'] ?? ''));
        $code = trim((string)($body['code'] ?? ''));

        if ($clientId <= 0) {
            throw new \Exception('El cliente es obligatorio');
        }
        $client = Client::findOrFail($clientId);
        if ($client->client_kind !== 'regular') {
            throw new \Exception('La red de distribucion solo aplica a clientes regulares');
        }
        if ($name === '') {
            throw new \Exception('El nombre de la red o nodo es obligatorio');
        }

        $rawAddresses = $body['addresses'] ?? [];
        if (is_string($rawAddresses)) {
            $decoded = json_decode($rawAddresses, true);
            $rawAddresses = is_array($decoded) ? $decoded : [];
        }
        if (!is_array($rawAddresses)) $rawAddresses = [];
        $this->addressesPayload = $rawAddresses;
        unset($body['addresses']);

        if (!$id) {
            $body['code'] = $code !== '' ? $code : $this->nextCode();
            $body['created_by'] = $userId;
            $body['status'] = true;
        } else {
            $body['code'] = $code !== '' ? $code : ClientDistributionNetwork::findOrFail($id)->code;
        }

        $exists = ClientDistributionNetwork::where('code', $body['code'])
            ->when($id, fn($query) => $query->where('id', '!=', $id))
            ->exists();
        if ($exists) {
            throw new \Exception('Ya existe una red de distribucion con este codigo');
        }

        $body['updated_by'] = $userId;
        $body['client_id'] = $clientId;
        $body['name'] = $name;
        $body['commercial_channel'] = trim((string)($body['commercial_channel'] ?? '')) ?: null;
        $body['segment'] = trim((string)($body['segment'] ?? '')) ?: null;
        $body['contact_name'] = trim((string)($body['contact_name'] ?? '')) ?: null;
        $body['contact_phone'] = trim((string)($body['contact_phone'] ?? '')) ?: null;
        $body['contact_email'] = trim((string)($body['contact_email'] ?? '')) ?: null;
        $body['observations'] = trim((string)($body['observations'] ?? '')) ?: null;
        $body['is_default'] = $this->toBoolean($body['is_default'] ?? false);

        return $body;
    }

    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        DB::beginTransaction();
        try {
            ClientDeliveryAddress::where('client_distribution_network_id', $jpa->id)->delete();

            $inserted = 0;
            $hasDefault = false;
            foreach ($this->addressesPayload as $idx => $item) {
                if (!is_array($item)) continue;

                $itemStatus = array_key_exists('status', $item) ? (bool)$item['status'] : true;
                if (!$itemStatus) continue;

                $name = trim((string)($item['name'] ?? ''));
                $address = trim((string)($item['address'] ?? ''));
                if ($name === '') throw new \Exception('Cada direccion debe tener un nombre');
                if ($address === '') throw new \Exception('Cada direccion debe tener una direccion');

                $isDefault = $this->toBoolean($item['is_default'] ?? false);
                if ($isDefault) $hasDefault = true;

                ClientDeliveryAddress::create([
                    'client_distribution_network_id' => $jpa->id,
                    'client_id' => $jpa->client_id,
                    'code' => trim((string)($item['code'] ?? '')) ?: sprintf('%s-%02d', $jpa->code, $idx + 1),
                    'name' => $name,
                    'ubigeo' => trim((string)($item['ubigeo'] ?? '')) ?: null,
                    'department' => trim((string)($item['department'] ?? '')) ?: null,
                    'province' => trim((string)($item['province'] ?? '')) ?: null,
                    'district' => trim((string)($item['district'] ?? '')) ?: null,
                    'address' => $address,
                    'reference' => trim((string)($item['reference'] ?? '')) ?: null,
                    'latitude' => $this->toNullableDecimal($item['latitude'] ?? null),
                    'longitude' => $this->toNullableDecimal($item['longitude'] ?? null),
                    'contact_name' => trim((string)($item['contact_name'] ?? '')) ?: null,
                    'contact_phone' => trim((string)($item['contact_phone'] ?? '')) ?: null,
                    'is_default' => $isDefault,
                    'status' => true,
                    'created_by' => Auth::id(),
                    'updated_by' => Auth::id(),
                ]);
                $inserted++;
            }

            if ($inserted === 0) {
                throw new \Exception('Debes agregar al menos una direccion de entrega');
            }

            if (!$hasDefault) {
                ClientDeliveryAddress::where('client_distribution_network_id', $jpa->id)
                    ->orderBy('id')
                    ->limit(1)
                    ->update(['is_default' => true]);
            } else {
                $defaultId = ClientDeliveryAddress::where('client_distribution_network_id', $jpa->id)
                    ->where('is_default', true)
                    ->orderBy('id')
                    ->value('id');
                if ($defaultId) {
                    ClientDeliveryAddress::where('client_distribution_network_id', $jpa->id)
                        ->where('id', '!=', $defaultId)
                        ->update(['is_default' => false]);
                }
            }

            if ($jpa->is_default) {
                ClientDistributionNetwork::where('client_id', $jpa->client_id)
                    ->where('id', '!=', $jpa->id)
                    ->update(['is_default' => false, 'updated_by' => Auth::id()]);
            }

            DB::commit();

            return $jpa->fresh([
                'client',
                'addresses',
                'creator',
                'updater',
            ]);
        } catch (\Throwable $th) {
            DB::rollBack();
            throw $th;
        }
    }

    public function boolean(Request $request)
    {
        $response = new Response();
        DB::beginTransaction();
        try {
            $network = ClientDistributionNetwork::findOrFail($request->id);
            $field = (string)$request->field;
            $value = $request->value;

            if (!in_array($field, ['is_default', 'status'], true)) {
                throw new \Exception('Campo no permitido');
            }

            $payload = [
                $field => $this->toBoolean($value),
                'updated_by' => Auth::id(),
            ];
            $network->update($payload);

            if ($field === 'is_default' && $this->toBoolean($value)) {
                ClientDistributionNetwork::where('client_id', $network->client_id)
                    ->where('id', '!=', $network->id)
                    ->update(['is_default' => false, 'updated_by' => Auth::id()]);
            }

            DB::commit();
            $response->status = 200;
            $response->message = 'Operacion correcta';
        } catch (\Throwable $th) {
            DB::rollBack();
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function status(Request $request)
    {
        $response = new Response();
        DB::beginTransaction();
        try {
            $network = ClientDistributionNetwork::findOrFail($request->id);
            $nextStatus = $request->status ? 0 : 1;

            $network->update([
                'status' => $nextStatus,
                'updated_by' => Auth::id(),
            ]);

            ClientDeliveryAddress::where('client_distribution_network_id', $network->id)->update([
                'status' => $nextStatus,
                'updated_by' => Auth::id(),
            ]);

            DB::commit();
            $response->status = 200;
            $response->message = 'Operacion correcta';
        } catch (\Throwable $th) {
            DB::rollBack();
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function delete(Request $request, string $id)
    {
        $response = new Response();
        DB::beginTransaction();
        try {
            $network = ClientDistributionNetwork::findOrFail($id);
            $network->update([
                'status' => null,
                'updated_by' => Auth::id(),
            ]);

            ClientDeliveryAddress::where('client_distribution_network_id', $network->id)->update([
                'status' => null,
                'updated_by' => Auth::id(),
            ]);

            DB::commit();
            $response->status = 200;
            $response->message = 'Operacion correcta';
        } catch (\Throwable $th) {
            DB::rollBack();
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    private function toBoolean($value): bool
    {
        if (is_bool($value)) return $value;
        if (is_numeric($value)) return (int)$value !== 0;

        $normalized = mb_strtolower(trim((string)$value));
        return in_array($normalized, ['1', 'true', 'si', 'yes', 'y', 'activo', 'activa', 'on'], true);
    }

    private function toNullableDecimal($value): ?float
    {
        if ($value === null) return null;
        $text = trim((string)$value);
        if ($text === '') return null;
        if (!is_numeric($text)) throw new \Exception("Valor numerico invalido: {$value}");
        return (float)$text;
    }

    private function nextCode(): string
    {
        $next = 1;
        $latest = ClientDistributionNetwork::query()->latest('id')->value('code');
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) {
            $next = ((int)$matches[1]) + 1;
        }
        return 'RDC-' . str_pad((string)$next, 6, '0', STR_PAD_LEFT);
    }
}
