<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\Article;
use App\Models\Batch;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\PurchaseReceipt;
use App\Models\PurchaseReceiptItem;
use App\Models\Supplier;
use App\Models\Warehouse;
use App\Services\AccountsPayableService;
use App\Services\StockService;
use App\Support\BusinessScope;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use SoDe\Extend\Response;

class PurchaseReceiptController extends BasicController
{
    public $model = PurchaseReceipt::class;
    public $reactView = 'Admin/PurchaseReceipts';
    public $prefix4filter = 'purchase_receipts';
    public $imageFields = ['document_file', 'guide_file'];
    public $useIntervention = false;

    private array $itemsPayload = [];
    private ?PurchaseReceipt $persistedReceipt = null;

    public function setPaginationInstance(string $model)
    {
        $query = $model::select('purchase_receipts.*')
            ->with([
                'purchaseOrder:id,code,business_id,business_branch_id,warehouse_id,supplier_id,issue_date,expected_date,currency,payment_condition,order_status,approval_status,subtotal,tax_amount,total,status',
                'business:id,name',
                'branch:id,business_id,name',
                'warehouse:id,name',
                'supplier:id,ruc,business_name',
                'items:id,purchase_receipt_id,purchase_order_item_id,batch_id,batch_code,lot,expiration_date,article_id,warehouse_id,stock_before,units_per_box,boxes_quantity,cost_unit,location,quantity,total,status',
                'items.purchaseOrderItem:id,purchase_order_id,article_id,presentation_id,presentation_label,presentation_units,requested_quantity,received_quantity,price_unit,total,status',
                'items.batch:id,business_id,article_id,lot,expiration_date',
                'items.article:id,code,name,laboratory_id,active_principle_id,unit_id',
                'items.article.laboratory:id,name',
                'items.article.activePrinciple:id,name',
                'items.article.unit:id,name,symbol',
                'items.warehouse:id,name',
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ])
            ->join('users as creator', 'creator.id', '=', 'purchase_receipts.created_by')
            ->join('users as updater', 'updater.id', '=', 'purchase_receipts.updated_by');

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
        $receiptId = $body['id'] ?? null;
        $this->persistedReceipt = $receiptId
            ? PurchaseReceipt::with('items:id,purchase_receipt_id,article_id,warehouse_id,quantity,status')->findOrFail($receiptId)
            : null;

        $purchaseOrderId = $body['purchase_order_id'] ?? null;
        $businessId = $body['business_id'] ?? null;
        $branchId = $body['business_branch_id'] ?? null;
        $warehouseId = $body['warehouse_id'] ?? null;
        $supplierId = $body['supplier_id'] ?? null;
        $issueDate = $this->normalizeDate($body['issue_date'] ?? now()->toDateString());
        $receiptStatus = $this->normalizeReceiptStatus($body['receipt_status'] ?? 'draft');
        $documentType = trim((string)($body['document_type'] ?? 'Factura'));
        $currency = strtoupper(trim((string)($body['currency'] ?? 'PEN')));
        $paymentCondition = $this->normalizePaymentCondition($body['payment_condition'] ?? 'Contado');
        $firstDueDate = $this->normalizeDate($body['first_due_date'] ?? null);
        $installments = $this->toNullableInt($body['installments'] ?? null);

        if (!$businessId) throw new \Exception('La empresa es obligatoria');
        if (!$warehouseId) throw new \Exception('El almacen es obligatorio');
        if (!$supplierId) throw new \Exception('El proveedor es obligatorio');
        if (!$issueDate) throw new \Exception('La fecha de emision es obligatoria');
        if ($documentType === '') throw new \Exception('El tipo de documento es obligatorio');
        if ($paymentCondition === 'Credito' && !$firstDueDate) {
            throw new \Exception('La fecha de primera cuota es obligatoria para compras al credito');
        }
        if ($paymentCondition === 'Credito' && (!$installments || $installments <= 0)) {
            throw new \Exception('Debes indicar al menos una cuota para compras al credito');
        }

        $business = BusinessScope::findFixedBusinessForRequest($businessId, $request);
        $warehouse = Warehouse::findOrFail($warehouseId);
        Supplier::findOrFail($supplierId);

        $purchaseOrder = null;
        if ($purchaseOrderId) {
            $purchaseOrder = PurchaseOrder::with('items')->findOrFail($purchaseOrderId);
            if ((int)$purchaseOrder->business_id !== (int)$businessId) {
                throw new \Exception('La orden de compra no pertenece a la empresa seleccionada');
            }
            if ((int)$purchaseOrder->warehouse_id !== (int)$warehouseId) {
                throw new \Exception('La orden de compra no corresponde al almacen seleccionado');
            }
            if ((int)$purchaseOrder->supplier_id !== (int)$supplierId) {
                throw new \Exception('La orden de compra no corresponde al proveedor seleccionado');
            }
        }

        $body['business_branch_id'] = BusinessScope::branchIdFromWarehouse($business, $warehouse, $branchId);

        $rawItems = $body['items'] ?? [];
        if (is_string($rawItems)) {
            $decoded = json_decode($rawItems, true);
            $rawItems = is_array($decoded) ? $decoded : [];
        }
        if (!is_array($rawItems)) $rawItems = [];
        $this->itemsPayload = $rawItems;
        unset($body['items']);

        if (!$receiptId) {
            $body['code'] = $this->nextCode();
            $body['created_by'] = $userId;
            $body['status'] = true;
        }

        if ($paymentCondition === 'Contado') {
            $installments = 1;
            $firstDueDate = $firstDueDate ?: $issueDate;
        }

        $body['updated_by'] = $userId;
        $body['purchase_order_id'] = $purchaseOrderId ?: null;
        $body['issue_date'] = $issueDate;
        $body['receipt_status'] = $receiptStatus;
        $body['confirmed_at'] = $receiptStatus === 'confirmed' ? ($body['confirmed_at'] ?? now()) : null;
        $body['document_type'] = $documentType;
        $body['currency'] = in_array($currency, ['PEN', 'USD', 'EUR']) ? $currency : 'PEN';
        $body['payment_condition'] = $paymentCondition;
        $body['first_due_date'] = $firstDueDate;
        $body['installments'] = $installments;
        $body['document_series'] = trim((string)($body['document_series'] ?? '')) ?: null;
        $body['document_sequence'] = trim((string)($body['document_sequence'] ?? '')) ?: null;
        $body['observations'] = trim((string)($body['observations'] ?? '')) ?: null;
        $body['guide_series'] = trim((string)($body['guide_series'] ?? '')) ?: null;
        $body['guide_sequence'] = trim((string)($body['guide_sequence'] ?? '')) ?: null;
        $body['guide_ruc'] = trim((string)($body['guide_ruc'] ?? '')) ?: null;
        $body['subtotal'] = $this->toNullableDecimal($body['subtotal'] ?? null) ?? 0;
        $body['tax_amount'] = $this->toNullableDecimal($body['tax_amount'] ?? null) ?? 0;
        $body['total'] = $this->toNullableDecimal($body['total'] ?? null) ?? 0;

        return $body;
    }

    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        DB::beginTransaction();
        try {
            $this->assertReceiptStockCanBeApplied(
                (int)$jpa->id,
                $this->getReceiptStockMap($this->persistedReceipt),
                $this->buildPayloadReceiptStockMap($jpa)
            );

            PurchaseReceiptItem::where('purchase_receipt_id', $jpa->id)->delete();

            $inserted = 0;
            $subtotal = 0;
            $isConfirmed = $jpa->receipt_status === 'confirmed';
            $business = BusinessScope::findFixedBusiness($jpa->business_id);

            foreach ($this->itemsPayload as $item) {
                if (!is_array($item)) continue;

                $articleId = $item['article_id'] ?? null;
                if (!$articleId) throw new \Exception('Cada linea debe tener articulo');
                $article = Article::findOrFail($articleId);

                $purchaseOrderItemId = $item['purchase_order_item_id'] ?? null;
                $purchaseOrderItem = null;
                if ($purchaseOrderItemId) {
                    $purchaseOrderItem = PurchaseOrderItem::findOrFail($purchaseOrderItemId);
                    if ($jpa->purchase_order_id && (int)$purchaseOrderItem->purchase_order_id !== (int)$jpa->purchase_order_id) {
                        throw new \Exception('El item de la orden de compra no pertenece al documento seleccionado');
                    }
                    if ((int)$purchaseOrderItem->article_id !== (int)$article->id) {
                        throw new \Exception('El articulo del detalle no coincide con el item de la orden de compra');
                    }
                }
                $presentationUnits = $purchaseOrderItem
                    ? max(1, (float)($purchaseOrderItem->presentation_units ?? 1))
                    : 1;

                $batchId = $item['batch_id'] ?? null;
                $batch = null;
                if ($batchId) {
                    $batch = Batch::findOrFail($batchId);
                    if ((int)$batch->business_id !== (int)$jpa->business_id) {
                        throw new \Exception('El lote no pertenece a la empresa seleccionada');
                    }
                    if ((int)$batch->article_id !== (int)$article->id) {
                        throw new \Exception('El lote no corresponde al articulo seleccionado');
                    }
                }

                $warehouseId = $item['warehouse_id'] ?? $jpa->warehouse_id;
                if (!$warehouseId) throw new \Exception('Cada linea debe tener almacen');
                $itemWarehouse = Warehouse::findOrFail($warehouseId);
                BusinessScope::branchIdFromWarehouse($business, $itemWarehouse, $jpa->business_branch_id);

                $quantity = $this->toNullableDecimal($item['quantity'] ?? null) ?? 0;
                $stockQuantity = $purchaseOrderItem
                    ? round($quantity * $presentationUnits, 3)
                    : $quantity;
                $stockBefore = $this->toNullableDecimal($item['stock_before'] ?? null) ?? 0;
                $unitsPerBox = $this->toNullableDecimal($item['units_per_box'] ?? null) ?? 0;
                $boxesQuantity = $this->toNullableDecimal($item['boxes_quantity'] ?? null) ?? 0;
                $costUnit = $this->toNullableDecimal($item['cost_unit'] ?? null) ?? 0;
                if ($quantity <= 0) throw new \Exception("La cantidad debe ser mayor a 0 para {$article->name}");
                if ($stockBefore < 0 || $unitsPerBox < 0 || $boxesQuantity < 0 || $costUnit < 0) {
                    throw new \Exception("Los valores numericos no pueden ser negativos para {$article->name}");
                }

                $lineTotal = $this->toNullableDecimal($item['total'] ?? null);
                if (is_null($lineTotal) || $lineTotal < 0) {
                    $lineTotal = (float)$quantity * (float)$costUnit;
                }

                if ($isConfirmed && $purchaseOrderItem) {
                    $alreadyConfirmed = $this->sumConfirmedQuantityForPurchaseOrderItem($purchaseOrderItem->id, $jpa->id);
                    $maxAllowed = (float)$purchaseOrderItem->requested_quantity;
                    if (($alreadyConfirmed + $quantity) > ($maxAllowed + 0.0001)) {
                        throw new \Exception("La recepcion supera la cantidad pendiente de {$article->name}");
                    }
                }

                $expirationDate = $this->normalizeDate($item['expiration_date'] ?? null);
                if (!$expirationDate && $batch?->expiration_date) {
                    $expirationDate = $batch->expiration_date->format('Y-m-d');
                }

                $lot = trim((string)($item['lot'] ?? '')) ?: null;
                $batchCode = trim((string)($item['batch_code'] ?? '')) ?: null;
                if ($batch) {
                    $lot = $batch->lot;
                    $batchCode = $batch->lot;
                }

                PurchaseReceiptItem::create([
                    'purchase_receipt_id' => $jpa->id,
                    'purchase_order_item_id' => $purchaseOrderItem?->id,
                    'batch_id' => $batch?->id,
                    'batch_code' => $batchCode,
                    'lot' => $lot,
                    'expiration_date' => $expirationDate,
                    'article_id' => $article->id,
                    'warehouse_id' => $warehouseId,
                    'stock_before' => $stockBefore,
                    'units_per_box' => $unitsPerBox,
                    'boxes_quantity' => $boxesQuantity,
                    'cost_unit' => $costUnit,
                    'location' => trim((string)($item['location'] ?? '')) ?: null,
                    'quantity' => $stockQuantity,
                    'total' => $lineTotal,
                    'status' => isset($item['status']) ? (bool)$item['status'] : true,
                ]);

                $subtotal += $lineTotal;
                $inserted++;
            }

            if ($inserted === 0) throw new \Exception('Debes agregar al menos un item');

            $taxAmount = $this->toNullableDecimal($request->input('tax_amount')) ?? 0;
            $total = $this->toNullableDecimal($request->input('total'));
            $subtotal = round($subtotal, 2);
            $taxAmount = round($taxAmount, 2);
            $total = is_null($total) ? round($subtotal + $taxAmount, 2) : round($total, 2);

            $jpa->update([
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'total' => $total,
                'confirmed_at' => $jpa->receipt_status === 'confirmed' ? ($jpa->confirmed_at ?? now()) : null,
            ]);

            $receipt = $jpa->fresh(['items.batch']);
            $this->syncInventoryIntegration($receipt);

            if ($jpa->purchase_order_id) {
                $this->syncPurchaseOrderProgress((int)$jpa->purchase_order_id);
            }

            $this->syncAccountsPayable($receipt->fresh());

            DB::commit();

            return $jpa->fresh([
                'purchaseOrder',
                'business',
                'branch',
                'warehouse',
                'supplier',
                'items.purchaseOrderItem',
                'items.batch',
                'items.article.laboratory',
                'items.article.activePrinciple',
                'items.article.unit',
                'items.warehouse',
                'creator',
                'updater',
            ]);
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

    public function boolean(Request $request)
    {
        $response = new Response();
        DB::beginTransaction();
        try {
            $previousReceipt = PurchaseReceipt::with('items:id,purchase_receipt_id,article_id,warehouse_id,quantity,status')
                ->findOrFail($request->id);
            $previousMap = $this->getReceiptStockMap($previousReceipt);

            $data = [];
            $data[$request->field] = $request->value;
            $data['updated_by'] = Auth::id();
            $this->model::where($this->identifier, $request->id)->update($data);

            $receipt = PurchaseReceipt::with('items:id,purchase_receipt_id,article_id,warehouse_id,quantity,status,batch_id,batch_code,lot,expiration_date')
                ->findOrFail($request->id);
            $this->assertReceiptStockCanBeApplied((int)$receipt->id, $previousMap, $this->getReceiptStockMap($receipt));
            $this->syncInventoryIntegration($receipt->fresh(['items.batch']));
            if ($receipt->purchase_order_id) {
                $this->syncPurchaseOrderProgress((int)$receipt->purchase_order_id);
            }
            $this->syncAccountsPayable($receipt);

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
            $receipt = PurchaseReceipt::with('items:id,purchase_receipt_id,article_id,warehouse_id,quantity,status')
                ->findOrFail($request->id);
            $previousMap = $this->getReceiptStockMap($receipt);
            $receipt->update([
                'status' => $request->status ? 0 : 1,
                'updated_by' => Auth::id(),
            ]);

            $receipt = $receipt->fresh(['items:id,purchase_receipt_id,article_id,warehouse_id,quantity,status,batch_id,batch_code,lot,expiration_date']);
            $this->assertReceiptStockCanBeApplied((int)$receipt->id, $previousMap, $this->getReceiptStockMap($receipt));
            $this->syncInventoryIntegration($receipt->fresh(['items.batch']));
            if ($receipt->purchase_order_id) {
                $this->syncPurchaseOrderProgress((int)$receipt->purchase_order_id);
            }
            $this->syncAccountsPayable($receipt);

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
            $receipt = PurchaseReceipt::with('items:id,purchase_receipt_id,article_id,warehouse_id,quantity,status')
                ->findOrFail($id);
            $previousMap = $this->getReceiptStockMap($receipt);
            $receipt->update([
                'status' => null,
                'updated_by' => Auth::id(),
            ]);

            $receipt = $receipt->fresh(['items:id,purchase_receipt_id,article_id,warehouse_id,quantity,status,batch_id,batch_code,lot,expiration_date']);
            $this->assertReceiptStockCanBeApplied((int)$receipt->id, $previousMap, $this->getReceiptStockMap($receipt));
            $this->syncInventoryIntegration($receipt->fresh(['items.batch']));
            if ($receipt->purchase_order_id) {
                $this->syncPurchaseOrderProgress((int)$receipt->purchase_order_id);
            }
            $this->syncAccountsPayable($receipt);

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

    private function syncPurchaseOrderProgress(int $purchaseOrderId): void
    {
        $purchaseOrder = PurchaseOrder::with('items')->findOrFail($purchaseOrderId);
        $itemIds = $purchaseOrder->items->pluck('id')->all();

        $receivedByItem = DB::table('purchase_receipt_items as receipt_item')
            ->join('purchase_receipts as receipt', 'receipt.id', '=', 'receipt_item.purchase_receipt_id')
            ->join('purchase_order_items as order_item', 'order_item.id', '=', 'receipt_item.purchase_order_item_id')
            ->where('receipt.purchase_order_id', $purchaseOrderId)
            ->where('receipt.receipt_status', 'confirmed')
            ->where('receipt.status', 1)
            ->where('receipt_item.status', 1)
            ->groupBy('receipt_item.purchase_order_item_id')
            ->selectRaw('receipt_item.purchase_order_item_id, SUM(receipt_item.quantity / CASE WHEN COALESCE(order_item.presentation_units, 0) > 0 THEN order_item.presentation_units ELSE 1 END) as qty')
            ->pluck('qty', 'purchase_order_item_id');

        $anyReceived = false;
        $allCompleted = count($itemIds) > 0;

        foreach ($purchaseOrder->items as $item) {
            $receivedQty = round((float)($receivedByItem[$item->id] ?? 0), 3);
            $item->update(['received_quantity' => $receivedQty]);

            if ($receivedQty > 0) $anyReceived = true;
            if ($receivedQty + 0.0001 < (float)$item->requested_quantity) {
                $allCompleted = false;
            }
        }

        $orderStatus = $purchaseOrder->approval_status === 'approved' ? 'approved' : 'draft';
        if ($anyReceived && !$allCompleted) $orderStatus = 'partial';
        if ($allCompleted && $anyReceived) $orderStatus = 'completed';

        $purchaseOrder->update([
            'order_status' => $orderStatus,
            'updated_by' => Auth::id(),
        ]);
    }

    private function sumConfirmedQuantityForPurchaseOrderItem(int $purchaseOrderItemId, int $currentReceiptId): float
    {
        return (float)DB::table('purchase_receipt_items as receipt_item')
            ->join('purchase_receipts as receipt', 'receipt.id', '=', 'receipt_item.purchase_receipt_id')
            ->join('purchase_order_items as order_item', 'order_item.id', '=', 'receipt_item.purchase_order_item_id')
            ->where('receipt_item.purchase_order_item_id', $purchaseOrderItemId)
            ->where('receipt.receipt_status', 'confirmed')
            ->where('receipt.status', 1)
            ->where('receipt_item.status', 1)
            ->where('receipt.id', '!=', $currentReceiptId)
            ->selectRaw('SUM(receipt_item.quantity / CASE WHEN COALESCE(order_item.presentation_units, 0) > 0 THEN order_item.presentation_units ELSE 1 END) as qty')
            ->value('qty');
    }

    private function toNullableDecimal($value): ?float
    {
        if ($value === null) return null;
        $text = trim((string)$value);
        if ($text === '') return null;
        if (!is_numeric($text)) throw new \Exception("Valor numerico invalido: {$value}");
        return (float)$text;
    }

    private function toNullableInt($value): ?int
    {
        if ($value === null) return null;
        $text = trim((string)$value);
        if ($text === '') return null;
        if (!ctype_digit(ltrim($text, '+'))) {
            throw new \Exception("Valor entero invalido: {$value}");
        }
        return (int)$text;
    }

    private function normalizeDate($value): ?string
    {
        if ($value === null) return null;
        $text = trim((string)$value);
        if ($text === '') return null;
        $timestamp = strtotime($text);
        if ($timestamp === false) {
            throw new \Exception("Fecha invalida: {$value}");
        }
        return date('Y-m-d', $timestamp);
    }

    private function getReceiptStockMap(?PurchaseReceipt $receipt): array
    {
        if (!$receipt || !$receipt->status || $receipt->receipt_status !== 'confirmed') {
            return [];
        }

        $items = $receipt->relationLoaded('items')
            ? $receipt->items
            : $receipt->items()->get(['purchase_receipt_id', 'article_id', 'warehouse_id', 'quantity', 'status']);

        $map = [];
        foreach ($items as $item) {
            if (!$item->status || !$item->article_id || !$item->warehouse_id) continue;

            $quantity = round((float)$item->quantity, 3);
            if ($quantity <= 0) continue;

            $key = $this->stockMapKey((int)$item->article_id, (int)$item->warehouse_id);
            $map[$key] = round(($map[$key] ?? 0) + $quantity, 3);
        }

        return $map;
    }

    private function buildPayloadReceiptStockMap(PurchaseReceipt $receipt): array
    {
        if (!$receipt->status || $receipt->receipt_status !== 'confirmed') {
            return [];
        }

        $map = [];
        foreach ($this->itemsPayload as $item) {
            if (!is_array($item)) continue;

            $itemStatus = array_key_exists('status', $item) ? (bool)$item['status'] : true;
            if (!$itemStatus) continue;

            $articleId = (int)($item['article_id'] ?? 0);
            $warehouseId = (int)($item['warehouse_id'] ?? $receipt->warehouse_id ?? 0);
            $quantity = $this->payloadStockQuantity($item);

            if ($articleId <= 0 || $warehouseId <= 0 || $quantity <= 0) continue;

            $key = $this->stockMapKey($articleId, $warehouseId);
            $map[$key] = round(($map[$key] ?? 0) + $quantity, 3);
        }

        return $map;
    }

    private function assertReceiptStockCanBeApplied(int $receiptId, array $previousMap, array $nextMap): void
    {
        $keys = array_unique(array_merge(array_keys($previousMap), array_keys($nextMap)));
        $stockService = app(StockService::class);

        foreach ($keys as $key) {
            [$articleId, $warehouseId] = $this->parseStockMapKey($key);
            $baseNetStock = $stockService->getNetStockByWarehouse($articleId, $warehouseId, 0, $receiptId);
            $futureStock = round($baseNetStock + ($nextMap[$key] ?? 0), 3);

            if ($futureStock < -0.0001) {
                throw new \Exception("No puedes modificar la recepcion porque dejaria stock negativo para el articulo {$articleId} en almacen {$warehouseId}");
            }
        }
    }

    private function payloadStockQuantity(array $item): float
    {
        $quantity = round((float)($this->toNullableDecimal($item['quantity'] ?? null) ?? 0), 3);
        if ($quantity <= 0) return 0.0;

        $purchaseOrderItemId = $this->toNullableInt($item['purchase_order_item_id'] ?? null);
        if (!$purchaseOrderItemId) return $quantity;

        $presentationUnits = (float)PurchaseOrderItem::query()
            ->where('id', $purchaseOrderItemId)
            ->value('presentation_units');
        if ($presentationUnits <= 0) $presentationUnits = 1;

        return round($quantity * $presentationUnits, 3);
    }

    private function stockMapKey(int $articleId, int $warehouseId): string
    {
        return $articleId . ':' . $warehouseId;
    }

    private function parseStockMapKey(string $key): array
    {
        [$articleId, $warehouseId] = array_pad(explode(':', $key, 2), 2, 0);
        return [(int)$articleId, (int)$warehouseId];
    }

    private function normalizePaymentCondition($value): string
    {
        $normalized = mb_strtolower(trim((string)$value));
        return $normalized === 'credito' ? 'Credito' : 'Contado';
    }

    private function normalizeReceiptStatus($value): string
    {
        $allowed = ['draft', 'confirmed', 'cancelled'];
        $normalized = mb_strtolower(trim((string)$value));
        return in_array($normalized, $allowed, true) ? $normalized : 'draft';
    }

    private function nextCode(): string
    {
        $next = 1;
        $latest = PurchaseReceipt::query()->latest('id')->value('code');
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) {
            $next = ((int)$matches[1]) + 1;
        }
        return 'RC-' . str_pad((string)$next, 6, '0', STR_PAD_LEFT);
    }

    private function syncAccountsPayable(PurchaseReceipt $receipt): void
    {
        app(AccountsPayableService::class)->syncFromPurchaseReceipt($receipt);
    }

    private function syncInventoryIntegration(PurchaseReceipt $receipt): void
    {
        app(StockService::class)->syncPurchaseReceiptBatches($receipt);
    }
}
