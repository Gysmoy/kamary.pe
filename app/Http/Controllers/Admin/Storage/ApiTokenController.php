<?php

namespace App\Http\Controllers\Admin\Storage;

use App\Http\Classes\dxResponse;
use App\Http\Controllers\BasicController;
use App\Models\dxDataGrid;
use App\Models\StorageApiToken;
use App\Support\StorageScope;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use SoDe\Extend\Response;

class ApiTokenController extends BasicController
{
    public $model = StorageApiToken::class;
    public $reactView = 'Admin/StorageApiTokens';
    public $prefix4filter = 'storage_api_tokens';

    private const DEFAULT_ABILITIES = ['stock:read', 'orders:read', 'orders:write'];

    public function setReactViewProperties(Request $request)
    {
        return [
            'moduleTitle' => 'Tokens acceso API',
            'requiredPermission' => 'storage-api-tokens',
            'clients' => $this->clientOptions(),
            'abilityOptions' => $this->abilityOptions(),
            'apiDocsUrl' => url('/api-docs/storage'),
        ];
    }

    public function paginate(Request $request): HttpResponse|ResponseFactory
    {
        $response = new dxResponse();

        try {
            $instance = $this->tokenRowsQuery();

            if ($request->group != null) {
                [$grouping] = $request->group;
                $selector = $grouping['selector'];
                $instance = $instance->select(DB::raw("{$selector} AS `key`"))->groupBy($selector);
            }

            if ($request->filter) {
                $instance->where(function ($query) use ($request) {
                    dxDataGrid::filter($query, $request->filter ?? [], false, null, []);
                });
            }

            if ($request->group == null) {
                if ($request->sort != null) {
                    foreach ($request->sort as $sorting) {
                        $instance->orderBy($sorting['selector'], $sorting['desc'] ? 'DESC' : 'ASC');
                    }
                } else {
                    $instance->orderBy('id', 'DESC');
                }
            }

            $totalCount = 0;
            if ($request->requireTotalCount) {
                $instance4count = clone $instance;
                $instance4count->groups = null;
                $instance4count->orders = null;
                $totalCount = $request->group != null
                    ? $instance4count->distinct()->count(DB::raw($selector))
                    : $instance4count->count();
            }

            $rows = $request->isLoadingAll
                ? $instance->get()
                : $instance->skip($request->skip ?? 0)->take($request->take ?? 10)->get();

            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = $rows->map(fn($row) => $this->formatTokenRow($row))->values();
            $response->summary = [];
            $response->totalCount = $totalCount;
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage() . ' Ln.' . $th->getLine();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function save(Request $request): HttpResponse|ResponseFactory
    {
        $response = new Response();

        try {
            $data = $this->validatedPayload($request);
            $client = StorageScope::assertClient((int)$data['client_id']);
            $abilities = $this->normalizeAbilities($data['abilities'] ?? []);
            $expiresAt = $this->normalizeExpiresAt($data['expires_at'] ?? null);

            $token = null;
            $plainToken = null;
            $id = (int)($data['id'] ?? 0);
            if ($id > 0) {
                $token = StorageApiToken::query()->whereNotNull('status')->findOrFail($id);
                if ((int)$token->client_id !== (int)$client->id) {
                    throw new \Exception('No se puede cambiar el cliente de un token existente. Crea uno nuevo para otro cliente.');
                }
            } else {
                $plainToken = StorageApiToken::makePlainToken();
                $token = new StorageApiToken();
                $token->client_id = $client->id;
                $token->token_prefix = substr($plainToken, 0, 12);
                $token->token_hash = StorageApiToken::hashToken($plainToken);
                $token->encrypted_token = StorageApiToken::encryptedToken($plainToken);
                $token->created_by = Auth::id();
                $token->status = true;
            }

            $token->fill([
                'name' => trim((string)($data['name'] ?? '')) ?: 'Integracion externa',
                'abilities' => $abilities,
                'expires_at' => $expiresAt,
                'status' => array_key_exists('status', $data) ? (bool)$data['status'] : (bool)($token->status ?? true),
                'updated_by' => Auth::id(),
            ]);
            $token->save();

            $response->status = 200;
            $response->message = $plainToken ? 'Token generado correctamente' : 'Token actualizado correctamente';
            $response->data = [
                'token' => $plainToken,
                'record' => $this->tokenResponse($token->fresh('client')),
            ];
        } catch (ValidationException $th) {
            $response->status = 422;
            $response->message = 'Payload invalido';
            $response->data = ['errors' => $th->errors()];
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function reveal(Request $request, string $id): HttpResponse|ResponseFactory
    {
        $response = new Response();

        try {
            $token = StorageApiToken::query()
                ->whereNotNull('status')
                ->with('client')
                ->findOrFail($id);

            $plainToken = $token->plainToken();
            if (!$plainToken) {
                throw new \Exception('Este token fue creado antes de habilitar visualizacion. Renuevalo para poder verlo.');
            }

            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = [
                'token' => $plainToken,
                'record' => $this->tokenResponse($token),
            ];
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function renew(Request $request, string $id): HttpResponse|ResponseFactory
    {
        $response = new Response();

        try {
            $token = StorageApiToken::query()
                ->whereNotNull('status')
                ->with('client')
                ->findOrFail($id);

            StorageScope::assertClient((int)$token->client_id);

            $plainToken = StorageApiToken::makePlainToken();
            $token->forceFill([
                'token_prefix' => substr($plainToken, 0, 12),
                'token_hash' => StorageApiToken::hashToken($plainToken),
                'encrypted_token' => StorageApiToken::encryptedToken($plainToken),
                'last_used_at' => null,
                'status' => true,
                'updated_by' => Auth::id(),
            ])->save();

            $response->status = 200;
            $response->message = 'Token renovado correctamente';
            $response->data = [
                'token' => $plainToken,
                'record' => $this->tokenResponse($token->fresh('client')),
            ];
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function boolean(Request $request)
    {
        $response = new Response();
        try {
            $field = $this->allowedBooleanFieldFromRequest($request);
            if ($field !== 'status') throw new \Exception('Campo no permitido');

            $updated = StorageApiToken::query()
                ->whereNotNull('status')
                ->whereKey($request->id)
                ->update([
                    'status' => (bool)$request->value,
                    'updated_by' => Auth::id(),
                ]);
            if (!$updated) throw new \Exception('Token no encontrado');

            $response->status = 200;
            $response->message = 'Operacion correcta';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function delete(Request $request, string $id)
    {
        $response = new Response();

        try {
            $updated = StorageApiToken::query()
                ->whereNotNull('status')
                ->whereKey($id)
                ->update([
                    'status' => null,
                    'updated_by' => Auth::id(),
                ]);
            if (!$updated) throw new \Exception('No se ha eliminado ningun token');

            $response->status = 200;
            $response->message = 'Token eliminado correctamente';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    private function tokenRowsQuery()
    {
        $base = DB::table('storage_api_tokens as token')
            ->join('clients as client', 'client.id', '=', 'token.client_id')
            ->leftJoin('users as creator', 'creator.id', '=', 'token.created_by')
            ->leftJoin('users as updater', 'updater.id', '=', 'token.updated_by')
            ->whereNotNull('token.status')
            ->selectRaw("
                token.id,
                token.client_id,
                COALESCE(client.document_number, '') as client_document_number,
                COALESCE(client.full_name, '') as client_name,
                token.name,
                token.token_prefix,
                token.abilities,
                token.last_used_at,
                token.expires_at,
                token.status,
                token.created_at,
                token.updated_at,
                CASE WHEN token.encrypted_token IS NULL OR token.encrypted_token = '' THEN 0 ELSE 1 END as can_reveal,
                TRIM(CONCAT(COALESCE(creator.name, ''), ' ', COALESCE(creator.lastname, ''))) AS creator_label,
                TRIM(CONCAT(COALESCE(updater.name, ''), ' ', COALESCE(updater.lastname, ''))) AS updater_label
            ");

        return DB::query()->fromSub($base, 'storage_api_tokens');
    }

    private function formatTokenRow($row): array
    {
        $abilities = $this->decodeAbilities($row->abilities ?? null);
        $prefix = trim((string)($row->token_prefix ?? ''));

        return [
            'id' => (int)$row->id,
            'client_id' => (int)$row->client_id,
            'client_document_number' => (string)$row->client_document_number,
            'client_name' => (string)$row->client_name,
            'client_label' => trim(($row->client_document_number ? "{$row->client_document_number} | " : '') . $row->client_name),
            'name' => (string)$row->name,
            'token_prefix' => $prefix,
            'token_mask' => $prefix ? "{$prefix}..." : '-',
            'abilities' => $abilities,
            'abilities_label' => implode(', ', $abilities),
            'last_used_at' => $row->last_used_at,
            'expires_at' => $row->expires_at,
            'status' => (bool)$row->status,
            'created_at' => $row->created_at,
            'updated_at' => $row->updated_at,
            'can_reveal' => (bool)$row->can_reveal,
            'creator_label' => (string)$row->creator_label,
            'updater_label' => (string)$row->updater_label,
        ];
    }

    private function validatedPayload(Request $request): array
    {
        $validator = Validator::make($request->all(), [
            'id' => ['nullable', 'integer'],
            'client_id' => ['required', 'integer'],
            'name' => ['nullable', 'string', 'max:255'],
            'abilities' => ['nullable', 'array'],
            'abilities.*' => ['string', 'max:40'],
            'expires_at' => ['nullable', 'date'],
            'status' => ['nullable', 'boolean'],
        ]);

        if ($validator->fails()) throw new ValidationException($validator);

        return $validator->validated();
    }

    private function normalizeAbilities(array $abilities): array
    {
        $allowed = array_column($this->abilityOptions(), 'value');
        $normalized = array_values(array_unique(array_filter(array_map(
            fn($ability) => trim((string)$ability),
            $abilities
        ))));

        if (in_array('*', $normalized, true)) return ['*'];

        $normalized = array_values(array_filter($normalized, fn($ability) => in_array($ability, $allowed, true)));

        return count($normalized) ? $normalized : self::DEFAULT_ABILITIES;
    }

    private function normalizeExpiresAt($value): ?string
    {
        $text = trim((string)($value ?? ''));
        if ($text === '') return null;
        $timestamp = strtotime($text);
        if ($timestamp === false) throw new \Exception('Fecha de expiracion invalida');

        return date('Y-m-d 23:59:59', $timestamp);
    }

    private function decodeAbilities($value): array
    {
        if (is_array($value)) return $value;
        $decoded = json_decode((string)$value, true);
        return is_array($decoded) && count($decoded) ? $decoded : self::DEFAULT_ABILITIES;
    }

    private function tokenResponse(StorageApiToken $token): array
    {
        return [
            'id' => $token->id,
            'client_id' => $token->client_id,
            'client_label' => $token->client ? trim(($token->client->document_number ? "{$token->client->document_number} | " : '') . $token->client->full_name) : '',
            'name' => $token->name,
            'token_prefix' => $token->token_prefix,
            'abilities' => $token->abilities ?: self::DEFAULT_ABILITIES,
            'expires_at' => optional($token->expires_at)->format('Y-m-d'),
            'status' => (bool)$token->status,
        ];
    }

    private function clientOptions(): array
    {
        return StorageScope::clientQuery()
            ->orderBy('full_name')
            ->get(['id', 'document_type', 'document_number', 'full_name'])
            ->map(fn($client) => [
                'id' => $client->id,
                'document_type' => $client->document_type,
                'document_number' => $client->document_number,
                'full_name' => $client->full_name,
                'label' => trim(($client->document_number ? "{$client->document_number} | " : '') . $client->full_name),
            ])
            ->values()
            ->all();
    }

    private function abilityOptions(): array
    {
        return [
            ['value' => 'stock:read', 'label' => 'Consultar stock'],
            ['value' => 'orders:read', 'label' => 'Consultar pedidos'],
            ['value' => 'orders:write', 'label' => 'Crear pedidos'],
            ['value' => '*', 'label' => 'Acceso completo'],
        ];
    }
}
