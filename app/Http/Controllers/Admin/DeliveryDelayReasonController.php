<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\DeliveryDelayReason;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DeliveryDelayReasonController extends BasicController
{
    public $model = DeliveryDelayReason::class;
    public $prefix4filter = 'delivery_delay_reasons';

    public function setPaginationInstance(string $model)
    {
        return $model::select('delivery_delay_reasons.*')
            ->with([
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ]);
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $id = $body['id'] ?? null;
        $description = trim((string)($body['description'] ?? ''));
        if ($description === '') throw new \Exception('La descripcion es obligatoria');

        $duplicate = DeliveryDelayReason::query()
            ->whereRaw('LOWER(description) = ?', [mb_strtolower($description)])
            ->when($id, fn ($query) => $query->where('id', '<>', $id))
            ->whereNotNull('status')
            ->exists();
        if ($duplicate) throw new \Exception('Ya existe un motivo con esa descripcion');

        $current = $id ? DeliveryDelayReason::find($id) : null;

        return [
            'id' => $id,
            'description' => $description,
            'status' => $this->normalizeStatus($body['status'] ?? true),
            'created_by' => $current?->created_by ?? Auth::id(),
            'updated_by' => Auth::id(),
        ];
    }

    private function normalizeStatus(mixed $value): bool
    {
        if (is_bool($value)) return $value;
        $normalized = mb_strtolower(trim((string)$value));
        return !in_array($normalized, ['0', 'false', 'inactive', 'inactivo'], true);
    }
}
