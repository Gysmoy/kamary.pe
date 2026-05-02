<?php

use Illuminate\Support\Facades\Route;

// Admin
use App\Http\Controllers\Admin\HomeController as AdminHomeController;
use App\Http\Controllers\Admin\ProfileController as AdminProfileController;
use App\Http\Controllers\Admin\AccountsPayableController as AdminAccountsPayableController;
use App\Http\Controllers\Admin\PurchaseOrderController as AdminPurchaseOrderController;
use App\Http\Controllers\Admin\PurchaseReceiptController as AdminPurchaseReceiptController;
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
use App\Http\Controllers\Admin\ComingSoonController as AdminComingSoonController;
use App\Http\Controllers\Admin\LaboratoryController as AdminLaboratoryController;
use App\Http\Controllers\Admin\RoleController as AdminRoleController;
use App\Http\Controllers\Admin\ServiceCatalogController as AdminServiceCatalogController;
use App\Http\Controllers\Admin\ServiceOrderController as AdminServiceOrderController;
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
Route::get('/', fn() => redirect('/login'));

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
        Route::get('/magistrales/units', [AdminUnitController::class, 'reactView']);
        Route::get('/magistrales/units-of-measure', fn() => redirect('/admin/magistrales/units'));
        Route::get('/magistrales/laboratories', [AdminLaboratoryController::class, 'reactView']);
        Route::get('/magistrales/categories', fn() => redirect('/admin/magistrales/laboratories'));

        // Administración
        Route::get('/purchase-orders', [AdminPurchaseOrderController::class, 'reactView']);
        Route::get('/purchase-receipts', [AdminPurchaseReceiptController::class, 'reactView']);
        Route::get('/accounts-payable', [AdminAccountsPayableController::class, 'reactView']);
        Route::get('/expenses', [AdminComingSoonController::class, 'reactView']);
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
        Route::get('/storage-inventory', [AdminComingSoonController::class, 'reactView']);
        Route::get('/storage-clients', [AdminComingSoonController::class, 'reactView']);
        Route::get('/service-orders', [AdminServiceOrderController::class, 'reactView']);
        Route::get('/storage-units', [AdminComingSoonController::class, 'reactView']);
        Route::get('/storage-products', [AdminComingSoonController::class, 'reactView']);
        Route::get('/storage-entry-note', [AdminComingSoonController::class, 'reactView']);
        Route::get('/storage-exit-note', [AdminComingSoonController::class, 'reactView']);
        Route::get('/storage-kardex', [AdminComingSoonController::class, 'reactView']);
        Route::get('/storage-general-service', [AdminComingSoonController::class, 'reactView']);
        Route::get('/storage-billing-control', [AdminComingSoonController::class, 'reactView']);
        Route::get('/storage-general-service-orders', [AdminComingSoonController::class, 'reactView']);

        // Despacho
        Route::get('/activity', [AdminActivityController::class, 'reactView']);
        Route::get('/driver', [AdminDriverController::class, 'reactView']);
        Route::get('/dispatch', [AdminDispatchController::class, 'reactView']);
        Route::get('/vehicle-zone', [AdminVehicleZoneController::class, 'reactView']);

        // Servicios
        Route::get('/services-client', [AdminComingSoonController::class, 'reactView']);
        Route::get('/services-billing', [AdminBillingDocumentController::class, 'reactView']);
        Route::get('/services-service-order', [AdminServiceOrderController::class, 'reactView']);
        Route::get('/services-services', [AdminServiceCatalogController::class, 'reactView']);
        Route::get('/billing-settings', [AdminBillingSettingsController::class, 'reactView']);
        Route::get('/billing-documents', [AdminBillingDocumentController::class, 'reactView']);

        // Muestras
        Route::get('/sample-orders', [AdminComingSoonController::class, 'reactView']);

        // Magistrales
        Route::get('/magistrales/articles', [AdminArticleController::class, 'reactView']);
        Route::get('/magistrales-articles', [AdminArticleController::class, 'reactView']);
        Route::get('/magistrales/batches', [AdminBatchController::class, 'reactView']);
        Route::get('/magistrales/entry-note', [AdminEntryNoteController::class, 'reactView']);
        Route::get('/magistrales/exit-note', [AdminExitNoteController::class, 'reactView']);
        Route::get('/magistrales/purchase-orders', [AdminPurchaseOrderController::class, 'reactView']);
        Route::get('/magistrales/purchase-receipts', [AdminPurchaseReceiptController::class, 'reactView']);
        Route::get('/magistrales/accounts-payable', [AdminAccountsPayableController::class, 'reactView']);
        Route::get('/magistrales/billing-settings', [AdminBillingSettingsController::class, 'reactView']);
        Route::get('/magistrales/billing-documents', [AdminBillingDocumentController::class, 'reactView']);
        Route::get('/magistrales-category', [AdminComingSoonController::class, 'reactView']);
        Route::get('/magistrales-formats', [AdminComingSoonController::class, 'reactView']);
        Route::get('/magistrales-formulas', [AdminComingSoonController::class, 'reactView']);
        Route::get('/magistrales-incomes', [AdminComingSoonController::class, 'reactView']);
        Route::get('/magistrales/inventory', [AdminInventoryController::class, 'reactView']);
        Route::get('/magistrales-inventory', [AdminInventoryController::class, 'reactView']);
        Route::get('/magistrales/kardex', [AdminKardexController::class, 'reactView']);
        Route::get('/magistrales-kardex', [AdminKardexController::class, 'reactView']);
        Route::get('/magistrales-laboratory', [AdminComingSoonController::class, 'reactView']);
        Route::get('/magistrales-purchase-order', fn() => redirect('/admin/magistrales/purchase-orders'));
        Route::get('/magistrales-production-order', [AdminComingSoonController::class, 'reactView']);
        Route::get('/magistrales/suppliers', [AdminSupplierController::class, 'reactView']);
        Route::get('/magistrales/warehouses', [AdminWarehouseController::class, 'reactView']);
        Route::get('/magistrales-supplier', [AdminSupplierController::class, 'reactView']);
        Route::get('/magistrales-responsible', [AdminComingSoonController::class, 'reactView']);
        Route::get('/magistrales-outputs', [AdminComingSoonController::class, 'reactView']);
        Route::get('/magistrales-unit', [AdminComingSoonController::class, 'reactView']);
        Route::get('/magistrales-sales', [AdminComingSoonController::class, 'reactView']);

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



