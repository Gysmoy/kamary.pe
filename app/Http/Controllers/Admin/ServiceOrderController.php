<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\Business;
use App\Models\Client;
use App\Models\ServiceCatalog;
use App\Models\ServiceOrder;
use App\Models\ServiceOrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ServiceOrderController extends BasicController
{
    public $model = ServiceOrder::class;
    public $reactView = 'Admin/ServiceOrders';
    public $prefix4filter = 'service_orders';

    private array $itemsPayload = [];

    public function setReactViewProperties(Request $request)
    {
        return ['requiredPermission' => 'services-service-order'];
    }

    public function setPaginationInstance(string $model)
    {
        return $model::select('service_orders.*')
            ->with([
                'business:id,name', 'branch:id,business_id,name', 'client:id,full_name,document_number', 'seller:id,name,lastname,username,fullname',
                'accountsReceivable:id,service_order_id,code,total,paid_amount,balance_amount,payment_status,status',
                'items:id,service_order_id,service_id,description,quantity,unit_price,detraction_percent,commission_percent,total,status',
                'items.service:id,code,name,category,subcategory,billing_unit',
                'creator:id,name,lastname,username,fullname', 'updater:id,name,lastname,username,fullname',
            ])
            ->join('users as creator', 'creator.id', '=', 'service_orders.created_by')
            ->join('users as updater', 'updater.id', '=', 'service_orders.updated_by');
    }

    public function branches(Request $request, string $businessId)
    {
        $business = Business::findOrFail($businessId);
        return response([
            'status' => 200,
            'message' => 'Operacion correcta',
            'data' => $business->branches()->whereNotNull('status')->orderBy('name')->get(['id', 'business_id', 'name', 'status']),
        ], 200);
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $userId = Auth::id();
        $id = $body['id'] ?? null;
        $businessId = (int) ($body['business_id'] ?? 0);
        $branchId = $this->toNullableInt($body['business_branch_id'] ?? null);
        $clientId = (int) ($body['client_id'] ?? 0);
        $sellerId = $this->toNullableInt($body['seller_id'] ?? null) ?: $userId;
        $issueDate = $this->normalizeDate($body['issue_date'] ?? now()->toDateString());

        if ($businessId <= 0) throw new \Exception('La empresa es obligatoria');
        if ($clientId <= 0) throw new \Exception('El cliente es obligatorio');
        if (!$issueDate) throw new \Exception('La fecha es obligatoria');

        Business::findOrFail($businessId);
        $client = Client::findOrFail($clientId);
        if ($client->client_kind !== 'regular') throw new \Exception('La orden de servicio debe trabajar con cliente regular');

        if ($branchId) {
            $branch = Business::findOrFail($businessId)->branches()->where('id', $branchId)->first();
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

        if (!$id) {
            $body['code'] = $this->nextCode();
            $body['created_by'] = $userId;
            $body['status'] = true;
        }

        $body['updated_by'] = $userId;
        $body['business_id'] = $businessId;
        $body['business_branch_id'] = $branchId;
        $body['client_id'] = $clientId;
        $body['seller_id'] = $sellerId;
        $body['expected_document_type'] = trim((string) ($body['expected_document_type'] ?? 'Factura')) ?: 'Factura';
        $body['currency'] = strtoupper(trim((string) ($body['currency'] ?? 'PEN')));
        $body['billing_cycle'] = trim((string) ($body['billing_cycle'] ?? '')) ?: null;
        $body['payment_condition'] = $this->normalizePaymentCondition($body['payment_condition'] ?? 'Contado');
        $body['installments'] = max(1, $this->toNullableInt($body['installments'] ?? null) ?? 1);
        $body['issue_date'] = $issueDate;
        $body['scheduled_at'] = $this->normalizeDate($body['scheduled_at'] ?? null);
        $body['first_due_date'] = $this->normalizeDate($body['first_due_date'] ?? null);
        $body['order_status'] = $this->normalizeOrderStatus($body['order_status'] ?? 'draft');
        $body['billing_status'] = $this->normalizeBillingStatus($body['billing_status'] ?? 'pending');
        $body['observations'] = trim((string) ($body['observations'] ?? '')) ?: null;
        $body['subtotal'] = 0;
        $body['tax_amount'] = $this->toDecimal($body['tax_amount'] ?? 0);
        $body['total'] = 0;
        $body['paid_amount'] = $this->toDecimal($body['paid_amount'] ?? 0);
        $body['balance_amount'] = $this->toDecimal($body['balance_amount'] ?? 0);
        $body['payment_status'] = $this->normalizePaymentStatus($body['payment_status'] ?? 'pending');
        $body['billed_at'] = $body['billing_status'] === 'billed' ? ($body['billed_at'] ?? now()) : null;

        return $body;
    }

    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        DB::beginTransaction();
        try {
            ServiceOrderItem::where('service_order_id', $jpa->id)->delete();
            $inserted = 0;
            $subtotal = 0;

            foreach ($this->itemsPayload as $item) {
                if (!is_array($item)) continue;
                $serviceId = $this->toNullableInt($item['service_id'] ?? null);
                if (!$serviceId) throw new \Exception('Cada linea debe tener servicio');
                $service = ServiceCatalog::findOrFail($serviceId);
                $quantity = $this->toDecimal($item['quantity'] ?? 0, 3);
                if ($quantity <= 0) throw new \Exception("La cantidad debe ser mayor a 0 para {$service->name}");
                $unitPrice = $this->toDecimal($item['unit_price'] ?? ($jpa->currency === 'USD' ? $service->unit_price_usd : $service->unit_price_pen));
                $detraction = $this->toDecimal($item['detraction_percent'] ?? 0);
                $commission = $this->toDecimal($item['commission_percent'] ?? 0);
                $total = $this->toDecimal($item['total'] ?? round($quantity * $unitPrice, 2));

                ServiceOrderItem::create([
                    'service_order_id' => $jpa->id,
                    'service_id' => $service->id,
                    'description' => trim((string) ($item['description'] ?? '')) ?: $service->name,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'detraction_percent' => $detraction,
                    'commission_percent' => $commission,
                    'total' => $total,
                    'status' => true,
                ]);
                $subtotal += $total;
                $inserted++;
            }

            if ($inserted === 0) throw new \Exception('Debes agregar al menos una linea de servicio');

            $subtotal = round($subtotal, 2);
            $taxAmount = round((float) ($request->input('tax_amount') ?? 0), 2);
            $total = round($subtotal + $taxAmount, 2);
            $jpa->update(['subtotal' => $subtotal, 'total' => $total, 'balance_amount' => $total]);

            app(\App\Services\AccountsReceivableService::class)->syncFromServiceOrder($jpa->fresh([
                'client',
                'business',
                'branch',
                'accountsReceivable',
            ]));

            DB::commit();
            return $jpa->fresh(['business', 'branch', 'client', 'seller', 'accountsReceivable', 'items.service', 'creator', 'updater']);
        } catch (\Throwable $th) {
            DB::rollBack();
            throw $th;
        }
    }

    public function boolean(Request $request)
    {
        $response = new \SoDe\Extend\Response();
        DB::beginTransaction();
        try {
            $order = ServiceOrder::findOrFail($request->id);
            $field = trim((string) $request->field);
            if ($field === '') throw new \Exception('Campo invalido');

            $order->update([
                $field => $request->value,
                'updated_by' => Auth::id(),
            ]);

            app(\App\Services\AccountsReceivableService::class)->syncFromServiceOrder($order->fresh([
                'client',
                'business',
                'branch',
                'accountsReceivable',
            ]));

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
        $response = new \SoDe\Extend\Response();
        DB::beginTransaction();
        try {
            $order = ServiceOrder::findOrFail($request->id);
            $order->update([
                'status' => $request->status ? 0 : 1,
                'updated_by' => Auth::id(),
            ]);

            app(\App\Services\AccountsReceivableService::class)->syncFromServiceOrder($order->fresh([
                'client',
                'business',
                'branch',
                'accountsReceivable',
            ]));

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
        $response = new \SoDe\Extend\Response();
        DB::beginTransaction();
        try {
            $order = ServiceOrder::findOrFail($id);
            $order->update([
                'status' => null,
                'updated_by' => Auth::id(),
            ]);

            app(\App\Services\AccountsReceivableService::class)->syncFromServiceOrder($order->fresh([
                'client',
                'business',
                'branch',
                'accountsReceivable',
            ]));

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

    private function toNullableInt($value): ?int
    {
        if ($value === null) return null;
        $text = trim((string) $value);
        if ($text === '') return null;
        if (!ctype_digit(ltrim($text, '+'))) throw new \Exception("Valor entero invalido: {$value}");
        return (int) $text;
    }

    private function toDecimal($value, int $precision = 2): float
    {
        $text = trim((string) $value);
        if ($text === '') return 0;
        if (!is_numeric($text)) throw new \Exception("Valor numerico invalido: {$value}");
        return round((float) $text, $precision);
    }

    private function normalizeDate($value): ?string
    {
        if ($value === null) return null;
        $text = trim((string) $value);
        if ($text === '') return null;
        $timestamp = strtotime($text);
        if ($timestamp === false) throw new \Exception("Fecha invalida: {$value}");
        return date('Y-m-d', $timestamp);
    }

    private function normalizePaymentCondition($value): string
    {
        $normalized = mb_strtolower(trim((string) $value));
        return $normalized === 'credito' ? 'Credito' : 'Contado';
    }

    private function normalizeOrderStatus($value): string
    {
        $allowed = ['draft', 'approved', 'scheduled', 'executing', 'prefactured', 'invoiced', 'closed', 'cancelled'];
        $normalized = mb_strtolower(trim((string) $value));
        return in_array($normalized, $allowed, true) ? $normalized : 'draft';
    }

    private function normalizeBillingStatus($value): string
    {
        $allowed = ['pending', 'partial', 'billed', 'cancelled'];
        $normalized = mb_strtolower(trim((string) $value));
        return in_array($normalized, $allowed, true) ? $normalized : 'pending';
    }

    private function normalizePaymentStatus($value): string
    {
        $allowed = ['pending', 'partial', 'paid'];
        $normalized = mb_strtolower(trim((string) $value));
        return in_array($normalized, $allowed, true) ? $normalized : 'pending';
    }

    private function nextCode(): string
    {
        $next = 1;
        $latest = ServiceOrder::query()->latest('id')->value('code');
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) $next = ((int) $matches[1]) + 1;
        return 'OS-' . str_pad((string) $next, 6, '0', STR_PAD_LEFT);
    }
}
