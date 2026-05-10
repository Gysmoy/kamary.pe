<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\SampleOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SampleOrderController extends BasicController
{
    public $model = SampleOrder::class;
    public $reactView = 'Admin/SampleOrders';
    public $prefix4filter = 'sample_orders';

    public function setReactViewProperties(Request $request)
    {
        return [
            'moduleTitle' => 'Muestras - Pedido',
            'requiredPermission' => 'sample-orders',
        ];
    }

    public function setPaginationInstance(string $model)
    {
        return $model::select('sample_orders.*')
            ->with([
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ])
            ->leftJoin('users as creator', 'creator.id', '=', 'sample_orders.created_by')
            ->leftJoin('users as updater', 'updater.id', '=', 'sample_orders.updated_by');
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $id = $body['id'] ?? null;

        $clientName = trim((string)($body['client_name'] ?? ''));
        if ($clientName === '') throw new \Exception('El cliente es obligatorio');

        if (!$id) {
            $body['order_number'] = trim((string)($body['order_number'] ?? '')) ?: $this->nextOrderNumber();
            $body['created_by'] = Auth::id();
            $body['status'] = true;
        }

        $body['updated_by'] = Auth::id();
        $body['order_status'] = $this->normalizeOption($body['order_status'] ?? 'registered', ['registered', 'processing', 'completed', 'cancelled'], 'registered');
        $body['email_status'] = $this->normalizeOption($body['email_status'] ?? 'pending', ['pending', 'sent', 'failed'], 'pending');
        $body['referral_guide'] = trim((string)($body['referral_guide'] ?? '')) ?: null;
        $body['total_gross_weight'] = $this->toNullableDecimal($body['total_gross_weight'] ?? null);
        $body['channel'] = trim((string)($body['channel'] ?? '')) ?: null;
        $body['document_type'] = strtoupper(trim((string)($body['document_type'] ?? 'RUC')));
        $body['document_number'] = trim((string)($body['document_number'] ?? '')) ?: null;
        $body['client_name'] = $clientName;
        $body['order_complete'] = $this->toBoolean($body['order_complete'] ?? false);
        $body['requested_at'] = $this->normalizeDate($body['requested_at'] ?? null);
        $body['delivered_at'] = $this->normalizeDate($body['delivered_at'] ?? null);
        $body['supervisor_name'] = trim((string)($body['supervisor_name'] ?? '')) ?: null;
        $body['cancellation_reason'] = trim((string)($body['cancellation_reason'] ?? '')) ?: null;
        $body['observations'] = trim((string)($body['observations'] ?? '')) ?: null;

        return $body;
    }

    private function nextOrderNumber(): string
    {
        $next = 1;
        $latest = SampleOrder::query()->latest('id')->value('order_number');
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) {
            $next = ((int)$matches[1]) + 1;
        }

        return 'MUE-' . str_pad((string)$next, 6, '0', STR_PAD_LEFT);
    }

    private function normalizeOption($value, array $allowed, string $fallback): string
    {
        $normalized = mb_strtolower(trim((string)$value));
        return in_array($normalized, $allowed, true) ? $normalized : $fallback;
    }

    private function normalizeDate($value): ?string
    {
        if ($value === null) return null;
        $text = trim((string)$value);
        if ($text === '') return null;
        $timestamp = strtotime($text);
        if ($timestamp === false) throw new \Exception("Fecha invalida: {$value}");

        return date('Y-m-d', $timestamp);
    }

    private function toNullableDecimal($value): ?float
    {
        if ($value === null) return null;
        $text = trim((string)$value);
        if ($text === '') return null;
        if (!is_numeric($text)) throw new \Exception("Valor numerico invalido: {$value}");

        return round((float)$text, 3);
    }

    private function toBoolean($value): bool
    {
        if (is_bool($value)) return $value;
        if (is_numeric($value)) return (int)$value !== 0;

        return in_array(mb_strtolower(trim((string)$value)), ['1', 'true', 'si', 'yes', 'on'], true);
    }
}
