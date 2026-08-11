<?php

use Illuminate\Support\Facades\Route;

// Admin
use App\Http\Controllers\Admin\HomeController as AdminHomeController;
use App\Http\Controllers\Admin\ProfileController as AdminProfileController;
use App\Http\Controllers\Admin\AccountsPayableController as AdminAccountsPayableController;
use App\Http\Controllers\Admin\PurchaseOrderController as AdminPurchaseOrderController;
use App\Http\Controllers\Admin\PurchaseReceiptController as AdminPurchaseReceiptController;
use App\Http\Controllers\Admin\Magistrales\AccountsPayableController as AdminMagistralesAccountsPayableController;
use App\Http\Controllers\Admin\Magistrales\ArticleController as AdminMagistralesArticleController;
use App\Http\Controllers\Admin\Magistrales\DashboardController as AdminMagistralesDashboardController;
use App\Http\Controllers\Admin\Magistrales\FormatController as AdminMagistralesFormatController;
use App\Http\Controllers\Admin\Magistrales\FormulaController as AdminMagistralesFormulaController;
use App\Http\Controllers\Admin\Magistrales\ProductionOrderController as AdminMagistralesProductionOrderController;
use App\Http\Controllers\Admin\Magistrales\ResponsibleController as AdminMagistralesResponsibleController;
use App\Http\Controllers\Admin\Magistrales\SaleController as AdminMagistralesSaleController;
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
use App\Http\Controllers\Admin\Storage\ApiTokenController as AdminStorageApiTokenController;
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
use App\Http\Controllers\Admin\EventualClientController as AdminEventualClientController;
use App\Http\Controllers\Admin\TakeOrderController as AdminTakeOrderController;
use App\Http\Controllers\Admin\DispatchController as AdminDispatchController;
use App\Http\Controllers\Admin\DocumentationController as AdminDocumentationController;
use App\Http\Controllers\Admin\DailySummaryController as AdminDailySummaryController;
use App\Http\Controllers\Admin\DriverController as AdminDriverController;
use App\Http\Controllers\Admin\ReferralGuideController as AdminReferralGuideController;
use App\Http\Controllers\Admin\EntryNoteController as AdminEntryNoteController;
use App\Http\Controllers\Admin\ExitNoteController as AdminExitNoteController;
use App\Http\Controllers\Admin\GeneralController as AdminGeneralController;
use App\Http\Controllers\Admin\InventoryReportController as AdminInventoryReportController;
use App\Http\Controllers\Admin\InventoryController as AdminInventoryController;
use App\Http\Controllers\Admin\ItemController as AdminItemController;
use App\Http\Controllers\Admin\KardexController as AdminKardexController;
use App\Http\Controllers\Admin\AccountsReceivableController as AdminAccountsReceivableController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Admin\PickingController as AdminPickingController;
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
use App\Http\Controllers\Admin\DetractionTypeController as AdminDetractionTypeController;
use App\Http\Controllers\Admin\VehicleZoneController as AdminVehicleZoneController;
use App\Http\Controllers\Admin\WarehouseController as AdminWarehouseController;

// Public 
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BillingDocumentVerificationController;
use App\Http\Controllers\LoginController;
use App\Http\Controllers\MailingController;
use App\Support\ModulePermissions;

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
Route::get('/', fn() => auth()->check() ? redirect()->to(ModulePermissions::homePathForUser(auth()->user())) : redirect()->to('/login'));

// Authentication Routes
Route::get('/login', [LoginController::class, 'reactView'])->name('Login.jsx');

Route::get('/confirm-email/{token}', [AuthController::class, 'confirmEmailView'])->name('ConfirmEmail.jsx');
Route::get('/confirmation/{token}', [AuthController::class, 'loginView'])->name('confirmation');

Route::get('/unsubscribe', [MailingController::class, 'reactView'])->name('Unsubscribe.jsx');
Route::get('/v/{document}/{token}', [BillingDocumentVerificationController::class, 'show'])->name('billing-documents.verify');
Route::get('/v/{document}/{token}/{type}', [BillingDocumentVerificationController::class, 'file'])->where('type', 'pdf|xml|cdr')->name('billing-documents.file');
Route::view('/api-docs/storage', 'api-docs.storage')->name('api-docs.storage');

Route::middleware('auth')->group(function () {
    // Toma pedido se retiro del sistema: todo se maneja desde Pedido (/admin/commercial-orders).
    // La pantalla ya no es accesible; el controlador y la API siguen en el repo por si hay que volver.

    // Admin routes
    Route::prefix('admin')->middleware('admin.permission')->group(function () {
        Route::get('/', fn() => redirect()->to(ModulePermissions::homePathForUser(auth()->user())));
        Route::get('/home', [AdminHomeController::class, 'reactView']);
        Route::get('/generals', [AdminGeneralController::class, 'reactView']);
        $magistralesProducts = 'module.permission:magistrales-products,magistrales-articles';
        $magistralesCategory = 'module.permission:magistrales-category,magistrales-products';
        $magistralesFormats = 'module.permission:magistrales-formats,magistrales-products';
        $magistralesFormulas = 'module.permission:magistrales-formulas,magistrales-products';
        $magistralesProduction = 'module.permission:magistrales-production-order,magistrales-warehouse';
        $magistralesResponsible = 'module.permission:magistrales-responsible,magistrales-warehouse';
        $magistralesBilling = 'module.permission:magistrales-billing,magistrales-sales';

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
        Route::get('/detraction-types', [AdminDetractionTypeController::class, 'reactView']);
        Route::get('/units', [AdminUnitController::class, 'reactView']);
        Route::get('/units-of-measure', fn() => redirect('/admin/units'));
        Route::get('/magistrales/units', fn() => redirect('/admin/units'));
        Route::get('/magistrales/units-of-measure', fn() => redirect('/admin/units'));
        Route::get('/magistrales/laboratories', fn() => redirect('/admin/laboratories'));
        Route::get('/magistrales/categories', fn() => redirect('/admin/magistrales/articles'))->middleware($magistralesCategory);

        // Administración
        Route::get('/purchase-orders', [AdminPurchaseOrderController::class, 'reactView']);
        Route::get('/purchase-receipts', [AdminPurchaseReceiptController::class, 'reactView']);
        Route::get('/accounts-payable', [AdminAccountsPayableController::class, 'reactView']);
        Route::get('/expenses', [AdminTransactionController::class, 'reactView']);
        Route::get('/daily-summary', [AdminDailySummaryController::class, 'reactView']);

        // Comercial
        Route::get('/clients', [AdminClientController::class, 'reactView']);
        // Unificado: la ruta de eventuales abre la pantalla unica de Clientes (filtrada a eventuales)
        Route::get('/eventual-clients', [AdminClientController::class, 'reactView']);
        Route::get('/client-distribution', [AdminClientDistributionNetworkController::class, 'reactView']);
        Route::get('/accounts-receivable', [AdminAccountsReceivableController::class, 'reactView']);
        Route::get('/commercial-orders', [AdminCommercialOrderController::class, 'reactView']);
        Route::get('/commercial-orders/multivende', [AdminCommercialOrderController::class, 'reactView']);
        Route::get('/orders', [AdminOrderController::class, 'reactView']);
        Route::get('/pricing', [AdminPriceListController::class, 'reactView']);
        Route::get('/reports/sales', [AdminSalesReportController::class, 'reactView']);
        Route::get('/reports/inventory', [AdminInventoryReportController::class, 'reactView']);

        // Serv. Almacen...
        Route::get('/storage-inventory', [AdminStorageInventoryController::class, 'reactView'])->middleware('module.permission:storage-inventory');
        Route::get('/storage-clients', [AdminStorageClientController::class, 'reactView'])->middleware('module.permission:storage-clients');
        Route::get('/storage-service-orders', [AdminStorageServiceOrderController::class, 'reactView'])->middleware('module.permission:storage-service-orders');
        Route::get('/storage-units', [AdminStorageUnitController::class, 'reactView'])->middleware('module.permission:storage-units');
        Route::get('/storage-products', [AdminStorageProductController::class, 'reactView'])->middleware('module.permission:storage-products');
        Route::get('/storage-entry-note', [AdminStorageEntryNoteController::class, 'reactView'])->middleware('module.permission:storage-entry-note');
        Route::get('/storage-exit-note', [AdminStorageExitNoteController::class, 'reactView'])->middleware('module.permission:storage-exit-note');
        Route::get('/storage-kardex', [AdminStorageKardexController::class, 'reactView'])->middleware('module.permission:storage-kardex');
        Route::get('/storage-general-service', [AdminStorageGeneralServiceController::class, 'reactView'])->middleware('module.permission:storage-general-service');
        Route::get('/storage-billing-control', [AdminStorageBillingControlController::class, 'reactView'])->middleware('module.permission:storage-billing-control');
        Route::get('/storage-general-service-orders', [AdminStorageGeneralServiceOrderController::class, 'reactView'])->middleware('module.permission:storage-general-service-orders');
        Route::get('/storage-api-tokens', [AdminStorageApiTokenController::class, 'reactView'])->middleware('module.permission:storage-api-tokens');

        // Despacho
        Route::get('/activity', [AdminActivityController::class, 'reactView']);
        Route::get('/driver', [AdminDriverController::class, 'reactView']);
        Route::redirect('/driver-routes', '/admin/dispatch');
        Route::get('/picking', [AdminPickingController::class, 'reactView']);
        Route::get('/dispatch', [AdminDispatchController::class, 'reactView']);
        Route::get('/vehicle-zone', [AdminVehicleZoneController::class, 'reactView']);
        Route::get('/manual-guides', [AdminReferralGuideController::class, 'reactView']);

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
        Route::get('/magistrales/dashboard', [AdminMagistralesDashboardController::class, 'reactView'])->middleware('module.permission:magistrales-dashboard');
        Route::get('/magistrales-dashboard', [AdminMagistralesDashboardController::class, 'reactView'])->middleware('module.permission:magistrales-dashboard');
        Route::get('/magistrales/articles', [AdminMagistralesArticleController::class, 'reactView'])->middleware($magistralesProducts);
        Route::get('/magistrales-articles', [AdminMagistralesArticleController::class, 'reactView'])->middleware($magistralesProducts);
        Route::get('/magistrales/batches', fn() => redirect('/admin/magistrales/articles'))->middleware($magistralesProducts);
        Route::get('/magistrales/entry-note', fn() => redirect('/admin/entry-note'));
        Route::get('/magistrales/exit-note', fn() => redirect('/admin/exit-note'));
        Route::get('/magistrales/purchase-orders', fn() => redirect('/admin/purchase-orders'));
        Route::get('/magistrales/accounts-payable', [AdminMagistralesAccountsPayableController::class, 'reactView'])->middleware('module.permission:magistrales-procurement');
        Route::get('/magistrales/billing-settings', fn() => redirect('/admin/billing-settings'))->middleware($magistralesBilling);
        Route::get('/magistrales/billing-documents', fn() => redirect('/admin/magistrales-sales'))->middleware($magistralesBilling);
        Route::get('/magistrales-category', fn() => redirect('/admin/magistrales/articles'))->middleware($magistralesCategory);
        Route::get('/magistrales/formats', [AdminMagistralesFormatController::class, 'reactView'])->middleware($magistralesFormats);
        Route::get('/magistrales-formats', [AdminMagistralesFormatController::class, 'reactView'])->middleware($magistralesFormats);
        Route::get('/magistrales/formulas', [AdminMagistralesFormulaController::class, 'reactView'])->middleware($magistralesFormulas);
        Route::get('/magistrales-formulas', [AdminMagistralesFormulaController::class, 'reactView'])->middleware($magistralesFormulas);
        Route::get('/magistrales/incomes', fn() => redirect('/admin/entry-note'));
        Route::get('/magistrales-incomes', fn() => redirect('/admin/entry-note'));
        Route::get('/magistrales/inventory', fn() => redirect('/admin/inventory'));
        Route::get('/magistrales-inventory', fn() => redirect('/admin/inventory'));
        Route::get('/magistrales/kardex', fn() => redirect('/admin/kardex'));
        Route::get('/magistrales-kardex', fn() => redirect('/admin/kardex'));
        Route::get('/magistrales-laboratory', fn() => redirect('/admin/laboratories'));
        Route::get('/magistrales-purchase-order', fn() => redirect('/admin/purchase-orders'));
        Route::get('/magistrales/production-orders', [AdminMagistralesProductionOrderController::class, 'reactView'])->middleware($magistralesProduction);
        Route::get('/magistrales-production-order', [AdminMagistralesProductionOrderController::class, 'reactView'])->middleware($magistralesProduction);
        Route::get('/magistrales/suppliers', fn() => redirect('/admin/suppliers'));
        Route::get('/magistrales/warehouses', fn() => redirect('/admin/inventory'));
        Route::get('/magistrales-supplier', fn() => redirect('/admin/suppliers'));
        Route::get('/magistrales/responsibles', [AdminMagistralesResponsibleController::class, 'reactView'])->middleware($magistralesResponsible);
        Route::get('/magistrales-responsible', [AdminMagistralesResponsibleController::class, 'reactView'])->middleware($magistralesResponsible);
        Route::get('/magistrales/outputs', fn() => redirect('/admin/exit-note'));
        Route::get('/magistrales-outputs', fn() => redirect('/admin/exit-note'));
        Route::get('/magistrales-unit', fn() => redirect('/admin/units'));
        Route::get('/magistrales/sales', [AdminMagistralesSaleController::class, 'reactView'])->middleware($magistralesBilling);
        Route::get('/magistrales-sales', [AdminMagistralesSaleController::class, 'reactView'])->middleware($magistralesBilling);

        Route::get('/users', [AdminUserController::class, 'reactView']);
        Route::get('/roles', [AdminRoleController::class, 'reactView']);
        Route::get('/businesses', [AdminBusinessController::class, 'reactView']);

        // Documentacion
        Route::get('/docs', [AdminDocumentationController::class, 'reactView']);
        Route::get('/docs/file/{manual}', [AdminDocumentationController::class, 'file'])
            ->where('manual', 'uso|programador');

        Route::get('/profile', [AdminProfileController::class, 'reactView'])->name('Admin/Profile.jsx');
        Route::get('/account', [AdminAccountController::class, 'reactView'])->name('Admin/Account.jsx');
    });
});



Route::get('/mailing/new-formula', fn() => view('mailing.new-formula'));
Route::get('/repository/{uuid}', [AdminRepositoryController::class, 'media'])->withoutMiddleware('throttle');
Route::get('/graph/sales/{type}/{filter}', [AdminHomeController::class, 'getSales'])
    ->middleware(['auth', 'module.permission:dashboard']);
