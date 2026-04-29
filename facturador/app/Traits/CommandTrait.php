<?php

namespace App\Traits;
use Throwable;

trait CommandTrait
{
    /**
     * Is offline
     * @return boolean
     */
    private function isOffline() {
        $offlineConfigurationClass = 'Modules\\Offline\\Models\\OfflineConfiguration';

        if (!class_exists($offlineConfigurationClass)) {
            return false;
        }

        try {
            $config = $offlineConfigurationClass::query()->first();
            return $config ? (bool) $config->is_client : false;
        } catch (Throwable $e) {
            return false;
        }
    }
}
