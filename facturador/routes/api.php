<?php

$apiMiddleware = env('API_REQUIRE_AUTH', false) ? ['auth:api'] : [];

Route::get('ping', function () {
    return ['success' => true];
});

Route::post('auth/login', 'Billing\\Api\\AuthController@login');

Route::middleware('auth:api')->group(function () {
    Route::get('auth/me', 'Billing\\Api\\AuthController@me');
    Route::post('auth/logout', 'Billing\\Api\\AuthController@logout');
});

Route::middleware($apiMiddleware)->group(function () {
    Route::get('company/record', 'Billing\\Api\\SetupController@record');
    Route::post('company', 'Billing\\Api\\SetupController@store');
    Route::post('company/logo', 'Billing\\Api\\SetupController@uploadLogo');
    Route::post('company/certificate', 'Billing\\Api\\SetupController@uploadCertificate');
    Route::get('establishments', 'Billing\\Api\\EstablishmentController@index');
    Route::post('establishments/sync', 'Billing\\Api\\EstablishmentController@sync');
    Route::get('series', 'Billing\\Api\\SeriesController@index');
    Route::post('series/sync', 'Billing\\Api\\SeriesController@sync');

    Route::post('documents', 'Billing\\Api\\DocumentController@store');
    Route::post('documents/status', 'Billing\\Api\\ServiceController@documentStatus');
    Route::post('dispatches', 'Billing\\Api\\DispatchController@store');
    Route::post('dispatches/status', 'Billing\\Api\\DispatchController@status');
    Route::post('dispatches/voided', 'Billing\\Api\\DispatchVoidedController@store');
    Route::post('dispatches/voided/status', 'Billing\\Api\\DispatchVoidedController@status');

    Route::post('voided', 'Billing\\Api\\VoidedController@store');
    Route::post('voided/status', 'Billing\\Api\\VoidedController@status');

    Route::get('files/{model}/{type}/{external_id}/{format?}', 'Billing\\DownloadController@downloadExternal')
        ->name('api.download.external_id');
});
