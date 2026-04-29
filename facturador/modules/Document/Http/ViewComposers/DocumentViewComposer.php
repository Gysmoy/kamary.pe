<?php

namespace Modules\Document\Http\ViewComposers;

use App\Models\Billing\Document;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Throwable;

class DocumentViewComposer
{
    public function compose($view)
    {
        static $requestData = null;

        if ($requestData === null) {
            $tenantDb = DB::connection('tenant')->getDatabaseName() ?: 'tenant';

            $requestData = [
                'not_sent' => Cache::remember("vc:documents:not-sent:{$tenantDb}", now()->addSeconds(10), function () {
                    try {
                        return (int) Document::whereNotSent()->count();
                    } catch (Throwable $e) {
                        return 0;
                    }
                }),
                'regularize_shipping' => Cache::remember("vc:documents:regularize-shipping:{$tenantDb}", now()->addSeconds(10), function () {
                    try {
                        return (int) Document::whereRegularizeShipping()->count();
                    } catch (Throwable $e) {
                        return 0;
                    }
                }),
            ];
        }

        $view->vc_document = $requestData['not_sent'];
        $view->vc_document_regularize_shipping = $requestData['regularize_shipping'];

    }
}
