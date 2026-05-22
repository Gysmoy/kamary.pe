<?php

namespace App\Services;

use App\Models\SystemSetting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

class FacturadorPro5SettingsService
{
    private const MODE_KEY = 'facturadorpro5.mode';
    private const CACHE_KEY = 'system-setting:facturadorpro5.mode';

    public function applyRuntimeConfig(): void
    {
        config(['facturadorpro5.mode' => $this->currentMode()]);
    }

    public function currentMode(): string
    {
        $fallback = $this->normalizeMode(config('facturadorpro5.mode', env('FACTURADORPRO5_MODE', 'demo')));

        try {
            if (!Schema::hasTable('system_settings')) {
                return $fallback;
            }

            return Cache::remember(self::CACHE_KEY, now()->addMinutes(5), function () use ($fallback) {
                $value = SystemSetting::query()
                    ->where('key', self::MODE_KEY)
                    ->value('value');

                return $this->normalizeMode($value ?: $fallback);
            });
        } catch (\Throwable) {
            return $fallback;
        }
    }

    public function updateMode(string $mode, ?int $userId = null): array
    {
        $mode = $this->normalizeMode($mode);

        SystemSetting::query()->updateOrCreate(
            ['key' => self::MODE_KEY],
            [
                'value' => $mode,
                'group' => 'billing',
                'updated_by' => $userId,
                'created_by' => $userId,
            ]
        );

        Cache::forget(self::CACHE_KEY);
        config(['facturadorpro5.mode' => $mode]);

        return $this->summary();
    }

    public function summary(): array
    {
        $mode = $this->currentMode();
        $source = 'env';

        try {
            if (Schema::hasTable('system_settings')) {
                $source = SystemSetting::query()->where('key', self::MODE_KEY)->exists() ? 'panel' : 'env';
            }
        } catch (\Throwable) {
            $source = 'env';
        }

        return [
            'mode' => $mode,
            'label' => $this->label($mode),
            'source' => $source,
            'is_demo' => $mode === 'demo',
            'is_production' => $mode === 'production',
            'env_default' => $this->normalizeMode(env('FACTURADORPRO5_MODE', 'demo')),
        ];
    }

    public function normalizeMode($mode): string
    {
        $mode = strtolower(trim((string) $mode));

        return match ($mode) {
            'production', 'prod', 'produccion', 'api', 'live' => 'production',
            default => 'demo',
        };
    }

    private function label(string $mode): string
    {
        return $mode === 'production' ? 'Produccion' : 'Demo / Test';
    }
}
