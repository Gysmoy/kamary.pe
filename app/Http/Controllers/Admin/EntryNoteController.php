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

    public function setPaginationInstance(string $model)
    {
        $query = $model::select('entry_notes.*')
            ->with([
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
                'items.article.storageLots.manufacturer:id,name,code',
                'items.warehouse:id,name',
                'items.manufacturer:id,name,code',
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ])
            ->leftJoin('users as creator', 'creator.id', '=', 'entry_notes.created_by')
            ->leftJoin('users as updater', 'updater.id', '=', 'entry_notes.updated_by');

        $scopeKey = BusinessScope::scopedKeyForRequest(request());
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
        $clientId = $body['client_id'] ?? null;
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

        $business = BusinessScope::findFixedBusinessForRequest($businessId, $request);
        $warehouse = Warehouse::findOrFail($warehouseId);
        $body['business_branch_id'] = BusinessScope::branchIdFromWarehouse($business, $warehouse, $branchId);
        $body['supplier_id'] = ($supplierId === '' || is_null($supplierId)) ? null : (int)$supplierId;
        $body['client_id'] = ($clientId === '' || is_null($clientId)) ? null : (int)$clientId;

        $rawItems = $body['items'] ?? [];
        if (is_string($rawItems)) {
            $decoded = json_decode($rawItems, true);
            $rawItems = is_array($decoded) ? $decoded : [];
        }
        if (!is_array($rawItems)) $rawItems = [];
        $this->itemsPayload = $rawItems;
        unset($body['items']);

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
                    'location' => trim((string)($item['location'] ?? '')) ?: null,
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
