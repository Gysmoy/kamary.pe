<?php

namespace App\Http\ViewComposers\Tenant;

use App\Models\Billing\Company;
use App\Models\Billing\Order;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use stdClass;
use Throwable;

class CompanyViewComposer
{
    public function compose($view)
    {
        static $requestData = null;

        if ($requestData === null) {
            $tenantDb = DB::connection('tenant')->getDatabaseName() ?: 'tenant';

            $requestData = [
                'company' => Cache::remember("vc:company:{$tenantDb}", now()->addSeconds(120), function () {
                    return $this->resolveCompany();
                }),
                'orders' => Cache::remember("vc:orders:pending:{$tenantDb}", now()->addSeconds(10), function () {
                    if (!class_exists(Order::class) || !Schema::connection('tenant')->hasTable('orders')) {
                        return 0;
                    }

                    try {
                        return (int) Order::where('status_order_id', 1)->count();
                    } catch (Throwable $e) {
                        return 0;
                    }
                }),
            ];
        }

        $view->vc_company = $requestData['company'];
        $view->vc_orders = $requestData['orders'];
    }

    private function resolveCompany(): object
    {
        if (!Schema::connection('tenant')->hasTable('companies')) {
            return $this->defaultCompany();
        }

        try {
            return Company::first() ?: $this->defaultCompany();
        } catch (Throwable $e) {
            return $this->defaultCompany();
        }
    }

    private function defaultCompany(): stdClass
    {
        return (object) [
            'favicon' => null,
            'logo' => null,
            'logo_store' => null,
            'soap_type_id' => '01',
            'trade_name' => '',
            'name' => '',
            'number' => '',
        ];
    }
}
