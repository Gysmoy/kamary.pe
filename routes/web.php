<?php

use Illuminate\Support\Facades\Route;

// Admin
use App\Http\Controllers\Admin\HomeController as AdminHomeController;
use App\Http\Controllers\Admin\ProfileController as AdminProfileController;
use App\Http\Controllers\Admin\AccountController as AdminAccountController;
use App\Http\Controllers\Admin\ItemController as AdminItemController;
use App\Http\Controllers\Admin\SaleController as AdminSaleController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\RepositoryController as AdminRepositoryController;
use App\Http\Controllers\Admin\CardController as AdminCardController;
use App\Http\Controllers\Admin\ComingSoonController as AdminComingSoonController;
use App\Http\Controllers\Admin\RoleController as AdminRoleController;

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
Route::get('/login', [LoginController::class, 'reactView'])->name('login');

Route::get('/confirm-email/{token}', [AuthController::class, 'confirmEmailView'])->name('ConfirmEmail.jsx');
Route::get('/confirmation/{token}', [AuthController::class, 'loginView'])->name('confirmation');

Route::get('/unsubscribe', [MailingController::class, 'reactView'])->name('Unsubscribe.jsx');

Route::middleware('auth')->group(function () {
    // Admin routes
    Route::middleware('can:Admin')->prefix('admin')->group(function () {
        Route::get('/', fn() => redirect()->to('/admin/home'));
        Route::get('/home', [AdminComingSoonController::class, 'reactView']);

        // Almacén
        Route::get('/articles', [AdminComingSoonController::class, 'reactView']);
        Route::get('/inventory', [AdminComingSoonController::class, 'reactView']);
        Route::get('/kardex', [AdminComingSoonController::class, 'reactView']);
        Route::get('/laboratories', [AdminComingSoonController::class, 'reactView']);
        Route::get('/batches', [AdminComingSoonController::class, 'reactView']);
        Route::get('/entry-note', [AdminComingSoonController::class, 'reactView']);
        Route::get('/exit-note', [AdminComingSoonController::class, 'reactView']);
        Route::get('/suppliers', [AdminComingSoonController::class, 'reactView']);
        Route::get('/units-of-measure', [AdminComingSoonController::class, 'reactView']);

        // Administración
        Route::get('/accounts-payable', [AdminComingSoonController::class, 'reactView']);
        Route::get('/expenses', [AdminComingSoonController::class, 'reactView']);
        Route::get('/daily-summary', [AdminComingSoonController::class, 'reactView']);

        // Comercial
        Route::get('/clients', [AdminComingSoonController::class, 'reactView']);
        Route::get('/eventual-clients', [AdminComingSoonController::class, 'reactView']);
        Route::get('/accounts-receivable', [AdminComingSoonController::class, 'reactView']);
        Route::get('/orders', [AdminComingSoonController::class, 'reactView']);
        Route::get('/pricing', [AdminComingSoonController::class, 'reactView']);

        // Serv. Almacen...
        Route::get('/storage-inventory', [AdminComingSoonController::class, 'reactView']);
        Route::get('/storage-clients', [AdminComingSoonController::class, 'reactView']);
        Route::get('/service-orders', [AdminComingSoonController::class, 'reactView']);
        Route::get('/storage-units', [AdminComingSoonController::class, 'reactView']);
        Route::get('/storage-products', [AdminComingSoonController::class, 'reactView']);
        Route::get('/storage-entry-note', [AdminComingSoonController::class, 'reactView']);
        Route::get('/storage-exit-note', [AdminComingSoonController::class, 'reactView']);
        Route::get('/storage-kardex', [AdminComingSoonController::class, 'reactView']);
        Route::get('/storage-general-service', [AdminComingSoonController::class, 'reactView']);
        Route::get('/storage-billing-control', [AdminComingSoonController::class, 'reactView']);
        Route::get('/storage-general-service-orders', [AdminComingSoonController::class, 'reactView']);

        // Despacho
        Route::get('/activity', [AdminComingSoonController::class, 'reactView']);
        Route::get('/driver', [AdminComingSoonController::class, 'reactView']);
        Route::get('/dispatch', [AdminComingSoonController::class, 'reactView']);
        Route::get('/vehicle-zone', [AdminComingSoonController::class, 'reactView']);

        // Servicios
        Route::get('/services-client', [AdminComingSoonController::class, 'reactView']);
        Route::get('/services-billing', [AdminComingSoonController::class, 'reactView']);
        Route::get('/services-service-order', [AdminComingSoonController::class, 'reactView']);
        Route::get('/services-services', [AdminComingSoonController::class, 'reactView']);

        // Muestras
        Route::get('/sample-orders', [AdminComingSoonController::class, 'reactView']);

        // Magistrales
        Route::get('/magistrales-articles', [AdminComingSoonController::class, 'reactView']);
        Route::get('/magistrales-category', [AdminComingSoonController::class, 'reactView']);
        Route::get('/magistrales-formats', [AdminComingSoonController::class, 'reactView']);
        Route::get('/magistrales-formulas', [AdminComingSoonController::class, 'reactView']);
        Route::get('/magistrales-incomes', [AdminComingSoonController::class, 'reactView']);
        Route::get('/magistrales-inventory', [AdminComingSoonController::class, 'reactView']);
        Route::get('/magistrales-kardex', [AdminComingSoonController::class, 'reactView']);
        Route::get('/magistrales-laboratory', [AdminComingSoonController::class, 'reactView']);
        Route::get('/magistrales-purchase-order', [AdminComingSoonController::class, 'reactView']);
        Route::get('/magistrales-production-order', [AdminComingSoonController::class, 'reactView']);
        Route::get('/magistrales-supplier', [AdminComingSoonController::class, 'reactView']);
        Route::get('/magistrales-responsible', [AdminComingSoonController::class, 'reactView']);
        Route::get('/magistrales-outputs', [AdminComingSoonController::class, 'reactView']);
        Route::get('/magistrales-unit', [AdminComingSoonController::class, 'reactView']);
        Route::get('/magistrales-sales', [AdminComingSoonController::class, 'reactView']);

        Route::get('/users', [AdminUserController::class, 'reactView']);
        Route::get('/roles', [AdminRoleController::class, 'reactView']);

        Route::get('/profile', [AdminProfileController::class, 'reactView'])->name('Admin/Profile.jsx');
        Route::get('/account', [AdminAccountController::class, 'reactView'])->name('Admin/Account.jsx');
    });
});



Route::get('/mailing/new-formula', fn() => view('mailing.new-formula'));
Route::get('/repository/{uuid}', [AdminRepositoryController::class, 'media'])->withoutMiddleware('throttle');
Route::get('/graph/sales/{type}/{filter}', [AdminHomeController::class, 'getSales']);
