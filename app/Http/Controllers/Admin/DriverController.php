<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\Business;
use App\Models\Driver;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DriverController extends BasicController
{
    public $model = Driver::class;
    public $reactView = 'Admin/Drivers';
    public $prefix4filter = 'drivers';

    public function setReactViewProperties(Request $request)
    {
        return ['requiredPermission' => 'driver'];
    }

    public function setPaginationInstance(string $model)
    {
        return $model::select('drivers.*')
            ->with(['business:id,name', 'creator:id,name,lastname,fullname', 'updater:id,name,lastname,fullname']);
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $id = $body['id'] ?? null;
        $businessId = $this->toNullableInt($body['business_id'] ?? null);
        $fullName = trim((string) ($body['full_name'] ?? ''));
        if ($fullName === '') throw new \Exception('El nombre del conductor es obligatorio');
        if ($businessId) Business::findOrFail($businessId);

        if (!$id) {
            $body['code'] = $this->nextCode();
            $body['created_by'] = Auth::id();
            $body['status'] = true;
        }

        $body['business_id'] = $businessId;
        $body['full_name'] = $fullName;
        $body['document_type'] = trim((string) ($body['document_type'] ?? '')) ?: null;
        $body['document_number'] = trim((string) ($body['document_number'] ?? '')) ?: null;
        $body['license_number'] = trim((string) ($body['license_number'] ?? '')) ?: null;
        $body['phone'] = trim((string) ($body['phone'] ?? '')) ?: null;
        $body['email'] = trim((string) ($body['email'] ?? '')) ?: null;
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
        $latest = Driver::query()->latest('id')->value('code');
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) $next = ((int) $matches[1]) + 1;
        return 'DRV-' . str_pad((string) $next, 6, '0', STR_PAD_LEFT);
    }
}
