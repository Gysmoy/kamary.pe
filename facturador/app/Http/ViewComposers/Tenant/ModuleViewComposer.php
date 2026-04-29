<?php

namespace App\Http\ViewComposers\Tenant;

use App\Models\System\Configuration;
use App\Models\Billing\Configuration as TenantConfiguration;
use App\Models\Billing\Module;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

class ModuleViewComposer
{
    public function compose($view)
    {
        static $requestData = null;

        if ($requestData === null) {
            $user = auth()->user();
            $tenantDb = DB::connection('tenant')->getDatabaseName() ?: 'tenant';
            $systemDb = DB::connection('system')->getDatabaseName() ?: 'system';
            $userId = $user ? $user->id : 0;

            $modules = Cache::remember("vc:modules:{$tenantDb}:{$userId}", now()->addSeconds(120), function () use ($user) {
                if (!$user) {
                    return [];
                }

                try {
                    return $user->modules()->pluck('value')->toArray();
                } catch (Throwable $e) {
                    return [];
                }
            });

            if (count($modules) === 0) {
                $modules = Cache::remember("vc:modules:all:{$tenantDb}", now()->addMinutes(5), function () {
                    if (!class_exists(Module::class) || !Schema::connection('tenant')->hasTable('modules')) {
                        return [];
                    }

                    try {
                        return Module::all()->pluck('value')->toArray();
                    } catch (Throwable $e) {
                        return [];
                    }
                });
            }

            $tenantConfiguration = Cache::remember("vc:tenant-config:{$tenantDb}", now()->addSeconds(60), function () {
                if (!Schema::connection('tenant')->hasTable('configurations')) {
                    return null;
                }

                try {
                    return TenantConfiguration::first();
                } catch (Throwable $e) {
                    return null;
                }
            });

            $useLoginGlobal = Cache::remember("vc:system-config:use-login-global:{$systemDb}", now()->addMinutes(5), function () {
                if (!Schema::connection('system')->hasTable('configurations') ||
                    !Schema::connection('system')->hasColumn('configurations', 'use_login_global')) {
                    return false;
                }

                try {
                    $systemConfig = Configuration::select('use_login_global')->first();
                    return $systemConfig ? (bool) $systemConfig->use_login_global : false;
                } catch (Throwable $e) {
                    return false;
                }
            });

            $requestData = [
                'modules' => $modules,
                'configuration' => $tenantConfiguration,
                'use_login_global' => $useLoginGlobal,
            ];
        }

        if(count($requestData['modules']) > 0) {
            $view->vc_modules = $requestData['modules'];
        } else {
            $view->vc_modules = [];
        }

        $view->vc_configuration = $requestData['configuration'];
        $view->useLoginGlobal = $requestData['use_login_global'];
    }
}
