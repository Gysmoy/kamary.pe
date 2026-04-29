<?php

namespace App\Support\Database;

trait UsesSystemConnection
{
    public function getConnectionName()
    {
        return $this->connection ?: config('database.default');
    }
}
