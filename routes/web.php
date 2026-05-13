<?php

use Illuminate\Support\Facades\Route;

// Admin
use App\Http\Controllers\Admin\HomeController as AdminHomeController;
use App\Http\Controllers\Admin\ProfileController as AdminProfileController;
use App\Http\Controllers\Admin\AccountsPayableController as AdminAccountsPayableController;
use App\Http\Controllers\Admin\PurchaseOrderController as AdminPurchaseOrderController;
use App\Http\Controllers\Admin\PurchaseReceiptController as AdminPurchaseReceiptController;
use App\Http\Controllers\Admin\Magistrales\ArticleController as AdminMagistralesArticleController;
use App\Http\Controllers\Admin\Magistrales\CategoryController as AdminMagistralesCategoryController;
use App\Http\Controllers\Admin\Magistrales\DashboardController as AdminMagistralesDashboardController;
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
use App\Http\Controllers\Admin\Storage\ClientController as AdminStorageClientController;
use App\Http\Controllers\Admin\Storage\EntryNoteController as AdminStorageEntryNoteController;
use App\Http\Controllers\Admin\Storage\ExitNoteController as AdminStorageExitNoteController;
use App\Http\Controllers\Admin\Storage\GeneralServiceController as AdminStorageGeneralServiceController;
use App\Http\Controllers\Admin\Storage\GeneralServiceOrderController as AdminStorageGeneralServiceOrderController;
use App\Http\Controllers\Admin\Storage\InventoryController as AdminStorageInventoryController;
use App\Http\Controllers\Admin\Storage\KardexController as AdminStorageKardexController;
use App\Http\Controllers\Admin\Storage\ProductController as AdminStorageProductController;
use App\Http\Controllers\Admin\Storage\ServiceOrderController as AdminStorageServiceOrderController;
use App\Http\Controllers\Admin\Storage\UnitController as AdminStorageUnitController;
use App\Http\Controllers\Admin\AccountController as AdminAccountController;
use App\Http\Controllers\Admin\ActivityController as AdminActivityController;
use App\Http\Controllers\Admin\ArticleController as AdminArticleController;
use App\Http\Controllers\Admin\BatchController as AdminBatchController;
use App\Http\Controllers\Admin\BillingDocumentController as AdminBillingDocumentController;
use App\Http\Controllers\Admin\BillingSettingsController as AdminBillingSettingsController;
use App\Http\Controllers\Admin\BusinessController as AdminBusinessController;
use App\Http\Controllers\Admin\ClientDistributionNetworkController as AdminClientDistributionNetworkController;
use App\Http\Controllers\Admin\ClientController as AdminClientController;
use App\Http\Controllers\Admin\CommercialOrderController as AdminCommercialOrderController;
use App\Http\Controllers\Admin\DispatchController as AdminDispatchController;
use App\Http\Controllers\Admin\DailySummaryController as AdminDailySummaryController;
use App\Http\Controllers\Admin\DriverController as AdminDriverController;
use App\Http\Controllers\Admin\EntryNoteController as AdminEntryNoteController;
use App\Http\Controllers\Admin\ExitNoteController as AdminExitNoteController;
use App\Http\Controllers\Admin\InventoryReportController as AdminInventoryReportController;
use App\Http\Controllers\Admin\InventoryController as AdminInventoryController;
use App\Http\Controllers\Admin\ItemController as AdminItemController;
use App\Http\Controllers\Admin\KardexController as AdminKardexController;
use App\Http\Controllers\Admin\AccountsReceivableController as AdminAccountsReceivableController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Admin\PriceListController as AdminPriceListController;
use App\Http\Controllers\Admin\SaleController as AdminSaleController;
use App\Http\Controllers\Admin\SalesReportController as AdminSalesReportController;
use App\Http\Controllers\Admin\SupplierController as AdminSupplierController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\RepositoryController as AdminRepositoryController;
use App\Http\Controllers\Admin\CardController as AdminCardController;
use App\Http\Controllers\Admin\LaboratoryController as AdminLaboratoryController;
use App\Http\Controllers\Admin\RoleController as AdminRoleController;
use App\Http\Controllers\Admin\ServiceCatalogController as AdminServiceCatalogController;
use App\Http\Controllers\Admin\ServiceClientController as AdminServiceClientController;
use App\Http\Controllers\Admin\ServiceOrderController as AdminServiceOrderController;
use App\Http\Controllers\Admin\SampleOrderController as AdminSampleOrderController;
use App\Http\Controllers\Admin\TransactionController as AdminTransactionController;
use App\Http\Controllers\Admin\UnitController as AdminUnitController;
use App\Http\Controllers\Admin\VehicleZoneController as AdminVehicleZoneController;
use App\Http\Controllers\Admin\WarehouseController as AdminWarehouseController;

// Public 
use App\Http\Controllers\AuthController;
use App\Http\Controllers\LoginController;
use App\Http\Controllers\MailingController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

// Public routes
Route::get('/', fn() => auth()->check() ? redirect()->to('/admin/home') : redirect()->to('/login'));

// Authentication Routes
Route::get('/login', [LoginController::class, 'reactView'])->name('Login.jsx');

Route::get('/confirm-email/{token}', [AuthController::class, 'confirmEmailView'])->name('ConfirmEmail.jsx');
Route::get('/confirmation/{token}', [AuthController::class, 'loginView'])->name('confirmation');

Route::get('/unsubscribe', [MailingController::class, 'reactView'])->name('Unsubscribe.jsx');

Route::middleware('auth')->group(function () {
    // Admin routes
    Route::prefix('admin')->group(function () {
        Route::get('/', fn() => redirect()->to('/admin/home'));
        Route::get('/home', [AdminHomeController::class, 'reactView']);

        // Almacén
        Route::get('/articles', [AdminArticleController::class, 'reactView']);
        Route::get('/inventory', [AdminInventoryController::class, 'reactView']);
        Route::get('/kardex', [AdminKardexController::class, 'reactView']);
        Route::get('/laboratories', [AdminLaboratoryController::class, 'reactView']);
        Route::get('/batches', [AdminBatchController::class, 'reactView']);
        Route::get('/entry-note', [AdminEntryNoteController::class, 'reactView']);
        Route::get('/exit-note', [AdminExitNoteController::class, 'reactView']);
        Route::get('/warehouses', [AdminWarehouseController::class, 'reactView']);
        Route::get('/suppliers', [AdminSupplierController::class, 'reactView']);
        Route::get('/categories', fn() => redirect('/admin/laboratories'));
        Route::get('/units', [AdminUnitController::class, 'reactView']);
        Route::get('/units-of-measure', fn() => redirect('/admin/units'));
        Route::get('/magistrales/units', [AdminMagistralesUnitController::class, 'reactView']);
        Route::get('/magistrales/units-of-measure', fn() => redirect('/admin/magistrales/units'));
        Route::get('/magistrales/laboratories', [AdminMagistralesLaboratoryController::class, 'reactView']);
        Route::get('/magistrales/categories', [AdminMagistralesCategoryController::class, 'reactView']);

        // Administración
        Route::get('/purchase-orders', [AdminPurchaseOrderController::class, 'reactView']);
        Route::get('/purchase-receipts', [AdminPurchaseReceiptController::class, 'reactView']);
        Route::get('/accounts-payable', [AdminAccountsPayableController::class, 'reactView']);
        Route::get('/expenses', [AdminTransactionController::class, 'reactView']);
        Route::get('/daily-summary', [AdminDailySummaryController::class, 'reactView']);

        // Comercial
        Route::get('/clients', [AdminClientController::class, 'reactView']);
        Route::get('/eventual-clients', [AdminClientController::class, 'reactView']);
        Route::get('/client-distribution', [AdminClientDistributionNetworkController::class, 'reactView']);
        Route::get('/accounts-receivable', [AdminAccountsReceivableController::class, 'reactView']);
        Route::get('/commercial-orders', [AdminCommercialOrderController::class, 'reactView']);
        Route::get('/orders', [AdminOrderController::class, 'reactView']);
        Route::get('/pricing', [AdminPriceListController::class, 'reactView']);
        Route::get('/reports/sales', [AdminSalesReportController::class, 'reactView']);
        Route::get('/reports/inventory', [AdminInventoryReportController::class, 'reactView']);

        // Serv. Almacen...
        Route::get('/storage-inventory', [AdminStorageInventoryController::class, 'reactView']);
        Route::get('/storage-clients', [AdminStorageClientController::class, 'reactView']);
        Route::get('/storage-service-orders', [AdminStorageServiceOrderController::class, 'reactView']);
        Route::get('/storage-units', [AdminStorageUnitController::class, 'reactView']);
        Route::get('/storage-products', [AdminStorageProductController::class, 'reactView']);
        Route::get('/storage-entry-note', [AdminStorageEntryNoteController::class, 'reactView']);
        Route::get('/storage-exit-note', [AdminStorageExitNoteController::class, 'reactView']);
        Route::get('/storage-kardex', [AdminStorageKardexController::class, 'reactView']);
        Route::get('/storage-general-service', [AdminStorageGeneralServiceController::class, 'reactView']);
        Route::get('/storage-billing-control', [AdminStorageBillingControlController::class, 'reactView']);
        Route::get('/storage-general-service-orders', [AdminStorageGeneralServiceOrderController::class, 'reactView']);

        // Despacho
        Route::get('/activity', [AdminActivityController::class, 'reactView']);
        Route::get('/driver', [AdminDriverController::class, 'reactView']);
        Route::get('/dispatch', [AdminDispatchController::class, 'reactView']);
        Route::get('/vehicle-zone', [AdminVehicleZoneController::class, 'reactView']);

        // Servicios
        Route::get('/services-client', [AdminServiceClientController::class, 'reactView']);
        Route::get('/services-billing', [AdminBillingDocumentController::class, 'reactView']);
        Route::get('/services-service-order', [AdminServiceOrderController::class, 'reactView']);
        Route::get('/services-services', [AdminServiceCatalogController::class, 'reactView']);
        Route::get('/billing-settings', [AdminBillingSettingsController::class, 'reactView']);
        Route::get('/billing-documents', [AdminBillingDocumentController::class, 'reactView']);

        // Muestras
        Route::get('/sample-orders', [AdminSampleOrderController::class, 'reactView']);

        // Magistrales
        Route::get('/magistrales/dashboard', [AdminMagistralesDashboardController::class, 'reactView']);
        Route::get('/magistrales-dashboard', [AdminMagistralesDashboardController::class, 'reactView']);
        Route::get('/magistrales/articles', [AdminMagistralesArticleController::class, 'reactView']);
        Route::get('/magistrales-articles', [AdminMagistralesArticleController::class, 'reactView']);
        Route::get('/magistrales/batches', [AdminBatchController::class, 'reactView']);
        Route::get('/magistrales/entry-note', [AdminEntryNoteController::class, 'reactView']);
        Route::get('/magistrales/exit-note', [AdminExitNoteController::class, 'reactView']);
        Route::get('/magistrales/purchase-orders', [AdminMagistralesPurchaseOrderController::class, 'reactView']);
        Route::get('/magistrales/purchase-receipts', [AdminPurchaseReceiptController::class, 'reactView']);
        Route::get('/magistrales/accounts-payable', [AdminAccountsPayableController::class, 'reactView']);
        Route::get('/magistrales/billing-settings', [AdminBillingSettingsController::class, 'reactView']);
        Route::get('/magistrales/billing-documents', [AdminBillingDocumentController::class, 'reactView']);
        Route::get('/magistrales-category', [AdminMagistralesCategoryController::class, 'reactView']);
        Route::get('/magistrales/formats', [AdminMagistralesFormatController::class, 'reactView']);
        Route::get('/magistrales-formats', [AdminMagistralesFormatController::class, 'reactView']);
        Route::get('/magistrales/formulas', [AdminMagistralesFormulaController::class, 'reactView']);
        Route::get('/magistrales-formulas', [AdminMagistralesFormulaController::class, 'reactView']);
        Route::get('/magistrales/incomes', [AdminMagistralesIncomeController::class, 'reactView']);
        Route::get('/magistrales-incomes', [AdminMagistralesIncomeController::class, 'reactView']);
        Route::get('/magistrales/inventory', [AdminMagistralesInventoryController::class, 'reactView']);
        Route::get('/magistrales-inventory', [AdminMagistralesInventoryController::class, 'reactView']);
        Route::get('/magistrales/kardex', [AdminMagistralesKardexController::class, 'reactView']);
        Route::get('/magistrales-kardex', [AdminMagistralesKardexController::class, 'reactView']);
        Route::get('/magistrales-laboratory', [AdminMagistralesLaboratoryController::class, 'reactView']);
        Route::get('/magistrales-purchase-order', fn() => redirect('/admin/magistrales/purchase-orders'));
        Route::get('/magistrales/production-orders', [AdminMagistralesProductionOrderController::class, 'reactView']);
        Route::get('/magistrales-production-order', [AdminMagistralesProductionOrderController::class, 'reactView']);
        Route::get('/magistrales/suppliers', [AdminMagistralesSupplierController::class, 'reactView']);
        Route::get('/magistrales/warehouses', [AdminWarehouseController::class, 'reactView']);
        Route::get('/magistrales-supplier', [AdminMagistralesSupplierController::class, 'reactView']);
        Route::get('/magistrales/responsibles', [AdminMagistralesResponsibleController::class, 'reactView']);
        Route::get('/magistrales-responsible', [AdminMagistralesResponsibleController::class, 'reactView']);
        Route::get('/magistrales/outputs', [AdminMagistralesOutputController::class, 'reactView']);
        Route::get('/magistrales-outputs', [AdminMagistralesOutputController::class, 'reactView']);
        Route::get('/magistrales-unit', [AdminMagistralesUnitController::class, 'reactView']);
        Route::get('/magistrales/sales', [AdminMagistralesSaleController::class, 'reactView']);
        Route::get('/magistrales-sales', [AdminMagistralesSaleController::class, 'reactView']);

        Route::get('/users', [AdminUserController::class, 'reactView']);
        Route::get('/roles', [AdminRoleController::class, 'reactView']);
        Route::get('/businesses', [AdminBusinessController::class, 'reactView']);

        Route::get('/profile', [AdminProfileController::class, 'reactView'])->name('Admin/Profile.jsx');
        Route::get('/account', [AdminAccountController::class, 'reactView'])->name('Admin/Account.jsx');
    });
});



Route::get('/mailing/new-formula', fn() => view('mailing.new-formula'));
Route::get('/repository/{uuid}', [AdminRepositoryController::class, 'media'])->withoutMiddleware('throttle');
Route::get('/graph/sales/{type}/{filter}', [AdminHomeController::class, 'getSales']);


