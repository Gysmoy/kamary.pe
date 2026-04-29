<?php

use Illuminate\Support\Facades\Route;

// Admin
use App\Http\Controllers\Admin\ActivityController as AdminActivityController;
use App\Http\Controllers\Admin\ProfileController as AdminProfileController;
use App\Http\Controllers\Admin\AccountsPayableController as AdminAccountsPayableController;
use App\Http\Controllers\Admin\AccountController as AdminAccountController;
use App\Http\Controllers\Admin\ArticleController as AdminArticleController;
use App\Http\Controllers\Admin\BatchController as AdminBatchController;
use App\Http\Controllers\Admin\BillingDocumentController as AdminBillingDocumentController;
use App\Http\Controllers\Admin\BusinessController as AdminBusinessController;
use App\Http\Controllers\Admin\ClientDistributionNetworkController as AdminClientDistributionNetworkController;
use App\Http\Controllers\Admin\ClientController as AdminClientController;
use App\Http\Controllers\Admin\CommercialOrderController as AdminCommercialOrderController;
use App\Http\Controllers\Admin\DispatchController as AdminDispatchController;
use App\Http\Controllers\Admin\DailySummaryController as AdminDailySummaryController;
use App\Http\Controllers\Admin\DriverController as AdminDriverController;
use App\Http\Controllers\Admin\EventualClientController as AdminEventualClientController;
use App\Http\Controllers\Admin\EntryNoteController as AdminEntryNoteController;
use App\Http\Controllers\Admin\ExitNoteController as AdminExitNoteController;
use App\Http\Controllers\Admin\InventoryReportController as AdminInventoryReportController;
use App\Http\Controllers\Admin\InventoryController as AdminInventoryController;
use App\Http\Controllers\Admin\KardexController as AdminKardexController;
use App\Http\Controllers\Admin\LaboratoryController as AdminLaboratoryController;
use App\Http\Controllers\Admin\AccountsReceivableController as AdminAccountsReceivableController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Admin\PriceListController as AdminPriceListController;
use App\Http\Controllers\Admin\PurchaseOrderController as AdminPurchaseOrderController;
use App\Http\Controllers\Admin\PurchaseReceiptController as AdminPurchaseReceiptController;
use App\Http\Controllers\Admin\ServiceCatalogController as AdminServiceCatalogController;
use App\Http\Controllers\Admin\ServiceOrderController as AdminServiceOrderController;
use App\Http\Controllers\Admin\SalesReportController as AdminSalesReportController;
use App\Http\Controllers\Admin\SupplierController as AdminSupplierController;
use App\Http\Controllers\Admin\VehicleController as AdminVehicleController;
use App\Http\Controllers\Admin\ZoneController as AdminZoneController;
use App\Http\Controllers\Admin\RoleController as AdminRoleController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\UnitController as AdminUnitController;
use App\Http\Controllers\Admin\WarehouseController as AdminWarehouseController;

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

Route::middleware('auth')->group(function () {
    Route::delete('logout', [AuthController::class, 'destroy'])->name('logout');


    Route::prefix('admin')->group(function () {
        Route::post('/users', [AdminUserController::class, 'save']);
        Route::post('/users/paginate', [AdminUserController::class, 'paginate']);
        Route::patch('/users/status', [AdminUserController::class, 'status']);
        Route::patch('/users/{field}', [AdminUserController::class, 'boolean']);
        Route::delete('/users/{id}', [AdminUserController::class, 'delete']);

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
        Route::patch('/entry-notes/status', [AdminEntryNoteController::class, 'status']);
        Route::patch('/entry-notes/{field}', [AdminEntryNoteController::class, 'boolean']);
        Route::delete('/entry-notes/{id}', [AdminEntryNoteController::class, 'delete']);
        Route::get('/entry-notes/businesses/{id}/branches', [AdminEntryNoteController::class, 'branches']);
        Route::get('/entry-notes/current-stock', [AdminEntryNoteController::class, 'currentStock']);

        Route::post('/exit-notes', [AdminExitNoteController::class, 'save']);
        Route::post('/exit-notes/paginate', [AdminExitNoteController::class, 'paginate']);
        Route::patch('/exit-notes/status', [AdminExitNoteController::class, 'status']);
        Route::patch('/exit-notes/{field}', [AdminExitNoteController::class, 'boolean']);
        Route::delete('/exit-notes/{id}', [AdminExitNoteController::class, 'delete']);
        Route::get('/exit-notes/businesses/{id}/branches', [AdminExitNoteController::class, 'branches']);

        Route::post('/inventory/paginate', [AdminInventoryController::class, 'paginate']);
        Route::post('/inventory-report/paginate', [AdminInventoryReportController::class, 'paginate']);
        Route::post('/kardex/paginate', [AdminKardexController::class, 'paginate']);

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

        Route::post('/clients', [AdminClientController::class, 'save']);
        Route::post('/clients/paginate', [AdminClientController::class, 'paginate']);
        Route::patch('/clients/status', [AdminClientController::class, 'status']);
        Route::patch('/clients/{field}', [AdminClientController::class, 'boolean']);
        Route::delete('/clients/{id}', [AdminClientController::class, 'delete']);
        Route::get('/clients/document/{type}/{number}', [AdminClientController::class, 'lookupByDocument']);

        Route::post('/eventual-clients', [AdminEventualClientController::class, 'save']);
        Route::post('/eventual-clients/paginate', [AdminEventualClientController::class, 'paginate']);
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

        Route::post('/accounts-receivable/paginate', [AdminAccountsReceivableController::class, 'paginate']);
        Route::post('/accounts-receivable/{id}/payments', [AdminAccountsReceivableController::class, 'registerPayment']);
        Route::get('/accounts-receivable/payments/media/{filename}', [AdminAccountsReceivableController::class, 'paymentFile'])->where('filename', '.*');
        Route::post('/sales-report/paginate', [AdminSalesReportController::class, 'paginate']);
        Route::post('/daily-summary/paginate', [AdminDailySummaryController::class, 'paginate']);

        Route::post('/dispatches', [AdminDispatchController::class, 'save']);
        Route::post('/dispatches/paginate', [AdminDispatchController::class, 'paginate']);
        Route::patch('/dispatches/status', [AdminDispatchController::class, 'status']);
        Route::patch('/dispatches/{field}', [AdminDispatchController::class, 'boolean']);
        Route::delete('/dispatches/{id}', [AdminDispatchController::class, 'delete']);
        Route::get('/dispatches/businesses/{id}/branches', [AdminDispatchController::class, 'branches']);

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
        Route::post('/billing-documents/{id}/issue', [AdminBillingDocumentController::class, 'issue']);
        Route::post('/billing-documents/{id}/cancel', [AdminBillingDocumentController::class, 'cancel']);
        Route::post('/billing-documents/{id}/credit-note', [AdminBillingDocumentController::class, 'creditNote']);
        Route::post('/billing-documents/{id}/provider-response', [AdminBillingDocumentController::class, 'registerProviderResponse']);
        Route::post('/billing-documents/{id}/provider-status', [AdminBillingDocumentController::class, 'providerStatus']);
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

        Route::post('/warehouses', [AdminWarehouseController::class, 'save']);
        Route::post('/warehouses/paginate', [AdminWarehouseController::class, 'paginate']);
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

