<?php

use Illuminate\Support\Facades\Route;

// Admin
use App\Http\Controllers\Admin\ProfileController as AdminProfileController;
use App\Http\Controllers\Admin\AccountController as AdminAccountController;
use App\Http\Controllers\Admin\LaboratoryController as AdminLaboratoryController;
use App\Http\Controllers\Admin\RoleController as AdminRoleController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\UnitController as AdminUnitController;

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

        Route::get('/profile/{uuid}', [AdminProfileController::class, 'full']);
        Route::get('/profile/thumbnail/{uuid}', [AdminProfileController::class, 'thumbnail']);
        Route::post('/profile', [AdminProfileController::class, 'saveProfile']);
        Route::patch('/profile', [AdminProfileController::class, 'save']);

        Route::patch('/account/username', [AdminAccountController::class, 'username']);
        Route::patch('/account/password', [AdminAccountController::class, 'password']);
    });
});
