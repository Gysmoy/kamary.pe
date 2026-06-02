<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\File;

// Admin
use App\Http\Controllers\Admin\ActivityController as AdminActivityController;
use App\Http\Controllers\Admin\HomeController as AdminHomeController;
use App\Http\Controllers\Admin\ProfileController as AdminProfileController;
use App\Http\Controllers\Admin\AccountsPayableController as AdminAccountsPayableController;
use App\Http\Controllers\Admin\AccountController as AdminAccountController;
use App\Http\Controllers\Admin\ArticleController as AdminArticleController;
use App\Http\Controllers\Admin\BatchController as AdminBatchController;
use App\Http\Controllers\Admin\BillingDocumentController as AdminBillingDocumentController;
use App\Http\Controllers\Admin\BillingSettingsController as AdminBillingSettingsController;
use App\Http\Controllers\Admin\BusinessController as AdminBusinessController;
use App\Http\Controllers\Admin\ClientDistributionNetworkController as AdminClientDistributionNetworkController;
use App\Http\Controllers\Admin\ClientController as AdminClientController;
use App\Http\Controllers\Admin\CommercialOrderController as AdminCommercialOrderController;
use App\Http\Controllers\Admin\DeliveryDelayReasonController as AdminDeliveryDelayReasonController;
use App\Http\Controllers\Admin\DeliveryEvidenceController as AdminDeliveryEvidenceController;
use App\Http\Controllers\Admin\TakeOrderController as AdminTakeOrderController;
use App\Http\Controllers\Admin\DispatchController as AdminDispatchController;
use App\Http\Controllers\Admin\DailySummaryController as AdminDailySummaryController;
use App\Http\Controllers\Admin\DriverController as AdminDriverController;
use App\Http\Controllers\Admin\EventualClientController as AdminEventualClientController;
use App\Http\Controllers\Admin\EntryNoteController as AdminEntryNoteController;
use App\Http\Controllers\Admin\ExitNoteController as AdminExitNoteController;
use App\Http\Controllers\Admin\GeneralController as AdminGeneralController;
use App\Http\Controllers\Admin\InventoryReportController as AdminInventoryReportController;
use App\Http\Controllers\Admin\InventoryController as AdminInventoryController;
use App\Http\Controllers\Admin\KardexController as AdminKardexController;
use App\Http\Controllers\Admin\LaboratoryController as AdminLaboratoryController;
use App\Http\Controllers\Admin\AccountsReceivableController as AdminAccountsReceivableController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Admin\PriceListController as AdminPriceListController;
use App\Http\Controllers\Admin\PurchaseOrderController as AdminPurchaseOrderController;
use App\Http\Controllers\Admin\PurchaseReceiptController as AdminPurchaseReceiptController;
use App\Http\Controllers\Admin\ReferralGuideController as AdminReferralGuideController;
use App\Http\Controllers\Admin\Magistrales\AccountsPayableController as AdminMagistralesAccountsPayableController;
use App\Http\Controllers\Admin\Magistrales\ArticleController as AdminMagistralesArticleController;
use App\Http\Controllers\Admin\Magistrales\CategoryController as AdminMagistralesCategoryController;
use App\Http\Controllers\Admin\Magistrales\FormatController as AdminMagistralesFormatController;
use App\Http\Controllers\Admin\Magistrales\FormulaController as AdminMagistralesFormulaController;
use App\Http\Controllers\Admin\Magistrales\IncomeController as AdminMagistralesIncomeController;
use App\Http\Controllers\Admin\Magistrales\InventoryController as AdminMagistralesInventoryController;
use App\Http\Controllers\Admin\Magistrales\KardexController as AdminMagistralesKardexController;
use App\Http\Controllers\Admin\Magistrales\LaboratoryController as AdminMagistralesLaboratoryController;
use App\Http\Controllers\Admin\Magistrales\OutputController as AdminMagistralesOutputController;
use App\Http\Controllers\Admin\Magistrales\ProductionOrderController as AdminMagistralesProductionOrderController;
use App\Http\Controllers\Admin\Magistrales\PurchaseOrderController as AdminMagistralesPurchaseOrderController;
use App\Http\Controllers\Admin\Magistrales\ResponsibleController as AdminMagistralesResponsibleController;
use App\Http\Controllers\Admin\Magistrales\SaleController as AdminMagistralesSaleController;
use App\Http\Controllers\Admin\Magistrales\SupplierController as AdminMagistralesSupplierController;
use App\Http\Controllers\Admin\Magistrales\UnitController as AdminMagistralesUnitController;
use App\Http\Controllers\Admin\Storage\BillingControlController as AdminStorageBillingControlController;
use App\Http\Controllers\Admin\Storage\ClientContractController as AdminStorageClientContractController;
use App\Http\Controllers\Admin\Storage\ClientController as AdminStorageClientController;
use App\Http\Controllers\Admin\Storage\ClientNotificationController as AdminStorageClientNotificationController;
use App\Http\Controllers\Admin\Storage\ClientTariffController as AdminStorageClientTariffController;
use App\Http\Controllers\Admin\Storage\EntryNoteController as AdminStorageEntryNoteController;
use App\Http\Controllers\Admin\Storage\ExitNoteController as AdminStorageExitNoteController;
use App\Http\Controllers\Admin\Storage\GeneralServiceController as AdminStorageGeneralServiceController;
use App\Http\Controllers\Admin\Storage\GeneralServiceOrderController as AdminStorageGeneralServiceOrderController;
use App\Http\Controllers\Admin\Storage\InventoryController as AdminStorageInventoryController;
use App\Http\Controllers\Admin\Storage\KardexController as AdminStorageKardexController;
use App\Http\Controllers\Admin\Storage\ProductController as AdminStorageProductController;
use App\Http\Controllers\Admin\Storage\ServiceOrderController as AdminStorageServiceOrderController;
use App\Http\Controllers\Admin\Storage\UnitController as AdminStorageUnitController;
use App\Http\Controllers\Admin\ServiceCatalogController as AdminServiceCatalogController;
use App\Http\Controllers\Admin\ServiceClientController as AdminServiceClientController;
use App\Http\Controllers\Admin\ServiceOrderController as AdminServiceOrderController;
use App\Http\Controllers\Admin\SalesReportController as AdminSalesReportController;
use App\Http\Controllers\Admin\SampleOrderController as AdminSampleOrderController;
use App\Http\Controllers\Admin\SupplierController as AdminSupplierController;
use App\Http\Controllers\Admin\TransactionController as AdminTransactionController;
use App\Http\Controllers\Admin\TransactionCategoryController as AdminTransactionCategoryController;
use App\Http\Controllers\Admin\VehicleController as AdminVehicleController;
use App\Http\Controllers\Admin\ZoneController as AdminZoneController;
use App\Http\Controllers\Admin\RoleController as AdminRoleController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\UnitController as AdminUnitController;
use App\Http\Controllers\Admin\WarehouseController as AdminWarehouseController;
use App\Http\Controllers\Integrations\EcomsurController;
use App\Http\Controllers\Integrations\MultivendeWebhookController;

// Public
use App\Http\Controllers\AuthController;
use App\Http\Controllers\LoginController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::post('/login', [LoginController::class, 'login']);

Route::prefix('integrations')->group(function () {
    Route::post('/ecomsur/logistic-orders', [EcomsurController::class, 'logisticOrders']);
    Route::post('/ecomsur/stock', [EcomsurController::class, 'stock']);
    Route::post('/multivende/webhook', MultivendeWebhookController::class);
});

Route::middleware('auth')->group(function () {
    Route::delete('logout', [AuthController::class, 'destroy'])->name('logout');

    Route::get('/graph/sales/{type}/{filter}', [AdminHomeController::class, 'getSales'])
        ->middleware('module.permission:dashboard');

    Route::prefix('admin')->middleware('admin.permission')->group(function () {
        Route::get('/ubigeo/inei', function () {
            $path = storage_path('app/utils/ubigeo-inei.json');

            abort_unless(File::exists($path), 404, 'Archivo de ubigeo no encontrado.');

            $rows = collect(json_decode(File::get($path), true) ?? [])
                ->map(function ($item) {
                    return [
                        'code' => trim((string) ($item['code'] ?? '')),
                        'department' => trim((string) ($item['department'] ?? '')),
                        'province' => trim((string) ($item['province'] ?? '')),
                        'district' => trim((string) ($item['district'] ?? '')),
                    ];
                })
                ->filter(function ($item) {
                    return $item['code'] && $item['department'] && $item['province'] && $item['district'];
                })
                ->values();

            return response()->json($rows);
        });

        Route::post('/users', [AdminUserController::class, 'save']);
        Route::post('/users/paginate', [AdminUserController::class, 'paginate']);
        Route::patch('/users/status', [AdminUserController::class, 'status']);
        Route::patch('/users/{field}', [AdminUserController::class, 'boolean']);
        Route::delete('/users/{id}', [AdminUserController::class, 'delete']);

        Route::post('/generals', [AdminGeneralController::class, 'save']);

        Route::post('/roles', [AdminRoleController::class, 'save']);
        Route::post('/roles/paginate', [AdminRoleController::class, 'paginate']);
        Route::patch('/roles/status', [AdminRoleController::class, 'status']);
        Route::patch('/roles/{field}', [AdminRoleController::class, 'boolean']);
        Route::delete('/roles/{id}', [AdminRoleController::class, 'delete']);

        Route::post('/businesses', [AdminBusinessController::class, 'save']);
        Route::post('/businesses/paginate', [AdminBusinessController::class, 'paginate']);
        Route::patch('/businesses/status', [AdminBusinessController::class, 'status']);
        Route::patch('/businesses/{field}', [AdminBusinessController::class, 'boolean']);
        Route::delete('/businesses/{id}', [AdminBusinessController::class, 'delete']);
        Route::get('/businesses/{id}/branches', [AdminBusinessController::class, 'branches']);
        Route::post('/businesses/{id}/branches', [AdminBusinessController::class, 'saveBranch']);
        Route::patch('/businesses/{id}/branches/{branchId}/{field}', [AdminBusinessController::class, 'branchBoolean']);
        Route::delete('/businesses/{id}/branches/{branchId}', [AdminBusinessController::class, 'deleteBranch']);
        Route::post('/businesses/{id}/fiscal-assets', [AdminBusinessController::class, 'uploadFiscalAssets']);
        Route::delete('/businesses/{id}/fiscal-assets/{type}', [AdminBusinessController::class, 'deleteFiscalAsset'])->where('type', 'logo|certificate');
        Route::post('/businesses/{id}/facturador-sync', [AdminBusinessController::class, 'syncFacturador']);
        Route::get('/billing-settings/facturador-mode', [AdminBillingSettingsController::class, 'facturadorMode']);
        Route::patch('/billing-settings/facturador-mode', [AdminBillingSettingsController::class, 'updateFacturadorMode']);

        Route::post('/units', [AdminUnitController::class, 'save']);
        Route::post('/units/import', [AdminUnitController::class, 'import']);
        Route::post('/units/paginate', [AdminUnitController::class, 'paginate']);
        Route::patch('/units/status', [AdminUnitController::class, 'status']);
        Route::patch('/units/{field}', [AdminUnitController::class, 'boolean']);
        Route::delete('/units/{id}', [AdminUnitController::class, 'delete']);

        Route::post('/laboratories', [AdminLaboratoryController::class, 'save']);
        Route::post('/laboratories/import', [AdminLaboratoryController::class, 'import']);
        Route::post('/laboratories/paginate', [AdminLaboratoryController::class, 'paginate']);
        Route::patch('/laboratories/status', [AdminLaboratoryController::class, 'status']);
        Route::patch('/laboratories/{field}', [AdminLaboratoryController::class, 'boolean']);
        Route::delete('/laboratories/{id}', [AdminLaboratoryController::class, 'delete']);
        Route::get('/laboratories/{id}/principles', [AdminLaboratoryController::class, 'principles']);
        Route::post('/laboratories/{id}/principles', [AdminLaboratoryController::class, 'savePrinciple']);
        Route::post('/laboratories/{id}/principles/import', [AdminLaboratoryController::class, 'importPrinciples']);
        Route::patch('/laboratories/{id}/principles/{principleId}/{field}', [AdminLaboratoryController::class, 'principleBoolean']);
        Route::delete('/laboratories/{id}/principles/{principleId}', [AdminLaboratoryController::class, 'deletePrinciple']);

        Route::post('/articles', [AdminArticleController::class, 'save']);
        Route::post('/articles/import', [AdminArticleController::class, 'import']);
        Route::post('/articles/paginate', [AdminArticleController::class, 'paginate']);
        Route::patch('/articles/status', [AdminArticleController::class, 'status']);
        Route::patch('/articles/{field}', [AdminArticleController::class, 'boolean']);
        Route::delete('/articles/{id}', [AdminArticleController::class, 'delete']);
        Route::get('/articles/laboratories/{id}/principles', [AdminArticleController::class, 'principles']);
        Route::get('/articles/{id}/stock-by-warehouse', [AdminArticleController::class, 'stockByWarehouse']);

        Route::post('/batches', [AdminBatchController::class, 'save']);
        Route::post('/batches/import', [AdminBatchController::class, 'import']);
        Route::post('/batches/paginate', [AdminBatchController::class, 'paginate']);
        Route::patch('/batches/status', [AdminBatchController::class, 'status']);
        Route::patch('/batches/{field}', [AdminBatchController::class, 'boolean']);
        Route::delete('/batches/{id}', [AdminBatchController::class, 'delete']);

        Route::post('/entry-notes', [AdminEntryNoteController::class, 'save']);
        Route::post('/entry-notes/paginate', [AdminEntryNoteController::class, 'paginate']);
        Route::patch('/entry-notes/{id}/entry-status', [AdminEntryNoteController::class, 'entryStatus']);
        Route::patch('/entry-notes/status', [AdminEntryNoteController::class, 'status']);
        Route::patch('/entry-notes/{field}', [AdminEntryNoteController::class, 'boolean']);
        Route::delete('/entry-notes/{id}', [AdminEntryNoteController::class, 'delete']);
        Route::get('/entry-notes/businesses/{id}/branches', [AdminEntryNoteController::class, 'branches']);
        Route::get('/entry-notes/current-stock', [AdminEntryNoteController::class, 'currentStock']);
        Route::get('/entry-notes/{id}', [AdminEntryNoteController::class, 'get']);

        Route::post('/exit-notes', [AdminExitNoteController::class, 'save']);
        Route::post('/exit-notes/paginate', [AdminExitNoteController::class, 'paginate']);
        Route::get('/exit-notes/available-stock', [AdminExitNoteController::class, 'availableStock']);
        Route::patch('/exit-notes/status', [AdminExitNoteController::class, 'status']);
        Route::patch('/exit-notes/{field}', [AdminExitNoteController::class, 'boolean']);
        Route::delete('/exit-notes/{id}', [AdminExitNoteController::class, 'delete']);
        Route::get('/exit-notes/businesses/{id}/branches', [AdminExitNoteController::class, 'branches']);

        Route::get('/inventory/options', [AdminInventoryController::class, 'options']);
        Route::post('/inventory/preview', [AdminInventoryController::class, 'preview']);
        Route::post('/inventory', [AdminInventoryController::class, 'save']);
        Route::post('/inventory/paginate', [AdminInventoryController::class, 'paginate']);
        Route::post('/inventory/{id}/apply', [AdminInventoryController::class, 'apply']);
        Route::get('/inventory/{id}', [AdminInventoryController::class, 'get']);
        Route::get('/inventory/{id}/format', [AdminInventoryController::class, 'format']);
        Route::post('/inventory/{id}/import', [AdminInventoryController::class, 'import']);
        Route::post('/inventory-report/paginate', [AdminInventoryReportController::class, 'paginate']);
        Route::post('/kardex/paginate', [AdminKardexController::class, 'paginate']);
        Route::post('/kardex/movements', [AdminKardexController::class, 'movements']);
        Route::get('/kardex/documents/{sourceType}/{sourceId}', [AdminKardexController::class, 'document']);
        Route::get('/kardex/documents/{sourceType}/{sourceId}/file', [AdminKardexController::class, 'documentFile']);

        Route::post('/purchase-orders', [AdminPurchaseOrderController::class, 'save']);
        Route::post('/purchase-orders/paginate', [AdminPurchaseOrderController::class, 'paginate']);
        Route::patch('/purchase-orders/status', [AdminPurchaseOrderController::class, 'status']);
        Route::patch('/purchase-orders/{field}', [AdminPurchaseOrderController::class, 'boolean']);
        Route::delete('/purchase-orders/{id}', [AdminPurchaseOrderController::class, 'delete']);
        Route::get('/purchase-orders/businesses/{id}/branches', [AdminPurchaseOrderController::class, 'branches']);

        Route::post('/purchase-receipts', [AdminPurchaseReceiptController::class, 'save']);
        Route::post('/purchase-receipts/paginate', [AdminPurchaseReceiptController::class, 'paginate']);
        Route::patch('/purchase-receipts/status', [AdminPurchaseReceiptController::class, 'status']);
        Route::patch('/purchase-receipts/{field}', [AdminPurchaseReceiptController::class, 'boolean']);
        Route::delete('/purchase-receipts/{id}', [AdminPurchaseReceiptController::class, 'delete']);
        Route::get('/purchase-receipts/businesses/{id}/branches', [AdminPurchaseReceiptController::class, 'branches']);

        Route::post('/accounts-payable/paginate', [AdminAccountsPayableController::class, 'paginate']);
        Route::post('/accounts-payable/{id}/payments', [AdminAccountsPayableController::class, 'registerPayment']);
        Route::get('/accounts-payable/payments/media/{filename}', [AdminAccountsPayableController::class, 'paymentFile'])->where('filename', '.*');

        Route::post('/suppliers', [AdminSupplierController::class, 'save']);
        Route::post('/suppliers/import', [AdminSupplierController::class, 'import']);
        Route::post('/suppliers/paginate', [AdminSupplierController::class, 'paginate']);
        Route::patch('/suppliers/status', [AdminSupplierController::class, 'status']);
        Route::patch('/suppliers/{field}', [AdminSupplierController::class, 'boolean']);
        Route::delete('/suppliers/{id}', [AdminSupplierController::class, 'delete']);
        Route::get('/suppliers/ruc/{ruc}', [AdminSupplierController::class, 'lookupByRuc']);

        Route::prefix('magistrales')->group(function () {
            $magistralesAny = 'module.permission:magistrales-dashboard,magistrales-products,magistrales-procurement,magistrales-warehouse,magistrales-billing,magistrales-articles,magistrales-category,magistrales-formats,magistrales-formulas,magistrales-incomes,magistrales-inventory,magistrales-kardex,magistrales-laboratory,magistrales-purchase-order,magistrales-production-order,magistrales-supplier,magistrales-responsible,magistrales-outputs,magistrales-unit,magistrales-sales';
            $magistralesArticles = 'module.permission:magistrales-articles,magistrales-products';
            $magistralesCategory = 'module.permission:magistrales-category,magistrales-products';
            $magistralesFormats = 'module.permission:magistrales-formats,magistrales-products';
            $magistralesFormulas = 'module.permission:magistrales-formulas,magistrales-products';
            $magistralesLaboratory = 'module.permission:magistrales-laboratory,magistrales-products';
            $magistralesUnit = 'module.permission:magistrales-unit,magistrales-products';
            $magistralesIncomes = 'module.permission:magistrales-incomes,magistrales-procurement';
            $magistralesResponsible = 'module.permission:magistrales-responsible,magistrales-warehouse';
            $magistralesProduction = 'module.permission:magistrales-production-order,magistrales-warehouse';
            $magistralesOutputs = 'module.permission:magistrales-outputs,magistrales-warehouse';
            $magistralesSales = 'module.permission:magistrales-sales,magistrales-billing';
            $magistralesInventory = 'module.permission:magistrales-inventory,magistrales-warehouse';
            $magistralesKardex = 'module.permission:magistrales-kardex,magistrales-warehouse';
            $magistralesPurchaseOrders = 'module.permission:magistrales-purchase-order,magistrales-procurement';
            $magistralesSuppliers = 'module.permission:magistrales-supplier,magistrales-procurement';
            $magistralesProcurement = 'module.permission:magistrales-procurement';

            Route::middleware($magistralesAny)->group(function () {
                Route::post('/articles/paginate', [AdminMagistralesArticleController::class, 'paginate']);
                Route::get('/articles/laboratories/{id}/principles', [AdminMagistralesArticleController::class, 'principles']);
                Route::get('/articles/{id}/stock-by-warehouse', [AdminMagistralesArticleController::class, 'stockByWarehouse']);
                Route::post('/categories/paginate', [AdminMagistralesCategoryController::class, 'paginate']);
                Route::get('/categories/{categoryId}/subcategories', [AdminMagistralesCategoryController::class, 'subcategories']);
                Route::post('/formats/paginate', [AdminMagistralesFormatController::class, 'paginate']);
                Route::post('/formulas/paginate', [AdminMagistralesFormulaController::class, 'paginate']);
                Route::post('/laboratories/paginate', [AdminMagistralesLaboratoryController::class, 'paginate']);
                Route::post('/units/paginate', [AdminMagistralesUnitController::class, 'paginate']);
                Route::post('/responsibles/paginate', [AdminMagistralesResponsibleController::class, 'paginate']);
                Route::post('/suppliers/paginate', [AdminMagistralesSupplierController::class, 'paginate']);
            });

            Route::middleware($magistralesArticles)->group(function () {
                Route::post('/articles', [AdminMagistralesArticleController::class, 'save']);
                Route::post('/articles/import', [AdminMagistralesArticleController::class, 'import']);
                Route::patch('/articles/status', [AdminMagistralesArticleController::class, 'status']);
                Route::patch('/articles/{field}', [AdminMagistralesArticleController::class, 'boolean']);
                Route::delete('/articles/{id}', [AdminMagistralesArticleController::class, 'delete']);
            });

            Route::middleware($magistralesCategory)->group(function () {
                Route::post('/categories', [AdminMagistralesCategoryController::class, 'save']);
                Route::patch('/categories/status', [AdminMagistralesCategoryController::class, 'status']);
                Route::patch('/categories/{field}', [AdminMagistralesCategoryController::class, 'boolean']);
                Route::delete('/categories/{id}', [AdminMagistralesCategoryController::class, 'delete']);
                Route::post('/categories/{categoryId}/subcategories', [AdminMagistralesCategoryController::class, 'saveSubcategory']);
                Route::patch('/categories/{categoryId}/subcategories/status', [AdminMagistralesCategoryController::class, 'statusSubcategory']);
                Route::delete('/categories/{categoryId}/subcategories/{id}', [AdminMagistralesCategoryController::class, 'deleteSubcategory']);
            });

            Route::middleware($magistralesFormats)->group(function () {
                Route::post('/formats', [AdminMagistralesFormatController::class, 'save']);
                Route::patch('/formats/status', [AdminMagistralesFormatController::class, 'status']);
                Route::patch('/formats/{field}', [AdminMagistralesFormatController::class, 'boolean']);
                Route::delete('/formats/{id}', [AdminMagistralesFormatController::class, 'delete']);
            });

            Route::middleware($magistralesFormulas)->group(function () {
                Route::post('/formulas', [AdminMagistralesFormulaController::class, 'save']);
                Route::get('/formulas/{id}/histories', [AdminMagistralesFormulaController::class, 'histories']);
                Route::patch('/formulas/status', [AdminMagistralesFormulaController::class, 'status']);
                Route::patch('/formulas/{field}', [AdminMagistralesFormulaController::class, 'boolean']);
                Route::delete('/formulas/{id}', [AdminMagistralesFormulaController::class, 'delete']);
            });

            Route::middleware($magistralesIncomes)->group(function () {
                Route::post('/incomes', [AdminMagistralesIncomeController::class, 'save']);
                Route::post('/incomes/paginate', [AdminMagistralesIncomeController::class, 'paginate']);
                Route::patch('/incomes/status', [AdminMagistralesIncomeController::class, 'status']);
                Route::delete('/incomes/{id}', [AdminMagistralesIncomeController::class, 'delete']);
                Route::post('/entry-notes', [AdminMagistralesIncomeController::class, 'save']);
                Route::post('/entry-notes/paginate', [AdminMagistralesIncomeController::class, 'paginate']);
                Route::patch('/entry-notes/status', [AdminMagistralesIncomeController::class, 'status']);
                Route::delete('/entry-notes/{id}', [AdminMagistralesIncomeController::class, 'delete']);
            });

            Route::middleware($magistralesLaboratory)->group(function () {
                Route::post('/laboratories', [AdminMagistralesLaboratoryController::class, 'save']);
                Route::patch('/laboratories/status', [AdminMagistralesLaboratoryController::class, 'status']);
                Route::patch('/laboratories/{field}', [AdminMagistralesLaboratoryController::class, 'boolean']);
                Route::delete('/laboratories/{id}', [AdminMagistralesLaboratoryController::class, 'delete']);
            });

            Route::middleware($magistralesUnit)->group(function () {
                Route::post('/units', [AdminMagistralesUnitController::class, 'save']);
                Route::post('/units/import', [AdminMagistralesUnitController::class, 'import']);
                Route::patch('/units/status', [AdminMagistralesUnitController::class, 'status']);
                Route::patch('/units/{field}', [AdminMagistralesUnitController::class, 'boolean']);
                Route::delete('/units/{id}', [AdminMagistralesUnitController::class, 'delete']);
            });

            Route::middleware($magistralesResponsible)->group(function () {
                Route::post('/responsibles', [AdminMagistralesResponsibleController::class, 'save']);
                Route::patch('/responsibles/status', [AdminMagistralesResponsibleController::class, 'status']);
                Route::patch('/responsibles/{field}', [AdminMagistralesResponsibleController::class, 'boolean']);
                Route::delete('/responsibles/{id}', [AdminMagistralesResponsibleController::class, 'delete']);
            });

            Route::middleware($magistralesProduction)->group(function () {
                Route::post('/production-orders', [AdminMagistralesProductionOrderController::class, 'save']);
                Route::post('/production-orders/paginate', [AdminMagistralesProductionOrderController::class, 'paginate']);
                Route::patch('/production-orders/status', [AdminMagistralesProductionOrderController::class, 'status']);
                Route::patch('/production-orders/{field}', [AdminMagistralesProductionOrderController::class, 'boolean']);
                Route::delete('/production-orders/{id}', [AdminMagistralesProductionOrderController::class, 'delete']);
            });

            Route::middleware($magistralesOutputs)->group(function () {
                Route::post('/outputs', [AdminMagistralesOutputController::class, 'save']);
                Route::post('/outputs/paginate', [AdminMagistralesOutputController::class, 'paginate']);
                Route::get('/outputs/available-stock', [AdminMagistralesOutputController::class, 'availableStock']);
                Route::patch('/outputs/status', [AdminMagistralesOutputController::class, 'status']);
                Route::patch('/outputs/{field}', [AdminMagistralesOutputController::class, 'boolean']);
                Route::delete('/outputs/{id}', [AdminMagistralesOutputController::class, 'delete']);
            });

            Route::middleware($magistralesSales)->group(function () {
                Route::post('/sales', [AdminMagistralesSaleController::class, 'save']);
                Route::post('/sales/paginate', [AdminMagistralesSaleController::class, 'paginate']);
                Route::patch('/sales/status', [AdminMagistralesSaleController::class, 'status']);
                Route::patch('/sales/{field}', [AdminMagistralesSaleController::class, 'boolean']);
                Route::delete('/sales/{id}', [AdminMagistralesSaleController::class, 'delete']);
            });

            Route::middleware($magistralesInventory)->group(function () {
                Route::post('/inventory', [AdminMagistralesInventoryController::class, 'save']);
                Route::post('/inventory/stock', [AdminMagistralesInventoryController::class, 'stock']);
                Route::post('/inventory/paginate', [AdminMagistralesInventoryController::class, 'paginate']);
                Route::patch('/inventory/status', [AdminMagistralesInventoryController::class, 'status']);
                Route::delete('/inventory/{id}', [AdminMagistralesInventoryController::class, 'delete']);
            });

            Route::middleware($magistralesKardex)->group(function () {
                Route::post('/kardex/paginate', [AdminMagistralesKardexController::class, 'paginate']);
                Route::post('/kardex/movements', [AdminMagistralesKardexController::class, 'movements']);
            });

            Route::middleware($magistralesPurchaseOrders)->group(function () {
                Route::post('/purchase-orders', [AdminMagistralesPurchaseOrderController::class, 'save']);
                Route::post('/purchase-orders/paginate', [AdminMagistralesPurchaseOrderController::class, 'paginate']);
                Route::patch('/purchase-orders/status', [AdminMagistralesPurchaseOrderController::class, 'status']);
                Route::patch('/purchase-orders/{field}', [AdminMagistralesPurchaseOrderController::class, 'boolean']);
                Route::delete('/purchase-orders/{id}', [AdminMagistralesPurchaseOrderController::class, 'delete']);
                Route::get('/purchase-orders/businesses/{id}/branches', [AdminMagistralesPurchaseOrderController::class, 'branches']);
            });

            Route::middleware($magistralesProcurement)->group(function () {
                Route::post('/accounts-payable/paginate', [AdminMagistralesAccountsPayableController::class, 'paginate']);
                Route::post('/accounts-payable/{id}/payments', [AdminMagistralesAccountsPayableController::class, 'registerPayment']);
                Route::get('/accounts-payable/payments/media/{filename}', [AdminMagistralesAccountsPayableController::class, 'paymentFile'])->where('filename', '.*');
            });

            Route::middleware($magistralesSuppliers)->group(function () {
                Route::post('/suppliers', [AdminMagistralesSupplierController::class, 'save']);
                Route::post('/suppliers/import', [AdminMagistralesSupplierController::class, 'import']);
                Route::patch('/suppliers/status', [AdminMagistralesSupplierController::class, 'status']);
                Route::patch('/suppliers/{field}', [AdminMagistralesSupplierController::class, 'boolean']);
                Route::delete('/suppliers/{id}', [AdminMagistralesSupplierController::class, 'delete']);
                Route::get('/suppliers/ruc/{ruc}', [AdminMagistralesSupplierController::class, 'lookupByRuc']);
            });
        });

        Route::prefix('storage')->group(function () {
            $storageAny = 'module.permission:storage-inventory,storage-clients,storage-service-orders,storage-units,storage-products,storage-entry-note,storage-exit-note,storage-kardex,storage-general-service,storage-billing-control,storage-general-service-orders';

            Route::middleware('module.permission:storage-inventory')->group(function () {
                Route::get('/inventory/options', [AdminStorageInventoryController::class, 'options']);
                Route::post('/inventory/preview', [AdminStorageInventoryController::class, 'preview']);
                Route::post('/inventory', [AdminStorageInventoryController::class, 'save']);
                Route::post('/inventory/paginate', [AdminStorageInventoryController::class, 'paginate']);
                Route::post('/inventory/{id}/apply', [AdminStorageInventoryController::class, 'apply']);
                Route::get('/inventory/{id}', [AdminStorageInventoryController::class, 'get']);
                Route::get('/inventory/{id}/format', [AdminStorageInventoryController::class, 'format']);
                Route::post('/inventory/{id}/import', [AdminStorageInventoryController::class, 'import']);
                Route::patch('/inventory/status', [AdminStorageInventoryController::class, 'status']);
                Route::delete('/inventory/{id}', [AdminStorageInventoryController::class, 'delete']);
            });

            Route::middleware($storageAny)->group(function () {
                Route::post('/clients/paginate', [AdminStorageClientController::class, 'paginate']);
                Route::get('/clients/document/{type}/{number}', [AdminStorageClientController::class, 'lookupByDocument']);
                Route::post('/units/paginate', [AdminStorageUnitController::class, 'paginate']);
                Route::post('/articles/paginate', [AdminStorageProductController::class, 'paginate']);
                Route::get('/articles/laboratories/{id}/principles', [AdminStorageProductController::class, 'principles']);
                Route::get('/articles/{id}/stock-by-warehouse', [AdminStorageProductController::class, 'stockByWarehouse']);
                Route::get('/kardex/options', [AdminStorageKardexController::class, 'options']);
                Route::post('/kardex/paginate', [AdminStorageKardexController::class, 'paginate']);
                Route::post('/general-service/paginate', [AdminStorageGeneralServiceController::class, 'paginate']);
            });

            Route::middleware('module.permission:storage-clients')->group(function () {
                Route::post('/clients', [AdminStorageClientController::class, 'save']);
                Route::patch('/clients/status', [AdminStorageClientController::class, 'status']);
                Route::patch('/clients/{field}', [AdminStorageClientController::class, 'boolean']);
                Route::delete('/clients/{id}', [AdminStorageClientController::class, 'delete']);
                Route::post('/client-notifications', [AdminStorageClientNotificationController::class, 'save']);
                Route::post('/client-notifications/paginate', [AdminStorageClientNotificationController::class, 'paginate']);
                Route::patch('/client-notifications/status', [AdminStorageClientNotificationController::class, 'status']);
                Route::patch('/client-notifications/{field}', [AdminStorageClientNotificationController::class, 'boolean']);
                Route::delete('/client-notifications/{id}', [AdminStorageClientNotificationController::class, 'delete']);
                Route::get('/client-tariffs/client/{clientId}', [AdminStorageClientTariffController::class, 'byClient']);
                Route::post('/client-tariffs', [AdminStorageClientTariffController::class, 'save']);
                Route::delete('/client-tariffs/{id}', [AdminStorageClientTariffController::class, 'delete']);
                Route::post('/client-contracts', [AdminStorageClientContractController::class, 'save']);
                Route::post('/client-contracts/paginate', [AdminStorageClientContractController::class, 'paginate']);
                Route::get('/client-contracts/{id}/file', [AdminStorageClientContractController::class, 'file']);
                Route::get('/client-contract-annexes/{id}/file', [AdminStorageClientContractController::class, 'annexFile']);
                Route::delete('/client-contracts/{id}/file', [AdminStorageClientContractController::class, 'deleteFile']);
                Route::delete('/client-contract-annexes/{id}', [AdminStorageClientContractController::class, 'deleteAnnex']);
                Route::delete('/client-contracts/{id}', [AdminStorageClientContractController::class, 'delete']);
            });

            Route::middleware('module.permission:storage-units')->group(function () {
                Route::post('/units', [AdminStorageUnitController::class, 'save']);
                Route::post('/units/import', [AdminStorageUnitController::class, 'import']);
                Route::patch('/units/status', [AdminStorageUnitController::class, 'status']);
                Route::patch('/units/{field}', [AdminStorageUnitController::class, 'boolean']);
                Route::delete('/units/{id}', [AdminStorageUnitController::class, 'delete']);
            });

            Route::middleware('module.permission:storage-products')->group(function () {
                Route::post('/articles', [AdminStorageProductController::class, 'save']);
                Route::post('/articles/import', [AdminStorageProductController::class, 'import']);
                Route::patch('/articles/status', [AdminStorageProductController::class, 'status']);
                Route::patch('/articles/{field}', [AdminStorageProductController::class, 'boolean']);
                Route::delete('/articles/{id}', [AdminStorageProductController::class, 'delete']);
            });

            Route::middleware('module.permission:storage-entry-note')->group(function () {
                Route::post('/entry-notes', [AdminStorageEntryNoteController::class, 'save']);
                Route::post('/entry-notes/paginate', [AdminStorageEntryNoteController::class, 'paginate']);
                Route::patch('/entry-notes/{id}/entry-status', [AdminStorageEntryNoteController::class, 'entryStatus']);
                Route::patch('/entry-notes/status', [AdminStorageEntryNoteController::class, 'status']);
                Route::patch('/entry-notes/{field}', [AdminStorageEntryNoteController::class, 'boolean']);
                Route::delete('/entry-notes/{id}', [AdminStorageEntryNoteController::class, 'delete']);
                Route::get('/entry-notes/businesses/{id}/branches', [AdminStorageEntryNoteController::class, 'branches']);
                Route::get('/entry-notes/current-stock', [AdminStorageEntryNoteController::class, 'currentStock']);
                Route::get('/entry-notes/{id}', [AdminStorageEntryNoteController::class, 'get']);
            });

            Route::middleware('module.permission:storage-exit-note')->group(function () {
                Route::post('/exit-notes', [AdminStorageExitNoteController::class, 'save']);
                Route::post('/exit-notes/paginate', [AdminStorageExitNoteController::class, 'paginate']);
                Route::get('/exit-notes/available-stock', [AdminStorageExitNoteController::class, 'availableStock']);
                Route::patch('/exit-notes/status', [AdminStorageExitNoteController::class, 'status']);
                Route::patch('/exit-notes/{field}', [AdminStorageExitNoteController::class, 'boolean']);
                Route::delete('/exit-notes/{id}', [AdminStorageExitNoteController::class, 'delete']);
                Route::get('/exit-notes/businesses/{id}/branches', [AdminStorageExitNoteController::class, 'branches']);
            });

            Route::middleware('module.permission:storage-kardex')->group(function () {
                Route::get('/kardex/locations-report', [AdminStorageKardexController::class, 'locationsReport']);
                Route::get('/kardex/inventory-report', [AdminStorageKardexController::class, 'inventoryReport']);
                Route::post('/kardex/movements', [AdminStorageKardexController::class, 'movements']);
                Route::post('/kardex/warehouses', [AdminStorageKardexController::class, 'saveWarehouse']);
                Route::delete('/kardex/warehouses/{id}', [AdminStorageKardexController::class, 'deleteWarehouse']);
                Route::post('/kardex/locations', [AdminStorageKardexController::class, 'saveLocation']);
                Route::delete('/kardex/locations/{id}', [AdminStorageKardexController::class, 'deleteLocation']);
            });

            Route::middleware('module.permission:storage-general-service')->group(function () {
                Route::post('/general-service', [AdminStorageGeneralServiceController::class, 'save']);
                Route::patch('/general-service/status', [AdminStorageGeneralServiceController::class, 'status']);
                Route::patch('/general-service/{field}', [AdminStorageGeneralServiceController::class, 'boolean']);
                Route::delete('/general-service/{id}', [AdminStorageGeneralServiceController::class, 'delete']);
            });

            Route::middleware('module.permission:storage-billing-control')->group(function () {
                Route::post('/billing-control', [AdminStorageBillingControlController::class, 'save']);
                Route::post('/billing-control/paginate', [AdminStorageBillingControlController::class, 'paginate']);
                Route::patch('/billing-control/status', [AdminStorageBillingControlController::class, 'status']);
                Route::patch('/billing-control/{field}', [AdminStorageBillingControlController::class, 'boolean']);
                Route::delete('/billing-control/{id}', [AdminStorageBillingControlController::class, 'delete']);
                Route::get('/billing-control/{id}/connector-payload', [AdminStorageBillingControlController::class, 'connectorPayload']);
                Route::post('/billing-control/{id}/prepare-voucher', [AdminStorageBillingControlController::class, 'prepareVoucher']);
                Route::post('/billing-control/{id}/issue', [AdminStorageBillingControlController::class, 'issue']);
                Route::post('/billing-control/{id}/cancel', [AdminStorageBillingControlController::class, 'cancel']);
                Route::post('/billing-control/{id}/credit-note', [AdminStorageBillingControlController::class, 'creditNote']);
                Route::post('/billing-control/{id}/provider-response', [AdminStorageBillingControlController::class, 'registerProviderResponse']);
                Route::post('/billing-control/{id}/provider-status', [AdminStorageBillingControlController::class, 'providerStatus']);
                Route::post('/billing-control/{id}/email', [AdminStorageBillingControlController::class, 'email']);
                Route::get('/billing-control/{id}/download/{type}', [AdminStorageBillingControlController::class, 'download'])->where('type', 'pdf|xml|cdr');
            });

            Route::middleware('module.permission:storage-service-orders')->group(function () {
                Route::post('/service-orders', [AdminStorageServiceOrderController::class, 'save']);
                Route::post('/service-orders/paginate', [AdminStorageServiceOrderController::class, 'paginate']);
                Route::patch('/service-orders/status', [AdminStorageServiceOrderController::class, 'status']);
                Route::patch('/service-orders/{field}', [AdminStorageServiceOrderController::class, 'boolean']);
                Route::delete('/service-orders/{id}', [AdminStorageServiceOrderController::class, 'delete']);
                Route::get('/service-orders/businesses/{id}/branches', [AdminStorageServiceOrderController::class, 'branches']);
            });

            Route::middleware('module.permission:storage-general-service-orders')->group(function () {
                Route::post('/general-service-orders', [AdminStorageGeneralServiceOrderController::class, 'save']);
                Route::post('/general-service-orders/paginate', [AdminStorageGeneralServiceOrderController::class, 'paginate']);
                Route::patch('/general-service-orders/status', [AdminStorageGeneralServiceOrderController::class, 'status']);
                Route::patch('/general-service-orders/{field}', [AdminStorageGeneralServiceOrderController::class, 'boolean']);
                Route::delete('/general-service-orders/{id}', [AdminStorageGeneralServiceOrderController::class, 'delete']);
                Route::get('/general-service-orders/businesses/{id}/branches', [AdminStorageGeneralServiceOrderController::class, 'branches']);
            });
        });

        Route::post('/clients', [AdminClientController::class, 'save']);
        Route::post('/clients/paginate', [AdminClientController::class, 'paginate']);
        Route::patch('/clients/status', [AdminClientController::class, 'status']);
        Route::patch('/clients/{field}', [AdminClientController::class, 'boolean']);
        Route::delete('/clients/{id}', [AdminClientController::class, 'delete']);
        Route::get('/clients/document/{type}/{number}', [AdminClientController::class, 'lookupByDocument']);

        Route::post('/eventual-clients', [AdminEventualClientController::class, 'save']);
        Route::post('/eventual-clients/paginate', [AdminEventualClientController::class, 'paginate']);
        Route::post('/eventual-clients/{id}/orders/paginate', [AdminEventualClientController::class, 'orders'])->whereNumber('id');
        Route::patch('/eventual-clients/status', [AdminEventualClientController::class, 'status']);
        Route::patch('/eventual-clients/{field}', [AdminEventualClientController::class, 'boolean']);
        Route::delete('/eventual-clients/{id}', [AdminEventualClientController::class, 'delete']);
        Route::get('/eventual-clients/document/{type}/{number}', [AdminEventualClientController::class, 'lookupByDocument']);

        Route::post('/client-distribution', [AdminClientDistributionNetworkController::class, 'save']);
        Route::post('/client-distribution/paginate', [AdminClientDistributionNetworkController::class, 'paginate']);
        Route::patch('/client-distribution/status', [AdminClientDistributionNetworkController::class, 'status']);
        Route::patch('/client-distribution/{field}', [AdminClientDistributionNetworkController::class, 'boolean']);
        Route::delete('/client-distribution/{id}', [AdminClientDistributionNetworkController::class, 'delete']);

        Route::post('/price-lists', [AdminPriceListController::class, 'save']);
        Route::post('/price-lists/paginate', [AdminPriceListController::class, 'paginate']);
        Route::patch('/price-lists/status', [AdminPriceListController::class, 'status']);
        Route::patch('/price-lists/{field}', [AdminPriceListController::class, 'boolean']);
        Route::delete('/price-lists/{id}', [AdminPriceListController::class, 'delete']);
        Route::get('/price-lists/businesses/{id}/branches', [AdminPriceListController::class, 'branches']);

        Route::post('/commercial-orders', [AdminCommercialOrderController::class, 'save']);
        Route::post('/commercial-orders/paginate', [AdminCommercialOrderController::class, 'paginate']);
        Route::patch('/commercial-orders/status', [AdminCommercialOrderController::class, 'status']);
        Route::patch('/commercial-orders/{field}', [AdminCommercialOrderController::class, 'boolean']);
        Route::delete('/commercial-orders/{id}', [AdminCommercialOrderController::class, 'delete']);
        Route::get('/commercial-orders/businesses/{id}/branches', [AdminCommercialOrderController::class, 'branches']);
        Route::get('/commercial-orders/clients/{id}/distribution-networks', [AdminCommercialOrderController::class, 'distributionNetworks']);
        Route::get('/commercial-orders/distribution-networks/{id}/addresses', [AdminCommercialOrderController::class, 'deliveryAddresses']);
        Route::get('/commercial-orders/pricing/resolve', [AdminCommercialOrderController::class, 'resolvePrice']);
        Route::post('/commercial-orders/articles', [AdminCommercialOrderController::class, 'articles']);
        Route::post('/commercial-orders/{id}/delivery-evidence', [AdminDeliveryEvidenceController::class, 'saveForCommercialOrder']);
        Route::get('/delivery-evidence-media/{filename}', [AdminDeliveryEvidenceController::class, 'media'])->where('filename', '.*');
        Route::post('/delivery-delay-reasons', [AdminDeliveryDelayReasonController::class, 'save']);
        Route::post('/delivery-delay-reasons/paginate', [AdminDeliveryDelayReasonController::class, 'paginate']);
        Route::patch('/delivery-delay-reasons/status', [AdminDeliveryDelayReasonController::class, 'status']);
        Route::patch('/delivery-delay-reasons/{field}', [AdminDeliveryDelayReasonController::class, 'boolean']);
        Route::delete('/delivery-delay-reasons/{id}', [AdminDeliveryDelayReasonController::class, 'delete']);

        Route::post('/take-orders', [AdminTakeOrderController::class, 'save']);
        Route::post('/take-orders/paginate', [AdminTakeOrderController::class, 'paginate']);
        Route::patch('/take-orders/status', [AdminTakeOrderController::class, 'status']);
        Route::patch('/take-orders/{field}', [AdminTakeOrderController::class, 'boolean']);
        Route::delete('/take-orders/{id}', [AdminTakeOrderController::class, 'delete']);
        Route::get('/take-orders/businesses/{id}/branches', [AdminTakeOrderController::class, 'branches']);
        Route::get('/take-orders/clients/{id}/distribution-networks', [AdminTakeOrderController::class, 'distributionNetworks']);
        Route::get('/take-orders/distribution-networks/{id}/addresses', [AdminTakeOrderController::class, 'deliveryAddresses']);
        Route::get('/take-orders/pricing/resolve', [AdminTakeOrderController::class, 'resolvePrice']);
        Route::post('/take-orders/articles', [AdminTakeOrderController::class, 'articles']);

        Route::post('/accounts-receivable/paginate', [AdminAccountsReceivableController::class, 'paginate']);
        Route::post('/accounts-receivable/{id}/payments', [AdminAccountsReceivableController::class, 'registerPayment']);
        Route::get('/accounts-receivable/payments/media/{filename}', [AdminAccountsReceivableController::class, 'paymentFile'])->where('filename', '.*');
        Route::post('/sales-report/paginate', [AdminSalesReportController::class, 'paginate']);
        Route::post('/daily-summary/paginate', [AdminDailySummaryController::class, 'paginate']);

        Route::post('/transactions', [AdminTransactionController::class, 'save']);
        Route::post('/transactions/paginate', [AdminTransactionController::class, 'paginate']);
        Route::delete('/transactions/{id}', [AdminTransactionController::class, 'delete']);
        Route::get('/transactions/report/{date}', [AdminTransactionController::class, 'report']);
        Route::post('/transactions/categories', [AdminTransactionCategoryController::class, 'save']);
        Route::post('/transactions/categories/paginate', [AdminTransactionCategoryController::class, 'paginate']);
        Route::patch('/transactions/categories/status', [AdminTransactionCategoryController::class, 'status']);
        Route::patch('/transactions/categories/{field}', [AdminTransactionCategoryController::class, 'boolean']);
        Route::delete('/transactions/categories/{id}', [AdminTransactionCategoryController::class, 'delete']);

        Route::post('/services-client', [AdminServiceClientController::class, 'save']);
        Route::post('/services-client/paginate', [AdminServiceClientController::class, 'paginate']);
        Route::patch('/services-client/status', [AdminServiceClientController::class, 'status']);
        Route::patch('/services-client/{field}', [AdminServiceClientController::class, 'boolean']);
        Route::delete('/services-client/{id}', [AdminServiceClientController::class, 'delete']);
        Route::get('/services-client/document/{type}/{number}', [AdminServiceClientController::class, 'lookupByDocument']);

        Route::post('/sample-orders/{id}/evidence', [AdminSampleOrderController::class, 'evidence']);
        Route::get('/sample-orders/evidence-media/{filename}', [AdminSampleOrderController::class, 'evidenceMedia'])->where('filename', '.*');
        Route::post('/sample-orders/articles', [AdminSampleOrderController::class, 'articles']);
        Route::post('/sample-orders', [AdminSampleOrderController::class, 'save']);
        Route::post('/sample-orders/paginate', [AdminSampleOrderController::class, 'paginate']);
        Route::patch('/sample-orders/status', [AdminSampleOrderController::class, 'status']);
        Route::patch('/sample-orders/{field}', [AdminSampleOrderController::class, 'boolean']);
        Route::delete('/sample-orders/{id}', [AdminSampleOrderController::class, 'delete']);

        Route::post('/dispatches', [AdminDispatchController::class, 'save']);
        Route::post('/dispatches/paginate', [AdminDispatchController::class, 'paginate']);
        Route::get('/dispatches/{id}', [AdminDispatchController::class, 'get'])->whereNumber('id');
        Route::patch('/dispatches/status', [AdminDispatchController::class, 'status']);
        Route::patch('/dispatches/{id}/manifest-conformity', [AdminDispatchController::class, 'manifestConformity'])->whereNumber('id');
        Route::patch('/dispatches/{field}', [AdminDispatchController::class, 'boolean']);
        Route::delete('/dispatches/{id}', [AdminDispatchController::class, 'delete']);
        Route::get('/dispatches/businesses/{id}/branches', [AdminDispatchController::class, 'branches']);
        Route::post('/dispatches/{id}/referral-guides/prepare', [AdminReferralGuideController::class, 'prepareFromDispatch']);

        Route::post('/referral-guides/paginate', [AdminReferralGuideController::class, 'paginate']);
        Route::patch('/referral-guides/{field}', [AdminReferralGuideController::class, 'boolean']);
        Route::post('/referral-guides/commercial-orders/{id}/prepare', [AdminReferralGuideController::class, 'prepareFromCommercialOrder']);
        Route::get('/referral-guides/{id}/connector-payload', [AdminReferralGuideController::class, 'connectorPayload']);
        Route::get('/referral-guides/{id}/download/{type}', [AdminReferralGuideController::class, 'download'])->where('type', 'pdf|xml|cdr');
        Route::post('/referral-guides/{id}/issue', [AdminReferralGuideController::class, 'issue']);
        Route::post('/referral-guides/{id}/cancel', [AdminReferralGuideController::class, 'cancel']);

        Route::post('/drivers', [AdminDriverController::class, 'save']);
        Route::post('/drivers/paginate', [AdminDriverController::class, 'paginate']);
        Route::patch('/drivers/status', [AdminDriverController::class, 'status']);
        Route::patch('/drivers/{field}', [AdminDriverController::class, 'boolean']);
        Route::delete('/drivers/{id}', [AdminDriverController::class, 'delete']);

        Route::post('/zones', [AdminZoneController::class, 'save']);
        Route::post('/zones/paginate', [AdminZoneController::class, 'paginate']);
        Route::patch('/zones/status', [AdminZoneController::class, 'status']);
        Route::patch('/zones/{field}', [AdminZoneController::class, 'boolean']);
        Route::delete('/zones/{id}', [AdminZoneController::class, 'delete']);

        Route::post('/vehicles', [AdminVehicleController::class, 'save']);
        Route::post('/vehicles/paginate', [AdminVehicleController::class, 'paginate']);
        Route::patch('/vehicles/status', [AdminVehicleController::class, 'status']);
        Route::patch('/vehicles/{field}', [AdminVehicleController::class, 'boolean']);
        Route::delete('/vehicles/{id}', [AdminVehicleController::class, 'delete']);

        Route::post('/activities', [AdminActivityController::class, 'save']);
        Route::post('/activities/paginate', [AdminActivityController::class, 'paginate']);
        Route::patch('/activities/status', [AdminActivityController::class, 'status']);
        Route::patch('/activities/{field}', [AdminActivityController::class, 'boolean']);
        Route::delete('/activities/{id}', [AdminActivityController::class, 'delete']);
        Route::get('/activities/businesses/{id}/branches', [AdminActivityController::class, 'branches']);

        Route::post('/billing-documents', [AdminBillingDocumentController::class, 'save']);
        Route::post('/billing-documents/paginate', [AdminBillingDocumentController::class, 'paginate']);
        Route::patch('/billing-documents/status', [AdminBillingDocumentController::class, 'status']);
        Route::patch('/billing-documents/{field}', [AdminBillingDocumentController::class, 'boolean']);
        Route::delete('/billing-documents/{id}', [AdminBillingDocumentController::class, 'delete']);
        Route::get('/billing-documents/{id}/connector-payload', [AdminBillingDocumentController::class, 'connectorPayload']);
        Route::post('/billing-documents/{id}/prepare-voucher', [AdminBillingDocumentController::class, 'prepareVoucher']);
        Route::post('/billing-documents/{id}/issue', [AdminBillingDocumentController::class, 'issue']);
        Route::post('/billing-documents/{id}/cancel', [AdminBillingDocumentController::class, 'cancel']);
        Route::post('/billing-documents/{id}/credit-note', [AdminBillingDocumentController::class, 'creditNote']);
        Route::post('/billing-documents/{id}/provider-response', [AdminBillingDocumentController::class, 'registerProviderResponse']);
        Route::post('/billing-documents/{id}/provider-status', [AdminBillingDocumentController::class, 'providerStatus']);
        Route::post('/billing-documents/{id}/email', [AdminBillingDocumentController::class, 'email']);
        Route::get('/billing-documents/{id}/download/{type}', [AdminBillingDocumentController::class, 'download'])->where('type', 'pdf|xml|cdr');

        Route::post('/services', [AdminServiceCatalogController::class, 'save']);
        Route::post('/services/paginate', [AdminServiceCatalogController::class, 'paginate']);
        Route::patch('/services/status', [AdminServiceCatalogController::class, 'status']);
        Route::patch('/services/{field}', [AdminServiceCatalogController::class, 'boolean']);
        Route::delete('/services/{id}', [AdminServiceCatalogController::class, 'delete']);

        Route::post('/service-orders', [AdminServiceOrderController::class, 'save']);
        Route::post('/service-orders/paginate', [AdminServiceOrderController::class, 'paginate']);
        Route::patch('/service-orders/status', [AdminServiceOrderController::class, 'status']);
        Route::patch('/service-orders/{field}', [AdminServiceOrderController::class, 'boolean']);
        Route::delete('/service-orders/{id}', [AdminServiceOrderController::class, 'delete']);
        Route::get('/service-orders/businesses/{id}/branches', [AdminServiceOrderController::class, 'branches']);

        Route::post('/orders', [AdminOrderController::class, 'save']);
        Route::post('/orders/paginate', [AdminOrderController::class, 'paginate']);
        Route::patch('/orders/status', [AdminOrderController::class, 'status']);
        Route::patch('/orders/{field}', [AdminOrderController::class, 'boolean']);
        Route::delete('/orders/{id}', [AdminOrderController::class, 'delete']);
        Route::get('/orders/businesses/{id}/branches', [AdminOrderController::class, 'branches']);
        Route::post('/orders/articles', [AdminOrderController::class, 'articles']);

        Route::post('/warehouses', [AdminWarehouseController::class, 'save']);
        Route::post('/warehouses/paginate', [AdminWarehouseController::class, 'paginate']);
        Route::get('/warehouses/{id}/locations', [AdminWarehouseController::class, 'locations']);
        Route::post('/warehouses/{id}/locations', [AdminWarehouseController::class, 'saveLocation']);
        Route::delete('/warehouses/{id}/locations/{locationId}', [AdminWarehouseController::class, 'deleteLocation']);
        Route::patch('/warehouses/status', [AdminWarehouseController::class, 'status']);
        Route::patch('/warehouses/{field}', [AdminWarehouseController::class, 'boolean']);
        Route::delete('/warehouses/{id}', [AdminWarehouseController::class, 'delete']);

        Route::get('/profile/{uuid}', [AdminProfileController::class, 'full']);
        Route::get('/profile/thumbnail/{uuid}', [AdminProfileController::class, 'thumbnail']);
        Route::post('/profile', [AdminProfileController::class, 'saveProfile']);
        Route::patch('/profile', [AdminProfileController::class, 'save']);

        Route::patch('/account/username', [AdminAccountController::class, 'username']);
        Route::patch('/account/password', [AdminAccountController::class, 'password']);
    });
});
