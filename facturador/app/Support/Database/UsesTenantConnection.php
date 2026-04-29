<?php

namespace App\Support\Database;

trait UsesTenantConnection
{
    public function getConnectionName()
    {
        return $this->connection ?: config('database.default');
    }
}
