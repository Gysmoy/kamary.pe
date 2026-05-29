<?php

namespace App\Support;

use App\Models\Warehouse;

class MagistralesInputWarehouse
{
    public static function warehouse(): Warehouse
    {
        return MagistralesWarehouse::warehouse();
    }

    public static function id(): int
    {
        return MagistralesWarehouse::id();
    }

    public static function idOrNull(): ?int
    {
        return MagistralesWarehouse::idOrNull();
    }

    public static function summary(): array
    {
        return MagistralesWarehouse::summary();
    }

    public static function ensureWarehouse(): ?Warehouse
    {
        return MagistralesWarehouse::ensureWarehouse();
    }
}
