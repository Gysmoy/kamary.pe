<?php

namespace App\Support;

use App\Models\BillingDocument;

class StoragePrefactureCode
{
    public const PREFIX = 'PF';

    public static function next(): string
    {
        $start = max(1, (int) config('billing.storage_prefacture_code_start', env('STORAGE_PREFACTURE_CODE_START', 7750)));
        $max = $start - 1;

        foreach (BillingDocument::query()->where('code', 'like', self::PREFIX . '%')->lockForUpdate()->pluck('code') as $code) {
            if (preg_match('/^' . self::PREFIX . '(\d+)$/', (string) $code, $matches)) {
                $max = max($max, (int) $matches[1]);
            }
        }

        return self::format($max + 1);
    }

    public static function format(int $sequence): string
    {
        return self::PREFIX . str_pad((string) $sequence, 5, '0', STR_PAD_LEFT);
    }
}
