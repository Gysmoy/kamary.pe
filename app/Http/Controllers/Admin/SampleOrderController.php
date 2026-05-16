<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\SampleOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

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
        $body['order_status'] = $this->normalizeOption(
            $this->normalizeStatusAlias($body['order_status'] ?? 'registered', [
                'processing' => 'preparing',
                'completed' => 'delivered',
            ]),
            ['registered', 'approved', 'preparing', 'in_route', 'delivered', 'cancelled'],
            'registered'
        );
        $body['email_status'] = $this->normalizeOption(
            $this->normalizeStatusAlias($body['email_status'] ?? 'pending', ['sent' => 'delivered']),
            ['pending', 'delivered', 'failed'],
            'pending'
        );
        $body['referral_guide'] = trim((string)($body['referral_guide'] ?? '')) ?: null;
        $body['total_gross_weight'] = $this->toNullableDecimal($body['total_gross_weight'] ?? null);
        $body['channel'] = trim((string)($body['channel'] ?? '')) ?: null;
        $body['sales_channel'] = trim((string)($body['sales_channel'] ?? $body['channel'] ?? '')) ?: null;
        $body['sales_subchannel'] = trim((string)($body['sales_subchannel'] ?? '')) ?: null;
        $body['business_line'] = trim((string)($body['business_line'] ?? '')) ?: null;
        $body['business_subline'] = trim((string)($body['business_subline'] ?? '')) ?: null;
        $body['ubigeo'] = trim((string)($body['ubigeo'] ?? '')) ?: null;
        $body['delivery_address'] = trim((string)($body['delivery_address'] ?? '')) ?: null;
        $body['delivery_reference'] = trim((string)($body['delivery_reference'] ?? '')) ?: null;
        $body['service_type'] = trim((string)($body['service_type'] ?? '')) ?: null;
        $body['document_type'] = strtoupper(trim((string)($body['document_type'] ?? 'RUC')));
        $body['document_number'] = trim((string)($body['document_number'] ?? '')) ?: null;
        $body['contact_document'] = trim((string)($body['contact_document'] ?? '')) ?: null;
        $body['contact_name'] = trim((string)($body['contact_name'] ?? '')) ?: null;
        $body['contact_phone'] = trim((string)($body['contact_phone'] ?? '')) ?: null;
        $body['client_name'] = $clientName;
        $body['client_id'] = $this->toNullableInt($body['client_id'] ?? null);
        $body['supervisor_id'] = $this->toNullableInt($body['supervisor_id'] ?? null);
        $body['request_reason'] = trim((string)($body['request_reason'] ?? '')) ?: null;
        $body['order_complete'] = $this->toBoolean($body['order_complete'] ?? false);
        $body['requested_at'] = $this->normalizeDate($body['requested_at'] ?? now()->toDateString());
        $body['delivered_at'] = $this->normalizeDate($body['delivered_at'] ?? null);
        $body['supervisor_name'] = trim((string)($body['supervisor_name'] ?? '')) ?: null;
        $body['cancellation_reason'] = trim((string)($body['cancellation_reason'] ?? '')) ?: null;
        $body['observations'] = trim((string)($body['observations'] ?? '')) ?: null;
        $body['map_lat'] = $this->toNullableDecimal($body['map_lat'] ?? null);
        $body['map_lng'] = $this->toNullableDecimal($body['map_lng'] ?? null);
        $body['evidence_url'] = trim((string)($body['evidence_url'] ?? '')) ?: null;
        $body['evidence_notes'] = trim((string)($body['evidence_notes'] ?? '')) ?: null;
        $body['items'] = $this->normalizeItems($body['items'] ?? []);

        return $body;
    }

    public function evidence(Request $request, string $id)
    {
        $response = new \SoDe\Extend\Response();

        try {
            $order = SampleOrder::query()->whereKey($id)->whereNotNull('status')->firstOrFail();
            $evidenceUrl = trim((string)($request->input('evidence_url') ?? $order->evidence_url ?? '')) ?: null;

            if ($request->hasFile('evidence_file')) {
                $file = $request->file('evidence_file');
                $maxBytes = 8 * 1024 * 1024;
                if ($file->getSize() > $maxBytes) {
                    throw new \Exception('La imagen no debe superar 8MB');
                }

                $extension = strtolower($file->getClientOriginalExtension());
                $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
                if (!in_array($extension, $allowedExtensions, true)) {
                    throw new \Exception('Solo se permiten imagenes JPG, PNG, WEBP o GIF');
                }

                $filename = Str::uuid()->toString() . ".{$extension}";
                Storage::putFileAs('images/sample_order_evidence', $file, $filename);
                $evidenceUrl = "/api/admin/sample-orders/evidence-media/{$filename}";
            }

            $order->update([
                'evidence_url' => $evidenceUrl,
                'evidence_notes' => trim((string)($request->input('evidence_notes') ?? '')) ?: null,
                'updated_by' => Auth::id(),
            ]);

            $response->status = 200;
            $response->message = 'Evidencia registrada correctamente';
            $response->data = $order->fresh();
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function evidenceMedia(Request $request, string $filename)
    {
        abort_if(str_contains($filename, '..') || str_contains($filename, '/') || str_contains($filename, '\\'), 404);
        $path = "images/sample_order_evidence/{$filename}";
        abort_unless(Storage::exists($path), 404);

        return response(Storage::get($path), 200, [
            'Content-Type' => Storage::mimeType($path) ?: 'application/octet-stream',
            'Cache-Control' => 'private, max-age=3600',
        ]);
    }

    private function nextOrderNumber(): string
    {
        $next = 1;
        $latest = SampleOrder::query()->latest('id')->value('order_number');
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) {
            $next = ((int)$matches[1]) + 1;
        }

        return 'P' . str_pad((string)$next, 6, '0', STR_PAD_LEFT);
    }

    private function normalizeOption($value, array $allowed, string $fallback): string
    {
        $normalized = mb_strtolower(trim((string)$value));
        return in_array($normalized, $allowed, true) ? $normalized : $fallback;
    }

    private function normalizeStatusAlias($value, array $aliases): string
    {
        $normalized = mb_strtolower(trim((string)$value));
        return $aliases[$normalized] ?? $normalized;
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

    private function toNullableInt($value): ?int
    {
        if ($value === null) return null;
        $text = trim((string)$value);
        if ($text === '') return null;
        if (!ctype_digit($text)) return null;

        return (int)$text;
    }

    private function normalizeItems($items): array
    {
        if (is_string($items)) {
            $decoded = json_decode($items, true);
            $items = json_last_error() === JSON_ERROR_NONE ? $decoded : [];
        }

        if (!is_array($items)) return [];

        return collect($items)
            ->filter(fn ($item) => is_array($item))
            ->map(function ($item) {
                return [
                    'article_id' => $this->toNullableInt($item['article_id'] ?? null),
                    'code' => trim((string)($item['code'] ?? '')) ?: null,
                    'lot_code' => trim((string)($item['lot_code'] ?? '')) ?: null,
                    'name' => trim((string)($item['name'] ?? '')) ?: null,
                    'unit' => trim((string)($item['unit'] ?? '')) ?: null,
                    'stock' => $this->toNullableDecimal($item['stock'] ?? 0) ?? 0,
                    'quantity' => $this->toNullableDecimal($item['quantity'] ?? 0) ?? 0,
                    'warehouse' => trim((string)($item['warehouse'] ?? '')) ?: null,
                    'expiration_date' => $this->normalizeDate($item['expiration_date'] ?? null),
                    'laboratory' => trim((string)($item['laboratory'] ?? '')) ?: null,
                    'active_principle' => trim((string)($item['active_principle'] ?? '')) ?: null,
                ];
            })
            ->values()
            ->all();
    }

    private function toBoolean($value): bool
    {
        if (is_bool($value)) return $value;
        if (is_numeric($value)) return (int)$value !== 0;

        return in_array(mb_strtolower(trim((string)$value)), ['1', 'true', 'si', 'yes', 'on'], true);
    }
}
