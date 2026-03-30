<?php

use Illuminate\Support\Facades\Route;

// Admin
use App\Http\Controllers\Admin\ProfileController as AdminProfileController;
use App\Http\Controllers\Admin\AccountController as AdminAccountController;
use App\Http\Controllers\Admin\ArticleController as AdminArticleController;
use App\Http\Controllers\Admin\BatchController as AdminBatchController;
use App\Http\Controllers\Admin\BusinessController as AdminBusinessController;
use App\Http\Controllers\Admin\EntryNoteController as AdminEntryNoteController;
use App\Http\Controllers\Admin\ExitNoteController as AdminExitNoteController;
use App\Http\Controllers\Admin\InventoryController as AdminInventoryController;
use App\Http\Controllers\Admin\KardexController as AdminKardexController;
use App\Http\Controllers\Admin\LaboratoryController as AdminLaboratoryController;
use App\Http\Controllers\Admin\SupplierController as AdminSupplierController;
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
        Route::post('/kardex/paginate', [AdminKardexController::class, 'paginate']);

        Route::post('/suppliers', [AdminSupplierController::class, 'save']);
        Route::post('/suppliers/import', [AdminSupplierController::class, 'import']);
        Route::post('/suppliers/paginate', [AdminSupplierController::class, 'paginate']);
        Route::patch('/suppliers/status', [AdminSupplierController::class, 'status']);
        Route::patch('/suppliers/{field}', [AdminSupplierController::class, 'boolean']);
        Route::delete('/suppliers/{id}', [AdminSupplierController::class, 'delete']);
        Route::get('/suppliers/ruc/{ruc}', [AdminSupplierController::class, 'lookupByRuc']);

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
