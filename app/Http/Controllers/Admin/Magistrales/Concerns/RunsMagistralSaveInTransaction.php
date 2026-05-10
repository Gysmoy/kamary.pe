<?php

namespace App\Http\Controllers\Admin\Magistrales\Concerns;

use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\DB;

trait RunsMagistralSaveInTransaction
{
    public function save(Request $request): HttpResponse|ResponseFactory
    {
        DB::beginTransaction();
        try {
            $response = parent::save($request);
            $statusCode = method_exists($response, 'getStatusCode') ? $response->getStatusCode() : 500;

            if ($statusCode >= 400) {
                DB::rollBack();
            } else {
                DB::commit();
            }

            return $response;
        } catch (\Throwable $th) {
            DB::rollBack();
            throw $th;
        }
    }
}
