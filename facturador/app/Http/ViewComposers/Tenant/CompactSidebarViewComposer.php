<?php

namespace App\Http\ViewComposers\Tenant;

use App\Models\Billing\Configuration;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CompactSidebarViewComposer
{
    public function compose($view)
    {
        static $configuration = null;
        if ($configuration === null) {
            $tenantDb = DB::connection('tenant')->getDatabaseName() ?: 'tenant';
            $configuration = Cache::remember("vc:compact-sidebar-config:{$tenantDb}", now()->addSeconds(60), function () {
                return Configuration::first();
            });

            if ($configuration && (!class_exists(\App\Models\Billing\Skin::class) || !Schema::connection('tenant')->hasTable('skins'))) {
                $configuration->setRelation('skin', null);
            }
        }
        // $set = (new \App\Http\Controllers\Billing\ConfigurationController)->getSystemPhone();

        $view->show_ws = $configuration ? $configuration->enable_whatsapp : false;
        $view->phone_whatsapp = $configuration ? $configuration->phone_whatsapp : null;
        $view->vc_compact_sidebar = $configuration;
    }
}
