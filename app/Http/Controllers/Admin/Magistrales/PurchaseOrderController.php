<?php

namespace App\Http\Controllers\Admin\Magistrales;

use App\Http\Controllers\Admin\PurchaseOrderController as BasePurchaseOrderController;
use App\Support\BusinessScope;
use App\Support\MagistralesWarehouse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\DB;

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
        $warehouse = MagistralesWarehouse::warehouse();
        $request->merge([
            'business_scope_key' => BusinessScope::KAMARY_MEDICALS,
            'warehouse_id' => $warehouse->id,
            'business_branch_id' => $warehouse->business_branch_id,
            'business_id' => $warehouse->branch?->business_id,
        ]);
    }
}
