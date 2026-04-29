<?php

use App\Http\Controllers\Admin\MailingTemplateController;
use App\Http\Controllers\Admin\HistoryDetailController as AdminHistoryDetailController;
use App\Http\Controllers\Admin\SendingHistoryController as AdminSendingHistoryController;
use App\Http\Controllers\Admin\TransactionController as AdminTransactionController;
use App\Http\Controllers\ExchangeRateController;
use App\Http\Controllers\MailingController;
use Illuminate\Support\Facades\Route;

Route::get('/exchange-rates', [ExchangeRateController::class, 'refresh']);
Route::get('/template/{id}', [MailingTemplateController::class, 'get'])->withoutMiddleware('throttle');
Route::post('/template', [MailingTemplateController::class, 'save'])->withoutMiddleware('throttle');

Route::prefix('/mailing')->group(function () {
    Route::post('/send', [MailingController::class, 'send']);
    Route::get('/execute', [AdminSendingHistoryController::class, 'execute']);
    Route::post('/history', [AdminSendingHistoryController::class, 'save']);
    Route::post('/history/detail', [AdminHistoryDetailController::class, 'save']);
})->withoutMiddleware('throttle');

Route::get('/transactions/revenues', [AdminTransactionController::class, 'revenues']);
