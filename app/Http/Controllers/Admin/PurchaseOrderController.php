<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\Article;
use App\Models\Business;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\Supplier;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use SoDe\Extend\Response;

class PurchaseOrderController extends BasicController
{
    public $model = PurchaseOrder::class;
    public $reactView = 'Admin/PurchaseOrders';
    public $prefix4filter = 'purchase_orders';

    private array $itemsPayload = [];

    public function setPaginationInstance(string $model)
    {
        return $model::select('purchase_orders.*')
            ->with([
                'business:id,name',
                'branch:id,business_id,name',
                'warehouse:id,name',
                'supplier:id,ruc,business_name',
                'items:id,purchase_order_id,article_id,requested_quantity,received_quantity,price_unit,total,status',
                'items.article:id,code,name,laboratory_id,active_principle_id,unit_id',
                'items.article.laboratory:id,name',
                'items.article.activePrinciple:id,name',
                'items.article.unit:id,name,symbol',
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ])
            ->join('users as creator', 'creator.id', '=', 'purchase_orders.created_by')
            ->join('users as updater', 'updater.id', '=', 'purchase_orders.updated_by');
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
        $currency = strtoupper(trim((string)($body['currency'] ?? 'PEN')));
        $paymentCondition = $this->normalizePaymentCondition($body['payment_condition'] ?? 'Contado');
        $orderStatus = $this->normalizeOrderStatus($body['order_status'] ?? 'draft');
        $approvalStatus = $this->normalizeApprovalStatus($body['approval_status'] ?? 'pending');

        if (!$businessId) throw new \Exception('La empresa es obligatoria');
        if (!$warehouseId) throw new \Exception('El almacen es obligatorio');
        if (!$supplierId) throw new \Exception('El proveedor es obligatorio');
        if (!$issueDate) throw new \Exception('La fecha de emision es obligatoria');

        Business::findOrFail($businessId);
        $warehouse = Warehouse::findOrFail($warehouseId);
        Supplier::findOrFail($supplierId);

        $body['business_branch_id'] = ($branchId === '' || is_null($branchId)) ? null : (int)$branchId;
        if (!is_null($warehouse->business_branch_id)) {
            if (is_null($body['business_branch_id'])) {
                $body['business_branch_id'] = (int)$warehouse->business_branch_id;
            } elseif ((int)$body['business_branch_id'] !== (int)$warehouse->business_branch_id) {
                throw new \Exception('El almacen seleccionado no pertenece a la sede elegida');
            }
        }

        if ($body['business_branch_id']) {
            $branch = Business::findOrFail($businessId)
                ->branches()
                ->where('id', $body['business_branch_id'])
                ->first();
            if (!$branch) throw new \Exception('La sede no pertenece a la empresa seleccionada');
        }

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
        $body['issue_date'] = $issueDate;
        $body['expected_date'] = $expectedDate;
        $body['currency'] = in_array($currency, ['PEN', 'USD', 'EUR']) ? $currency : 'PEN';
        $body['payment_condition'] = $paymentCondition;
        $body['order_status'] = $orderStatus;
        $body['approval_status'] = $approvalStatus;
        $body['observations'] = trim((string)($body['observations'] ?? '')) ?: null;
        $body['subtotal'] = $this->toNullableDecimal($body['subtotal'] ?? null) ?? 0;
        $body['tax_amount'] = $this->toNullableDecimal($body['tax_amount'] ?? null) ?? 0;
        $body['total'] = $this->toNullableDecimal($body['total'] ?? null) ?? 0;

        return $body;
    }

    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        DB::beginTransaction();
        try {
            PurchaseOrderItem::where('purchase_order_id', $jpa->id)->delete();

            $inserted = 0;
            $subtotal = 0;
            foreach ($this->itemsPayload as $item) {
                if (!is_array($item)) continue;

                $articleId = $item['article_id'] ?? null;
                if (!$articleId) throw new \Exception('Cada linea debe tener articulo');
                $article = Article::findOrFail($articleId);

                $requestedQuantity = $this->toNullableDecimal($item['requested_quantity'] ?? null) ?? 0;
                $receivedQuantity = $this->toNullableDecimal($item['received_quantity'] ?? null) ?? 0;
                $priceUnit = $this->toNullableDecimal($item['price_unit'] ?? null) ?? 0;

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
                    'requested_quantity' => $requestedQuantity,
                    'received_quantity' => $receivedQuantity,
                    'price_unit' => $priceUnit,
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
            ]);

            DB::commit();

            return $jpa->fresh([
                'business',
                'branch',
                'warehouse',
                'supplier',
                'items.article.laboratory',
                'items.article.activePrinciple',
                'items.article.unit',
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
            $business = Business::findOrFail($businessId);
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

    private function toNullableDecimal($value): ?float
    {
        if ($value === null) return null;
        $text = trim((string)$value);
        if ($text === '') return null;
        if (!is_numeric($text)) throw new \Exception("Valor numerico invalido: {$value}");
        return (float)$text;
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
