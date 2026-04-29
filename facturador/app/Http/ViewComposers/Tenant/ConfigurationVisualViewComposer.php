<?php

namespace App\Http\ViewComposers\Tenant;

use App\Http\Resources\Billing\ConfigurationResource;
use App\Models\Billing\Configuration;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

class ConfigurationVisualViewComposer
{
    public function compose($view)
    {
        static $record = null;
        $defaults = (object) [
            'bg' => 'white',
            'header' => 'light',
            'sidebars' => 'light',
        ];

        if ($record === null) {
            $tenantDb = DB::connection('tenant')->getDatabaseName() ?: 'tenant';
            $configuration = Cache::remember("vc:visual-config:{$tenantDb}", now()->addSeconds(60), function () {
                return Configuration::first();
            });

            if (!$configuration) {
                $view->visual = $defaults;
                return;
            }

            $hasVisualColumn = Schema::connection('tenant')->hasColumn('configurations', 'visual');
            if (!$hasVisualColumn) {
                $view->visual = $defaults;
                return;
            }

            if (is_null($configuration->visual)) {
                try {
                    $configuration->visual = (array) $defaults;
                    $configuration->save();
                    Cache::forget("vc:visual-config:{$tenantDb}");
                    $configuration = Configuration::first();
                } catch (Throwable $e) {
                    $view->visual = $defaults;
                    return;
                }
            }

            $record = new ConfigurationResource($configuration);
        }

        $view->visual = $record->visual ?: $defaults;
    }
}

