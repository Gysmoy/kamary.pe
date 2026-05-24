<?php

namespace App\Services;

use App\Models\CommercialOrder;
use App\Models\CommercialOrderTrackingEvent;
use App\Models\Dispatch;
use App\Models\ReferralGuide;
use App\Models\ReferralGuideItem;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ReferralGuideService
{
    private const DEFAULT_SERIES = 'T001';

    public function prepareForDispatch(Dispatch $dispatch): Collection
    {
        $dispatch->loadMissing([
            'business',
            'branch',
            'warehouse.branch',
            'driver',
            'vehicle',
            'assignments.commercialOrder.business',
            'assignments.commercialOrder.branch',
            'assignments.commercialOrder.warehouse.branch',
            'assignments.commercialOrder.client',
            'assignments.commercialOrder.eventualClient',
            'assignments.commercialOrder.items.article.unit',
            'assignments.commercialOrder.items.presentation',
        ]);

        $guides = collect();
        DB::transaction(function () use ($dispatch, $guides) {
            foreach ($dispatch->assignments as $assignment) {
                if (!$assignment->status || !$assignment->commercialOrder) continue;
                $guides->push($this->prepareForOrder($assignment->commercialOrder, $dispatch, false));
            }
        });

        if ($guides->isEmpty()) {
            throw new \Exception('El despacho no tiene pedidos disponibles para generar guia');
        }

        return $guides->map(fn(ReferralGuide $guide) => $this->loadGuide($guide->id))->values();
    }

    public function prepareForCommercialOrder(CommercialOrder $order): ReferralGuide
    {
        return DB::transaction(fn() => $this->prepareForOrder($order, null, true));
    }

    public function prepareForOrder(CommercialOrder $order, ?Dispatch $dispatch = null, bool $wrapTransaction = true): ReferralGuide
    {
        $callback = function () use ($order, $dispatch) {
            $order->loadMissing([
                'business',
                'branch',
                'warehouse.branch',
                'client',
                'eventualClient',
                'items.article.unit',
                'items.presentation',
            ]);
            $dispatch?->loadMissing(['business', 'branch', 'warehouse.branch', 'driver', 'vehicle']);

            if (!$order->status || in_array($order->order_status, ['draft', 'cancelled'], true)) {
                throw new \Exception("El pedido {$order->code} no esta disponible para guia");
            }

            $guide = $this->findReusableGuide($order, $dispatch);
            if ($guide && in_array($guide->guide_status, ['accepted', 'cancelled'], true)) {
                return $this->loadGuide($guide->id);
            }

            $guide = $guide ?: new ReferralGuide();
            $isNew = !$guide->exists;
            $branch = $dispatch?->branch ?: $order->branch ?: $order->warehouse?->branch;
            $business = $dispatch?->business ?: $order->business;
            $warehouse = $dispatch?->warehouse ?: $order->warehouse;
            $driver = $dispatch?->driver;
            $vehicle = $dispatch?->vehicle;
            $series = trim((string) ($guide->series ?: $branch?->series_guia ?: config('facturadorpro5.series.guia', self::DEFAULT_SERIES)));
            $series = $series !== '' ? $series : self::DEFAULT_SERIES;
            $sequence = $guide->sequence ?: $this->nextSequence($series);
            $externalReference = $series . '-' . $this->normalizeSequence($sequence);
            $issueDate = $guide->issue_date ?: now()->toDateString();
            $transferDate = $dispatch?->scheduled_date
                ? Carbon::parse($dispatch->scheduled_date)->toDateString()
                : ($order->promised_delivery_at ? Carbon::parse($order->promised_delivery_at)->toDateString() : $issueDate);
            $items = $order->items->where('status', true)->values();
            if ($items->isEmpty()) throw new \Exception("El pedido {$order->code} no tiene items activos");

            $grossWeight = round($items->sum(function ($item) {
                $presentationUnits = (float)($item->presentation_units ?: 1);
                if ($presentationUnits <= 0) $presentationUnits = 1;
                return (float) $item->quantity * $presentationUnits * (float) ($item->article?->unit_weight ?? 0);
            }), 3);

            $guide->fill([
                'business_id' => $business?->id ?: $order->business_id,
                'business_branch_id' => $branch?->id ?: $order->business_branch_id,
                'warehouse_id' => $warehouse?->id ?: $order->warehouse_id,
                'dispatch_id' => $dispatch?->id,
                'commercial_order_id' => $order->id,
                'driver_id' => $driver?->id,
                'vehicle_id' => $vehicle?->id,
                'document_type' => 'Guia de remision',
                'series' => $series,
                'sequence' => $sequence,
                'external_reference' => $externalReference,
                'issue_date' => $issueDate,
                'transfer_date' => $transferDate,
                'guide_status' => 'prepared',
                'external_status' => $guide->external_status ?: 'pending',
                'provider' => 'facturadorpro5',
                'provider_endpoint' => $this->joinProviderUrl((string) config('facturadorpro5.dispatch_endpoint', '/api/dispatches')),
                'origin_ubigeo' => $branch?->ubigeo,
                'origin_address' => $branch?->address ?: ($warehouse?->name ?: $business?->name),
                'destination_ubigeo' => $order->ubigeo,
                'destination_address' => $order->delivery_address,
                'recipient_name' => $this->customerName($order),
                'recipient_document_type' => $this->customerDocumentType($order),
                'recipient_document_number' => $this->customerDocumentNumber($order),
                'recipient_phone' => $order->dispatch_contact_phone ?: ($order->client?->phone ?: $order->eventualClient?->phone),
                'driver_name' => $driver?->full_name ?: $dispatch?->driver_name,
                'driver_document_type' => $driver?->document_type,
                'driver_document_number' => $driver?->document_number,
                'driver_license_number' => $driver?->license_number,
                'vehicle_plate' => $vehicle?->plate ?: $dispatch?->vehicle_plate,
                'transfer_mode' => 'private',
                'transfer_reason' => 'VENTA',
                'package_count' => max(1, $items->count()),
                'gross_weight' => $grossWeight,
                'metadata' => [
                    'source' => 'commercial_order',
                    'commercial_order_code' => $order->code,
                    'dispatch_code' => $dispatch?->code,
                    'manifest_code' => $dispatch?->manifest_code,
                    'business_name' => $business?->name,
                    'business_ruc' => $business?->tax_number,
                    'business_address' => $branch?->address,
                    'delivery_reference' => $order->delivery_reference,
                    'dispatch_contact_name' => $order->dispatch_contact_name,
                    'dispatch_contact_phone' => $order->dispatch_contact_phone,
                ],
                'observations' => trim((string) $order->observations) ?: null,
                'updated_by' => Auth::id(),
            ]);

            if ($isNew) {
                $guide->code = $this->nextCode();
                $guide->created_by = Auth::id();
                $guide->status = true;
            }

            $guide->save();
            $this->syncItems($guide, $order);

            $fresh = $this->loadGuide($guide->id);
            $fresh->update([
                'request_payload' => json_encode($this->buildProviderPayload($fresh), JSON_UNESCAPED_UNICODE),
            ]);

            if (!CommercialOrderTrackingEvent::query()
                ->where('commercial_order_id', $order->id)
                ->where('referral_guide_id', $fresh->id)
                ->where('event_type', 'referral_guide')
                ->exists()) {
                app(CommercialOrderTrackingService::class)->recordReferralGuide($order->fresh(), $fresh);
            }

            return $this->loadGuide($guide->id);
        };

        return $wrapTransaction ? DB::transaction($callback) : $callback();
    }

    public function cancel(ReferralGuide $guide, ?string $reason = null): ReferralGuide
    {
        $guide = $this->loadGuide($guide->id);

        if ($guide->guide_status === 'cancelled') {
            return $guide;
        }

        if ($guide->guide_status === 'accepted') {
            $previousResponse = json_decode($guide->response_payload ?: '[]', true);
            $previousResponse = is_array($previousResponse) ? $previousResponse : [];
            $payload = $this->buildCancelPayload($guide, $reason);
            $providerResponse = app(FacturadorPro5Service::class)->cancelReferralGuide($guide, $payload);
            if (empty($providerResponse['links']) && !empty($previousResponse['links'])) {
                $providerResponse['links'] = $previousResponse['links'];
            }
            if (!empty($previousResponse)) {
                $providerResponse['previous_response'] = $previousResponse;
            }
            $localStatus = (string) ($providerResponse['local_status'] ?? 'cancelled');

            $guide->update([
                'guide_status' => $localStatus,
                'external_status' => (string) ($providerResponse['external_status'] ?? 'Anulado'),
                'external_id' => $providerResponse['external_id'] ?? $guide->external_id,
                'external_reference' => $providerResponse['external_reference'] ?? $guide->external_reference,
                'provider_endpoint' => $this->referralGuideCancelEndpointUrl(),
                'response_payload' => json_encode($providerResponse, JSON_UNESCAPED_UNICODE),
                'error_message' => null,
                'metadata' => array_merge($guide->metadata ?? [], [
                    'cancel_reason' => $reason ?: 'Anulacion de guia de remision',
                    'voided_ticket' => $providerResponse['ticket'] ?? null,
                    'voided_external_id' => $providerResponse['voided_external_id'] ?? null,
                ]),
                'updated_by' => Auth::id(),
            ]);

            $fresh = $this->loadGuide($guide->id);
            $this->recordCancellationEvent($fresh, $reason, $providerResponse);

            return $fresh;
        }

        $guide->update([
            'guide_status' => 'cancelled',
            'external_status' => 'cancelled',
            'error_message' => $reason ?: null,
            'updated_by' => Auth::id(),
        ]);

        $fresh = $this->loadGuide($guide->id);
        $this->recordCancellationEvent($fresh, $reason);

        return $fresh;
    }

    public function issue(ReferralGuide $guide): ReferralGuide
    {
        if (!$guide->status) throw new \Exception('La guia esta inactiva');
        if ($guide->guide_status === 'accepted') throw new \Exception('La guia ya fue emitida');
        if ($guide->guide_status === 'cancelled') throw new \Exception('No puedes emitir una guia anulada');

        $guide = $this->loadGuide($guide->id);
        $this->assertReadyForIssue($guide);

        $payload = $this->buildProviderPayload($guide);
        $providerResponse = app(FacturadorPro5Service::class)->issueReferralGuide($guide, $payload);
        $localStatus = (string) ($providerResponse['local_status'] ?? 'accepted');

        $guide->update([
            'guide_status' => $localStatus,
            'external_status' => (string) ($providerResponse['external_status'] ?? $localStatus),
            'external_id' => (string) ($providerResponse['external_id'] ?? $guide->external_id),
            'external_reference' => (string) ($providerResponse['external_reference'] ?? $guide->external_reference),
            'provider_endpoint' => $this->joinProviderUrl((string) config('facturadorpro5.dispatch_endpoint', '/api/dispatches')),
            'request_payload' => json_encode($payload, JSON_UNESCAPED_UNICODE),
            'response_payload' => json_encode($providerResponse, JSON_UNESCAPED_UNICODE),
            'error_message' => null,
            'updated_by' => Auth::id(),
        ]);

        $fresh = $this->loadGuide($guide->id);
        if ($fresh->commercialOrder) {
            app(CommercialOrderTrackingService::class)->record(
                $fresh->commercialOrder,
                'referral_guide_issued',
                'Guia de remision emitida ' . ($fresh->external_reference ?: $fresh->code),
                $fresh->guide_status,
                (string) ($providerResponse['cdr_description'] ?? $providerResponse['external_status'] ?? 'Guia emitida'),
                ['guide_code' => $fresh->code, 'response' => $providerResponse],
                $fresh->dispatch_id,
                $fresh->id
            );
        }

        return $fresh;
    }

    public function buildProviderPayload(ReferralGuide $guide): array
    {
        $guide->loadMissing(['business', 'branch', 'items', 'dispatch', 'commercialOrder']);
        $providerService = app(FacturadorPro5Service::class);

        return [
            'provider' => 'facturadorpro5',
            'mode' => config('facturadorpro5.mode', 'demo'),
            'status' => 'ready',
            'request' => [
                'method' => 'POST',
                'url' => $this->joinProviderUrl((string) config('facturadorpro5.dispatch_endpoint', '/api/dispatches')),
                'headers' => $providerService->previewHeaders(),
                'body' => $this->buildIssueRequestBody($guide),
            ],
        ];
    }

    private function buildCancelPayload(ReferralGuide $guide, ?string $reason = null): array
    {
        $providerService = app(FacturadorPro5Service::class);
        $endpointUrl = $this->referralGuideCancelEndpointUrl();

        return [
            'provider' => 'facturadorpro5',
            'mode' => config('facturadorpro5.mode', 'demo'),
            'status' => 'ready',
            'request' => [
                'method' => 'POST',
                'url' => $endpointUrl,
                'headers' => $providerService->previewHeaders(),
                'body' => $providerService->buildReferralGuideCancelRequestBody($guide, $reason),
            ],
        ];
    }

    public function buildIssueRequestBody(ReferralGuide $guide): array
    {
        $guide->loadMissing(['business', 'branch', 'items', 'dispatch', 'commercialOrder']);
        $issueDate = optional($guide->issue_date)->format('Y-m-d') ?: now()->format('Y-m-d');
        $transferDate = optional($guide->transfer_date)->format('Y-m-d') ?: $issueDate;
        $weight = max(0.001, round((float) $guide->gross_weight, 3));
        $transferMode = $this->mapTransferMode($guide->transfer_mode);
        $reasonCode = $this->mapTransferReason($guide->transfer_reason);

        $body = [
            'serie_documento' => $guide->series ?: (string) config('facturadorpro5.series.guia', self::DEFAULT_SERIES),
            'numero_documento' => $this->normalizeSequenceForProvider($guide->sequence),
            'fecha_de_emision' => $issueDate,
            'hora_de_emision' => now()->format('H:i:s'),
            'codigo_tipo_documento' => '09',
            'datos_del_emisor' => [
                'codigo_del_domicilio_fiscal' => $guide->branch?->establishment_code ?: '0000',
            ],
            'datos_del_cliente_o_receptor' => [
                'codigo_tipo_documento_identidad' => $this->mapIdentityDocumentTypeId($guide->recipient_document_type),
                'numero_documento' => $guide->recipient_document_number ?: '00000000',
                'apellidos_y_nombres_o_razon_social' => $guide->recipient_name ?: 'Cliente',
                'nombre_comercial' => $guide->recipient_name ?: 'Cliente',
                'codigo_pais' => 'PE',
                'ubigeo' => $guide->destination_ubigeo ?: '150101',
                'direccion' => $guide->destination_address ?: '-',
                'telefono' => $guide->recipient_phone,
            ],
            'observaciones' => $guide->observations,
            'codigo_modo_transporte' => $transferMode,
            'codigo_motivo_traslado' => $reasonCode,
            'descripcion_motivo_traslado' => $guide->transfer_reason ?: 'VENTA',
            'fecha_de_traslado' => $transferDate,
            'indicador_de_transbordo' => false,
            'codigo_de_puerto' => null,
            'unidad_peso_total' => 'KGM',
            'peso_total' => $weight,
            'numero_de_bultos' => max(1, (int) $guide->package_count),
            'numero_de_contenedor' => null,
            'numero_de_placa' => $guide->vehicle_plate,
            'direccion_partida' => [
                'ubigeo' => $guide->origin_ubigeo ?: '150101',
                'direccion' => $guide->origin_address ?: '-',
            ],
            'direccion_llegada' => [
                'ubigeo' => $guide->destination_ubigeo ?: '150101',
                'direccion' => $guide->destination_address ?: '-',
            ],
            'transportista' => [
                'codigo_tipo_documento_identidad' => '6',
                'numero_documento' => $guide->business?->tax_number ?: '00000000000',
                'apellidos_y_nombres_o_razon_social' => $guide->business?->name ?: 'KAMARY',
            ],
            'chofer' => [
                'codigo_tipo_documento_identidad' => $this->mapIdentityDocumentTypeId($guide->driver_document_type),
                'numero_documento' => $guide->driver_document_number ?: '00000000',
                'licencia' => $guide->driver_license_number,
            ],
            'items' => $guide->items->where('status', true)->values()->map(function ($item) {
                $quantity = round((float) $item->quantity, 3);
                return [
                    'codigo_interno' => $item->item_code ?: ('ITEM-' . $item->id),
                    'descripcion' => $item->description,
                    'nombre' => $item->description,
                    'codigo_tipo_item' => '01',
                    'codigo_producto_sunat' => '',
                    'unidad_de_medida' => $this->normalizeUnitCode($item->unit),
                    'cantidad' => $quantity,
                    'valor_unitario' => 0,
                    'codigo_tipo_precio' => '01',
                    'precio_unitario' => 0,
                    'codigo_tipo_afectacion_igv' => '20',
                    'total_base_igv' => 0,
                    'porcentaje_igv' => 0,
                    'total_igv' => 0,
                    'total_impuestos' => 0,
                    'total_valor_item' => 0,
                    'total_item' => 0,
                ];
            })->all(),
            'acciones' => [
                'enviar_email' => false,
                'formato_pdf' => 'a4',
            ],
        ];

        if ($transferMode === '01' && trim((string) $guide->driver_name) !== '') {
            $body['transportista'] = [
                'codigo_tipo_documento_identidad' => $this->mapIdentityDocumentTypeId($guide->driver_document_type),
                'numero_documento' => $guide->driver_document_number ?: '00000000',
                'apellidos_y_nombres_o_razon_social' => $guide->driver_name,
            ];
        }

        return $body;
    }

    public function loadGuide(int $id): ReferralGuide
    {
        return ReferralGuide::with([
            'business',
            'branch',
            'warehouse',
            'dispatch',
            'commercialOrder.client',
            'commercialOrder.eventualClient',
            'driver',
            'vehicle',
            'items.article.unit',
        ])->findOrFail($id);
    }

    private function assertReadyForIssue(ReferralGuide $guide): void
    {
        $mode = (string) config('facturadorpro5.mode', 'demo');
        $errors = [];
        $productionFindings = [];

        if (!$guide->business) $errors[] = 'Falta la empresa de la guia.';
        if (trim((string) $guide->series) === '') $errors[] = 'Falta la serie de la guia.';
        if (trim((string) $guide->sequence) === '') $errors[] = 'Falta el correlativo de la guia.';
        if (!$guide->issue_date) $errors[] = 'Falta la fecha de emision de la guia.';
        if (!$guide->transfer_date) $errors[] = 'Falta la fecha de traslado de la guia.';
        if (trim((string) $guide->recipient_name) === '') $errors[] = 'Falta el destinatario de la guia.';
        if (trim((string) $guide->destination_address) === '') $errors[] = 'Falta la direccion de llegada.';
        if (trim((string) $guide->origin_address) === '') $errors[] = 'Falta la direccion de partida.';
        if ($guide->items->where('status', true)->isEmpty()) $errors[] = 'La guia no tiene items activos.';

        if ($guide->business) {
            if (trim((string) $guide->business->tax_number) === '') $productionFindings[] = 'La empresa no tiene RUC.';
            if (($guide->business->facturador_sync_status ?? null) !== 'success') {
                $productionFindings[] = 'La empresa no esta sincronizada con el facturador.';
            }
        }

        if (!$guide->branch) {
            $productionFindings[] = 'Falta la sede fiscal de la guia.';
        } else {
            if (trim((string) $guide->branch->establishment_code) === '') $productionFindings[] = 'La sede no tiene codigo fiscal.';
            if (!$guide->branch->facturador_establishment_id) $productionFindings[] = 'La sede no esta sincronizada como establecimiento fiscal.';
        }

        if (trim((string) $guide->vehicle_plate) === '') $productionFindings[] = 'Falta la placa del vehiculo.';
        if (trim((string) $guide->driver_document_number) === '') $productionFindings[] = 'Falta el documento del conductor.';
        if (trim((string) $guide->driver_license_number) === '') $productionFindings[] = 'Falta la licencia del conductor.';

        if ($mode !== 'demo') {
            $errors = array_merge($errors, $productionFindings);
        }

        $errors = array_values(array_unique(array_filter($errors)));
        if (!empty($errors)) {
            throw new \Exception(implode(' ', $errors));
        }
    }

    private function findReusableGuide(CommercialOrder $order, ?Dispatch $dispatch): ?ReferralGuide
    {
        return ReferralGuide::query()
            ->where('commercial_order_id', $order->id)
            ->where('dispatch_id', $dispatch?->id)
            ->whereNotNull('status')
            ->where('guide_status', '!=', 'cancelled')
            ->first();
    }

    private function syncItems(ReferralGuide $guide, CommercialOrder $order): void
    {
        ReferralGuideItem::where('referral_guide_id', $guide->id)->delete();

        foreach ($order->items->where('status', true) as $item) {
            $presentationUnits = (float)($item->presentation_units ?: 1);
            if ($presentationUnits <= 0) $presentationUnits = 1;
            $weight = round((float) $item->quantity * $presentationUnits * (float) ($item->article?->unit_weight ?? 0), 3);
            ReferralGuideItem::create([
                'referral_guide_id' => $guide->id,
                'commercial_order_item_id' => $item->id,
                'article_id' => $item->article_id,
                'item_code' => $item->article?->code,
                'description' => $item->article?->name ?: 'Articulo',
                'unit' => $item->article?->unit?->symbol ?: ($item->article?->unit?->name ?: 'NIU'),
                'quantity' => $item->quantity,
                'gross_weight' => $weight,
                'metadata' => [
                    'presentation_id' => $item->presentation_id,
                    'presentation_name' => $item->presentation?->name,
                    'warehouse_id' => $item->warehouse_id,
                    'line_total' => $item->total,
                ],
                'status' => true,
            ]);
        }
    }

    private function recordCancellationEvent(ReferralGuide $guide, ?string $reason = null, array $providerResponse = []): void
    {
        if (!$guide->commercialOrder) {
            return;
        }

        $number = $guide->external_reference ?: trim(implode('-', array_filter([$guide->series, $guide->sequence]))) ?: $guide->code;
        app(CommercialOrderTrackingService::class)->record(
            $guide->commercialOrder,
            'referral_guide_cancelled',
            'Guia de remision anulada ' . $number,
            $guide->guide_status,
            $reason ?: 'Guia de remision anulada',
            array_filter([
                'guide_code' => $guide->code,
                'response' => $providerResponse ?: null,
            ]),
            $guide->dispatch_id,
            $guide->id
        );
    }

    private function nextCode(): string
    {
        $next = 1;
        $latest = ReferralGuide::query()->latest('id')->value('code');
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) $next = ((int) $matches[1]) + 1;
        return 'GRE-' . str_pad((string) $next, 6, '0', STR_PAD_LEFT);
    }

    private function nextSequence(string $series): string
    {
        $next = 1;
        $latest = ReferralGuide::query()
            ->where('series', $series)
            ->whereNotNull('sequence')
            ->latest('id')
            ->value('sequence');
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) $next = ((int) $matches[1]) + 1;
        return $this->normalizeSequence((string) $next);
    }

    private function normalizeSequence(?string $sequence): string
    {
        $number = preg_replace('/\D+/', '', (string) $sequence);
        $number = $number === '' ? '1' : $number;
        return str_pad($number, 8, '0', STR_PAD_LEFT);
    }

    private function normalizeSequenceForProvider(?string $sequence): int|string
    {
        $number = ltrim(preg_replace('/\D+/', '', (string) $sequence), '0');
        return $number === '' ? '#' : (int) $number;
    }

    private function joinProviderUrl(string $endpoint): string
    {
        $baseUrl = rtrim((string) config('facturadorpro5.base_url'), '/');
        $endpoint = '/' . ltrim($endpoint, '/');

        if (str_ends_with($baseUrl, '/api') && str_starts_with($endpoint, '/api/')) {
            return $baseUrl . substr($endpoint, 4);
        }

        if (str_ends_with($baseUrl, '/api') && $endpoint === '/api') {
            return $baseUrl;
        }

        return $baseUrl . $endpoint;
    }

    private function referralGuideCancelEndpointUrl(): ?string
    {
        $endpoint = trim((string) config('facturadorpro5.dispatch_cancel_endpoint', ''));
        return $endpoint !== '' ? $this->joinProviderUrl($endpoint) : null;
    }

    private function mapIdentityDocumentTypeId(?string $documentType): string
    {
        $normalized = mb_strtolower(trim((string) $documentType));

        return match ($normalized) {
            'ruc', '6', '06' => '6',
            'dni', '1', '01' => '1',
            'ce', '4', '04' => '4',
            'pasaporte', '7', '07' => '7',
            default => '0',
        };
    }

    private function mapTransferMode(?string $transferMode): string
    {
        $normalized = mb_strtolower(trim((string) $transferMode));
        return in_array($normalized, ['public', 'publico', '01'], true) ? '01' : '02';
    }

    private function mapTransferReason(?string $reason): string
    {
        $normalized = mb_strtolower(trim((string) $reason));

        return match ($normalized) {
            'compra', '02' => '02',
            'venta con entrega a terceros', '14' => '14',
            'traslado entre establecimientos', '04' => '04',
            'devolucion', '07' => '07',
            default => '01',
        };
    }

    private function normalizeUnitCode(?string $unit): string
    {
        $unit = strtoupper(trim((string) $unit));
        if (preg_match('/^[A-Z0-9]{2,4}$/', $unit)) {
            return $unit;
        }

        return 'NIU';
    }

    private function customerName(CommercialOrder $order): ?string
    {
        return $order->client?->full_name ?: $order->eventualClient?->business_name;
    }

    private function customerDocumentType(CommercialOrder $order): ?string
    {
        return $order->client?->document_type ?: $order->eventualClient?->document_type;
    }

    private function customerDocumentNumber(CommercialOrder $order): ?string
    {
        return $order->client?->document_number ?: $order->eventualClient?->document_number;
    }
}
