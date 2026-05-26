<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\Article;
use App\Models\Client;
use App\Models\ExitNote;
use App\Models\ExitNoteItem;
use App\Models\Warehouse;
use App\Services\StockService;
use App\Support\BusinessScope;
use App\Support\StorageScope;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use SoDe\Extend\Response;

class ExitNoteController extends BasicController
{
    public $model = ExitNote::class;
    public $reactView = 'Admin/ExitNotes';
    public $prefix4filter = 'exit_notes';

    private array $itemsPayload = [];

    public function setPaginationInstance(string $model)
    {
        $query = $model::select('exit_notes.*')
            ->with([
                'business:id,name',
                'branch:id,business_id,name',
                'warehouse:id,name',
                'client:id,document_number,full_name',
                'items:id,exit_note_id,batch_code,article_id,warehouse_id,stock,expiration_date,location,destination_location,quantity,total,status',
                'items.article:id,code,name,health_registration,laboratory_id,active_principle_id,unit_id',
                'items.article.laboratory:id,name',
                'items.article.activePrinciple:id,name',
                'items.article.unit:id,name,symbol',
                'items.warehouse:id,name',
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ])
            ->join('users as creator', 'creator.id', '=', 'exit_notes.created_by')
            ->join('users as updater', 'updater.id', '=', 'exit_notes.updated_by');

        $scopeKey = BusinessScope::scopedKeyForRequest(request());
        $query->whereHas('business', function ($business) use ($scopeKey) {
            $business->whereIn('business_key', BusinessScope::fixedKeys());
            if ($scopeKey) $business->where('business_key', $scopeKey);
        });
        if ($this->isStorageRequest(request())) {
            $query->whereHas('client', fn($client) => StorageScope::applyClientScope($client, 'clients'));
        }

        return $query;
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $userId = Auth::id();

        $businessId = $body['business_id'] ?? null;
        $branchId = $body['business_branch_id'] ?? null;
        $warehouseId = $body['warehouse_id'] ?? null;
        $isStorage = $this->isStorageRequest($request);
        $clientId = $this->normalizeClientId($body['client_id'] ?? null);
        $client = null;
        if ($clientId) {
            $client = Client::find($clientId);
            if (!$client && strlen((string)$clientId) >= 8) {
                $client = Client::where('document_number', (string)$clientId)->first();
                $clientId = $client?->id;
            }
        }
        if (!$client) {
            $client = $this->findClientFromPayload($body);
            $clientId = $client?->id;
        }

        if (!$businessId) throw new \Exception('La empresa es obligatoria');
        if (!$warehouseId) throw new \Exception('El almacen es obligatorio');
        if ($isStorage) {
            if (!$clientId) throw new \Exception('El cliente es obligatorio');
            if (trim((string)($body['exit_date'] ?? '')) === '') throw new \Exception('La fecha de salida es obligatoria');
            if (trim((string)($body['document_type'] ?? '')) === '') throw new \Exception('El tipo de documento es obligatorio');
            if (trim((string)($body['document_series'] ?? '')) === '') throw new \Exception('La serie es obligatoria');
            if (trim((string)($body['document_sequence'] ?? '')) === '') throw new \Exception('La secuencia es obligatoria');
            if (trim((string)($body['document_date'] ?? '')) === '') throw new \Exception('La fecha de documento es obligatoria');
            $client = StorageScope::assertClient($clientId);
            $clientId = (int)$client->id;
            if (!empty($body['id'])) {
                $currentExit = $this->scopedExitNoteQuery($request)->whereKey($body['id'])->first();
                if (!$currentExit) throw new \Exception('Nota de salida de almacenamiento no encontrada');
                if ($currentExit && (int)$currentExit->client_id !== $clientId) {
                    throw new \Exception('No se puede cambiar el cliente de una nota de salida de almacenamiento');
                }
            }
        }

        $business = BusinessScope::findFixedBusinessForRequest($businessId, $request);
        $warehouse = Warehouse::findOrFail($warehouseId);

        $body['business_branch_id'] = BusinessScope::branchIdFromWarehouse($business, $warehouse, $branchId);
        $body['client_id'] = $clientId;
        unset($body['client_document_number']);

        $rawItems = $body['items'] ?? [];
        if (is_string($rawItems)) {
            $decoded = json_decode($rawItems, true);
            $rawItems = is_array($decoded) ? $decoded : [];
        }
        if (!is_array($rawItems)) $rawItems = [];
        $this->itemsPayload = $rawItems;
        unset($body['items']);

        $rawMotives = $body['motives'] ?? [];
        if (is_string($rawMotives)) {
            $decodedMotives = json_decode($rawMotives, true);
            if (is_array($decodedMotives)) $rawMotives = $decodedMotives;
            else if (trim($rawMotives) === '') $rawMotives = [];
            else $rawMotives = [trim($rawMotives)];
        }
        if (!is_array($rawMotives)) $rawMotives = [];
        $motives = [];
        foreach ($rawMotives as $motive) {
            $text = trim((string)$motive);
            if ($text !== '') $motives[] = $text;
        }
        $body['motives'] = count($motives) ? $motives : null;

        if (!isset($body['id']) || !$body['id']) {
            $body['created_by'] = $userId;
            $body['status'] = true;
            $body['exit_status'] = $isStorage ? 'pending' : 'approved';
        }
        $body['updated_by'] = $userId;
        $body['client_name'] = trim((string)($body['client_name'] ?? '')) ?: ($client ? trim(($client->document_number ? "{$client->document_number} - " : '') . $client->full_name) : null);
        $body['exit_date'] = trim((string)($body['exit_date'] ?? '')) ?: null;
        $body['document_type'] = trim((string)($body['document_type'] ?? '')) ?: null;
        $body['document_series'] = trim((string)($body['document_series'] ?? '')) ?: null;
        $body['document_sequence'] = trim((string)($body['document_sequence'] ?? '')) ?: null;
        $body['document_date'] = trim((string)($body['document_date'] ?? '')) ?: null;
        if (isset($body['exit_status'])) {
            $body['exit_status'] = $this->normalizeExitStatus($body['exit_status']);
        }
        $body['observations'] = trim((string)($body['observations'] ?? '')) ?: null;

        return $body;
    }

    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        DB::beginTransaction();
        try {
            if (!$jpa->code && Schema::hasColumn('exit_notes', 'code')) {
                $jpa->code = 'NS' . str_pad((string)$jpa->id, 5, '0', STR_PAD_LEFT);
                $jpa->save();
            }

            ExitNoteItem::where('exit_note_id', $jpa->id)->delete();

            $inserted = 0;
            $business = BusinessScope::findFixedBusiness($jpa->business_id);
            $isStorage = $this->isStorageRequest($request);
            $reservedStock = [];
            foreach ($this->itemsPayload as $item) {
                if (!is_array($item)) continue;

                $articleId = $item['article_id'] ?? null;
                if (!$articleId) throw new \Exception('Cada linea debe tener articulo');
                if ($isStorage) {
                    StorageScope::assertArticleBelongsToClient((int)$articleId, (int)$jpa->client_id);
                } else {
                    Article::findOrFail($articleId);
                }

                $warehouseId = $item['warehouse_id'] ?? $jpa->warehouse_id;
                if (!$warehouseId) throw new \Exception('Cada linea debe tener almacen');
                $itemWarehouse = Warehouse::findOrFail($warehouseId);
                BusinessScope::branchIdFromWarehouse($business, $itemWarehouse, $jpa->business_branch_id);

                $stock = $this->toNullableDecimal($item['stock'] ?? null) ?? 0;
                $quantity = $this->toNullableDecimal($item['quantity'] ?? null) ?? 0;
                $total = $this->toNullableDecimal($item['total'] ?? null) ?? 0;
                if ($quantity <= 0) throw new \Exception('La cantidad debe ser mayor a 0');

                $lot = trim((string)($item['batch_code'] ?? $item['lot'] ?? ''));
                $location = trim((string)($item['location'] ?? ''));

                $expirationDate = null;
                $rawExpirationDate = trim((string)($item['expiration_date'] ?? ''));
                if ($rawExpirationDate !== '') {
                    $timestamp = strtotime($rawExpirationDate);
                    if ($timestamp === false) throw new \Exception("Fecha de vencimiento invalida: {$rawExpirationDate}");
                    $expirationDate = date('Y-m-d', $timestamp);
                }

                if ($isStorage && $lot === '') throw new \Exception('Cada linea de salida debe tener lote');

                $hasStorageKey = $isStorage || ($lot !== '' && $expirationDate) || $location !== '';
                $availableStock = $hasStorageKey
                    ? app(StockService::class)->getAvailableStockByStorageKey((int)$articleId, (int)$warehouseId, $lot, $expirationDate, $location, (int)$jpa->id, (int)$jpa->business_id, !$isStorage, $isStorage ? (int)$jpa->client_id : null)
                    : $this->getAvailableStockByWarehouse((int)$articleId, (int)$warehouseId, (int)$jpa->id);
                $stockKey = $this->stockReservationKey((int)$articleId, (int)$warehouseId, $hasStorageKey ? $lot : '', $hasStorageKey ? $expirationDate : null, $hasStorageKey ? $location : '');
                $alreadyReserved = (float)($reservedStock[$stockKey] ?? 0);
                $remainingStock = round($availableStock - $alreadyReserved, 3);

                if ($quantity > $remainingStock + 0.0001) {
                    throw new \Exception("Stock insuficiente para el articulo {$articleId}, lote {$lot}. Disponible: {$remainingStock}");
                }
                $reservedStock[$stockKey] = round($alreadyReserved + $quantity, 3);

                ExitNoteItem::create([
                    'exit_note_id' => $jpa->id,
                    'batch_code' => $lot ?: null,
                    'article_id' => $articleId,
                    'warehouse_id' => $warehouseId,
                    'stock' => $availableStock,
                    'expiration_date' => $expirationDate,
                    'location' => $location ?: null,
                    'destination_location' => trim((string)($item['destination_location'] ?? '')) ?: null,
                    'quantity' => $quantity,
                    'total' => $total > 0 ? $total : $quantity,
                    'status' => isset($item['status']) ? (bool)$item['status'] : true,
                ]);
                $inserted++;
            }

            if ($inserted === 0) {
                throw new \Exception('Debes agregar al menos una linea en la nota de salida');
            }

            DB::commit();
        } catch (\Throwable $th) {
            DB::rollBack();
            throw $th;
        }
    }

    private function getAvailableStockByWarehouse(int $articleId, int $warehouseId, int $excludedExitNoteId = 0): float
    {
        return app(StockService::class)->getAvailableStockByWarehouse($articleId, $warehouseId, $excludedExitNoteId);
    }

    public function availableStock(Request $request): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            $warehouseId = $this->toNullableInt($request->input('warehouse_id'));
            $exitNoteId = $this->toNullableInt($request->input('exit_note_id')) ?? 0;
            $clientId = $this->toNullableInt($request->input('client_id'));
            $search = trim((string)$request->input('q', ''));

            if ($warehouseId) Warehouse::findOrFail($warehouseId);
            if (!$clientId) throw new \Exception('El cliente es obligatorio');
            StorageScope::assertClient($clientId);

            $businessKey = BusinessScope::scopedKeyForRequest($request) ?: BusinessScope::keyForPath($request->path());

            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = app(StockService::class)->availableStorageStockRows($warehouseId, $search, $exitNoteId, $businessKey, $clientId, 'storage');
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function branches(Request $request, string $businessId): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            $business = BusinessScope::findFixedBusinessForRequest($businessId, $request);
            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = $business->branches()->whereNotNull('status')->orderBy('name')->get(['id', 'business_id', 'name', 'status']);
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function get(Request $request, string $id)
    {
        $response = new Response();
        try {
            $jpa = $this->scopedExitNoteQuery($request)->with($this->with4get)->find($id);
            if (!$jpa) throw new \Exception('El registro que buscas no existe');
            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = $jpa;
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
            $data = [];
            $data[$request->field] = $request->value;
            $data['updated_by'] = Auth::id();
            $updated = $this->scopedExitNoteQuery($request)
                ->where($this->identifier, $request->id)
                ->update($data);
            if (!$updated) throw new \Exception('Nota de salida no encontrada en este modulo');
            $response->status = 200;
            $response->message = 'Operacion correcta';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function status(Request $request)
    {
        $response = new Response();
        try {
            $jpa = $this->scopedExitNoteQuery($request)
                ->with(['items:id,exit_note_id,batch_code,article_id,warehouse_id,expiration_date,location,quantity,status'])
                ->findOrFail($request->id);

            if ($request->has('exit_status')) {
                $nextStatus = $this->normalizeExitStatus($request->input('exit_status'));
                if ($nextStatus === 'approved') {
                    $this->assertExitStockAvailable($jpa, $this->isStorageRequest($request));
                }
                $jpa->update([
                    'exit_status' => $nextStatus,
                    'updated_by' => Auth::id(),
                ]);
                $response->status = 200;
                $response->message = 'Operacion correcta';
                return response($response->toArray(), $response->status);
            }

            $nextStatus = $request->status ? 0 : 1;
            if ((int)$nextStatus === 1) {
                $this->assertExitStockAvailable($jpa, $this->isStorageRequest($request));
            }

            $jpa->update([
                'status' => $nextStatus,
                'updated_by' => Auth::id(),
            ]);
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
            $updated = $this->scopedExitNoteQuery($request)
                ->where($this->identifier, $id)
                ->update([
                    'status' => null,
                    'updated_by' => Auth::id(),
                ]);
            if (!$updated) throw new \Exception('No se ha eliminado ningun registro');

            $response->status = 200;
            $response->message = 'Operacion correcta';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    private function scopedExitNoteQuery(Request $request)
    {
        return $this->model::query()
            ->when($this->isStorageRequest($request), function ($query) use ($request) {
                $scopeKey = BusinessScope::scopedKeyForRequest($request);
                $query
                    ->whereHas('client', fn($client) => StorageScope::applyClientScope($client, 'clients'))
                    ->whereHas('business', function ($business) use ($scopeKey) {
                        $business->whereIn('business_key', BusinessScope::fixedKeys());
                        if ($scopeKey) $business->where('business_key', $scopeKey);
                    });
            });
    }

    private function toNullableDecimal($value): ?float
    {
        if ($value === null) return null;
        $text = trim((string)$value);
        if ($text === '') return null;
        if (!is_numeric($text)) throw new \Exception("Valor numerico invalido: {$value}");
        return (float)$text;
    }

    private function normalizeClientId($value): ?int
    {
        if ($value === null) return null;

        $text = trim((string)$value);
        if ($text === '') return null;
        if (preg_match('/^client-(\d+)$/i', $text, $matches)) return (int)$matches[1];
        if (ctype_digit($text)) return (int)$text;

        return null;
    }

    private function findClientFromPayload(array $body): ?Client
    {
        $documentNumber = preg_replace('/\D+/', '', (string)($body['client_document_number'] ?? ''));
        $clientName = trim((string)($body['client_name'] ?? ''));

        if ($documentNumber === '') {
            $rawClientId = (string)($body['client_id'] ?? '');
            if (preg_match('/\b\d{8,11}\b/', $rawClientId, $matches)) {
                $documentNumber = $matches[0];
            }
        }

        if ($documentNumber === '' && $clientName !== '' && preg_match('/\b\d{8,11}\b/', $clientName, $matches)) {
            $documentNumber = $matches[0];
        }

        if ($documentNumber !== '') {
            $client = Client::where('document_number', $documentNumber)->first();
            if ($client) return $client;
        }

        if ($clientName === '') return null;

        $cleanName = trim(preg_replace('/^\s*\d{8,11}\s*[-|]\s*/', '', $clientName));
        return Client::query()
            ->where('full_name', $clientName)
            ->orWhere('full_name', $cleanName)
            ->first();
    }

    private function toNullableInt($value): ?int
    {
        if ($value === null) return null;
        $text = trim((string)$value);
        if ($text === '') return null;
        if (!is_numeric($text)) return null;
        return (int)$text;
    }

    private function isStorageRequest(Request $request): bool
    {
        $path = '/' . trim($request->path(), '/');
        $referer = (string)$request->headers->get('referer', '');
        return str_contains($path, '/storage/exit-notes') || str_contains($referer, '/storage-exit-note');
    }

    private function stockReservationKey(int $articleId, int $warehouseId, string $lot, ?string $expirationDate, string $location): string
    {
        return implode('|', [
            $articleId,
            $warehouseId,
            mb_strtolower(trim($lot)),
            $expirationDate ?: '',
            mb_strtolower(trim($location)),
        ]);
    }

    private function assertExitStockAvailable(ExitNote $jpa, bool $storageOnly = false): void
    {
        $reservedStock = [];
        foreach ($jpa->items as $item) {
            if (!$item->article_id || !$item->warehouse_id || (float)$item->quantity <= 0) continue;

            $lot = trim((string)($item->batch_code ?? ''));
            $location = trim((string)($item->location ?? ''));
            $expirationDate = $item->expiration_date ? $item->expiration_date->format('Y-m-d') : null;
            $hasStorageKey = $storageOnly || ($lot !== '' && $expirationDate) || $location !== '';
            $availableStock = $hasStorageKey
                ? app(StockService::class)->getAvailableStockByStorageKey((int)$item->article_id, (int)$item->warehouse_id, $lot, $expirationDate, $location, (int)$jpa->id, (int)$jpa->business_id, !$storageOnly, $storageOnly ? (int)$jpa->client_id : null)
                : $this->getAvailableStockByWarehouse((int)$item->article_id, (int)$item->warehouse_id, (int)$jpa->id);
            $stockKey = $this->stockReservationKey((int)$item->article_id, (int)$item->warehouse_id, $hasStorageKey ? $lot : '', $hasStorageKey ? $expirationDate : null, $hasStorageKey ? $location : '');
            $alreadyReserved = (float)($reservedStock[$stockKey] ?? 0);
            $remainingStock = round($availableStock - $alreadyReserved, 3);

            if ((float)$item->quantity > $remainingStock + 0.0001) {
                throw new \Exception("No se puede aprobar la nota. Stock insuficiente para articulo {$item->article_id}, lote {$lot}. Disponible: {$remainingStock}");
            }
            $reservedStock[$stockKey] = round($alreadyReserved + (float)$item->quantity, 3);
        }
    }

    private function normalizeExitStatus($status): string
    {
        $status = trim((string)$status);
        $allowed = ['pending', 'approved', 'cancelled'];
        return in_array($status, $allowed, true) ? $status : 'pending';
    }
}
