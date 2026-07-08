<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\Article;
use App\Models\ArticlePresentation;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\Supplier;
use App\Services\AccountsPayableService;
use App\Models\Warehouse;
use App\Support\BusinessScope;
use App\Support\MagistralesWarehouse;
use App\Support\SamplesWarehouse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use SoDe\Extend\Response;

class PurchaseOrderController extends BasicController
{
    public $model = PurchaseOrder::class;
    public $reactView = 'Admin/PurchaseOrders';
    public $prefix4filter = 'purchase_orders';
    protected string $moduleScope = 'standard';

    private array $itemsPayload = [];

    public function setPaginationInstance(string $model)
    {
        $query = $model::select('purchase_orders.*')
            ->with([
                'business:id,name',
                'branch:id,business_id,name',
                'warehouse:id,name',
                'supplier:id,ruc,business_name',
                'items:id,purchase_order_id,article_id,presentation_id,presentation_label,presentation_units,last_price,requested_quantity,received_quantity,price_unit,total,status',
                'items.article:id,code,name,article_type,magistral_presentation,laboratory_id,active_principle_id,unit_id',
                'items.article.laboratory:id,name',
                'items.article.activePrinciple:id,name',
                'items.article.unit:id,name,symbol',
                'items.article.presentations:id,article_id,name,units,price,purchase_price_national,purchase_price_foreign,sort_order,status',
                'items.presentation:id,article_id,name,units,purchase_price_national,purchase_price_foreign,price,status',
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ])
            ->join('users as creator', 'creator.id', '=', 'purchase_orders.created_by')
            ->join('users as updater', 'updater.id', '=', 'purchase_orders.updated_by');

        $scopeKey = BusinessScope::scopedKeyForRequest(request());
        $query->whereHas('business', function ($business) use ($scopeKey) {
            $business->whereIn('business_key', BusinessScope::fixedKeys());
            if ($scopeKey) $business->where('business_key', $scopeKey);
        });

        if (Schema::hasColumn('purchase_orders', 'module_scope')) {
            $query->where(function ($scope) {
                $scope->where('purchase_orders.module_scope', $this->moduleScope);
                if ($this->moduleScope === 'standard') {
                    $scope->orWhereNull('purchase_orders.module_scope');
                }
            });
        }

        return $query;
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $userId = Auth::id();
        $purchaseOrderId = $body['id'] ?? null;

        $businessId = $body['business_id'] ?? null;
        $branchId = $body['business_branch_id'] ?? null;
        $warehouseId = $body['warehouse_id'] ?? null;
        $supplierId = $body['supplier_id'] ?? null;
        $issueDate = $this->normalizeDate($body['issue_date'] ?? now()->toDateString());
        $expectedDate = $this->normalizeDate($body['expected_date'] ?? null);
        $maxDeliveryDate = $this->normalizeDate($body['max_delivery_date'] ?? null);
        $currency = strtoupper(trim((string)($body['currency'] ?? 'PEN')));
        $paymentCondition = $this->normalizePaymentCondition($body['payment_condition'] ?? 'Contado');
        $paymentMethod = trim((string)($body['payment_method'] ?? '')) ?: null;
        $documentType = trim((string)($body['document_type'] ?? '')) ?: null;
        $orderStatus = $this->normalizeOrderStatus($body['order_status'] ?? 'draft');
        $approvalStatus = $this->normalizeApprovalStatus($body['approval_status'] ?? 'pending');
        $buyerName = trim((string)($body['buyer_name'] ?? ''));

        if (!$businessId) throw new \Exception('La empresa es obligatoria');
        if (!$warehouseId) throw new \Exception('El almacen es obligatorio');
        if (!$supplierId) throw new \Exception('El proveedor es obligatorio');
        if (!$issueDate) throw new \Exception('La fecha de emision es obligatoria');

        if ($purchaseOrderId && !$this->scopedPurchaseOrderMutationQuery($purchaseOrderId)->exists()) {
            throw new \Exception('Orden de compra no encontrada en este modulo');
        }

        $business = BusinessScope::findFixedBusinessForRequest($businessId, $request);
        $warehouse = Warehouse::findOrFail($warehouseId);
        $this->scopedSupplierQuery()->findOrFail($supplierId);

        $body['business_branch_id'] = BusinessScope::branchIdFromWarehouse($business, $warehouse, $branchId);

        $rawItems = $body['items'] ?? [];
        if (is_string($rawItems)) {
            $decoded = json_decode($rawItems, true);
            $rawItems = is_array($decoded) ? $decoded : [];
        }
        if (!is_array($rawItems)) $rawItems = [];
        $this->itemsPayload = $rawItems;
        unset($body['items']);

        if (!$purchaseOrderId) {
            $body['code'] = $this->nextCode();
            $body['created_by'] = $userId;
            $body['status'] = true;
        }

        $body['updated_by'] = $userId;
        $body['module_scope'] = $this->moduleScope;
        $body['buyer_name'] = $buyerName ?: null;
        $body['issue_date'] = $issueDate;
        $body['expected_date'] = $expectedDate;
        $body['max_delivery_date'] = $maxDeliveryDate;
        $body['delivery_place'] = trim((string)($body['delivery_place'] ?? '')) ?: null;
        $body['currency'] = in_array($currency, ['PEN', 'USD', 'EUR']) ? $currency : 'PEN';
        $body['payment_condition'] = $paymentCondition;
        $body['payment_method'] = $paymentMethod;
        $body['document_type'] = $documentType;
        $body['article_type'] = $this->moduleScope === 'magistrales'
            ? $this->normalizeMagistralPurchaseArticleType($body['article_type'] ?? null)
            : (trim((string)($body['article_type'] ?? '')) ?: null);
        if (Schema::hasColumn('purchase_orders', 'affects_igv')) {
            $body['affects_igv'] = $this->moduleScope === 'magistrales'
                ? $this->toBoolean($body['affects_igv'] ?? true)
                : (array_key_exists('affects_igv', $body) ? $this->toBoolean($body['affects_igv']) : null);
        }
        $body['order_status'] = $orderStatus;
        $body['approval_status'] = $approvalStatus;
        $body['observations'] = trim((string)($body['observations'] ?? '')) ?: null;
        $body['subtotal'] = $this->toNullableDecimal($body['subtotal'] ?? null) ?? 0;
        $body['tax_amount'] = $this->toNullableDecimal($body['tax_amount'] ?? null) ?? 0;
        $body['total'] = $this->toNullableDecimal($body['total'] ?? null) ?? 0;

        foreach (['module_scope', 'buyer_name', 'article_type', 'max_delivery_date', 'delivery_place', 'payment_method', 'document_type', 'affects_igv'] as $column) {
            if (!Schema::hasColumn('purchase_orders', $column)) unset($body[$column]);
        }

        return $body;
    }

    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        DB::beginTransaction();
        try {
            PurchaseOrderItem::where('purchase_order_id', $jpa->id)->delete();
            $hasPresentationId = Schema::hasColumn('purchase_order_items', 'presentation_id');
            $hasPresentationLabel = Schema::hasColumn('purchase_order_items', 'presentation_label');
            $hasPresentationUnits = Schema::hasColumn('purchase_order_items', 'presentation_units');
            $hasLastPrice = Schema::hasColumn('purchase_order_items', 'last_price');

            $inserted = 0;
            $grossSubtotal = 0;
            // El modulo GENERAL de O. Compra unifico las ordenes del almacen fijo de Magistrales
            // (purchase_orders.module_scope='magistrales' -> 'standard', ver migracion
            // rescope_magistral_purchase_orders). Los articulos de catalogo magistral solo pueden
            // agregarse a una orden cuyo almacen de destino sea ese almacen fijo; para cualquier
            // otro almacen el filtro de articulos por module_scope se mantiene exactamente igual a hoy.
            $effectiveArticleScope = $this->articleScopeForWarehouse((int)($jpa->warehouse_id ?? 0));
            foreach ($this->itemsPayload as $item) {
                if (!is_array($item)) continue;

                $articleId = $item['article_id'] ?? null;
                if (!$articleId) throw new \Exception('Cada linea debe tener articulo');
                $article = $this->scopedArticleQuery($effectiveArticleScope)->findOrFail($articleId);
                if ($this->moduleScope === 'magistrales') {
                    $this->assertMagistralArticleMatchesPurchaseType($article, (string)$jpa->article_type);
                }
                $presentation = null;
                $presentationId = $hasPresentationId ? $this->toNullableInt($item['presentation_id'] ?? null) : null;
                if ($presentationId) {
                    $presentation = ArticlePresentation::where('article_id', $article->id)->findOrFail($presentationId);
                }

                $requestedQuantity = $this->toNullableDecimal($item['requested_quantity'] ?? null) ?? 0;
                $receivedQuantity = $this->toNullableDecimal($item['received_quantity'] ?? null) ?? 0;
                $priceUnit = $this->toNullableDecimal($item['price_unit'] ?? null) ?? 0;
                $presentationUnits = $this->toNullableDecimal($item['presentation_units'] ?? null) ?? (float) ($presentation->units ?? 1);
                $presentationLabel = trim((string) ($item['presentation_label'] ?? ''))
                    ?: ($presentation?->name ?: ($article->magistral_presentation ?: ($article->unit?->symbol ?: $article->unit?->name)));
                $lastPrice = $this->toNullableDecimal($item['last_price'] ?? null);

                if ($requestedQuantity <= 0) {
                    throw new \Exception("La cantidad solicitada debe ser mayor a 0 para {$article->name}");
                }
                if ($receivedQuantity < 0) {
                    throw new \Exception("La cantidad recepcionada no puede ser negativa para {$article->name}");
                }

                $lineTotal = $this->toNullableDecimal($item['total'] ?? null);
                if (is_null($lineTotal) || $lineTotal < 0) {
                    $lineTotal = (float)$requestedQuantity * (float)$priceUnit;
                }

                PurchaseOrderItem::create([
                    'purchase_order_id' => $jpa->id,
                    'article_id' => $article->id,
                    ...($hasPresentationId ? ['presentation_id' => $presentation?->id] : []),
                    ...($hasPresentationLabel ? ['presentation_label' => $presentationLabel ?: null] : []),
                    ...($hasPresentationUnits ? ['presentation_units' => $presentationUnits] : []),
                    ...($hasLastPrice ? ['last_price' => $lastPrice] : []),
                    'requested_quantity' => $requestedQuantity,
                    'received_quantity' => $receivedQuantity,
                    'price_unit' => $priceUnit,
                    'total' => $lineTotal,
                    'status' => isset($item['status']) ? (bool)$item['status'] : true,
                ]);

                $grossSubtotal += $lineTotal;
                $inserted++;
            }

            if ($inserted === 0) throw new \Exception('Debes agregar al menos un item');

            $grossSubtotal = round($grossSubtotal, 2);
            $taxAmount = $this->toNullableDecimal($request->input('tax_amount')) ?? 0;
            $total = $this->toNullableDecimal($request->input('total'));
            $subtotal = $grossSubtotal;

            if ($this->moduleScope === 'magistrales' && Schema::hasColumn('purchase_orders', 'affects_igv')) {
                $affectsIgv = (bool) $jpa->affects_igv;
                if ($affectsIgv) {
                    $subtotal = round($grossSubtotal / 1.18, 2);
                    $taxAmount = round($grossSubtotal - $subtotal, 2);
                    $total = $grossSubtotal;
                } else {
                    $subtotal = $grossSubtotal;
                    $taxAmount = 0;
                    $total = $grossSubtotal;
                }
            } else {
                $subtotal = round($subtotal, 2);
                $taxAmount = round($taxAmount, 2);
                $total = is_null($total) ? round($subtotal + $taxAmount, 2) : round($total, 2);
            }

            $jpa->update([
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'total' => $total,
            ]);

            $this->syncAccountsPayable($jpa->fresh());

            DB::commit();

            return $jpa->fresh([
                'business',
                'branch',
                'warehouse',
                'supplier',
                'items.article.laboratory',
                'items.article.activePrinciple',
                'items.article.unit',
                'items.article.presentations',
                'items.presentation',
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
            $field = $this->allowedBooleanFieldFromRequest($request);
            $data = [];
            $data[$field] = $request->value;
            $data['updated_by'] = Auth::id();
            $updated = $this->scopedPurchaseOrderMutationQuery($request->id)->update($data);
            if (!$updated) throw new \Exception('Orden de compra no encontrada en este modulo');

            $purchaseOrder = $this->scopedPurchaseOrderMutationQuery($request->id)->firstOrFail();
            $this->syncAccountsPayable($purchaseOrder->fresh());

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
            $purchaseOrder = $this->scopedPurchaseOrderMutationQuery($id)->firstOrFail();
            $purchaseOrder->update([
                'status' => null,
                'updated_by' => Auth::id(),
            ]);

            $this->syncAccountsPayable($purchaseOrder->fresh());

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
        try {
            $updated = $this->scopedPurchaseOrderMutationQuery($request->id)->update([
                'status' => $request->status ? 0 : 1,
                'updated_by' => Auth::id(),
            ]);
            if (!$updated) throw new \Exception('Orden de compra no encontrada en este modulo');
            $response->status = 200;
            $response->message = 'Operacion correcta';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
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
        $text = trim((string) $value);
        if ($text === '') return null;
        if (!is_numeric($text)) throw new \Exception("Valor entero invalido: {$value}");
        return (int) $text;
    }

    private function toBoolean($value): bool
    {
        if (is_bool($value)) return $value;
        if (is_numeric($value)) return (int) $value === 1;

        $normalized = mb_strtolower(trim((string) $value));
        return in_array($normalized, ['1', 'true', 'si', 'sí', 'yes', 'on'], true);
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

    private function normalizePaymentCondition($value): string
    {
        $normalized = mb_strtolower(trim((string)$value));
        return $normalized === 'credito' ? 'Credito' : 'Contado';
    }

    private function normalizeOrderStatus($value): string
    {
        $allowed = ['draft', 'approved', 'partial', 'completed', 'cancelled'];
        $normalized = mb_strtolower(trim((string)$value));
        return in_array($normalized, $allowed, true) ? $normalized : 'draft';
    }

    private function normalizeApprovalStatus($value): string
    {
        $allowed = ['pending', 'approved', 'rejected'];
        $normalized = mb_strtolower(trim((string)$value));
        return in_array($normalized, $allowed, true) ? $normalized : 'pending';
    }

    private function normalizeMagistralPurchaseArticleType($value): string
    {
        $normalized = mb_strtolower(trim((string)$value));
        if ($normalized === '') {
            throw new \Exception('El tipo de articulo es obligatorio');
        }

        if (str_contains($normalized, 'comercial')) return 'PRODUCTOS COMERCIALES';
        if (str_contains($normalized, 'insumo') || str_contains($normalized, 'envase')) return 'INSUMOS Y ENVASES';

        throw new \Exception('El tipo de articulo no es valido para ordenes de compra magistrales');
    }

    private function assertMagistralArticleMatchesPurchaseType(Article $article, string $purchaseType): void
    {
        $articleType = mb_strtoupper(trim((string)$article->article_type));
        $allowed = match ($purchaseType) {
            'INSUMOS Y ENVASES' => ['INSUMO', 'INSUMOS', 'ENVASE', 'ENVASES'],
            'PRODUCTOS COMERCIALES' => ['PRODUCTO COMERCIAL', 'PRODUCTOS COMERCIALES'],
            default => [],
        };

        if (!in_array($articleType, $allowed, true)) {
            throw new \Exception("El articulo {$article->code} - {$article->name} no corresponde al tipo {$purchaseType}");
        }
    }

    private function syncAccountsPayable(PurchaseOrder $purchaseOrder): void
    {
        app(AccountsPayableService::class)->syncFromPurchaseOrder($purchaseOrder);
    }

    private function scopedPurchaseOrderMutationQuery($id)
    {
        return $this->model::query()
            ->where($this->identifier, $id)
            ->when(Schema::hasColumn('purchase_orders', 'module_scope'), function ($query) {
                $query->where(function ($scope) {
                    $scope->where('module_scope', $this->moduleScope);
                    if ($this->moduleScope === 'standard') {
                        $scope->orWhereNull('module_scope');
                    }
                });
            });
    }

    private function scopedSupplierQuery()
    {
        // Los proveedores de Magistrales se unificaron al catalogo general (scope standard).
        $scopeKey = $this->moduleScope === 'magistrales' ? 'standard' : $this->moduleScope;

        return Supplier::query()
            ->when(Schema::hasColumn('suppliers', 'module_scope'), function ($query) use ($scopeKey) {
                $query->where(function ($scope) use ($scopeKey) {
                    $scope->where('module_scope', $scopeKey);
                    if ($scopeKey === 'standard') {
                        $scope->orWhereNull('module_scope');
                    }
                });
            });
    }

    /**
     * El selector de articulos del PO general muestra el catalogo de Magistrales o de Muestras
     * cuando la orden apunta al almacen fijo respectivo (MagistralesWarehouse::idOrNull() /
     * SamplesWarehouse::idOrNull()). DEBE mantenerse en sincronia con
     * ArticleController::pickerEffectiveModuleScope(): lo que ese picker ofrece es lo que aqui
     * se valida al guardar (scopedArticleQuery). Fuera de esos almacenes fijos devuelve
     * $this->moduleScope sin cambios (comportamiento estandar intacto).
     */
    private function articleScopeForWarehouse(?int $warehouseId): string
    {
        if ($this->moduleScope !== 'standard') return $this->moduleScope;
        if (!$warehouseId) return $this->moduleScope;

        $magistralesWarehouseId = MagistralesWarehouse::idOrNull();
        if ($magistralesWarehouseId && $warehouseId === $magistralesWarehouseId) {
            return 'magistrales';
        }

        $samplesWarehouseId = SamplesWarehouse::idOrNull();
        if ($samplesWarehouseId && $warehouseId === $samplesWarehouseId) {
            return 'muestras';
        }

        return $this->moduleScope;
    }

    private function scopedArticleQuery(?string $scope = null)
    {
        $scope = $scope ?? $this->moduleScope;

        return Article::query()
            ->when(Schema::hasColumn('articles', 'module_scope'), function ($query) use ($scope) {
                $query->where(function ($q) use ($scope) {
                    $q->where('module_scope', $scope);
                    if ($scope === 'standard') {
                        $q->orWhereNull('module_scope');
                    }
                });
            });
    }

    private function nextCode(): string
    {
        $next = 1;
        $latest = PurchaseOrder::query()->latest('id')->value('code');
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) {
            $next = ((int)$matches[1]) + 1;
        }
        return 'OC-' . str_pad((string)$next, 6, '0', STR_PAD_LEFT);
    }
}
