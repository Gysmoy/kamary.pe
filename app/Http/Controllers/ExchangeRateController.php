<?php

namespace App\Http\Controllers;

use App\Models\ExchangeRate;
use Exception;
use Illuminate\Http\Request;
use SoDe\Extend\Fetch;
use SoDe\Extend\Response;

class ExchangeRateController extends Controller
{
    public function refresh(Request $request)
    {
        $response = Response::simpleTryCatch(function () use ($request) {
            $res = new Fetch(env('EXCHANGE_RATE_API'));
            $exchangeRates = $res->json() ?? [];
            $result = $exchangeRates['result'] ?? 'fail';
            if ($result !== 'success') throw new Exception('Falló la obtención de tasas de cambio');
            $rates = $exchangeRates['rates'] ?? [];
            foreach ($rates as $rate => $value) {
                ExchangeRate::updateOrCreate(
                    ['currency' => $rate],
                    ['rate' => 1 / $value]
                );
            }
        });
        return response($response->toArray(), $response->status);
    }
}
