<?php

namespace App\Http\Controllers\Admin;

use App\Helpers\EmailConfig;
use App\Http\Controllers\BasicController;
use App\Models\Client;
use App\Models\SampleOrder;
use App\Support\BusinessScope;
use App\Support\SampleDelayReasons;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use SoDe\Extend\Response;

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
        if (Schema::hasColumn('sample_orders', 'approved_at') && in_array($body['order_status'], ['approved', 'preparing', 'in_route', 'delivered'], true)) {
            $body['approved_at'] = $this->normalizeDateTime($body['approved_at'] ?? null)
                ?? ($id ? SampleOrder::query()->whereKey($id)->value('approved_at') : null)
                ?? now();
        }
        // El estado del correo lo gobierna el envio real al aprobar (no el formulario):
        // nace 'pending' y al editar se conserva el estado ya registrado.
        $body['email_status'] = $id
            ? (SampleOrder::query()->whereKey($id)->value('email_status') ?: 'pending')
            : 'pending';
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
        $body['request_reason_id'] = trim((string)($body['request_reason_id'] ?? '')) ?: null;
        $body['sales_channel_id'] = trim((string)($body['sales_channel_id'] ?? '')) ?: null;
        $body['sales_subchannel_id'] = trim((string)($body['sales_subchannel_id'] ?? '')) ?: null;
        $body['service_type_id'] = trim((string)($body['service_type_id'] ?? '')) ?: null;
        $body['giro_id'] = trim((string)($body['giro_id'] ?? '')) ?: null;
        $body['sub_giro_id'] = trim((string)($body['sub_giro_id'] ?? '')) ?: null;
        $body['order_complete'] = $this->toBoolean($body['order_complete'] ?? false);
        $body['requested_at'] = $this->normalizeDate($body['requested_at'] ?? now()->toDateString());
        $body['delivered_at'] = $this->normalizeDate($body['delivered_at'] ?? null);
        if ($body['order_status'] === 'delivered' && !$body['delivered_at']) {
            $body['delivered_at'] = now()->toDateString();
        }
        if (Schema::hasColumn('sample_orders', 'delay_reason')) {
            // El motivo solo tiene sentido si la entrega salio despues de la fecha solicitada:
            // si el pedido llego a tiempo se limpia para que no ensucie el dashboard.
            $delayed = $this->deliveredLate($body['requested_at'] ?? null, $body['delivered_at'] ?? null);
            $body['delay_reason'] = $delayed ? SampleDelayReasons::normalize($body['delay_reason'] ?? null) : null;
            $body['delay_reason_notes'] = $delayed ? (trim((string)($body['delay_reason_notes'] ?? '')) ?: null) : null;
        }
        $body['supervisor_name'] = trim((string)($body['supervisor_name'] ?? '')) ?: null;
        $body['cancellation_reason'] = trim((string)($body['cancellation_reason'] ?? '')) ?: null;
        $body['observations'] = trim((string)($body['observations'] ?? '')) ?: null;
        $body['map_lat'] = $this->toNullableDecimal($body['map_lat'] ?? null);
        $body['map_lng'] = $this->toNullableDecimal($body['map_lng'] ?? null);
        $body['evidence_url'] = trim((string)($body['evidence_url'] ?? '')) ?: null;
        $body['evidence_notes'] = trim((string)($body['evidence_notes'] ?? '')) ?: null;
        $body['items'] = $this->normalizeItems($body['items'] ?? []);
        $this->assertItemsFromSampleWarehouse($body['items']);

        return $body;
    }

    public function articles(Request $request)
    {
        $response = new Response();

        try {
            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = $this->sampleStockRows(
                (string)($request->input('search') ?? ''),
                (int)($request->input('take') ?? 1000)
            );
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    // Pedido completo solo si hay items y el stock alcanza la cantidad pedida en cada uno
    private function sampleOrderComplete(SampleOrder $order): bool
    {
        $items = is_array($order->items) ? $order->items : [];
        if (count($items) === 0) return false;

        foreach ($items as $item) {
            $quantity = (float)($item['quantity'] ?? 0);
            $stock = (float)($item['stock'] ?? 0);
            if ($quantity <= 0 || $stock < $quantity) return false;
        }

        return true;
    }

    // Notifica por correo al cliente vinculado que su pedido de muestra fue aprobado.
    // No interrumpe el flujo: cualquier fallo deja email_status='failed' y se registra en log.
    private function sendApprovalEmail(SampleOrder $order): void
    {
        try {
            $client = $order->client_id ? Client::query()->find($order->client_id) : null;
            $email = $client ? trim((string)($client->email ?? '')) : '';

            if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $order->update(['email_status' => 'failed']);
                Log::warning('Pedido muestra aprobado sin correo de cliente valido', [
                    'sample_order_id' => $order->id,
                    'client_id' => $order->client_id,
                ]);
                return;
            }

            $html = $this->buildApprovalEmailBody($order, $client);

            $mail = EmailConfig::config();
            $mail->Subject = 'Pedido de muestra ' . ($order->order_number ?: ('#' . $order->id)) . ' aprobado';
            $mail->isHTML(true);
            $mail->Body = $html;
            $mail->AltBody = trim(strip_tags($html));
            $mail->addAddress($email, trim((string)($client->full_name ?? $order->client_name ?? '')) ?: $email);
            $mail->send();
            $mail->smtpClose();

            $order->update(['email_status' => 'delivered']);
        } catch (\Throwable $th) {
            $order->update(['email_status' => 'failed']);
            Log::error('Error enviando correo de aprobacion de pedido muestra', [
                'sample_order_id' => $order->id,
                'message' => $th->getMessage(),
            ]);
        }
    }

    private function buildApprovalEmailBody(SampleOrder $order, ?Client $client): string
    {
        $items = is_array($order->items) ? $order->items : [];
        $rows = '';
        foreach ($items as $item) {
            $code = e((string)($item['code'] ?? ''));
            $name = e((string)($item['name'] ?? ''));
            $unit = e((string)($item['unit'] ?? ''));
            $quantity = (float)($item['quantity'] ?? 0);
            $quantityLabel = e(rtrim(rtrim(number_format($quantity, 2, '.', ''), '0'), '.'));
            $rows .= "<tr>"
                . "<td style=\"padding:6px 10px;border:1px solid #e5e7eb;\">{$code}</td>"
                . "<td style=\"padding:6px 10px;border:1px solid #e5e7eb;\">{$name}</td>"
                . "<td style=\"padding:6px 10px;border:1px solid #e5e7eb;text-align:center;\">{$quantityLabel}</td>"
                . "<td style=\"padding:6px 10px;border:1px solid #e5e7eb;\">{$unit}</td>"
                . "</tr>";
        }
        if ($rows === '') {
            $rows = "<tr><td colspan=\"4\" style=\"padding:6px 10px;border:1px solid #e5e7eb;text-align:center;\">Sin articulos</td></tr>";
        }

        $orderNumber = e((string)($order->order_number ?: ('#' . $order->id)));
        $clientName = e((string)($client->full_name ?? $order->client_name ?? ''));
        $requestedAt = $order->requested_at ? e($order->requested_at->format('d/m/Y')) : '';
        $appName = e((string) config('app.name', 'Kamary'));

        return "<div style=\"font-family:Arial,Helvetica,sans-serif;color:#111827;max-width:640px;margin:0 auto;\">"
            . "<h2 style=\"color:#1d4ed8;\">Pedido de muestra aprobado</h2>"
            . "<p>Estimado(a) <strong>{$clientName}</strong>,</p>"
            . "<p>Le informamos que su pedido de muestra <strong>{$orderNumber}</strong> ha sido <strong>aprobado</strong>.</p>"
            . ($requestedAt !== '' ? "<p><strong>Fecha de solicitud:</strong> {$requestedAt}</p>" : '')
            . "<h3 style=\"margin-bottom:6px;\">Detalle de articulos</h3>"
            . "<table style=\"border-collapse:collapse;width:100%;font-size:14px;\">"
            . "<thead><tr style=\"background:#f3f4f6;\">"
            . "<th style=\"padding:6px 10px;border:1px solid #e5e7eb;text-align:left;\">Codigo</th>"
            . "<th style=\"padding:6px 10px;border:1px solid #e5e7eb;text-align:left;\">Articulo</th>"
            . "<th style=\"padding:6px 10px;border:1px solid #e5e7eb;\">Cantidad</th>"
            . "<th style=\"padding:6px 10px;border:1px solid #e5e7eb;text-align:left;\">Unidad</th>"
            . "</tr></thead>"
            . "<tbody>{$rows}</tbody></table>"
            . "<p style=\"margin-top:20px;color:#6b7280;font-size:12px;\">Este es un correo automatico de {$appName}.</p>"
            . "</div>";
    }

    public function boolean(Request $request)
    {
        $field = trim((string)$request->field);
        if ($field !== 'order_status') {
            return parent::boolean($request);
        }

        $response = new Response();
        try {
            $orderStatus = $this->normalizeOption(
                $this->normalizeStatusAlias($request->value ?? 'registered', [
                    'processing' => 'preparing',
                    'completed' => 'delivered',
                ]),
                ['registered', 'approved', 'preparing', 'in_route', 'delivered', 'cancelled'],
                'registered'
            );

            $order = SampleOrder::query()->whereKey($request->id)->whereNotNull('status')->firstOrFail();
            $wasApproved = in_array($order->order_status, ['approved', 'preparing', 'in_route', 'delivered'], true);

            // No se puede aprobar un pedido incompleto (stock insuficiente para liquidarlo)
            if ($orderStatus === 'approved' && !$this->sampleOrderComplete($order)) {
                throw new \Exception('No se puede aprobar el pedido: el stock es insuficiente (pedido incompleto).');
            }

            $updates = [
                'order_status' => $orderStatus,
                'updated_by' => Auth::id(),
            ];

            if (
                Schema::hasColumn('sample_orders', 'approved_at')
                && in_array($orderStatus, ['approved', 'preparing', 'in_route', 'delivered'], true)
                && !$order->approved_at
            ) {
                $updates['approved_at'] = now();
            }
            if ($orderStatus === 'delivered' && !$order->delivered_at) {
                $updates['delivered_at'] = now()->toDateString();
            }
            if ($orderStatus === 'delivered' && Schema::hasColumn('sample_orders', 'delay_reason')) {
                $deliveredAt = $updates['delivered_at'] ?? $order->delivered_at;
                $delayed = $this->deliveredLate($order->requested_at, $deliveredAt);
                $updates['delay_reason'] = $delayed ? SampleDelayReasons::normalize($request->delay_reason) : null;
                $updates['delay_reason_notes'] = $delayed ? (trim((string)$request->delay_reason_notes) ?: null) : null;
            }

            $order->update($updates);

            // Al aprobar (transicion a 'approved') se notifica por correo al cliente vinculado
            if ($orderStatus === 'approved' && !$wasApproved) {
                $this->sendApprovalEmail($order);
            }

            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = $order->fresh();
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function evidence(Request $request, string $id)
    {
        $response = new Response();

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

    /** La entrega salio despues de la fecha solicitada. */
    private function deliveredLate($requestedAt, $deliveredAt): bool
    {
        if (!$requestedAt || !$deliveredAt) return false;

        return Carbon::parse($deliveredAt)->startOfDay()
            ->greaterThan(Carbon::parse($requestedAt)->startOfDay());
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

    private function normalizeDateTime($value): ?string
    {
        if ($value === null) return null;
        $text = trim((string)$value);
        if ($text === '') return null;
        $timestamp = strtotime($text);
        if ($timestamp === false) throw new \Exception("Fecha invalida: {$value}");

        return date('Y-m-d H:i:s', $timestamp);
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
                    'stock_key' => trim((string)($item['stock_key'] ?? '')) ?: null,
                    'article_id' => $this->toNullableInt($item['article_id'] ?? null),
                    'warehouse_id' => $this->toNullableInt($item['warehouse_id'] ?? null),
                    'code' => trim((string)($item['code'] ?? '')) ?: null,
                    'lot_code' => trim((string)($item['lot_code'] ?? '')) ?: null,
                    'name' => trim((string)($item['name'] ?? '')) ?: null,
                    'unit' => trim((string)($item['unit'] ?? '')) ?: null,
                    'stock' => $this->toNullableDecimal($item['stock'] ?? 0) ?? 0,
                    'quantity' => $this->toNullableDecimal($item['quantity'] ?? 0) ?? 0,
                    'unit_weight' => $this->toNullableDecimal($item['unit_weight'] ?? 0) ?? 0,
                    'warehouse' => trim((string)($item['warehouse'] ?? '')) ?: null,
                    'expiration_date' => $this->normalizeDate($item['expiration_date'] ?? null),
                    'laboratory' => trim((string)($item['laboratory'] ?? '')) ?: null,
                    'active_principle' => trim((string)($item['active_principle'] ?? '')) ?: null,
                ];
            })
            ->values()
            ->all();
    }

    private function assertItemsFromSampleWarehouse(array $items): void
    {
        if (count($items) === 0) return;

        $requested = [];
        foreach ($items as $index => $item) {
            $articleId = $this->toNullableInt($item['article_id'] ?? null);
            if (!$articleId) {
                throw new \Exception('El item ' . ($index + 1) . ' debe seleccionarse desde el almacen de Muestras');
            }

            $requested[$articleId] = ($requested[$articleId] ?? 0) + (float)($item['quantity'] ?? 0);
        }

        $stockByArticle = collect($this->sampleStockRows('', 5000))
            ->groupBy('article_id')
            ->map(fn($rows) => $rows->sum('stock'));

        foreach ($requested as $articleId => $quantity) {
            $available = (float)($stockByArticle[$articleId] ?? 0);
            if ($available <= 0) {
                throw new \Exception("El articulo {$articleId} no pertenece al almacen de Muestras o no tiene stock disponible");
            }
            if ($quantity > ($available + 0.0005)) {
                throw new \Exception("Stock insuficiente en almacen de Muestras para el articulo {$articleId}. Disponible: " . round($available, 3));
            }
        }
    }

    private function sampleStockRows(string $search = '', int $take = 1000): array
    {
        if (
            !Schema::hasTable('warehouses')
            || !Schema::hasTable('articles')
            || !Schema::hasTable('entry_note_items')
            || !Schema::hasTable('entry_notes')
        ) {
            return [];
        }

        $warehouseIds = $this->sampleWarehouseIds();
        if (count($warehouseIds) === 0) return [];

        $entryMovements = DB::table('entry_note_items as item')
            ->join('entry_notes as note', 'note.id', '=', 'item.entry_note_id')
            ->join('businesses as business', 'business.id', '=', 'note.business_id')
            ->where('business.business_key', BusinessScope::KAMARY_PERU)
            ->where('note.status', 1)
            ->where('item.status', 1)
            ->when(Schema::hasColumn('entry_notes', 'entry_status'), fn($query) => $query->where('note.entry_status', 'approved'))
            ->where(function ($query) use ($warehouseIds) {
                $query->whereIn('item.warehouse_id', $warehouseIds)
                    ->orWhere(function ($fallback) use ($warehouseIds) {
                        $fallback->whereNull('item.warehouse_id')->whereIn('note.warehouse_id', $warehouseIds);
                    });
            })
            ->selectRaw("
                item.article_id,
                COALESCE(item.warehouse_id, note.warehouse_id) as warehouse_id,
                COALESCE(NULLIF(item.lot, ''), NULLIF(item.batch_code, ''), '') as lot,
                item.expiration_date,
                item.quantity
            ");

        if (Schema::hasTable('purchase_receipt_items') && Schema::hasTable('purchase_receipts')) {
            $receiptMovements = DB::table('purchase_receipt_items as item')
                ->join('purchase_receipts as receipt', 'receipt.id', '=', 'item.purchase_receipt_id')
                ->join('businesses as business', 'business.id', '=', 'receipt.business_id')
                ->where('business.business_key', BusinessScope::KAMARY_PERU)
                ->where('receipt.status', 1)
                ->when(Schema::hasColumn('purchase_receipts', 'receipt_status'), fn($query) => $query->where('receipt.receipt_status', 'confirmed'))
                ->where('item.status', 1)
                ->where(function ($query) use ($warehouseIds) {
                    $query->whereIn('item.warehouse_id', $warehouseIds)
                        ->orWhere(function ($fallback) use ($warehouseIds) {
                            $fallback->whereNull('item.warehouse_id')->whereIn('receipt.warehouse_id', $warehouseIds);
                        });
                })
                ->selectRaw("
                    item.article_id,
                    COALESCE(item.warehouse_id, receipt.warehouse_id) as warehouse_id,
                    COALESCE(NULLIF(item.lot, ''), NULLIF(item.batch_code, ''), '') as lot,
                    item.expiration_date,
                    item.quantity
                ");

            $entryMovements->unionAll($receiptMovements);
        }

        $incomingTotals = DB::query()
            ->fromSub($entryMovements, 'incoming')
            ->selectRaw("
                incoming.article_id,
                incoming.warehouse_id,
                incoming.lot,
                incoming.expiration_date,
                COALESCE(SUM(incoming.quantity), 0) as qty_in
            ")
            ->groupBy('incoming.article_id', 'incoming.warehouse_id', 'incoming.lot', 'incoming.expiration_date');

        $outgoingTotals = Schema::hasTable('exit_note_items') && Schema::hasTable('exit_notes')
            ? DB::table('exit_note_items as item')
                ->join('exit_notes as note', 'note.id', '=', 'item.exit_note_id')
                ->join('businesses as business', 'business.id', '=', 'note.business_id')
                ->where('business.business_key', BusinessScope::KAMARY_PERU)
                ->where('note.status', 1)
                ->where('item.status', 1)
                ->when(Schema::hasColumn('exit_notes', 'exit_status'), fn($query) => $query->where('note.exit_status', 'approved'))
                ->where(function ($query) use ($warehouseIds) {
                    $query->whereIn('item.warehouse_id', $warehouseIds)
                        ->orWhere(function ($fallback) use ($warehouseIds) {
                            $fallback->whereNull('item.warehouse_id')->whereIn('note.warehouse_id', $warehouseIds);
                        });
                })
                ->selectRaw("
                    item.article_id,
                    COALESCE(item.warehouse_id, note.warehouse_id) as warehouse_id,
                    COALESCE(NULLIF(item.batch_code, ''), '') as lot,
                    item.expiration_date,
                    COALESCE(SUM(item.quantity), 0) as qty_out
                ")
                ->groupBy('item.article_id', 'warehouse_id', 'lot', 'item.expiration_date')
            : DB::query()
                ->selectRaw("
                    NULL as article_id,
                    NULL as warehouse_id,
                    '' as lot,
                    NULL as expiration_date,
                    0 as qty_out
                ")
                ->whereRaw('1 = 0');

        $needle = mb_strtolower(trim($search));
        $query = DB::query()
            ->fromSub($incomingTotals, 'stock')
            ->join('articles as article', 'article.id', '=', 'stock.article_id')
            ->leftJoin('units as unit', 'unit.id', '=', 'article.unit_id')
            ->leftJoin('laboratories as laboratory', 'laboratory.id', '=', 'article.laboratory_id')
            ->leftJoin('active_principles as principle', 'principle.id', '=', 'article.active_principle_id')
            ->leftJoin('warehouses as warehouse', 'warehouse.id', '=', 'stock.warehouse_id')
            ->leftJoinSub($outgoingTotals, 'outgoing', function ($join) {
                $join->on('outgoing.article_id', '=', 'stock.article_id')
                    ->on('outgoing.warehouse_id', '=', 'stock.warehouse_id')
                    ->whereRaw("COALESCE(outgoing.lot, '') = COALESCE(stock.lot, '')")
                    ->whereRaw("COALESCE(outgoing.expiration_date, '1000-01-01') = COALESCE(stock.expiration_date, '1000-01-01')");
            })
            ->when(Schema::hasColumn('articles', 'status'), fn($query) => $query->whereNotNull('article.status'))
            ->whereRaw('(COALESCE(stock.qty_in, 0) - COALESCE(outgoing.qty_out, 0)) > 0')
            ->when($needle !== '', function ($query) use ($needle) {
                $like = '%' . $needle . '%';
                $query->where(function ($inner) use ($like) {
                    $inner->whereRaw("LOWER(COALESCE(article.code, '')) LIKE ?", [$like])
                        ->orWhereRaw("LOWER(COALESCE(article.name, '')) LIKE ?", [$like])
                        ->orWhereRaw("LOWER(COALESCE(stock.lot, '')) LIKE ?", [$like])
                        ->orWhereRaw("LOWER(COALESCE(warehouse.name, '')) LIKE ?", [$like]);
                });
            })
            ->orderBy('article.name')
            ->orderBy('stock.expiration_date')
            ->limit(max(1, min($take ?: 1000, 5000)))
            ->get([
                'stock.article_id',
                'stock.warehouse_id',
                'stock.lot',
                'stock.expiration_date',
                DB::raw('COALESCE(stock.qty_in, 0) - COALESCE(outgoing.qty_out, 0) as stock'),
                'article.code',
                'article.name',
                'article.unit_weight',
                DB::raw('COALESCE(unit.symbol, unit.name, "") as unit_label'),
                DB::raw('COALESCE(laboratory.name, "") as laboratory_name'),
                DB::raw('COALESCE(principle.name, "") as principle_name'),
                DB::raw('COALESCE(warehouse.name, "") as warehouse_name'),
            ]);

        return $query->map(function ($row) {
            $expirationDate = $row->expiration_date ? substr((string)$row->expiration_date, 0, 10) : '';
            $stockKey = implode('|', [
                $row->article_id,
                $row->warehouse_id,
                (string)$row->lot,
                $expirationDate,
            ]);

            return [
                'id' => (int)$row->article_id,
                'stock_key' => $stockKey,
                'article_id' => (int)$row->article_id,
                'warehouse_id' => $row->warehouse_id ? (int)$row->warehouse_id : null,
                'code' => (string)$row->code,
                'default_lot' => (string)$row->lot,
                'name' => (string)$row->name,
                'unit_weight' => (float)($row->unit_weight ?? 0),
                'unit' => ['symbol' => (string)$row->unit_label, 'name' => (string)$row->unit_label],
                'stock' => round((float)$row->stock, 3),
                'warehouse' => ['id' => $row->warehouse_id, 'name' => (string)$row->warehouse_name],
                'warehouse_name' => (string)$row->warehouse_name,
                'default_expiration_date' => $expirationDate,
                'laboratory' => ['name' => (string)$row->laboratory_name],
                'activePrinciple' => ['name' => (string)$row->principle_name],
            ];
        })->values()->all();
    }

    private function sampleWarehouseIds(): array
    {
        // El modulo Muestras consume stock UNICAMENTE del almacen fijo de Muestras.
        $id = \App\Support\SamplesWarehouse::idOrNull();
        return $id ? [$id] : [];
    }

    private function toBoolean($value): bool
    {
        if (is_bool($value)) return $value;
        if (is_numeric($value)) return (int)$value !== 0;

        return in_array(mb_strtolower(trim((string)$value)), ['1', 'true', 'si', 'yes', 'on'], true);
    }
}
