<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\Business;
use App\Models\Zone;
use App\Support\BusinessScope;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ZoneController extends BasicController
{
    public $model = Zone::class;
    public $prefix4filter = 'zones';

    public function setPaginationInstance(string $model)
    {
        $query = $model::select('zones.*')
            ->with(['business:id,name', 'creator:id,name,lastname,fullname', 'updater:id,name,lastname,fullname']);

        $scopeKey = BusinessScope::scopedKeyForRequest(request());
        $query->where(function ($rows) use ($scopeKey) {
            $rows->whereNull('business_id')
                ->orWhereHas('business', function ($business) use ($scopeKey) {
                    $business->whereIn('business_key', BusinessScope::fixedKeys());
                    if ($scopeKey) $business->where('business_key', $scopeKey);
                });
        });

        return $query;
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $id = $body['id'] ?? null;
        $businessId = $this->toNullableInt($body['business_id'] ?? null);
        $name = trim((string) ($body['name'] ?? ''));
        if ($name === '') throw new \Exception('El nombre de la zona es obligatorio');
        if ($businessId) BusinessScope::findFixedBusinessForRequest($businessId, $request);

        if (!$id) {
            $body['code'] = $this->nextCode();
            $body['created_by'] = Auth::id();
            $body['status'] = true;
        }

        $body['business_id'] = $businessId;
        $body['name'] = $name;
        $body['ubigeo'] = trim((string) ($body['ubigeo'] ?? '')) ?: null;
        $body['department'] = trim((string) ($body['department'] ?? '')) ?: null;
        $body['province'] = trim((string) ($body['province'] ?? '')) ?: null;
        $body['district'] = trim((string) ($body['district'] ?? '')) ?: null;
        $body['reference'] = trim((string) ($body['reference'] ?? '')) ?: null;
        $body['observations'] = trim((string) ($body['observations'] ?? '')) ?: null;
        $body['updated_by'] = Auth::id();

        return $body;
    }

    private function toNullableInt($value): ?int
    {
        if ($value === null) return null;
        $text = trim((string) $value);
        if ($text === '') return null;
        if (!ctype_digit(ltrim($text, '+'))) throw new \Exception("Valor entero invalido: {$value}");
        return (int) $text;
    }

    private function nextCode(): string
    {
        $next = 1;
        $latest = Zone::query()->latest('id')->value('code');
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) $next = ((int) $matches[1]) + 1;
        return 'ZON-' . str_pad((string) $next, 6, '0', STR_PAD_LEFT);
    }
}
