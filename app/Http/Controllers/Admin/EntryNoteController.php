<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\Article;
use App\Models\Client;
use App\Models\EntryNote;
use App\Models\EntryNoteItem;
use App\Models\Laboratory;
use App\Models\Warehouse;
use App\Services\StockService;
use App\Support\BusinessScope;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use SoDe\Extend\Response;

class EntryNoteController extends BasicController
{
    public $model = EntryNote::class;
    public $reactView = 'Admin/EntryNotes';
    public $prefix4filter = 'entry_notes';
    public $imageFields = ['document_file', 'guide_file'];
    public $useIntervention = false;

    private array $itemsPayload = [];

    private function neutralBusinessScopePaths(): array
    {
        return ['/admin/entry-note'];
    }

    private function listRelations(bool $isStorage): array
    {
        if ($isStorage) {
            return [
                'business:id,name',
                'branch:id,business_id,name',
                'warehouse:id,name',
                'client:id,document_number,full_name',
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ];
        }

        return $this->detailRelations();
    }

    private function detailRelations(): array
    {
        return [
            'business:id,name',
            'branch:id,business_id,name',
            'warehouse:id,name',
            'supplier:id,ruc,business_name',
            'client:id,document_number,full_name',
            'items:id,entry_note_id,batch_code,lot,expiration_date,storage_condition,manufacturer_id,article_id,warehouse_id,stock,cost_unit,location,requested_quantity,received_quantity,quantity,total,status',
            'items.article:id,code,name,laboratory_id,active_principle_id,unit_id',
            'items.article.laboratory:id,name',
            'items.article.activePrinciple:id,name',
            'items.article.unit:id,name,symbol',
            'items.article.storageLots:id,article_id,lot,expiration_date,storage_condition,manufacturer_id,status',
            'items.article.storageLots.manufacturer:id,name,code,country',
            'items.warehouse:id,name',
            'items.manufacturer:id,name,code,country',
            'creator:id,name,lastname,username,fullname',
            'updater:id,name,lastname,username,fullname',
        ];
    }

    private function storageListColumns(): array
    {
        return [
            'entry_notes.id',
            'entry_notes.code',
            'entry_notes.business_id',
            'entry_notes.business_branch_id',
            'entry_notes.warehouse_id',
            'entry_notes.client_id',
            'entry_notes.entry_date',
            'entry_notes.document_type',
            'entry_notes.document_series',
            'entry_notes.document_sequence',
            'entry_notes.status',
            'entry_notes.entry_status',
            'entry_notes.created_by',
            'entry_notes.updated_by',
            'entry_notes.created_at',
            'entry_notes.updated_at',
        ];
    }

    public function get(Request $request, string $id)
    {
        $response = Response::simpleTryCatch(function () use ($id) {
            $entryNote = $this->model::with($this->detailRelations())->find($id);
            if (!$entryNote) throw new \Exception('El registro que buscas no existe');
            return $entryNote;
        });
        return response($response->toArray(), $response->status);
    }

    public function setPaginationInstance(string $model)
    {
        $isStorage = $this->isStorageRequest(request());
        $query = $model::select($isStorage ? $this->storageListColumns() : ['entry_notes.*'])
            ->with($this->listRelations($isStorage))
            ->leftJoin('businesses as business', 'business.id', '=', 'entry_notes.business_id')
            ->leftJoin('business_branches as branch', 'branch.id', '=', 'entry_notes.business_branch_id')
            ->leftJoin('warehouses as warehouse', 'warehouse.id', '=', 'entry_notes.warehouse_id')
            ->leftJoin('suppliers as supplier', 'supplier.id', '=', 'entry_notes.supplier_id')
            ->leftJoin('clients as client', 'client.id', '=', 'entry_notes.client_id')
            ->leftJoin('users as creator', 'creator.id', '=', 'entry_notes.created_by')
            ->leftJoin('users as updater', 'updater.id', '=', 'entry_notes.updated_by');

        $scopeKey = BusinessScope::scopedKeyForRequest(request(), $this->neutralBusinessScopePaths());
        $query->whereHas('business', function ($business) use ($scopeKey) {
            $business->whereIn('business_key', BusinessScope::fixedKeys());
            if ($scopeKey) $business->where('business_key', $scopeKey);
        });

        return $query;
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $userId = Auth::id();
        $isStorage = $this->isStorageRequest($request);

        $businessId = $body['business_id'] ?? null;
        $branchId = $body['business_branch_id'] ?? null;
        $warehouseId = $body['warehouse_id'] ?? null;
        $supplierId = $body['supplier_id'] ?? null;
        $clientId = $this->normalizeClientId($body['client_id'] ?? null);
        $documentType = trim((string)($body['document_type'] ?? 'Boleta'));
        $currency = trim((string)($body['currency'] ?? 'PEN'));

        if (!$businessId) throw new \Exception('La empresa es obligatoria');
        if (!$warehouseId) throw new \Exception('El almacen es obligatorio');
        if ($documentType === '') throw new \Exception('El tipo de documento es obligatorio');
        if ($currency === '') throw new \Exception('La moneda es obligatoria');
        if ($isStorage) {
            if (!$clientId) throw new \Exception('El cliente es obligatorio');
            if (trim((string)($body['entry_date'] ?? '')) === '') throw new \Exception('La fecha de ingreso es obligatoria');
            if (trim((string)($body['document_series'] ?? '')) === '') throw new \Exception('La serie es obligatoria');
            if (trim((string)($body['document_sequence'] ?? '')) === '') throw new \Exception('La secuencia es obligatoria');
            if (trim((string)($body['document_date'] ?? '')) === '') throw new \Exception('La fecha de documento es obligatoria');
            if (trim((string)($body['driver_name'] ?? '')) === '') throw new \Exception('El nombre del chofer es obligatorio');
            if (trim((string)($body['driver_license'] ?? '')) === '') throw new \Exception('El numero de brevete es obligatorio');
            if (trim((string)($body['vehicle_plate'] ?? '')) === '') throw new \Exception('El numero de placa es obligatorio');
            Client::findOrFail($clientId);
        }

        $business = BusinessScope::findFixedBusinessForRequest($businessId, $request, $this->neutralBusinessScopePaths());
        $warehouse = Warehouse::findOrFail($warehouseId);
        $body['business_branch_id'] = BusinessScope::branchIdFromWarehouse($business, $warehouse, $branchId);
        $body['supplier_id'] = ($supplierId === '' || is_null($supplierId)) ? null : (int)$supplierId;
        $body['client_id'] = $clientId;

        $rawItems = $body['items'] ?? [];
        if (is_string($rawItems)) {
            $decoded = json_decode($rawItems, true);
            $rawItems = is_array($decoded) ? $decoded : [];
        }
        if (!is_array($rawItems)) $rawItems = [];
        $this->itemsPayload = $rawItems;
        unset($body['items']);

        if ($isStorage) {
            if (!collect($this->itemsPayload)->contains(fn($item) => is_array($item) && !empty($item['article_id']))) {
                throw new \Exception('Debes agregar al menos una linea en la nota de entrada');
            }
            $this->assertStorageArticlesBelongToClient($clientId, $this->itemsPayload);
            $this->assertStorageLocationsAvailable((object)[
                'id' => (int)($body['id'] ?? 0),
                'business_id' => $business->id,
                'warehouse_id' => $warehouse->id,
            ], $this->itemsPayload);
        }

        if (!isset($body['id']) || !$body['id']) {
            $body['created_by'] = $userId;
            $body['status'] = true;
            $body['entry_status'] = $isStorage ? 'pending' : 'approved';
        }
        $body['updated_by'] = $userId;

        $body['document_type'] = $documentType;
        $body['currency'] = strtoupper($currency);
        $body['provider_distributor'] = trim((string)($body['provider_distributor'] ?? '')) ?: null;
        $body['entry_date'] = trim((string)($body['entry_date'] ?? '')) ?: null;
        $body['document_series'] = trim((string)($body['document_series'] ?? '')) ?: null;
        $body['document_sequence'] = trim((string)($body['document_sequence'] ?? '')) ?: null;
        $body['document_date'] = trim((string)($body['document_date'] ?? '')) ?: null;
        $body['invoice_type'] = trim((string)($body['invoice_type'] ?? '')) ?: null;
        $body['invoice_series'] = trim((string)($body['invoice_series'] ?? '')) ?: null;
        $body['invoice_sequence'] = trim((string)($body['invoice_sequence'] ?? '')) ?: null;
        $body['invoice_date'] = trim((string)($body['invoice_date'] ?? '')) ?: null;
        $body['dua_number'] = trim((string)($body['dua_number'] ?? '')) ?: null;
        $body['transport_agency'] = trim((string)($body['transport_agency'] ?? '')) ?: null;
        $body['driver_name'] = trim((string)($body['driver_name'] ?? '')) ?: null;
        $body['driver_license'] = trim((string)($body['driver_license'] ?? '')) ?: null;
        $body['vehicle_plate'] = trim((string)($body['vehicle_plate'] ?? '')) ?: null;
        $body['observations'] = trim((string)($body['observations'] ?? '')) ?: null;
        $body['guide_series'] = trim((string)($body['guide_series'] ?? '')) ?: null;
        $body['guide_sequence'] = trim((string)($body['guide_sequence'] ?? '')) ?: null;
        $body['guide_ruc'] = trim((string)($body['guide_ruc'] ?? '')) ?: null;

        return $body;
    }

    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        DB::beginTransaction();
        try {
            if (!$jpa->code) {
                $jpa->code = 'NE' . str_pad((string)$jpa->id, 5, '0', STR_PAD_LEFT);
                $jpa->save();
            }

            if ($this->isStorageRequest($request)) {
                $this->assertStorageLocationsAvailable($jpa, $this->itemsPayload);
            }

            EntryNoteItem::where('entry_note_id', $jpa->id)->delete();

            $inserted = 0;
            $business = BusinessScope::findFixedBusiness($jpa->business_id);
            foreach ($this->itemsPayload as $idx => $item) {
                if (!is_array($item)) continue;

                $articleId = $item['article_id'] ?? null;
                if (!$articleId) {
                    throw new \Exception('Cada linea de detalle debe tener articulo');
                }

                $article = Article::findOrFail($articleId);
                $warehouseId = $item['warehouse_id'] ?? $jpa->warehouse_id;
                if (!$warehouseId) throw new \Exception('Cada linea debe tener almacen');
                $itemWarehouse = Warehouse::findOrFail($warehouseId);
                BusinessScope::branchIdFromWarehouse($business, $itemWarehouse, $jpa->business_branch_id);

                $stock = $this->toNullableDecimal($item['stock'] ?? null) ?? 0;
                $costUnit = $this->toNullableDecimal($item['cost_unit'] ?? null) ?? 0;
                $requestedQuantity = $this->toNullableDecimal($item['requested_quantity'] ?? null);
                $receivedQuantity = $this->toNullableDecimal($item['received_quantity'] ?? null);
                $quantity = $this->toNullableDecimal($item['quantity'] ?? null);
                $quantity = $receivedQuantity ?? $quantity ?? 0;
                $requestedQuantity = $requestedQuantity ?? $quantity;
                $receivedQuantity = $receivedQuantity ?? $quantity;
                if ($quantity <= 0) {
                    throw new \Exception('La cantidad de cada linea debe ser mayor a 0');
                }
                if (!empty($item['manufacturer_id'])) {
                    Laboratory::findOrFail($item['manufacturer_id']);
                }

                $total = $this->toNullableDecimal($item['total'] ?? null);
                if (is_null($total) || $total < 0) {
                    $total = (float)$quantity * (float)$costUnit;
                }

                EntryNoteItem::create([
                    'entry_note_id' => $jpa->id,
                    'batch_code' => trim((string)($item['batch_code'] ?? '')) ?: null,
                    'lot' => trim((string)($item['lot'] ?? '')) ?: null,
                    'expiration_date' => trim((string)($item['expiration_date'] ?? '')) ?: null,
                    'storage_condition' => trim((string)($item['storage_condition'] ?? '')) ?: null,
                    'manufacturer_id' => !empty($item['manufacturer_id']) ? (int)$item['manufacturer_id'] : null,
                    'article_id' => $article->id,
                    'warehouse_id' => $warehouseId,
                    'stock' => $stock,
                    'cost_unit' => $costUnit,
                    'location' => $this->normalizeStorageLocationCode($item['location'] ?? '') ?: null,
                    'requested_quantity' => $requestedQuantity,
                    'received_quantity' => $receivedQuantity,
                    'quantity' => $quantity,
                    'total' => $total,
                    'status' => isset($item['status']) ? (bool)$item['status'] : true,
                ]);
                $inserted++;
            }

            if ($inserted === 0) {
                throw new \Exception('Debes agregar al menos una linea en la nota de entrada');
            }

            DB::commit();
        } catch (\Throwable $th) {
            DB::rollBack();
            throw $th;
        }
    }

    public function branches(Request $request, string $businessId): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            $business = BusinessScope::findFixedBusinessForRequest($businessId, $request, $this->neutralBusinessScopePaths());
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

    public function currentStock(Request $request): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            $articleId = (int)($request->article_id ?? 0);
            $warehouseId = (int)($request->warehouse_id ?? 0);

            if ($articleId <= 0) throw new \Exception('El articulo es obligatorio');
            if ($warehouseId <= 0) throw new \Exception('El almacen es obligatorio');

            Article::findOrFail($articleId);
            Warehouse::findOrFail($warehouseId);

            $stock = app(StockService::class)->getAvailableStockByWarehouse($articleId, $warehouseId);
            $qtyOut = (float)DB::table('exit_note_items as exit_item')
                ->join('exit_notes as exit_note', 'exit_note.id', '=', 'exit_item.exit_note_id')
                ->where('exit_note.status', 1)
                ->where('exit_item.status', 1)
                ->where('exit_item.article_id', $articleId)
                ->where('exit_item.warehouse_id', $warehouseId)
                ->sum('exit_item.quantity');
            $qtyIn = $stock + $qtyOut;

            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = [
                'qty_in' => $qtyIn,
                'qty_out' => $qtyOut,
                'stock' => $stock,
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
            $data = [];
            $data[$request->field] = $request->value;
            $data['updated_by'] = Auth::id();

            $this->model::where($this->identifier, $request->id)->update($data);

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
            $this->model::where($this->identifier, $request->id)->update([
                'status' => $request->status ? 0 : 1,
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

    public function entryStatus(Request $request, string $id)
    {
        $response = new Response();
        try {
            $status = trim((string)$request->input('entry_status'));
            if (!in_array($status, ['pending', 'approved', 'cancelled'], true)) {
                throw new \Exception('Estado de nota no valido');
            }

            $entryNote = $this->model::findOrFail($id);
            if ($status === 'approved' && $this->isStorageRequest($request)) {
                $entryNote->load('items');
                $this->assertStorageLocationsAvailable($entryNote, $entryNote->items);
            }

            $entryNote->entry_status = $status;
            $entryNote->status = $status === 'cancelled' ? false : true;
            $entryNote->updated_by = Auth::id();
            $entryNote->save();

            $response->status = 200;
            $response->message = match ($status) {
                'approved' => 'Nota de entrada aprobada correctamente',
                'cancelled' => 'Nota de entrada anulada correctamente',
                default => 'Nota de entrada actualizada correctamente',
            };
            $response->data = $entryNote->fresh(['client', 'warehouse', 'items.article', 'items.manufacturer']);
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    private function isStorageRequest(Request $request): bool
    {
        $path = '/' . trim($request->path(), '/');
        $referer = (string)$request->headers->get('referer', '');
        return str_contains($path, '/storage/entry-notes') || str_contains($referer, '/storage-entry-note');
    }

    private function assertStorageLocationsAvailable(object $entryNote, iterable $items): void
    {
        $business = BusinessScope::findFixedBusiness($entryNote->business_id);
        if ($business->business_key !== BusinessScope::KAMARY_MEDICALS) {
            return;
        }

        $stockService = app(StockService::class);
        $usedLocations = [];

        foreach ($items as $idx => $item) {
            $articleId = $this->itemValue($item, 'article_id');
            if (!$articleId) {
                continue;
            }

            $location = $this->normalizeStorageLocationCode($this->itemValue($item, 'location'));
            $lineNumber = is_numeric($idx) ? ((int)$idx + 1) : 0;
            $lineLabel = $lineNumber > 0 ? " en la linea {$lineNumber}" : '';
            if ($location === '') {
                throw new \Exception("La ubicacion de almacen es obligatoria{$lineLabel}");
            }

            $warehouseId = (int)($this->itemValue($item, 'warehouse_id') ?: $entryNote->warehouse_id);
            if ($warehouseId <= 0) {
                throw new \Exception("El almacen es obligatorio{$lineLabel}");
            }

            $locationRow = DB::table('storage_locations as location')
                ->where('location.warehouse_id', $warehouseId)
                ->where('location.status', 1)
                ->whereRaw("LOWER(location.code) = ?", [mb_strtolower($location)])
                ->first(['location.id', 'location.code']);

            if (!$locationRow) {
                $warehouseName = optional(Warehouse::find($warehouseId))->name ?: 'seleccionado';
                throw new \Exception("La ubicacion {$location} no esta registrada o activa para el almacen {$warehouseName}");
            }

            $locationKey = $warehouseId . '|' . mb_strtolower((string)$locationRow->code);
            if (isset($usedLocations[$locationKey])) {
                throw new \Exception("La ubicacion {$locationRow->code} ya fue usada en otra linea de esta nota. Usa una ubicacion libre por producto");
            }
            $usedLocations[$locationKey] = true;

            $occupancyRows = $stockService->storageLocationOccupancyRows(
                $warehouseId,
                (string)$locationRow->code,
                (int)$entryNote->id,
                BusinessScope::KAMARY_MEDICALS
            );

            if (count($occupancyRows) > 0) {
                throw new \Exception($this->occupiedLocationMessage((string)$locationRow->code, $occupancyRows));
            }
        }
    }

    private function assertStorageArticlesBelongToClient(int $clientId, iterable $items): void
    {
        if ($clientId <= 0) {
            throw new \Exception('El cliente es obligatorio');
        }

        $articleIds = collect($items)
            ->map(fn($item) => (int)($this->itemValue($item, 'article_id') ?: 0))
            ->filter(fn($id) => $id > 0)
            ->unique()
            ->values();

        if ($articleIds->isEmpty()) {
            return;
        }

        $articles = Article::query()
            ->whereIn('id', $articleIds)
            ->get(['id', 'code', 'name', 'client_id'])
            ->keyBy('id');

        foreach ($items as $idx => $item) {
            $articleId = (int)($this->itemValue($item, 'article_id') ?: 0);
            if ($articleId <= 0) {
                continue;
            }

            $article = $articles->get($articleId);
            $lineNumber = is_numeric($idx) ? ((int)$idx + 1) : 0;
            $lineLabel = $lineNumber > 0 ? " en la linea {$lineNumber}" : '';
            if (!$article) {
                throw new \Exception("El articulo seleccionado{$lineLabel} no existe");
            }

            if ((int)($article->client_id ?? 0) !== $clientId) {
                $articleName = trim(implode(' - ', array_filter([$article->code, $article->name]))) ?: "ID {$articleId}";
                throw new \Exception("El articulo {$articleName}{$lineLabel} no pertenece al cliente seleccionado");
            }
        }
    }

    private function occupiedLocationMessage(string $location, array $rows): string
    {
        $warehouseName = (string)($rows[0]['warehouse_name'] ?? 'seleccionado');
        $clients = collect($rows)
            ->pluck('client_name')
            ->filter()
            ->unique()
            ->values()
            ->implode(', ');
        $clients = $clients !== '' ? $clients : 'sin cliente registrado';

        $products = collect($rows)
            ->map(function ($row) {
                $name = trim((string)($row['article_name'] ?? 'Producto'));
                $lot = trim((string)($row['lot'] ?? ''));
                $stock = number_format((float)($row['stock'] ?? 0), 3, '.', '');
                $label = $lot !== '' ? "{$name} lote {$lot}" : $name;
                return "{$label} ({$stock})";
            })
            ->unique()
            ->values();

        $visibleProducts = $products->take(3)->implode('; ');
        if ($products->count() > 3) {
            $visibleProducts .= ' y ' . ($products->count() - 3) . ' mas';
        }

        $from = collect($rows)->pluck('occupied_from')->filter()->min() ?: 'sin fecha';
        $until = collect($rows)->pluck('occupied_until')->filter()->max() ?: 'sin vencimiento';

        return "La ubicacion {$location} del almacen {$warehouseName} ya esta ocupada por {$visibleProducts}. Cliente: {$clients}. Ocupacion: {$from} a {$until}";
    }

    private function itemValue($item, string $key, $default = null)
    {
        if (is_array($item)) {
            return $item[$key] ?? $default;
        }
        if (is_object($item)) {
            return $item->{$key} ?? $default;
        }
        return $default;
    }

    private function normalizeStorageLocationCode($value): string
    {
        return trim(explode('|', explode(',', (string)($value ?? ''))[0] ?? '')[0] ?? '');
    }

    private function normalizeClientId($value): ?int
    {
        if ($value === null) return null;

        $text = trim((string)$value);
        if ($text === '') return null;
        if (preg_match('/^client-(\d+)$/i', $text, $matches)) return (int)$matches[1];
        if (ctype_digit($text)) return (int)$text;

        throw new \Exception('El cliente seleccionado no es valido');
    }

    private function toNullableDecimal($value): ?float
    {
        if ($value === null) return null;
        $text = trim((string)$value);
        if ($text === '') return null;
        if (!is_numeric($text)) {
            throw new \Exception("Valor numerico invalido: {$value}");
        }
        return (float)$text;
    }
}
