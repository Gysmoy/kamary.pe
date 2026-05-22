<?php

namespace App\Http\Controllers\Admin;

use App\Services\FacturadorPro5SettingsService;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Auth;
use SoDe\Extend\Response;

class BillingSettingsController extends BusinessController
{
    public $reactView = 'Admin/BillingSettings';

    public function facturadorMode(Request $request): HttpResponse|ResponseFactory
    {
        $response = new Response();

        try {
            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = app(FacturadorPro5SettingsService::class)->summary();
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function updateFacturadorMode(Request $request): HttpResponse|ResponseFactory
    {
        $response = new Response();

        try {
            $response->data = app(FacturadorPro5SettingsService::class)->updateMode(
                (string) $request->input('mode', 'demo'),
                Auth::id()
            );
            $response->status = 200;
            $response->message = 'Modo de facturacion actualizado';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }
}
