<?php

namespace App\Http\Controllers\External;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Client;
use App\Models\ExitNote;
use App\Models\ExitNoteItem;
use App\Models\IntegrationLog;
use App\Models\StorageApiToken;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\StockService;
use App\Support\BusinessScope;
use App\Support\StorageScope;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class StorageApiController extends Controller
{
    private const PROVIDER = 'storage_client_api';

    public function me(Request $request): JsonResponse
    {
        $token = $this->token($request);
        $client = $this->client($request);

        return $this->success([
            'client' => $this->clientPayload($client),
            'token' => [
                'name' => $token->name,
                'prefix' => $token->token_prefix,
                'abilities' => $token->abilities ?: ['stock:read', 'orders:read', 'orders:write'],
                'expires_at' => optional($token->expires_at)->toIso8601String(),
            ],
        ]);
    }

    public function stock(Request $request, StockService $stockService): JsonResponse
    {
        try {
            $client = $this->client($request);
            $warehouseId = $this->nullableInt($request->query('warehouse_id'));
            $search = trim((string) ($request->query('q', $request->query('search', ''))));

            if ($warehouseId) $this->assertStorageWarehouse($warehouseId);

            $rows = $stockService->availableStorageStockRows(
                $warehouseId,
                $search,
                0,
                BusinessScope::KAMARY_MEDICALS,
                (int) $client->id,
                'storage'
            );

            $rows = $this->filterStockRows($rows, $request);
            $page = max(1, (int) $request->query('page', 1));
            $perPage = min(100, max(1, (int) $request->query('per_page', 50)));
            $total = count($rows);
            $items = array_slice($rows, ($page - 1) * $perPage, $perPage);

            return $this->success([
                'items' => array_map(fn(array $row) => $this->stockRowPayload($row), $items),
                'pagination' => [
                    'page' => $page,
                    'per_page' => $perPage,
                    'total' => $total,
                    'last_page' => (int) ceil($total / $perPage),
                ],
            ]);
        } catch (\Throwable $th) {
            return $this->error($th->getMessage());
        }
    }

    public function createOrder(Request $request, StockService $stockService): JsonResponse
    {
        $client = $this->client($request);
        $token = $this->token($request);
        $payload = $request->all();
        $externalReference = trim((string) ($payload['external_reference'] ?? ''));
        $source = $this->externalSource($payload['source'] ?? null);

        $log = IntegrationLog::create([
            'provider' => self::PROVIDER,
            'direction' => 'inbound',
            'event_type' => 'storage_order_create',
            'external_id' => $externalReference ?: null,
            'status' => 'received',
            'request_payload' => $payload,
        ]);

        try {
            $validator = Validator::make($payload, [
                'external_reference' => ['required', 'string', 'max:120'],
                'source' => ['nullable', 'string', 'max:60'],
                'warehouse_id' => ['nullable', 'integer'],
                'document_date' => ['nullable', 'date'],
                'exit_date' => ['nullable', 'date'],
                'observations' => ['nullable', 'string', 'max:2000'],
                'items' => ['required', 'array', 'min:1'],
                'items.*.article_id' => ['nullable', 'integer'],
                'items.*.sku' => ['nullable', 'string', 'max:60'],
                'items.*.article_code' => ['nullable', 'string', 'max:60'],
                'items.*.warehouse_id' => ['nullable', 'integer'],
                'items.*.lot' => ['required', 'string', 'max:80'],
                'items.*.expiration_date' => ['nullable', 'date'],
                'items.*.location' => ['nullable', 'string', 'max:255'],
                'items.*.destination_location' => ['nullable', 'string', 'max:255'],
                'items.*.quantity' => ['required', 'numeric', 'gt:0'],
            ]);

            if ($validator->fails()) {
                throw new ValidationException($validator);
            }

            $lockName = 'storage-api-order:' . $client->id . ':' . sha1($source . '|' . $externalReference);
            $result = Cache::lock($lockName, 30)->block(10, function () use ($client, $token, $payload, $source, $stockService) {
                return DB::transaction(fn() => $this->createExitNoteFromPayload($client, $token, $payload, $source, $stockService));
            });

            $log->update([
                'status' => $result['idempotent'] ? 'already_processed' : 'processed',
                'response_payload' => $result,
                'http_status' => $result['idempotent'] ? 200 : 201,
                'processed_at' => now(),
            ]);

            return $this->success($result, $result['idempotent'] ? 200 : 201);
        } catch (ValidationException $th) {
            $log->update([
                'status' => 'error',
                'message' => 'Payload invalido',
                'response_payload' => ['errors' => $th->errors()],
                'http_status' => 422,
                'processed_at' => now(),
            ]);

            return $this->error('Payload invalido.', 422, $th->errors());
        } catch (\Throwable $th) {
            $log->update([
                'status' => 'error',
                'message' => $th->getMessage(),
                'http_status' => 422,
                'processed_at' => now(),
            ]);

            return $this->error($th->getMessage());
        }
    }

    public function order(Request $request, string $reference): JsonResponse
    {
        try {
            $client = $this->client($request);
            $source = $this->externalSource($request->query('source'));
            $reference = trim(urldecode($reference));
            if ($reference === '') throw new \InvalidArgumentException('Referencia externa requerida.');

            $exitNote = ExitNote::with([
                'warehouse:id,name',
                'items:id,exit_note_id,batch_code,article_id,warehouse_id,stock,expiration_date,location,destination_location,quantity,total,status',
                'items.article:id,code,name,health_registration,unit_id',
                'items.article.unit:id,name,symbol',
                'items.warehouse:id,name',
            ])
                ->where('client_id', $client->id)
                ->where('external_source', $source)
                ->where('external_reference', $reference)
                ->first();

            if (!$exitNote) {
                return $this->error('Pedido externo no encontrado.', 404);
            }

            return $this->success($this->orderPayload($exitNote, false));
        } catch (\Throwable $th) {
            return $this->error($th->getMessage());
        }
    }

    private function createExitNoteFromPayload(Client $client, StorageApiToken $token, array $payload, string $source, StockService $stockService): array
    {
        $externalReference = trim((string) $payload['external_reference']);
        $existing = ExitNote::with([
            'warehouse:id,name',
            'items:id,exit_note_id,batch_code,article_id,warehouse_id,stock,expiration_date,location,destination_location,quantity,total,status',
            'items.article:id,code,name,health_registration,unit_id',
            'items.article.unit:id,name,symbol',
            'items.warehouse:id,name',
        ])
            ->where('client_id', $client->id)
            ->where('external_source', $source)
            ->where('external_reference', $externalReference)
            ->first();

        if ($existing) {
            return $this->orderPayload($existing, true);
        }

        $business = BusinessScope::businessForKey(BusinessScope::KAMARY_MEDICALS);
        if (!$business) {
            throw new \RuntimeException('No se encontro la empresa Kamary Medicals para almacenamiento.');
        }

        $warehouseId = $this->nullableInt($payload['warehouse_id'] ?? null);
        $items = $this->normalizeOrderItems($payload['items'], $client, $warehouseId, (int) $business->id, $stockService);
        if (!$warehouseId) {
            $warehouseId = (int) $items[0]['warehouse_id'];
        }

        $warehouse = $this->assertStorageWarehouse($warehouseId);
        $branchId = BusinessScope::branchIdFromWarehouse($business, $warehouse);
        foreach ($items as $item) {
            $itemWarehouse = Warehouse::findOrFail($item['warehouse_id']);
            BusinessScope::branchIdFromWarehouse($business, $itemWarehouse, $branchId);
        }
        $systemUserId = $this->systemUserId();
        $date = $this->date($payload['exit_date'] ?? null) ?: now()->toDateString();
        $documentDate = $this->date($payload['document_date'] ?? null) ?: $date;

        try {
            $exitNote = ExitNote::create([
                'business_id' => $business->id,
                'business_branch_id' => $branchId,
                'warehouse_id' => $warehouse->id,
                'client_id' => $client->id,
                'client_name' => $this->clientDisplayName($client),
                'motives' => ['Pedido externo'],
                'exit_date' => $date,
                'document_type' => 'Pedido externo',
                'document_series' => 'API',
                'document_sequence' => mb_substr($externalReference, 0, 40),
                'document_date' => $documentDate,
                'observations' => $this->observations($payload),
                'status' => true,
                'exit_status' => 'approved',
                'external_source' => $source,
                'external_reference' => $externalReference,
                'external_payload' => $payload,
                'storage_api_token_id' => $token->id,
                'created_by' => $systemUserId,
                'updated_by' => $systemUserId,
            ]);
        } catch (QueryException $th) {
            $duplicate = ExitNote::with(['warehouse:id,name', 'items.article.unit', 'items.warehouse'])
                ->where('client_id', $client->id)
                ->where('external_source', $source)
                ->where('external_reference', $externalReference)
                ->first();
            if ($duplicate) return $this->orderPayload($duplicate, true);
            throw $th;
        }

        $exitNote->code = 'NS' . str_pad((string) $exitNote->id, 5, '0', STR_PAD_LEFT);
        $exitNote->save();

        foreach ($items as $item) {
            ExitNoteItem::create([
                'exit_note_id' => $exitNote->id,
                'batch_code' => $item['lot'],
                'article_id' => $item['article_id'],
                'warehouse_id' => $item['warehouse_id'],
                'stock' => $item['stock'],
                'expiration_date' => $item['expiration_date'],
                'location' => $item['location'] ?: null,
                'destination_location' => $item['destination_location'] ?: null,
                'quantity' => $item['quantity'],
                'total' => $item['quantity'],
                'status' => true,
            ]);
        }

        $exitNote->load([
            'warehouse:id,name',
            'items:id,exit_note_id,batch_code,article_id,warehouse_id,stock,expiration_date,location,destination_location,quantity,total,status',
            'items.article:id,code,name,health_registration,unit_id',
            'items.article.unit:id,name,symbol',
            'items.warehouse:id,name',
        ]);

        return $this->orderPayload($exitNote, false);
    }

    private function normalizeOrderItems(array $rawItems, Client $client, ?int $defaultWarehouseId, int $businessId, StockService $stockService): array
    {
        $items = [];
        $reservedStock = [];

        foreach ($rawItems as $index => $rawItem) {
            if (!is_array($rawItem)) continue;

            $article = $this->resolveClientArticle($rawItem, $client);
            $warehouseId = $this->nullableInt($rawItem['warehouse_id'] ?? null) ?: $defaultWarehouseId;
            if (!$warehouseId) {
                throw new \InvalidArgumentException("items.{$index}.warehouse_id es obligatorio cuando no se envia warehouse_id general.");
            }
            $this->assertStorageWarehouse($warehouseId);

            $quantity = $this->decimal($rawItem['quantity'] ?? null);
            $lot = trim((string) ($rawItem['lot'] ?? ''));
            $expirationDate = $this->date($rawItem['expiration_date'] ?? null);
            $location = trim((string) ($rawItem['location'] ?? ''));

            $availableStock = $stockService->getAvailableStockByStorageKey(
                (int) $article->id,
                $warehouseId,
                $lot,
                $expirationDate,
                $location,
                0,
                $businessId,
                false,
                (int) $client->id
            );

            $stockKey = implode('|', [
                $article->id,
                $warehouseId,
                mb_strtolower($lot),
                $expirationDate ?: '',
                mb_strtolower($location),
            ]);
            $alreadyReserved = (float) ($reservedStock[$stockKey] ?? 0);
            $remaining = round($availableStock - $alreadyReserved, 3);

            if ($quantity > $remaining + 0.0001) {
                throw new \InvalidArgumentException("Stock insuficiente para SKU {$article->code}, lote {$lot}. Disponible: {$remaining}");
            }

            $reservedStock[$stockKey] = round($alreadyReserved + $quantity, 3);
            $items[] = [
                'article_id' => (int) $article->id,
                'warehouse_id' => $warehouseId,
                'lot' => $lot,
                'expiration_date' => $expirationDate,
                'location' => $location,
                'destination_location' => trim((string) ($rawItem['destination_location'] ?? '')),
                'quantity' => $quantity,
                'stock' => $remaining,
            ];
        }

        if (empty($items)) {
            throw new \InvalidArgumentException('Debes enviar al menos un item valido.');
        }

        return $items;
    }

    private function resolveClientArticle(array $item, Client $client): Article
    {
        $articleId = $this->nullableInt($item['article_id'] ?? null);
        if ($articleId) {
            return StorageScope::assertArticleBelongsToClient($articleId, (int) $client->id);
        }

        $sku = trim((string) ($item['sku'] ?? $item['article_code'] ?? ''));
        if ($sku === '') {
            throw new \InvalidArgumentException('Cada item debe tener article_id o sku.');
        }

        $article = StorageScope::articleQuery()
            ->where('client_id', $client->id)
            ->whereNotNull('status')
            ->whereRaw('LOWER(code) = ?', [mb_strtolower($sku)])
            ->first();

        if (!$article) {
            throw new \InvalidArgumentException("SKU {$sku} no pertenece al cliente de almacenamiento.");
        }

        return $article;
    }

    private function assertStorageWarehouse(int $warehouseId): Warehouse
    {
        $business = BusinessScope::businessForKey(BusinessScope::KAMARY_MEDICALS);
        if (!$business) throw new \RuntimeException('No se encontro la empresa Kamary Medicals.');

        $warehouse = Warehouse::with('branch.business')
            ->whereKey($warehouseId)
            ->whereNotNull('status')
            ->first();

        if (!$warehouse) throw new \InvalidArgumentException('Almacen no encontrado.');

        BusinessScope::branchIdFromWarehouse($business, $warehouse);
        return $warehouse;
    }

    private function filterStockRows(array $rows, Request $request): array
    {
        $sku = mb_strtolower(trim((string) ($request->query('sku', $request->query('article_code', '')))));
        $lot = mb_strtolower(trim((string) $request->query('lot', '')));
        $location = mb_strtolower(trim((string) $request->query('location', '')));

        return array_values(array_filter($rows, function (array $row) use ($sku, $lot, $location) {
            if ($sku !== '' && mb_strtolower((string) $row['article_code']) !== $sku) return false;
            if ($lot !== '' && mb_strtolower((string) $row['lot']) !== $lot) return false;
            if ($location !== '' && mb_strtolower((string) $row['location']) !== $location) return false;
            return true;
        }));
    }

    private function stockRowPayload(array $row): array
    {
        return [
            'article_id' => $row['article_id'],
            'sku' => $row['article_code'],
            'name' => $row['article_name'],
            'health_registration' => $row['health_registration'],
            'laboratory' => $row['laboratory_name'],
            'active_principle' => $row['principle_name'],
            'unit' => $row['unit_label'],
            'warehouse' => [
                'id' => $row['warehouse_id'],
                'name' => $row['warehouse_name'],
            ],
            'lot' => $row['lot'],
            'expiration_date' => $row['expiration_date'] ?: null,
            'location' => $row['location'],
            'temperature_range' => $row['temperature_range'],
            'available_stock' => $row['stock'],
        ];
    }

    private function orderPayload(ExitNote $exitNote, bool $idempotent): array
    {
        return [
            'idempotent' => $idempotent,
            'order' => [
                'id' => $exitNote->id,
                'code' => $exitNote->code,
                'external_reference' => $exitNote->external_reference,
                'source' => $exitNote->external_source,
                'status' => $exitNote->exit_status,
                'exit_date' => optional($exitNote->exit_date)->format('Y-m-d'),
                'document' => [
                    'type' => $exitNote->document_type,
                    'series' => $exitNote->document_series,
                    'sequence' => $exitNote->document_sequence,
                    'date' => optional($exitNote->document_date)->format('Y-m-d'),
                ],
                'warehouse' => [
                    'id' => $exitNote->warehouse_id,
                    'name' => $exitNote->warehouse?->name,
                ],
                'items' => $exitNote->items->map(function (ExitNoteItem $item) {
                    return [
                        'article_id' => $item->article_id,
                        'sku' => $item->article?->code,
                        'name' => $item->article?->name,
                        'unit' => $item->article?->unit?->symbol ?: $item->article?->unit?->name,
                        'warehouse' => [
                            'id' => $item->warehouse_id,
                            'name' => $item->warehouse?->name,
                        ],
                        'lot' => $item->batch_code,
                        'expiration_date' => optional($item->expiration_date)->format('Y-m-d'),
                        'location' => $item->location,
                        'destination_location' => $item->destination_location,
                        'quantity' => (float) $item->quantity,
                    ];
                })->values()->all(),
                'created_at' => optional($exitNote->created_at)->toIso8601String(),
            ],
        ];
    }

    private function observations(array $payload): ?string
    {
        $observations = trim((string) ($payload['observations'] ?? ''));
        $reference = trim((string) ($payload['external_reference'] ?? ''));
        $lines = array_filter([
            "Pedido externo: {$reference}",
            $observations,
        ]);

        return count($lines) ? implode("\n", $lines) : null;
    }

    private function token(Request $request): StorageApiToken
    {
        return $request->attributes->get('storage_api_token');
    }

    private function client(Request $request): Client
    {
        return $request->attributes->get('storage_api_client');
    }

    private function clientPayload(Client $client): array
    {
        return [
            'id' => $client->id,
            'document_type' => $client->document_type,
            'document_number' => $client->document_number,
            'full_name' => $client->full_name,
        ];
    }

    private function clientDisplayName(Client $client): string
    {
        return trim(($client->document_number ? "{$client->document_number} - " : '') . $client->full_name);
    }

    private function externalSource($value): string
    {
        $source = preg_replace('/[^A-Za-z0-9_.-]/', '_', trim((string) ($value ?: self::PROVIDER)));
        return substr($source ?: self::PROVIDER, 0, 60);
    }

    private function nullableInt($value): ?int
    {
        if ($value === null) return null;
        $text = trim((string) $value);
        if ($text === '') return null;
        if (!is_numeric($text)) return null;
        return (int) $text;
    }

    private function decimal($value): float
    {
        if ($value === null || $value === '') return 0;
        if (!is_numeric($value)) throw new \InvalidArgumentException("Valor numerico invalido: {$value}");
        return (float) $value;
    }

    private function date($value): ?string
    {
        $text = trim((string) ($value ?? ''));
        if ($text === '') return null;
        $timestamp = strtotime($text);
        if ($timestamp === false) throw new \InvalidArgumentException("Fecha invalida: {$value}");
        return date('Y-m-d', $timestamp);
    }

    private function systemUserId(): ?int
    {
        $id = (int) config('integrations.storage_client_api.system_user_id', 1);
        return $id > 0 && User::whereKey($id)->exists() ? $id : null;
    }

    private function success(array $data, int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Operacion correcta',
            'data' => $data,
        ], $status);
    }

    private function error(string $message, int $status = 422, ?array $errors = null): JsonResponse
    {
        return response()->json(array_filter([
            'success' => false,
            'message' => $message,
            'errors' => $errors,
        ], fn($value) => $value !== null), $status);
    }
}
