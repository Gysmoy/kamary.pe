<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\CommercialOrder;
use App\Models\DeliveryEvidence;
use App\Models\Dispatch;
use App\Models\DispatchAssignment;
use App\Services\CommercialOrderTrackingService;
use App\Services\DispatchService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use SoDe\Extend\Response;

class DeliveryEvidenceController extends BasicController
{
    public function saveForCommercialOrder(Request $request, string $id)
    {
        $response = new Response();
        DB::beginTransaction();

        try {
            $order = CommercialOrder::with(['dispatchAssignments.dispatch', 'deliveryEvidences'])->whereKey($id)->whereNotNull('status')->firstOrFail();
            $dispatch = $this->resolveDispatch($order, $this->toNullableInt($request->input('dispatch_id')));
            $evidence = DeliveryEvidence::query()
                ->where('commercial_order_id', $order->id)
                ->where(function ($query) use ($dispatch) {
                    if ($dispatch) $query->where('dispatch_id', $dispatch->id);
                    else $query->whereNull('dispatch_id');
                })
                ->first();
            $evidenceUrl = trim((string) ($request->input('evidence_url') ?? '')) ?: null;

            if (!$evidenceUrl) {
                $evidenceUrl = $evidence?->evidence_url;
            }

            if ($request->hasFile('evidence_file')) {
                $evidenceUrl = $this->storeEvidenceFile($request);
            }

            if (!$evidenceUrl) {
                throw new \Exception('Debes adjuntar una imagen o enlace de evidencia');
            }

            $deliveredAt = $this->normalizeDateTime($request->input('delivered_at')) ?? now();

            if (!$evidence) {
                $evidence = new DeliveryEvidence([
                    'code' => $this->nextCode(),
                    'business_id' => $order->business_id,
                    'commercial_order_id' => $order->id,
                    'dispatch_id' => $dispatch?->id,
                    'created_by' => Auth::id(),
                    'status' => true,
                ]);
            }

            $evidence->fill([
                'business_id' => $order->business_id,
                'dispatch_id' => $dispatch?->id,
                'commercial_order_id' => $order->id,
                'driver_id' => $dispatch?->driver_id,
                'recipient_name' => trim((string) ($request->input('recipient_name') ?? '')) ?: null,
                'recipient_document_type' => trim((string) ($request->input('recipient_document_type') ?? 'DNI')) ?: 'DNI',
                'recipient_document_number' => trim((string) ($request->input('recipient_document_number') ?? '')) ?: null,
                'recipient_phone' => trim((string) ($request->input('recipient_phone') ?? '')) ?: null,
                'evidence_url' => $evidenceUrl,
                'evidence_notes' => trim((string) ($request->input('evidence_notes') ?? '')) ?: null,
                'delivered_at' => $deliveredAt,
                'latitude' => $this->toNullableDecimal($request->input('latitude')),
                'longitude' => $this->toNullableDecimal($request->input('longitude')),
                'metadata' => [
                    'source' => 'admin',
                    'user_agent' => $request->userAgent(),
                    'ip' => $request->ip(),
                ],
                'updated_by' => Auth::id(),
            ]);
            $evidence->save();

            $previousDispatchStatus = $order->dispatch_status;
            $previousOrderStatus = $order->order_status;
            $orderPayload = [
                'dispatch_status' => 'delivered',
                'updated_by' => Auth::id(),
            ];
            if (!in_array($order->order_status, ['billed', 'closed', 'cancelled'], true)) {
                $orderPayload['order_status'] = 'delivered';
            }
            $order->update($orderPayload);

            if ($dispatch) {
                DispatchAssignment::query()
                    ->where('dispatch_id', $dispatch->id)
                    ->where('commercial_order_id', $order->id)
                    ->update(['assignment_status' => 'delivered']);

                if ($this->markDispatchDeliveredWhenComplete($dispatch)) {
                    $dispatchService = app(DispatchService::class);
                    $freshDispatch = $dispatch->fresh(['assignments.commercialOrder.items', 'assignments.commercialOrder.client', 'assignments.commercialOrder.eventualClient', 'exitNote.items']);
                    $dispatchService->syncExitNote($freshDispatch);
                    $dispatchService->syncCommercialOrderStatuses([$order->id]);
                }
            }

            $freshOrder = $order->fresh();
            $tracking = app(CommercialOrderTrackingService::class);
            if ($previousDispatchStatus !== 'delivered') {
                $tracking->recordStatusChange($freshOrder, 'dispatch_status', 'delivered', $dispatch);
            }
            if (($orderPayload['order_status'] ?? null) === 'delivered' && $previousOrderStatus !== 'delivered') {
                $tracking->recordStatusChange($freshOrder, 'order_status', 'delivered', $dispatch);
            }
            $tracking->recordDeliveryEvidence($freshOrder, $evidence);

            DB::commit();

            $response->status = 200;
            $response->message = 'Evidencia registrada correctamente';
            $response->data = $evidence->fresh(['commercialOrder:id,code', 'dispatch:id,code,manifest_code,dispatch_status', 'driver:id,full_name,license_number']);
        } catch (\Throwable $th) {
            DB::rollBack();
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function media(Request $request, string $filename)
    {
        abort_if(str_contains($filename, '..') || str_contains($filename, '/') || str_contains($filename, '\\'), 404);
        $path = "images/delivery_evidence/{$filename}";
        abort_unless(Storage::exists($path), 404);

        return response(Storage::get($path), 200, [
            'Content-Type' => Storage::mimeType($path) ?: 'application/octet-stream',
            'Cache-Control' => 'private, max-age=3600',
        ]);
    }

    private function resolveDispatch(CommercialOrder $order, ?int $dispatchId): ?Dispatch
    {
        if ($dispatchId) {
            $dispatch = Dispatch::findOrFail($dispatchId);
            $exists = DispatchAssignment::query()
                ->where('dispatch_id', $dispatch->id)
                ->where('commercial_order_id', $order->id)
                ->where('status', 1)
                ->exists();
            if (!$exists) throw new \Exception('El pedido no pertenece al despacho seleccionado');
            return $dispatch;
        }

        return $order->dispatchAssignments
            ->filter(fn ($assignment) => $assignment->status !== false && $assignment->status !== 0 && $assignment->dispatch?->status !== null)
            ->sortByDesc(fn ($assignment) => $assignment->dispatch?->scheduled_date ?? $assignment->created_at)
            ->first()
            ?->dispatch;
    }

    private function storeEvidenceFile(Request $request): string
    {
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
        Storage::putFileAs('images/delivery_evidence', $file, $filename);

        return "/api/admin/delivery-evidence-media/{$filename}";
    }

    private function markDispatchDeliveredWhenComplete(Dispatch $dispatch): bool
    {
        $assignmentOrderIds = DispatchAssignment::query()
            ->where('dispatch_id', $dispatch->id)
            ->where('status', 1)
            ->pluck('commercial_order_id')
            ->filter()
            ->values();

        if ($assignmentOrderIds->isEmpty()) return false;

        $pending = CommercialOrder::query()
            ->whereIn('id', $assignmentOrderIds)
            ->whereNotIn('dispatch_status', ['delivered', 'cancelled'])
            ->count();

        if ($pending > 0) return false;

        if (!$dispatch->driver_id || !$dispatch->vehicle_id || !$dispatch->zone_id) return false;

        $covered = DeliveryEvidence::query()
            ->where('dispatch_id', $dispatch->id)
            ->whereIn('commercial_order_id', $assignmentOrderIds)
            ->whereNotNull('status')
            ->distinct()
            ->count('commercial_order_id');

        if ($covered < $assignmentOrderIds->unique()->count()) return false;

        $dispatch->update([
            'dispatch_status' => 'delivered',
            'delivered_at' => $dispatch->delivered_at ?: now(),
            'updated_by' => Auth::id(),
        ]);

        return true;
    }

    private function nextCode(): string
    {
        $next = 1;
        $latest = DeliveryEvidence::query()->latest('id')->value('code');
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) {
            $next = ((int) $matches[1]) + 1;
        }

        return 'EVD-' . str_pad((string) $next, 6, '0', STR_PAD_LEFT);
    }

    private function normalizeDateTime($value): mixed
    {
        if ($value === null) return null;
        $text = trim((string) $value);
        if ($text === '') return null;
        $timestamp = strtotime($text);
        if ($timestamp === false) throw new \Exception("Fecha invalida: {$value}");

        return date('Y-m-d H:i:s', $timestamp);
    }

    private function toNullableInt($value): ?int
    {
        if ($value === null) return null;
        $text = trim((string) $value);
        if ($text === '') return null;
        if (!ctype_digit(ltrim($text, '+'))) throw new \Exception("Valor entero invalido: {$value}");
        return (int) $text;
    }

    private function toNullableDecimal($value): ?float
    {
        if ($value === null) return null;
        $text = trim((string) $value);
        if ($text === '') return null;
        if (!is_numeric($text)) throw new \Exception("Valor numerico invalido: {$value}");

        return (float) $text;
    }
}
