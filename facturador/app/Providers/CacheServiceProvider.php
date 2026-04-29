<?php

namespace App\Providers;

use Illuminate\Cache\RedisStore;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;
use Throwable;

class CacheServiceProvider extends ServiceProvider
{
    /**
     * Resolve cache prefix for redis in single-company mode and legacy multi-tenant mode.
     *
     * @param \Illuminate\Foundation\Application $app
     * @return string
     */
    private function resolveRedisPrefix($app): string
    {
        if (PHP_SAPI === 'cli') {
            return (string) $app['config']['driver'];
        }

        $fallback = (string) ($app['config']['app.key'] ?? 'factu_lite_cache');

        try {
            if (!Schema::connection('system')->hasTable('hostnames') || !Schema::connection('system')->hasTable('websites')) {
                return $fallback;
            }

            $fqdn = (string) ($_SERVER['SERVER_NAME'] ?? '');
            if ($fqdn === '') {
                return $fallback;
            }

            $uuid = DB::connection('system')
                ->table('hostnames')
                ->select('websites.uuid')
                ->join('websites', 'hostnames.website_id', '=', 'websites.id')
                ->where('fqdn', $fqdn)
                ->value('uuid');

            return !empty($uuid) ? (string) $uuid : $fallback;
        } catch (Throwable $e) {
            return $fallback;
        }
    }

    public function boot()
    {
        Cache::extend('redis_tenancy', function ($app) {
            $uuid = $this->resolveRedisPrefix($app);

            return Cache::repository(new RedisStore(
                $app['redis'],
                $uuid,
                $app['config']['cache.stores.redis.connection']
            ));
        });
    }
}
