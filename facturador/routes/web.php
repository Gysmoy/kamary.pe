<?php

Route::any('{any?}', function () {
    abort(404, 'Facturador backend-only: la interfaz web fue eliminada.');
})->where('any', '.*');
