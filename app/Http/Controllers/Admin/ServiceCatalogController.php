<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\ServiceCatalog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ServiceCatalogController extends BasicController
{
    public $model = ServiceCatalog::class;
    public $reactView = 'Admin/ServiceCatalog';
    public $prefix4filter = 'services';

    public function setReactViewProperties(Request $request)
    {
        return ['requiredPermission' => 'services-services'];
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $userId = Auth::id();
        $id = $body['id'] ?? null;

        $code = trim((string) ($body['code'] ?? ''));
        $name = trim((string) ($body['name'] ?? ''));
        if ($code === '') throw new \Exception('El codigo es obligatorio');
        if ($name === '') throw new \Exception('El nombre es obligatorio');

        $existsCode = ServiceCatalog::whereRaw('LOWER(code) = ?', [mb_strtolower($code)])
            ->when($id, fn($query) => $query->where('id', '!=', $id))
            ->exists();
        if ($existsCode) throw new \Exception('Ya existe un servicio con este codigo');

        if (!$id) {
            $body['created_by'] = $userId;
            $body['status'] = true;
        }

        $body['updated_by'] = $userId;
        $body['code'] = $code;
        $body['name'] = $name;
        $body['category'] = trim((string) ($body['category'] ?? '')) ?: null;
        $body['subcategory'] = trim((string) ($body['subcategory'] ?? '')) ?: null;
        $body['service_type'] = trim((string) ($body['service_type'] ?? '')) ?: null;
        $body['billing_unit'] = trim((string) ($body['billing_unit'] ?? '')) ?: null;
        $body['unit_price_pen'] = $this->toDecimal($body['unit_price_pen'] ?? 0);
        $body['unit_price_usd'] = $this->toDecimal($body['unit_price_usd'] ?? 0);
        $body['applicable_zone'] = trim((string) ($body['applicable_zone'] ?? '')) ?: null;
        $body['linked_vehicle_type'] = trim((string) ($body['linked_vehicle_type'] ?? '')) ?: null;
        $body['commissions_enabled'] = $this->toBoolean($body['commissions_enabled'] ?? false);
        $body['observations'] = trim((string) ($body['observations'] ?? '')) ?: null;

        return $body;
    }

    private function toDecimal($value): float
    {
        $text = trim((string) $value);
        if ($text === '') return 0;
        if (!is_numeric($text)) throw new \Exception("Valor numerico invalido: {$value}");
        return round((float) $text, 2);
    }

    private function toBoolean($value): bool
    {
        if (is_bool($value)) return $value;
        if (is_numeric($value)) return (int) $value !== 0;
        return in_array(mb_strtolower(trim((string) $value)), ['1', 'true', 'si', 'yes', 'on'], true);
    }
}
