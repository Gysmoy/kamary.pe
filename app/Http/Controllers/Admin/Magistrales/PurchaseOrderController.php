<?php

namespace App\Http\Controllers\Admin\Magistrales;

use App\Http\Controllers\Admin\PurchaseOrderController as BasePurchaseOrderController;
use App\Models\MagistralIncome;
use App\Models\MagistralIncomeItem;
use App\Models\PurchaseOrder;
use App\Support\BusinessScope;
use App\Support\MagistralesInputWarehouse;
use App\Support\MagistralesWarehouse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PurchaseOrderController extends BasePurchaseOrderController
{
    protected string $moduleScope = 'magistrales';

    public function setReactViewProperties(Request $request)
    {
        return [
            'moduleScope' => 'magistrales',
            'moduleTitle' => 'Magistrales - O. Compra',
            'requiredPermission' => ['magistrales-purchase-order', 'magistrales-procurement'],
            'fixedWarehouse' => MagistralesWarehouse::summary(),
            'inputWarehouse' => MagistralesInputWarehouse::summary(),
        ];
    }

    public function save(Request $request): HttpResponse|ResponseFactory
    {
        $this->forceMagistralesScope($request);
        DB::beginTransaction();

        try {
            $response = parent::save($request);
            $statusCode = method_exists($response, 'getStatusCode') ? $response->getStatusCode() : 500;

            if ($statusCode >= 400) {
                DB::rollBack();
            } else {
                $this->syncInputIncomeFromResponse($response);
                DB::commit();
            }

            return $response;
        } catch (\Throwable $th) {
            DB::rollBack();
            throw $th;
        }
    }

    public function paginate(Request $request): HttpResponse|ResponseFactory
    {
        $this->forceMagistralesScope($request);
        return parent::paginate($request);
    }

    public function branches(Request $request, string $businessId): HttpResponse|ResponseFactory
    {
        $this->forceMagistralesScope($request);
        return parent::branches($request, $businessId);
    }

    private function forceMagistralesScope(Request $request): void
    {
        $warehouse = $this->usesInputWarehouse($request->input('article_type'))
            ? MagistralesInputWarehouse::warehouse()
            : MagistralesWarehouse::warehouse();

        $request->merge([
            'business_scope_key' => BusinessScope::KAMARY_MEDICALS,
            'warehouse_id' => $warehouse->id,
            'business_branch_id' => $warehouse->business_branch_id,
            'business_id' => $warehouse->branch?->business_id,
        ]);
    }

    private function usesInputWarehouse($articleType): bool
    {
        $normalized = mb_strtolower(trim((string)$articleType));

        return str_contains($normalized, 'insumo') || str_contains($normalized, 'envase');
    }

    private function syncInputIncomeFromResponse(HttpResponse|ResponseFactory $response): void
    {
        if (
            !Schema::hasTable('purchase_orders')
            || !Schema::hasTable('magistral_incomes')
            || !Schema::hasTable('magistral_income_items')
        ) {
            return;
        }

        $payload = json_decode((string) $response->getContent(), true);
        $purchaseOrderId = $payload['data']['id'] ?? null;
        if (!$purchaseOrderId) return;

        $purchaseOrder = PurchaseOrder::with(['items.article'])
            ->where('module_scope', 'magistrales')
            ->find($purchaseOrderId);
        if (!$purchaseOrder) return;

        if (
            !$this->usesInputWarehouse($purchaseOrder->article_type)
            || $purchaseOrder->status === null
            || $purchaseOrder->order_status === 'cancelled'
            || $purchaseOrder->approval_status === 'rejected'
        ) {
            $this->deactivateSyncedIncome($purchaseOrder);
            return;
        }

        $items = $purchaseOrder->items
            ->filter(fn($item) => $item->status !== null && (float)$item->received_quantity > 0)
            ->values();

        if ($items->isEmpty()) {
            $this->deactivateSyncedIncome($purchaseOrder);
            return;
        }

        $warehouse = MagistralesInputWarehouse::warehouse();
        $affectsIgv = (bool) ($purchaseOrder->affects_igv ?? true);
        $subtotal = 0;
        $total = 0;

        $income = MagistralIncome::query()->firstOrNew([
            'purchase_order_code' => $purchaseOrder->code,
            'origin' => 'Orden de compra magistral',
        ]);

        if (!$income->exists) {
            $income->code = $this->nextSyncedIncomeCode($purchaseOrder);
            $income->created_by = $purchaseOrder->created_by;
        }

        $income->fill([
            'document_type' => $purchaseOrder->document_type,
            'business_id' => $warehouse->branch?->business_id,
            'warehouse_id' => $warehouse->id,
            'supplier_id' => $purchaseOrder->supplier_id,
            'payment_method' => $purchaseOrder->payment_method,
            'currency' => $purchaseOrder->currency,
            'affects_igv' => $affectsIgv,
            'issue_date' => $purchaseOrder->issue_date,
            'observations' => trim((string) $purchaseOrder->observations) ?: 'Ingreso automatico desde orden de compra ' . $purchaseOrder->code,
            'status' => true,
            'updated_by' => $purchaseOrder->updated_by,
        ]);
        $income->save();

        MagistralIncomeItem::where('magistral_income_id', $income->id)->delete();

        foreach ($items as $item) {
            $quantity = (float) $item->received_quantity;
            $priceWithIgv = (float) $item->price_unit;
            $priceWithoutIgv = $affectsIgv ? round($priceWithIgv / 1.18, 4) : $priceWithIgv;
            $lineTotal = round($quantity * $priceWithIgv, 2);

            MagistralIncomeItem::create([
                'magistral_income_id' => $income->id,
                'article_id' => $item->article_id,
                'description' => $item->article?->name,
                'quantity' => $quantity,
                'presentation' => $item->presentation_label,
                'expiration_date' => null,
                'lot' => null,
                'price_without_igv' => $priceWithoutIgv,
                'price_with_igv' => $priceWithIgv,
                'subtotal' => $lineTotal,
                'status' => true,
            ]);

            $subtotal += round($quantity * $priceWithoutIgv, 2);
            $total += $lineTotal;
        }

        $income->update([
            'subtotal' => round($subtotal, 2),
            'igv' => $affectsIgv ? round(max(0, $total - $subtotal), 2) : 0,
            'total' => round($total, 2),
        ]);
    }

    private function deactivateSyncedIncome(PurchaseOrder $purchaseOrder): void
    {
        MagistralIncome::query()
            ->where('purchase_order_code', $purchaseOrder->code)
            ->where('origin', 'Orden de compra magistral')
            ->update(['status' => null, 'updated_by' => $purchaseOrder->updated_by]);
    }

    private function nextSyncedIncomeCode(PurchaseOrder $purchaseOrder): string
    {
        $baseCode = 'ING-' . $purchaseOrder->code;
        $exists = MagistralIncome::query()->where('code', $baseCode)->exists();
        if (!$exists) return $baseCode;

        $next = 1;
        do {
            $code = $baseCode . '-' . $next;
            $next++;
        } while (MagistralIncome::query()->where('code', $code)->exists());

        return $code;
    }
}
