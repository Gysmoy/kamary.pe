<?php

namespace App\Providers;

use App\Models\Billing\Document;
use App\Observers\DocumentObserver;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
	public function boot()
	{
		View::addNamespace('tenant', resource_path('views/billing'));

		if (config('tenant.force_https')) {
			URL::forceScheme('https');
		}
		Document::observe(DocumentObserver::class);
	}

	public function register()
	{
	}
}
