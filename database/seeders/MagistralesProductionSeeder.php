<?php

namespace Database\Seeders;

use App\Models\AccountsPayable;
use App\Models\Article;
use App\Models\Business;
use App\Models\BusinessBranch;
use App\Models\MagistralCategory;
use App\Models\MagistralFormat;
use App\Models\MagistralIncome;
use App\Models\MagistralInventoryCount;
use App\Models\MagistralLaboratory;
use App\Models\MagistralOutput;
use App\Models\MagistralProductionOrder;
use App\Models\MagistralResponsible;
use App\Models\MagistralSale;
use App\Models\MagistralSubcategory;
use App\Models\PurchaseOrder;
use App\Models\PurchaseReceipt;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use App\Support\BusinessScope;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class MagistralesProductionSeeder extends Seeder
{
    private ?int $userId = null;

    public function run(): void
    {
        if (!Schema::hasTable('magistral_categories')) {
            return;
        }

        $this->userId = User::query()->orderBy('id')->value('id');

        DB::transaction(function () {
            $this->purgeExistingMagistralesData();

            $business = $this->ensureBusiness();
            $branch = $this->ensureBranch($business);
            $this->ensureWarehouse($branch);
        });
    }

    private function purgeExistingMagistralesData(): void
    {
        MagistralInventoryCount::query()->delete();
        MagistralSale::query()->delete();
        MagistralOutput::query()->delete();
        MagistralProductionOrder::query()->delete();
        MagistralIncome::query()->delete();

        $purchaseOrderIds = PurchaseOrder::query()
            ->where('module_scope', 'magistrales')
            ->pluck('id');
        if ($purchaseOrderIds->isNotEmpty()) {
            AccountsPayable::query()
                ->where('source_type', 'purchase_order')
                ->whereIn('source_id', $purchaseOrderIds)
                ->delete();
            PurchaseOrder::query()->whereIn('id', $purchaseOrderIds)->delete();
        }

        $articleIds = Article::query()
            ->where('module_scope', 'magistrales')
            ->pluck('id');
        if ($articleIds->isNotEmpty()) {
            Article::query()->whereIn('id', $articleIds)->delete();
        }

        $supplierIds = Supplier::query()
            ->where('module_scope', 'magistrales')
            ->pluck('id');
        if ($supplierIds->isNotEmpty()) {
            $purchaseReceiptIds = PurchaseReceipt::query()
                ->whereIn('supplier_id', $supplierIds)
                ->pluck('id');
            if ($purchaseReceiptIds->isNotEmpty()) {
                AccountsPayable::query()
                    ->where('source_type', 'purchase_receipt')
                    ->whereIn('source_id', $purchaseReceiptIds)
                    ->delete();
                PurchaseReceipt::query()->whereIn('id', $purchaseReceiptIds)->delete();
            }

            $supplierPurchaseOrderIds = PurchaseOrder::query()
                ->whereIn('supplier_id', $supplierIds)
                ->pluck('id');
            if ($supplierPurchaseOrderIds->isNotEmpty()) {
                AccountsPayable::query()
                    ->where('source_type', 'purchase_order')
                    ->whereIn('source_id', $supplierPurchaseOrderIds)
                    ->delete();
                PurchaseOrder::query()->whereIn('id', $supplierPurchaseOrderIds)->delete();
            }

            AccountsPayable::query()->whereIn('supplier_id', $supplierIds)->delete();
            Supplier::query()->whereIn('id', $supplierIds)->delete();
        }

        MagistralResponsible::query()->delete();
        MagistralFormat::query()->delete();
        MagistralSubcategory::query()->delete();
        MagistralCategory::query()->delete();
        MagistralLaboratory::query()->delete();
        Unit::query()->where('module_scope', 'magistrales')->delete();
    }

    private function ensureBusiness(): Business
    {
        return Business::query()->updateOrCreate(
            ['business_key' => BusinessScope::KAMARY_MEDICALS],
            [
                'name' => 'Kamary Medicals',
                'trade_name' => 'Kamary Medicals',
                'description' => 'Unidad operativa para formulas magistrales.',
                'facturador_sync_status' => 'pending',
                'facturador_sync_message' => 'Completar configuracion fiscal antes de emitir comprobantes magistrales.',
                'status' => true,
                'updated_by' => $this->userId,
            ]
        );
    }

    private function ensureBranch(Business $business): BusinessBranch
    {
        return BusinessBranch::query()->updateOrCreate(
            [
                'business_id' => $business->id,
                'name' => 'Principal Magistrales',
            ],
            [
                'establishment_code' => '0000',
                'ubigeo' => '150101',
                'address' => 'Calle Leoncio Prado 830, Urb. La Viña, San Luis, Lima',
                'email' => 'magistrales@kamarymedicals.pe',
                'telephone' => '014856320',
                'facturador_sync_status' => 'pending',
                'facturador_sync_message' => 'Sede base del modulo Magistrales.',
                'series_factura' => 'FM01',
                'series_boleta' => 'BM01',
                'series_nota_credito' => 'FCM1',
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]
        );
    }

    private function ensureWarehouse(BusinessBranch $branch): Warehouse
    {
        return Warehouse::query()->updateOrCreate(
            [
                'business_branch_id' => $branch->id,
                'name' => 'Almacen Magistrales Principal',
            ],
            [
                'description' => 'Almacen fijo del modulo Magistrales.',
                'status' => true,
                'created_by' => $this->userId,
                'updated_by' => $this->userId,
            ]
        );
    }
}
