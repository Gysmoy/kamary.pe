<?php

namespace App\Providers;

use App\Models\Sale;
use App\Models\User;
use App\Observers\SaleCreationObserver;
use App\Observers\SaleStatusObserver;
use App\Observers\UserNameObserver;
use App\Services\FacturadorPro5SettingsService;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        app(FacturadorPro5SettingsService::class)->applyRuntimeConfig();

        if (env('APP_ENV') == 'production') URL::forceScheme('https');
        Sale::observe([
            SaleCreationObserver::class,
            // SaleStatusObserver::class,
        ]);
        User::observe(UserNameObserver::class);
    }
}
