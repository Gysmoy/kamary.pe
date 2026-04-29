<?php

namespace App\Traits;
use Modules\Offline\Models\OfflineConfiguration;
use Throwable;

trait OfflineTrait
{ 

    private function getIsClient() {
        $config = $this->getOfflineConfiguration();

        return $config ? (bool) $config->is_client : false;
    }

    private function getUrlServer() {
        $config = $this->getOfflineConfiguration();

        return $config ? (string) $config->url_server : '';
    }
    
    private function getTokenServer() {
        $config = $this->getOfflineConfiguration();

        return $config ? (string) $config->token_server : '';
    }

    private function getOfflineConfiguration()
    {
        if (!class_exists(OfflineConfiguration::class)) {
            return null;
        }

        try {
            return OfflineConfiguration::query()->first();
        } catch (Throwable $e) {
            return null;
        }
    }
    
}
