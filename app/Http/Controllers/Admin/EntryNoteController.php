<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\Article;
use App\Models\EntryNote;
use App\Models\EntryNoteItem;
use App\Models\ExitNote;
use App\Models\ExitNoteItem;
use App\Models\Laboratory;
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

class EntryNoteController extends BasicController
{
    public $model = EntryNote::class;
    public $reactView = 'Admin/EntryNotes';
    public $prefix4filter = 'entry_notes';
    public $imageFields = ['document_file', 'guide_file'];
    public $useIntervention = false;

    private array $itemsPayload = [];

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
        $columns = [
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

        // Tolera que el codigo llegue a un entorno donde la migracion aun no corrio.
        if ($this->supportsVoidColumn()) {
            $columns[] = 'entry_notes.voided_exit_note_id';
        }

        return $columns;
    }

    private function supportsVoidColumn(): bool
    {
        return Schema::hasColumn('entry_notes', 'voided_exit_note_id');
    }

    public function get(Request $request, string $id)
    {
        $response = Response::simpleTryCatch(function () use ($request, $id) {
            $entryNote = $this->scopedEntryNoteQuery($request)->with($this->detailRelations())->find($id);
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

        $scopeKey = BusinessScope::scopedKeyForRequest(request())
            ?: ($isStorage ? BusinessScope::KAMARY_MEDICALS : BusinessScope::KAMARY_PERU);
        $query->whereHas('business', function ($business) use ($scopeKey) {
            $business->whereIn('business_key', BusinessScope::fixedKeys());
            if ($scopeKey) $business->where('business_key', $scopeKey);
        });
        if ($isStorage) {
            $query->whereHas('client', fn($client) => StorageScope::applyClientScope($client, 'clients'));
        }

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

        if (!$businessId && $isStorage) throw new \Exception('La empresa es obligatoria');
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
            StorageScope::assertClient($clientId);
            if (!empty($body['id'])) {
                $currentEntry = $this->scopedEntryNoteQuery($request)->whereKey($body['id'])->first();
                if (!$currentEntry) throw new \Exception('Nota de entrada de almacenamiento no encontrada');
                if ($currentEntry && (int)$currentEntry->client_id !== (int)$clientId) {
                    throw new \Exception('No se puede cambiar el cliente de una nota de entrada de almacenamiento');
                }
            }
        }

        $business = $businessId
            ? BusinessScope::findFixedBusinessForRequest($businessId, $request)
            : $this->defaultBusiness($request);
        $body['business_id'] = $business->id;
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

    public function currentStock(Request $request): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            $articleId = (int)($request->article_id ?? 0);
            $warehouseId = (int)($request->warehouse_id ?? 0);

            if ($articleId <= 0) throw new \Exception('El articulo es obligatorio');
            if ($warehouseId <= 0) throw new \Exception('El almacen es obligatorio');

            Warehouse::findOrFail($warehouseId);

            if ($this->isStorageRequest($request)) {
                $article = StorageScope::assertArticle($articleId);
                $clientId = $this->normalizeClientId($request->input('client_id')) ?: (int)($article->client_id ?? 0);
                if (!$clientId) throw new \Exception('El cliente es obligatorio para consultar stock de almacenamiento');
                StorageScope::assertArticleBelongsToClient($articleId, $clientId);

                $qtyIn = (float)DB::table('entry_note_items as entry_item')
                    ->join('entry_notes as entry_note', 'entry_note.id', '=', 'entry_item.entry_note_id')
                    ->join('businesses as business', 'business.id', '=', 'entry_note.business_id')
                    ->where('entry_note.status', 1)
                    ->where('entry_note.entry_status', 'approved')
                    ->where('entry_item.status', 1)
                    ->where('business.business_key', BusinessScope::KAMARY_MEDICALS)
                    ->where('entry_item.article_id', $articleId)
                    ->where('entry_note.client_id', $clientId)
                    ->whereRaw('COALESCE(entry_item.warehouse_id, entry_note.warehouse_id) = ?', [$warehouseId])
                    ->sum('entry_item.quantity');

                $qtyOutQuery = DB::table('exit_note_items as exit_item')
                    ->join('exit_notes as exit_note', 'exit_note.id', '=', 'exit_item.exit_note_id')
                    ->join('businesses as business', 'business.id', '=', 'exit_note.business_id')
                    ->where('exit_note.status', 1)
                    ->where('exit_item.status', 1)
                    ->where('business.business_key', BusinessScope::KAMARY_MEDICALS)
                    ->where('exit_item.article_id', $articleId)
                    ->where('exit_note.client_id', $clientId)
                    ->whereRaw('COALESCE(exit_item.warehouse_id, exit_note.warehouse_id) = ?', [$warehouseId]);
                if (\Illuminate\Support\Facades\Schema::hasColumn('exit_notes', 'exit_status')) {
                    $qtyOutQuery->where('exit_note.exit_status', 'approved');
                }
                $qtyOut = (float)$qtyOutQuery->sum('exit_item.quantity');
                $stock = round($qtyIn - $qtyOut, 3);
            } else {
                Article::findOrFail($articleId);
                $stock = app(StockService::class)->getAvailableStockByWarehouse($articleId, $warehouseId);
                $qtyOutQuery = DB::table('exit_note_items as exit_item')
                    ->join('exit_notes as exit_note', 'exit_note.id', '=', 'exit_item.exit_note_id')
                    ->where('exit_note.status', 1)
                    ->where('exit_item.status', 1)
                    ->where('exit_item.article_id', $articleId)
                    ->where('exit_item.warehouse_id', $warehouseId);
                if (\Illuminate\Support\Facades\Schema::hasColumn('exit_notes', 'exit_status')) {
                    $qtyOutQuery->where('exit_note.exit_status', 'approved');
                }
                $qtyOut = (float)$qtyOutQuery->sum('exit_item.quantity');
                $qtyIn = $stock + $qtyOut;
            }

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
            $field = $this->allowedBooleanFieldFromRequest($request);
            $data = [];
            $data[$field] = $request->value;
            $data['updated_by'] = Auth::id();

            $updated = $this->scopedEntryNoteQuery($request)
                ->where($this->identifier, $request->id)
                ->update($data);
            if (!$updated) throw new \Exception('Nota de entrada no encontrada en este modulo');

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
            $updated = $this->scopedEntryNoteQuery($request)
                ->where($this->identifier, $request->id)
                ->update([
                'status' => $request->status ? 0 : 1,
                'updated_by' => Auth::id(),
            ]);
            if (!$updated) throw new \Exception('Nota de entrada no encontrada en este modulo');

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

            $entryNote = $this->scopedEntryNoteQuery($request)->findOrFail($id);
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

    /**
     * Carga masiva de stock: convierte un archivo del usuario en una nota de entrada aprobada.
     *
     * Sigue el mismo patron que el resto de importaciones del sistema (lotes, articulos): el
     * usuario sube su propio archivo y mapea sus columnas, en vez de obligarlo a una plantilla.
     *
     * El stock entra por una nota de entrada a proposito: es el unico camino que deja movimiento en
     * kardex y que el modulo de inventario puede auditar despues.
     *
     * En almacenamiento la mercaderia es de un cliente (obligatorio) y el catalogo se limita a los
     * productos de ese cliente. En Kamary Peru la mercaderia es propia y no hay cliente.
     */
    public function import(Request $request): HttpResponse|ResponseFactory
    {
        $response = new Response();

        try {
            $isStorage = $this->isStorageRequest($request);
            $rows = $request->input('rows');
            $mapping = $request->input('mapping') ?? [];

            if (!is_array($rows) || count($rows) === 0) {
                throw new \Exception('No hay registros para importar');
            }

            $articleKey = trim((string)($mapping['article'] ?? ''));
            $quantityKey = trim((string)($mapping['quantity'] ?? ''));
            if ($articleKey === '' || $quantityKey === '') {
                throw new \Exception('Debes mapear al menos las columnas de articulo y cantidad');
            }
            $lotKey = trim((string)($mapping['lot'] ?? ''));
            $expirationKey = trim((string)($mapping['expiration_date'] ?? ''));
            $locationKey = trim((string)($mapping['location'] ?? ''));
            $costKey = trim((string)($mapping['cost_unit'] ?? ''));

            $clientId = $this->importInt($request->input('client_id'));
            $client = null;
            if ($isStorage) {
                if (!$clientId) throw new \Exception('Selecciona el cliente dueno de la mercaderia');
                $client = StorageScope::assertClient($clientId);
            } else {
                $clientId = null; // en Kamary Peru la mercaderia es propia
            }

            $warehouseId = $this->importInt($request->input('warehouse_id'));
            if (!$warehouseId) throw new \Exception('Selecciona el almacen donde ingresa la mercaderia');
            $warehouse = Warehouse::with('branch.business')->findOrFail($warehouseId);
            $business = $warehouse->branch?->business;
            $expectedKey = $isStorage ? BusinessScope::KAMARY_MEDICALS : BusinessScope::KAMARY_PERU;
            if (!$business || $business->business_key !== $expectedKey) {
                throw new \Exception('El almacen seleccionado no corresponde a este modulo');
            }

            // Catalogo indexado por codigo y por nombre: el archivo puede traer cualquiera de los
            // dos y no tiene por que respetar mayusculas ni acentos.
            $articles = Article::query()
                ->whereNotNull('status')
                ->when($isStorage, fn($query) => $query->where('client_id', $clientId))
                ->when(!$isStorage, fn($query) => $query->whereNull('client_id'))
                ->get(['id', 'code', 'name']);
            $byCode = [];
            $byName = [];
            foreach ($articles as $article) {
                $code = $this->normalizeImportText($article->code);
                $name = $this->normalizeImportText($article->name);
                if ($code !== '') $byCode[$code] = $article->id;
                if ($name !== '') $byName[$name] = $article->id;
            }
            if (count($byCode) === 0 && count($byName) === 0) {
                throw new \Exception($isStorage
                    ? 'Este cliente no tiene productos creados. Registralos en "Creacion del producto" antes de cargar stock.'
                    : 'No hay articulos creados. Registralos en "Articulos" antes de cargar stock.');
            }

            // Primera pasada: validar todo el archivo antes de escribir nada, para no dejar una
            // nota a medias si una fila esta mal.
            $parsed = [];
            $errors = [];
            foreach ($rows as $index => $row) {
                $line = $index + 2; // +1 por indice base 0 y +1 por la fila de cabecera
                if (!is_array($row)) continue;

                $articleRaw = trim((string)($row[$articleKey] ?? ''));
                $quantityRaw = trim((string)($row[$quantityKey] ?? ''));
                if ($articleRaw === '' && $quantityRaw === '') continue; // fila vacia

                if ($articleRaw === '') { $errors[] = "Fila {$line}: falta el articulo"; continue; }

                $needle = $this->normalizeImportText($articleRaw);
                $articleId = $byCode[$needle] ?? $byName[$needle] ?? null;
                if (!$articleId) { $errors[] = "Fila {$line}: el articulo \"{$articleRaw}\" no existe"; continue; }

                $quantity = $this->importDecimal($quantityRaw);
                if ($quantity === null || $quantity <= 0) { $errors[] = "Fila {$line}: la cantidad debe ser mayor a 0"; continue; }

                $expiration = null;
                if ($expirationKey !== '') {
                    $expirationRaw = trim((string)($row[$expirationKey] ?? ''));
                    if ($expirationRaw !== '') {
                        $expiration = $this->normalizeImportDate($expirationRaw);
                        if (!$expiration) { $errors[] = "Fila {$line}: la fecha de vencimiento \"{$expirationRaw}\" no es valida"; continue; }
                    }
                }

                $cost = 0.0;
                if ($costKey !== '') $cost = (float)($this->importDecimal(trim((string)($row[$costKey] ?? ''))) ?? 0);

                $parsed[] = [
                    'article_id' => $articleId,
                    'lot' => $lotKey !== '' ? trim((string)($row[$lotKey] ?? '')) : '',
                    'expiration_date' => $expiration,
                    'location' => $locationKey !== '' ? trim((string)($row[$locationKey] ?? '')) : '',
                    'quantity' => (float)$quantity,
                    'cost_unit' => $cost,
                ];
            }

            if (count($errors) > 0) {
                throw new \Exception('El archivo tiene errores y no se importo nada:' . PHP_EOL . implode(PHP_EOL, array_slice($errors, 0, 10))
                    . (count($errors) > 10 ? PHP_EOL . '... y ' . (count($errors) - 10) . ' error(es) mas' : ''));
            }
            if (count($parsed) === 0) throw new \Exception('El archivo no tiene filas con datos para importar');

            DB::beginTransaction();

            $entryNote = EntryNote::create([
                'business_id' => $business->id,
                'business_branch_id' => $warehouse->business_branch_id,
                'warehouse_id' => $warehouse->id,
                'client_id' => $clientId,
                'entry_date' => now()->toDateString(),
                'document_type' => $isStorage ? 'Guia Remision' : 'Boleta',
                'document_date' => now()->toDateString(),
                'currency' => 'PEN',
                'observations' => 'Carga masiva de stock desde archivo.',
                'status' => true,
                'entry_status' => 'approved',
                'created_by' => Auth::id(),
                'updated_by' => Auth::id(),
            ]);
            $entryNote->code = 'NE-CM-' . str_pad((string)$entryNote->id, 5, '0', STR_PAD_LEFT);
            $entryNote->save();

            foreach ($parsed as $item) {
                EntryNoteItem::create([
                    'entry_note_id' => $entryNote->id,
                    'article_id' => $item['article_id'],
                    'warehouse_id' => $warehouse->id,
                    'lot' => $item['lot'] ?: null,
                    'batch_code' => $item['lot'] ?: null,
                    'expiration_date' => $item['expiration_date'],
                    'location' => $item['location'] ?: null,
                    'quantity' => $item['quantity'],
                    'received_quantity' => $item['quantity'],
                    'cost_unit' => $item['cost_unit'],
                    'total' => round($item['quantity'] * $item['cost_unit'], 2),
                    'status' => true,
                ]);
            }

            DB::commit();

            $response->status = 200;
            $response->message = "Se cargo el stock en la nota de entrada {$entryNote->code}: " . count($parsed) . ' linea(s).';
            $response->data = [
                'entry_note_id' => $entryNote->id,
                'entry_note_code' => $entryNote->code,
                'imported' => count($parsed),
                'client_name' => $client->full_name ?? null,
            ];
        } catch (\Throwable $th) {
            if (DB::transactionLevel() > 0) DB::rollBack();
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    private function importInt($value): ?int
    {
        $text = trim((string)$value);
        return $text === '' || !is_numeric($text) ? null : (int)$text;
    }

    private function importDecimal($value): ?float
    {
        $text = str_replace(',', '.', trim((string)$value));
        return $text === '' || !is_numeric($text) ? null : (float)$text;
    }

    private function normalizeImportText($value): string
    {
        $text = trim((string)$value);
        if ($text === '') return '';
        $text = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text) ?: $text;
        $text = strtolower($text);
        return preg_replace('/[^a-z0-9]/', '', $text) ?? '';
    }

    /** Acepta 2027-05-31, 31/05/2027, 31-05-2027 y el numero de serie de fecha de Excel. */
    private function normalizeImportDate(string $value): ?string
    {
        $text = trim($value);
        if ($text === '') return null;

        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $text)) return $text;

        if (preg_match('/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/', $text, $m)) {
            $day = (int)$m[1]; $month = (int)$m[2]; $year = (int)$m[3];
            if (checkdate($month, $day, $year)) return sprintf('%04d-%02d-%02d', $year, $month, $day);
            return null;
        }

        if (preg_match('/^\d{5}$/', $text)) {
            // Serie de fecha de Excel: dias desde 1899-12-30.
            return date('Y-m-d', strtotime('1899-12-30 +' . (int)$text . ' days'));
        }

        $timestamp = strtotime($text);
        return $timestamp ? date('Y-m-d', $timestamp) : null;
    }

    /**
     * Devuelve el detalle que se usaria para anular la nota, sin crear nada. Alimenta el modal de
     * confirmacion para que el usuario vea exactamente que va a salir y en que cantidad.
     */
    public function voidPreview(Request $request, string $id): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            $entryNote = $this->assertVoidableEntryNote($request, $id);
            $items = $this->voidableItems($entryNote);

            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = [
                'entry_note' => [
                    'id' => $entryNote->id,
                    'code' => $entryNote->code,
                    'warehouse_name' => $entryNote->warehouse?->name,
                ],
                'items' => $items->map(fn($item) => [
                    'article_name' => $item->article?->name ?? '',
                    'article_code' => $item->article?->code ?? '',
                    'lot' => $this->effectiveLot($item),
                    'quantity' => (float) $item->quantity,
                ])->values(),
            ];
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    /**
     * Anula la nota de entrada creando una nota de salida espejo.
     *
     * La entrada NO se cancela ni se da de baja: sigue contando como ingreso aprobado y la salida
     * descuenta la misma cantidad. Cancelarla ademas restaria el stock dos veces, porque
     * InventoryController suma las entradas aprobadas y resta las salidas aprobadas por separado.
     *
     * Los items se copian con el mismo lote, vencimiento, ubicacion y almacen porque el stock se
     * calcula agrupando por esa combinacion: si no coinciden, la salida no compensaria a la entrada.
     */
    public function void(Request $request, string $id): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            $entryNote = $this->assertVoidableEntryNote($request, $id);
            $items = $this->voidableItems($entryNote);

            DB::beginTransaction();

            // Relee con bloqueo para que dos anulaciones simultaneas no creen dos notas de salida.
            $locked = EntryNote::query()->whereKey($entryNote->id)->lockForUpdate()->first();
            if ($locked?->voided_exit_note_id) {
                throw new \Exception('Esta nota de entrada ya fue anulada');
            }

            $exitNote = ExitNote::create([
                'business_id' => $entryNote->business_id,
                'business_branch_id' => $entryNote->business_branch_id,
                'warehouse_id' => $entryNote->warehouse_id,
                'client_id' => null,
                'motives' => ["Anulacion de la nota de entrada {$entryNote->code}"],
                'exit_date' => now()->toDateString(),
                'document_type' => 'Nota de salida',
                'document_date' => now()->toDateString(),
                'observations' => "Salida generada automaticamente para anular la nota de entrada {$entryNote->code}.",
                'status' => true,
                'exit_status' => 'approved',
                'created_by' => Auth::id(),
                'updated_by' => Auth::id(),
            ]);
            $exitNote->code = 'NS' . str_pad((string) $exitNote->id, 5, '0', STR_PAD_LEFT);
            $exitNote->save();

            foreach ($items as $item) {
                ExitNoteItem::create([
                    'exit_note_id' => $exitNote->id,
                    'article_id' => $item->article_id,
                    'warehouse_id' => $item->warehouse_id ?: $entryNote->warehouse_id,
                    'batch_code' => $this->effectiveLot($item) ?: null,
                    'expiration_date' => $item->expiration_date,
                    'location' => $item->location,
                    'stock' => (float) ($item->stock ?? 0),
                    'quantity' => (float) $item->quantity,
                    'total' => (float) ($item->total ?? 0),
                    'status' => true,
                ]);
            }

            $locked->voided_exit_note_id = $exitNote->id;
            $locked->updated_by = Auth::id();
            $locked->save();

            DB::commit();

            $response->status = 200;
            $response->message = "Nota de entrada anulada con la nota de salida {$exitNote->code}";
            $response->data = [
                'exit_note_id' => $exitNote->id,
                'exit_note_code' => $exitNote->code,
            ];
        } catch (\Throwable $th) {
            DB::rollBack();
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    /** El lote efectivo es el mismo que usa InventoryController para agrupar el stock entrante. */
    private function effectiveLot(EntryNoteItem $item): string
    {
        return trim((string) $item->lot) ?: trim((string) $item->batch_code);
    }

    private function assertVoidableEntryNote(Request $request, string $id): EntryNote
    {
        if ($this->isStorageRequest($request)) {
            throw new \Exception('Las notas de almacenamiento se anulan desde su propio modulo');
        }

        if (!$this->supportsVoidColumn()) {
            throw new \Exception('La anulacion de notas de entrada aun no esta habilitada en este entorno. Ejecuta las migraciones pendientes.');
        }

        $entryNote = $this->scopedEntryNoteQuery($request)->with('warehouse:id,name')->find($id);
        if (!$entryNote) throw new \Exception('Nota de entrada no encontrada');
        if ($entryNote->voided_exit_note_id) throw new \Exception('Esta nota de entrada ya fue anulada');
        if ($entryNote->status === null) throw new \Exception('Esta nota de entrada no esta disponible');
        if ($entryNote->entry_status !== 'approved' || !$entryNote->status) {
            throw new \Exception('Solo se puede anular una nota de entrada aprobada');
        }

        return $entryNote;
    }

    private function voidableItems(EntryNote $entryNote)
    {
        $items = EntryNoteItem::query()
            ->with('article:id,code,name')
            ->where('entry_note_id', $entryNote->id)
            ->where('status', 1)
            ->where('quantity', '>', 0)
            ->orderBy('id')
            ->get();

        if ($items->isEmpty()) {
            throw new \Exception('Esta nota de entrada no tiene articulos con cantidad para anular');
        }

        return $items;
    }

    public function delete(Request $request, string $id)
    {
        $response = new Response();
        try {
            // Fuera del modulo de almacenamiento la nota nace aprobada y suma stock real
            // (InventoryController::incomingTotalsQuery filtra por status=1 y entry_status='approved').
            // Darla de baja aqui restaria ese stock en silencio, sin movimiento de kardex y aunque
            // la mercaderia ya se hubiera vendido: la correccion se hace con una nota de salida.
            if (!$this->isStorageRequest($request)) {
                throw new \Exception('Una nota de entrada no se puede eliminar. Registra una nota de salida para revertir el ingreso.');
            }

            $updated = $this->scopedEntryNoteQuery($request)
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

    private function scopedEntryNoteQuery(Request $request)
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

    private function isStorageRequest(Request $request): bool
    {
        $path = '/' . trim($request->path(), '/');
        $referer = (string)$request->headers->get('referer', '');
        return str_contains($path, '/storage/entry-notes') || str_contains($referer, '/storage-entry-note');
    }

    private function defaultBusiness(Request $request)
    {
        $business = BusinessScope::businessForKey(BusinessScope::keyFromRequestPath($request) ?: BusinessScope::KAMARY_PERU);
        if (!$business) throw new \Exception('No se encontro la empresa del modulo actual');
        return $business;
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
                ->where('location.client_id', (int)$entryNote->client_id)
                ->where('location.status', 1)
                ->whereRaw("LOWER(location.code) = ?", [mb_strtolower($location)])
                ->first(['location.id', 'location.code']);

            if (!$locationRow) {
                $warehouseName = optional(Warehouse::find($warehouseId))->name ?: 'seleccionado';
                throw new \Exception("La ubicacion {$location} no esta registrada o activa para el cliente en el almacen {$warehouseName}");
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
            ->get(['id', 'code', 'name', 'client_id', 'module_scope'])
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

            if (($article->module_scope ?? null) !== 'storage') {
                $articleName = trim(implode(' - ', array_filter([$article->code, $article->name]))) ?: "ID {$articleId}";
                throw new \Exception("El articulo {$articleName}{$lineLabel} no pertenece al modulo de almacenamiento");
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
