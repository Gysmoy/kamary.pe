<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\Business;
use App\Models\Vehicle;
use App\Models\Zone;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class VehicleController extends BasicController
{
    public $model = Vehicle::class;
    public $prefix4filter = 'vehicles';

    public function setPaginationInstance(string $model)
    {
        return $model::select('vehicles.*')
            ->with(['business:id,name', 'zone:id,name,code', 'creator:id,name,lastname,fullname', 'updater:id,name,lastname,fullname']);
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $id = $body['id'] ?? null;
        $businessId = $this->toNullableInt($body['business_id'] ?? null);
        $zoneId = $this->toNullableInt($body['zone_id'] ?? null);
        $plate = mb_strtoupper(trim((string) ($body['plate'] ?? '')));
        if ($plate === '') throw new \Exception('La placa es obligatoria');
        if ($businessId) Business::findOrFail($businessId);
        if ($zoneId) Zone::findOrFail($zoneId);

        $duplicatePlate = Vehicle::query()
            ->when($id, fn($query) => $query->where('id', '!=', $id))
            ->whereRaw('UPPER(plate) = ?', [$plate])
            ->exists();
        if ($duplicatePlate) throw new \Exception('La placa ya existe');

        if (!$id) {
            $body['code'] = $this->nextCode();
            $body['created_by'] = Auth::id();
            $body['status'] = true;
        }

        $body['business_id'] = $businessId;
        $body['zone_id'] = $zoneId;
        $body['plate'] = $plate;
        $body['label'] = trim((string) ($body['label'] ?? '')) ?: $plate;
        $body['brand'] = trim((string) ($body['brand'] ?? '')) ?: null;
        $body['model'] = trim((string) ($body['model'] ?? '')) ?: null;
        $body['color'] = trim((string) ($body['color'] ?? '')) ?: null;
        $body['vehicle_type'] = trim((string) ($body['vehicle_type'] ?? '')) ?: null;
        $body['capacity'] = $this->toFloat($body['capacity'] ?? 0);
        $body['gross_weight'] = $this->toFloat($body['gross_weight'] ?? 0);
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

    private function toFloat($value): float
    {
        $text = trim((string) $value);
        if ($text === '') return 0;
        if (!is_numeric($text)) throw new \Exception("Valor decimal invalido: {$value}");
        return round((float) $text, 2);
    }

    private function nextCode(): string
    {
        $next = 1;
        $latest = Vehicle::query()->latest('id')->value('code');
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) $next = ((int) $matches[1]) + 1;
        return 'VEH-' . str_pad((string) $next, 6, '0', STR_PAD_LEFT);
    }
}
