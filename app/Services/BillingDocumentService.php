<?php

namespace App\Services;

use App\Models\BillingDocument;
use App\Models\BillingDocumentItem;
use App\Models\BillingEvent;
use App\Models\BusinessBranch;
use App\Models\CommercialOrder;
use App\Models\ServiceOrder;
use App\Support\BusinessScope;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;

class BillingDocumentService
{
    public function prepareDocument(BillingDocument $document): BillingDocument
    {
        if ($document->reference_billing_document_id) {
            throw new \Exception('Las notas de credito se generan desde un comprobante existente');
        }

        if ($document->source_type === 'commercial_order') {
            $order = CommercialOrder::with(['items.article', 'client', 'eventualClient', 'business', 'warehouse'])->findOrFail($document->source_id);
            if (!$order->status || in_array($order->order_status, ['draft', 'cancelled'], true)) {
                throw new \Exception('No se puede preparar facturacion para un pedido no aprobado');
            }
            $sourceBranchId = $this->resolveSourceBranchId($order->business, $order->business_branch_id, $order->warehouse);

            $document->fill([
                'commercial_order_id' => $order->id,
                'service_order_id' => null,
                'business_id' => $order->business_id,
                'business_branch_id' => $sourceBranchId,
                'warehouse_id' => $order->warehouse_id,
                'client_id' => $order->client_id,
                'eventual_client_id' => $order->eventual_client_id,
                'issue_date' => $document->issue_date ?: $order->issue_date,
                'due_date' => $document->due_date ?: $order->first_due_date,
                'currency' => $document->currency ?: $order->currency,
                'payment_condition' => $document->payment_condition ?: $order->payment_condition,
                'payment_method' => $document->payment_method ?: $order->payment_method,
                'customer_email' => $document->customer_email ?: ($order->client?->billing_email ?: $order->client?->email ?: $order->eventualClient?->email),
                'subtotal' => $order->subtotal,
                'tax_amount' => $order->tax_amount,
                'total' => $order->total,
                'provider' => $document->provider ?: 'facturadorpro5',
                'provider_endpoint' => rtrim((string) config('facturadorpro5.base_url'), '/') . (string) config('facturadorpro5.issue_endpoint'),
                'provider_mode' => config('facturadorpro5.mode', 'demo'),
                'local_status' => $document->local_status ?: 'pending',
                'external_status' => $document->external_status ?: 'draft',
                'metadata' => array_merge($document->metadata ?? [], [
                    'source_code' => $order->code,
                    'commercial_channel' => $order->commercial_channel,
                    'segment' => $order->segment,
                    'dispatch_contact_name' => $order->dispatch_contact_name,
                    'dispatch_contact_phone' => $order->dispatch_contact_phone,
                    'delivery_address' => $order->delivery_address,
                    'delivery_reference' => $order->delivery_reference,
                    'document_origin' => 'commercial_order',
                ]),
            ]);

            if (!$document->code) $document->code = $this->nextCode();
            if (!$document->series) $document->series = $this->resolveSeries($document->document_type, $document->branch);
            $document->save();

            BillingDocumentItem::where('billing_document_id', $document->id)->delete();
            foreach ($order->items as $item) {
                if (!$item->status) continue;
                BillingDocumentItem::create([
                    'billing_document_id' => $document->id,
                    'commercial_order_item_id' => $item->id,
                    'service_order_item_id' => null,
                    'item_type' => 'article',
                    'item_code' => $item->article?->code,
                    'description' => $item->article?->name ?: 'Articulo',
                    'quantity' => $item->quantity,
                    'unit_price' => $item->price_unit,
                    'total' => $item->total,
                    'metadata' => [
                        'presentation_id' => $item->presentation_id,
                        'presentation_units' => $item->presentation_units,
                        'warehouse_id' => $item->warehouse_id,
                    ],
                    'status' => true,
                ]);
            }
        } elseif ($document->source_type === 'service_order') {
            $order = ServiceOrder::with(['items.service', 'client', 'business'])->findOrFail($document->source_id);
            if (!$order->status || in_array($order->order_status, ['draft', 'cancelled'], true)) {
                throw new \Exception('No se puede preparar facturacion para una orden de servicio no aprobada');
            }
            $sourceBranchId = $this->resolveSourceBranchId($order->business, $order->business_branch_id, null);

            $document->fill([
                'commercial_order_id' => null,
                'service_order_id' => $order->id,
                'business_id' => $order->business_id,
                'business_branch_id' => $sourceBranchId,
                'warehouse_id' => null,
                'client_id' => $order->client_id,
                'eventual_client_id' => null,
                'issue_date' => $document->issue_date ?: $order->issue_date,
                'due_date' => $document->due_date ?: $order->first_due_date,
                'currency' => $document->currency ?: $order->currency,
                'payment_condition' => $document->payment_condition ?: $order->payment_condition,
                'payment_method' => $document->payment_method ?: null,
                'customer_email' => $document->customer_email ?: ($order->client?->billing_email ?: $order->client?->email),
                'subtotal' => $order->subtotal,
                'tax_amount' => $order->tax_amount,
                'total' => $order->total,
                'provider' => $document->provider ?: 'facturadorpro5',
                'provider_endpoint' => rtrim((string) config('facturadorpro5.base_url'), '/') . (string) config('facturadorpro5.issue_endpoint'),
                'provider_mode' => config('facturadorpro5.mode', 'demo'),
                'local_status' => $document->local_status ?: 'pending',
                'external_status' => $document->external_status ?: 'draft',
                'metadata' => array_merge($document->metadata ?? [], [
                    'source_code' => $order->code,
                    'billing_cycle' => $order->billing_cycle,
                    'scheduled_at' => optional($order->scheduled_at)->format('Y-m-d'),
                    'document_origin' => 'service_order',
                ]),
            ]);

            if (!$document->code) $document->code = $this->nextCode();
            if (!$document->series) $document->series = $this->resolveSeries($document->document_type, $document->branch);
            $document->save();

            BillingDocumentItem::where('billing_document_id', $document->id)->delete();
            foreach ($order->items as $item) {
                if (!$item->status) continue;
                BillingDocumentItem::create([
                    'billing_document_id' => $document->id,
                    'commercial_order_item_id' => null,
                    'service_order_item_id' => $item->id,
                    'item_type' => 'service',
                    'item_code' => $item->service?->code,
                    'description' => $item->description ?: ($item->service?->name ?: 'Servicio'),
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'total' => $item->total,
                    'metadata' => [
                        'service_id' => $item->service_id,
                        'detraction_percent' => $item->detraction_percent,
                        'commission_percent' => $item->commission_percent,
                    ],
                    'status' => true,
                ]);
            }
        } else {
            throw new \Exception('Tipo de origen de facturacion no soportado');
        }

        $this->refreshConnectorPayload($document);
        $this->syncSourceBillingStatus($document->fresh());

        return $document->fresh(['business', 'branch', 'warehouse', 'client', 'eventualClient', 'commercialOrder', 'serviceOrder', 'referenceDocument', 'items', 'events', 'creator', 'updater']);
    }

    public function refreshConnectorPayload(BillingDocument $document): BillingDocument
    {
        $payload = $this->buildConnectorPayload($document->fresh(['items', 'client', 'eventualClient', 'commercialOrder', 'serviceOrder', 'referenceDocument']));
        $document->update(['request_payload' => json_encode($payload, JSON_UNESCAPED_UNICODE)]);
        return $document->fresh();
    }

    public function buildConnectorPayload(BillingDocument $document): array
    {
        $document->loadMissing('items', 'client', 'eventualClient', 'business', 'commercialOrder', 'serviceOrder', 'referenceDocument');
        $providerService = app(FacturadorPro5Service::class);

        return [
            'provider' => 'facturadorpro5',
            'mode' => config('facturadorpro5.mode', 'demo'),
            'request' => [
                'method' => 'POST',
                'url' => $this->joinProviderUrl((string) config('facturadorpro5.issue_endpoint')),
                'headers' => $providerService->previewHeaders(),
                'body' => $providerService->buildIssueRequestBody($document),
            ],
        ];
    }

    public function buildCancelPayload(BillingDocument $document, ?string $reason): array
    {
        $providerService = app(FacturadorPro5Service::class);

        return [
            'provider' => 'facturadorpro5',
            'mode' => config('facturadorpro5.mode', 'demo'),
            'request' => [
                'method' => 'POST',
                'url' => $this->joinProviderUrl((string) config('facturadorpro5.cancel_endpoint')),
                'headers' => $providerService->previewHeaders(),
                'body' => $providerService->buildCancelRequestBody($document, $reason),
            ],
        ];
    }

    public function buildFiscalReadiness(BillingDocument $document): array
    {
        $document->loadMissing('items', 'client', 'eventualClient', 'business', 'branch', 'commercialOrder', 'serviceOrder', 'referenceDocument');

        $mode = (string) config('facturadorpro5.mode', 'demo');
        $normalizedType = $this->normalizeDocumentType($document->document_type);
        $isCreditNote = $this->isCreditNoteType($normalizedType);
        $business = $document->business;
        $branch = $document->branch;
        $customer = $document->client ?: $document->eventualClient;
        $activeItems = $document->items->where('status', true)->values();
        $resolvedSeries = trim((string) ($document->series ?: $this->resolveSeries($document->document_type, $branch)));
        $errors = [];
        $warnings = [];

        if (!$document->status) {
            $errors[] = 'El comprobante esta inactivo.';
        }

        if (!$business) {
            $errors[] = 'Falta la empresa del comprobante.';
        }

        if (!$branch) {
            $errors[] = 'Falta la sede del comprobante.';
        }

        if (trim((string) $document->document_type) === '') {
            $errors[] = 'Debes definir el tipo de comprobante.';
        }

        if (!$document->issue_date) {
            $errors[] = 'Debes definir la fecha de emision.';
        }

        if (trim((string) $document->currency) === '') {
            $errors[] = 'Debes definir la moneda del comprobante.';
        }

        if ($resolvedSeries === '') {
            $errors[] = 'No se pudo resolver una serie para el comprobante.';
        } elseif (!$this->hasExplicitSeriesForType($document->document_type, $branch) && trim((string) $document->series) === '') {
            $warnings[] = 'La serie se resolvera con la configuracion global del conector.';
        }

        if ($branch) {
            if (trim((string) ($branch->establishment_code ?? '')) === '') {
                $warnings[] = 'La sede no tiene codigo fiscal configurado.';
            }

            if (trim((string) ($branch->ubigeo ?? '')) === '') {
                $warnings[] = 'La sede no tiene ubigeo configurado.';
            }

            if (trim((string) ($branch->address ?? '')) === '') {
                $warnings[] = 'La sede no tiene direccion fiscal configurada.';
            }
        }

        if ($activeItems->isEmpty()) {
            $errors[] = 'El comprobante no tiene items activos para emitir.';
        } else {
            foreach ($activeItems as $item) {
                if (trim((string) $item->description) === '') {
                    $errors[] = "El item #{$item->id} no tiene descripcion.";
                }

                if ((float) $item->quantity === 0.0) {
                    $errors[] = "El item #{$item->id} no tiene cantidad valida.";
                }

                if ((float) $item->total === 0.0) {
                    $errors[] = "El item #{$item->id} no tiene total valido.";
                }

                if (trim((string) Arr::get($item->metadata, 'unit_code', '')) === '') {
                    $warnings[] = "El item #{$item->id} usara una unidad SUNAT por defecto.";
                }
            }
        }

        if (!$isCreditNote && (float) $document->total <= 0) {
            $errors[] = 'El total del comprobante debe ser mayor a cero.';
        }

        if ($isCreditNote && (float) $document->total >= 0) {
            $errors[] = 'La nota de credito debe tener un total negativo.';
        }

        if (!$customer) {
            $errors[] = 'El comprobante no tiene cliente asociado.';
        } else {
            $customerName = trim((string) ($document->client?->full_name ?: $document->eventualClient?->business_name));
            $customerDocumentType = $this->normalizeIdentityDocumentType($customer->document_type ?? null);
            $customerDocumentNumber = trim((string) ($customer->document_number ?? ''));

            if ($customerName === '') {
                $errors[] = 'El cliente no tiene nombre o razon social.';
            }

            if ($normalizedType === 'factura') {
                if ($customerDocumentType !== 'ruc' || !preg_match('/^\d{11}$/', $customerDocumentNumber)) {
                    $errors[] = 'La factura requiere un cliente con RUC valido de 11 digitos.';
                }
            } elseif ($customerDocumentType !== '' || $customerDocumentNumber !== '') {
                if ($customerDocumentType === '') {
                    $errors[] = 'El cliente tiene numero de documento pero no tipo de documento.';
                } elseif (!$this->isValidIdentityDocumentNumber($customerDocumentType, $customerDocumentNumber)) {
                    $errors[] = 'El documento del cliente no tiene un formato valido para el tipo registrado.';
                }
            }

            if (!$document->client?->ubigeo && !$document->commercialOrder?->ubigeo) {
                $warnings[] = 'El cliente no tiene ubigeo fiscal; se usara 150101 por defecto.';
            }

            if (
                trim((string) ($document->client?->full_address ?: '')) === ''
                && trim((string) ($document->eventualClient?->address ?: '')) === ''
                && trim((string) ($document->commercialOrder?->delivery_address ?: '')) === ''
            ) {
                $warnings[] = 'El cliente no tiene direccion fiscal; el proveedor recibira una direccion generica.';
            }
        }

        if ($isCreditNote) {
            $reference = $document->referenceDocument;
            if (!$reference) {
                $errors[] = 'La nota de credito no tiene comprobante de referencia.';
            } else {
                if ($reference->local_status !== 'accepted') {
                    $errors[] = 'La nota de credito requiere un comprobante de referencia aceptado.';
                }

                if (trim((string) $reference->series) === '' || trim((string) $reference->sequence) === '') {
                    $errors[] = 'El comprobante de referencia no tiene serie y numero completos.';
                }
            }
        }

        if ($this->documentHasDetractionEnabled($document)) {
            $detractionPercent = (float) Arr::get($document->metadata, 'detraction_percent', 0);
            $detractionAmount = (float) Arr::get($document->metadata, 'detraction_amount', 0);

            if ($normalizedType !== 'factura') {
                $errors[] = 'La detraccion solo se debe aplicar a facturas.';
            }

            if ($detractionPercent <= 0) {
                $errors[] = 'La detraccion requiere un porcentaje mayor a cero.';
            }

            if ($detractionAmount <= 0) {
                $errors[] = 'La detraccion requiere un monto calculado mayor a cero.';
            }

            if (!$business || trim((string) $business->detraction_account) === '') {
                $errors[] = 'La detraccion requiere la cuenta de detracciones de la empresa.';
            }

            if (strtoupper((string) $document->currency) !== 'PEN') {
                $warnings[] = 'La detraccion se enviara en soles; revisa la moneda del comprobante.';
            }
        }

        if ($business) {
            $productionFindings = [];

            try {
                app(BusinessFacturadorSyncService::class)->assertBusinessIsReady($business);
            } catch (\Throwable $th) {
                $productionFindings[] = $th->getMessage();
            }

            if (trim((string) $business->facturador_company_id) === '') {
                $productionFindings[] = 'La empresa no tiene identificador fiscal sincronizado.';
            }

            if (($business->facturador_sync_status ?? null) !== 'success') {
                $productionFindings[] = 'La empresa no esta sincronizada con el facturador interno.';
            }

            if ($branch) {
                if (trim((string) ($branch->establishment_code ?? '')) === '') {
                    $productionFindings[] = 'La sede no tiene codigo fiscal configurado.';
                }

                if (!$branch->facturador_establishment_id) {
                    $productionFindings[] = 'La sede no tiene establecimiento sincronizado en el facturador interno.';
                }

                if (($branch->facturador_sync_status ?? null) !== 'success') {
                    $productionFindings[] = 'La sede no esta sincronizada con el facturador interno.';
                }
            }

            if ($mode === 'demo') {
                $warnings = array_merge($warnings, $productionFindings);
            } else {
                $errors = array_merge($errors, $productionFindings);
            }
        }

        $errors = array_values(array_unique(array_filter(array_map(fn($value) => trim((string) $value), $errors))));
        $warnings = array_values(array_unique(array_filter(array_map(fn($value) => trim((string) $value), $warnings))));
        $status = !empty($errors) ? 'blocked' : (!empty($warnings) ? 'warning' : 'ready');

        return [
            'status' => $status,
            'label' => match ($status) {
                'blocked' => 'Bloqueado',
                'warning' => 'Revisar',
                default => 'Listo',
            },
            'can_issue' => empty($errors),
            'mode' => $mode,
            'resolved_series' => $resolvedSeries ?: null,
            'errors' => $errors,
            'warnings' => $warnings,
            'summary' => $this->buildReadinessSummary($status, $errors, $warnings),
        ];
    }

    public function issueDocument(BillingDocument $document): BillingDocument
    {
        if (!$document->status) throw new \Exception('El comprobante esta inactivo');
        if ($document->local_status === 'accepted') throw new \Exception('El comprobante ya fue emitido');
        if ($document->local_status === 'cancelled') throw new \Exception('No puedes emitir un comprobante anulado');

        $document = $this->prepareIfNeeded($document);
        if (!$document->sequence) {
            $document->update(['sequence' => $this->nextSequence($document)]);
            $document = $document->fresh();
        }

        $this->assertReadyForIssue($document);
        $payload = $this->buildConnectorPayload($document);
        $providerResponse = app(FacturadorPro5Service::class)->issue($document, $payload);

        return $this->applyProviderSuccess(
            $document,
            $payload,
            $providerResponse,
            'issued',
            rtrim((string) config('facturadorpro5.base_url'), '/') . (string) config('facturadorpro5.issue_endpoint')
        );
    }

    public function prepareVoucher(BillingDocument $document, array $options = []): BillingDocument
    {
        if (!$document->status) throw new \Exception('El comprobante esta inactivo');
        if ($document->local_status !== 'pending') throw new \Exception('Solo puedes preparar comprobantes pendientes');

        $document = $this->prepareIfNeeded($document);
        $updates = [];
        $metadata = $this->buildDetractionMetadata($document, $options);
        if ($metadata !== null) {
            $updates['metadata'] = $metadata;
        }

        if (!$document->series) {
            $document->loadMissing('branch');
            $updates['series'] = $this->resolveSeries($document->document_type, $document->branch);
        }

        if (!$document->sequence) {
            $sequenceDocument = $updates ? tap($document->replicate(), function ($replica) use ($document, $updates) {
                $replica->id = $document->id;
                $replica->exists = true;
                $replica->fill($updates);
            }) : $document;
            $updates['sequence'] = $this->nextSequence($sequenceDocument);
        }

        if ($updates) {
            $updates['updated_by'] = Auth::id();
            $document->update($updates);
            $document = $document->fresh(['items', 'client', 'eventualClient', 'business', 'branch', 'serviceOrder', 'commercialOrder', 'referenceDocument']);
            $this->refreshConnectorPayload($document);
        }

        $fresh = $document->fresh();
        $this->registerEvent($fresh, 'prepared_voucher', [
            'local_status' => $fresh->local_status,
            'external_status' => $fresh->external_status,
            'message' => 'Comprobante preparado con serie y secuencia',
        ]);

        return $fresh->fresh(['business', 'branch', 'warehouse', 'client', 'eventualClient', 'commercialOrder', 'serviceOrder', 'referenceDocument', 'items', 'events', 'creator', 'updater']);
    }

    public function cancelDocument(BillingDocument $document, ?string $reason = null): BillingDocument
    {
        if (!$document->status) throw new \Exception('El comprobante esta inactivo');
        if ($document->local_status !== 'accepted') throw new \Exception('Solo puedes anular comprobantes aceptados');
        if (mb_strtolower(trim((string) $document->document_type)) === 'nota de credito') {
            throw new \Exception('La nota de credito no se anula desde este flujo');
        }

        $payload = $this->buildCancelPayload($document, $reason);
        $providerResponse = app(FacturadorPro5Service::class)->cancel($document, $payload);
        $localStatus = (string) ($providerResponse['local_status'] ?? 'cancelled');

        $document->update([
            'local_status' => $localStatus,
            'external_status' => (string) ($providerResponse['external_status'] ?? 'cancelled'),
            'provider_endpoint' => rtrim((string) config('facturadorpro5.base_url'), '/') . (string) config('facturadorpro5.cancel_endpoint'),
            'provider_mode' => config('facturadorpro5.mode', 'demo'),
            'response_payload' => json_encode($providerResponse, JSON_UNESCAPED_UNICODE),
            'error_message' => null,
            'cancelled_at' => $localStatus === 'cancelled' ? now() : null,
            'updated_by' => Auth::id(),
            'metadata' => array_merge($document->metadata ?? [], [
                'cancel_reason' => $reason ?: 'Anulacion operativa',
                'voided_ticket' => $providerResponse['ticket'] ?? null,
                'voided_external_id' => $providerResponse['voided_external_id'] ?? null,
            ]),
        ]);

        $fresh = $document->fresh();
        $this->registerEvent($fresh, 'cancelled', [
            'local_status' => $fresh->local_status,
            'external_status' => $fresh->external_status,
            'request_payload' => $payload,
            'response_payload' => $providerResponse,
            'message' => $reason ?: 'Comprobante anulado',
        ]);
        $this->syncSourceBillingStatus($fresh);

        return $fresh->fresh(['business', 'branch', 'warehouse', 'client', 'eventualClient', 'commercialOrder', 'serviceOrder', 'referenceDocument', 'items', 'events', 'creator', 'updater']);
    }

    public function syncProviderStatus(BillingDocument $document): BillingDocument
    {
        $providerService = app(FacturadorPro5Service::class);
        $providerResponse = $providerService->status($document);
        $localStatus = (string) ($providerResponse['local_status'] ?? $document->local_status);

        $document->update([
            'local_status' => $localStatus,
            'external_status' => (string) ($providerResponse['external_status'] ?? $document->external_status),
            'external_id' => (string) ($providerResponse['external_id'] ?? $document->external_id),
            'external_reference' => (string) ($providerResponse['external_reference'] ?? $document->external_reference),
            'provider_endpoint' => (string) ($providerResponse['provider_endpoint'] ?? $providerService->resolveEndpointUrl((string) config('facturadorpro5.status_endpoint'))),
            'provider_mode' => config('facturadorpro5.mode', 'demo'),
            'response_payload' => json_encode($providerResponse, JSON_UNESCAPED_UNICODE),
            'error_message' => null,
            'sent_at' => $document->sent_at ?: (in_array($localStatus, ['sent', 'accepted', 'observed', 'rejected', 'cancelled'], true) ? now() : null),
            'accepted_at' => $localStatus === 'accepted' ? ($document->accepted_at ?: now()) : $document->accepted_at,
            'cancelled_at' => $localStatus === 'cancelled' ? ($document->cancelled_at ?: now()) : $document->cancelled_at,
            'updated_by' => Auth::id(),
            'metadata' => array_merge($document->metadata ?? [], [
                'last_provider_sync_at' => now()->toIso8601String(),
            ]),
        ]);

        $fresh = $document->fresh();
        $this->registerEvent($fresh, 'provider_status_synced', [
            'local_status' => $fresh->local_status,
            'external_status' => $fresh->external_status,
            'request_payload' => [
                'provider' => 'facturadorpro5',
                'mode' => config('facturadorpro5.mode', 'demo'),
                'request' => [
                    'method' => 'POST',
                    'url' => $providerResponse['provider_endpoint'] ?? $providerService->resolveEndpointUrl((string) config('facturadorpro5.status_endpoint')),
                    'headers' => $providerService->previewHeaders(),
                    'body' => $providerResponse['request_echo'] ?? [],
                ],
            ],
            'response_payload' => $providerResponse,
            'message' => $providerResponse['external_status'] ?? 'Estado sincronizado con el proveedor',
        ]);
        $this->syncSourceBillingStatus($fresh);

        return $fresh->fresh(['business', 'branch', 'warehouse', 'client', 'eventualClient', 'commercialOrder', 'serviceOrder', 'referenceDocument', 'items', 'events', 'creator', 'updater']);
    }

    public function createCreditNote(BillingDocument $reference, array $data = []): BillingDocument
    {
        $reference->loadMissing('business', 'branch', 'warehouse');
        if (!$reference->status) throw new \Exception('El comprobante de referencia esta inactivo');
        if ($reference->local_status !== 'accepted') throw new \Exception('Solo puedes generar nota de credito desde un comprobante aceptado');
        if (mb_strtolower(trim((string) $reference->document_type)) === 'nota de credito') {
            throw new \Exception('No puedes generar nota de credito sobre otra nota de credito');
        }
        $referenceBranchId = $this->resolveSourceBranchId($reference->business, $reference->business_branch_id, $reference->warehouse);

        $issueDate = $data['issue_date'] ?? now()->toDateString();
        $document = BillingDocument::create([
            'code' => $this->nextCode(),
            'source_type' => $reference->source_type,
            'source_id' => $reference->source_id,
            'commercial_order_id' => $reference->commercial_order_id,
            'service_order_id' => $reference->service_order_id,
            'reference_billing_document_id' => $reference->id,
            'business_id' => $reference->business_id,
            'business_branch_id' => $referenceBranchId,
            'warehouse_id' => $reference->warehouse_id,
            'client_id' => $reference->client_id,
            'eventual_client_id' => $reference->eventual_client_id,
            'provider' => $reference->provider ?: 'facturadorpro5',
            'document_type' => 'Nota de credito',
            'series' => $data['series'] ?? $this->resolveSeries('nota de credito', $reference->branch),
            'sequence' => $this->nextSequence((new BillingDocument([
                'series' => $data['series'] ?? $this->resolveSeries('nota de credito', $reference->branch),
                'document_type' => 'Nota de credito',
            ]))),
            'issue_date' => $issueDate,
            'due_date' => $issueDate,
            'currency' => $reference->currency,
            'payment_condition' => $reference->payment_condition,
            'payment_method' => $reference->payment_method,
            'customer_email' => $reference->customer_email,
            'provider_endpoint' => rtrim((string) config('facturadorpro5.base_url'), '/') . (string) config('facturadorpro5.credit_note_endpoint', config('facturadorpro5.issue_endpoint')),
            'provider_mode' => config('facturadorpro5.mode', 'demo'),
            'subtotal' => -abs((float) $reference->subtotal),
            'tax_amount' => -abs((float) $reference->tax_amount),
            'total' => -abs((float) $reference->total),
            'local_status' => 'pending',
            'external_status' => 'draft',
            'metadata' => array_merge($reference->metadata ?? [], [
                'credit_note_reason' => $data['reason'] ?? 'Anulacion de la operacion',
                'credit_note_note' => $data['note'] ?? null,
                'credit_note_type' => 'full',
            ]),
            'observations' => $data['note'] ?? $reference->observations,
            'status' => true,
            'created_by' => Auth::id(),
            'updated_by' => Auth::id(),
        ]);

        foreach ($reference->items()->where('status', 1)->get() as $item) {
            BillingDocumentItem::create([
                'billing_document_id' => $document->id,
                'commercial_order_item_id' => $item->commercial_order_item_id,
                'service_order_item_id' => $item->service_order_item_id,
                'item_type' => $item->item_type,
                'item_code' => $item->item_code,
                'description' => $item->description,
                'quantity' => -abs((float) $item->quantity),
                'unit_price' => $item->unit_price,
                'total' => -abs((float) $item->total),
                'metadata' => $item->metadata,
                'status' => true,
            ]);
        }

        $document = $this->refreshConnectorPayload($document);
        $this->assertReadyForIssue($document);
        $payload = $this->buildConnectorPayload($document->fresh(['items', 'client', 'eventualClient', 'commercialOrder', 'serviceOrder', 'referenceDocument']));
        $providerResponse = app(FacturadorPro5Service::class)->creditNote($document, $payload);

        return $this->applyProviderSuccess(
            $document,
            $payload,
            $providerResponse,
            'credit_note_issued',
            rtrim((string) config('facturadorpro5.base_url'), '/') . (string) config('facturadorpro5.credit_note_endpoint', config('facturadorpro5.issue_endpoint'))
        );
    }

    public function registerEvent(BillingDocument $document, string $eventType, array $data = []): BillingEvent
    {
        return BillingEvent::create([
            'billing_document_id' => $document->id,
            'event_type' => $eventType,
            'local_status' => $data['local_status'] ?? $document->local_status,
            'external_status' => $data['external_status'] ?? $document->external_status,
            'request_payload' => isset($data['request_payload']) ? json_encode($data['request_payload'], JSON_UNESCAPED_UNICODE) : null,
            'response_payload' => isset($data['response_payload']) ? json_encode($data['response_payload'], JSON_UNESCAPED_UNICODE) : null,
            'message' => $data['message'] ?? null,
            'status' => true,
            'created_by' => Auth::id(),
            'updated_by' => Auth::id(),
        ]);
    }

    public function syncSourceBillingStatus(BillingDocument $document): void
    {
        if ($document->source_type === 'commercial_order' && $document->commercial_order_id) {
            $order = CommercialOrder::find($document->commercial_order_id);
            if ($order) $this->syncAggregateBillingStatus('commercial_order', $order);
            return;
        }

        if ($document->source_type === 'service_order' && $document->service_order_id) {
            $order = ServiceOrder::find($document->service_order_id);
            if ($order) $this->syncAggregateBillingStatus('service_order', $order);
        }
    }

    private function syncAggregateBillingStatus(string $sourceType, CommercialOrder|ServiceOrder $order): void
    {
        $documents = BillingDocument::query()
            ->where('source_type', $sourceType)
            ->where('source_id', $order->id)
            ->where('status', 1)
            ->get();

        if ($documents->isEmpty()) {
            $order->update(['billing_status' => 'pending', 'billed_at' => null]);
            return;
        }

        $acceptedTotal = round((float) $documents->where('local_status', 'accepted')->sum('total'), 2);
        $hasNonCancelled = $documents->contains(fn($row) => $row->local_status !== 'cancelled');
        $hasAcceptedCreditNote = $documents->contains(function ($row) {
            return $row->local_status === 'accepted'
                && in_array(mb_strtolower(trim((string) $row->document_type)), ['nota de credito', 'nota_credito', 'credit_note'], true);
        });
        $nextStatus = 'pending';
        $billedAt = null;

        if (!$hasNonCancelled) {
            $nextStatus = 'cancelled';
        } elseif ($acceptedTotal <= 0 && $hasAcceptedCreditNote) {
            $nextStatus = 'cancelled';
        } elseif ($acceptedTotal > 0 && $acceptedTotal + 0.0001 < (float) $order->total) {
            $nextStatus = 'partial';
        } elseif ($acceptedTotal > 0 && $acceptedTotal + 0.0001 >= (float) $order->total) {
            $nextStatus = 'billed';
            $billedAt = Carbon::now();
        }

        $order->update(['billing_status' => $nextStatus, 'billed_at' => $billedAt]);
    }

    private function prepareIfNeeded(BillingDocument $document): BillingDocument
    {
        $document->loadMissing('items');
        if (
            $document->items->isEmpty()
            || (
                $document->local_status === 'pending'
                && in_array($document->source_type, ['commercial_order', 'service_order'], true)
            )
        ) {
            return $this->prepareDocument($document);
        }

        return $this->refreshConnectorPayload($document);
    }

    private function applyProviderSuccess(BillingDocument $document, array $payload, array $providerResponse, string $eventType, string $endpoint): BillingDocument
    {
        $localStatus = (string) ($providerResponse['local_status'] ?? 'accepted');
        $sentAt = in_array($localStatus, ['sent', 'accepted', 'observed', 'rejected'], true) ? now() : null;
        $acceptedAt = $localStatus === 'accepted' ? now() : null;

        $document->update([
            'local_status' => $localStatus,
            'external_status' => (string) ($providerResponse['external_status'] ?? 'accepted'),
            'external_id' => (string) ($providerResponse['external_id'] ?? ('FP5-' . $document->code)),
            'external_reference' => (string) ($providerResponse['external_reference'] ?? ('SUNAT-' . $document->code)),
            'provider_endpoint' => $endpoint,
            'provider_mode' => config('facturadorpro5.mode', 'demo'),
            'request_payload' => json_encode($payload, JSON_UNESCAPED_UNICODE),
            'response_payload' => json_encode($providerResponse, JSON_UNESCAPED_UNICODE),
            'error_message' => null,
            'sent_at' => $sentAt,
            'accepted_at' => $acceptedAt,
            'updated_by' => Auth::id(),
        ]);

        $fresh = $document->fresh();
        $this->registerEvent($fresh, $eventType, [
            'local_status' => $fresh->local_status,
            'external_status' => $fresh->external_status,
            'request_payload' => $payload,
            'response_payload' => $providerResponse,
            'message' => $providerResponse['external_status'] ?? 'Respuesta del proveedor recibida correctamente',
        ]);
        $this->syncSourceBillingStatus($fresh);

        return $fresh->fresh(['business', 'branch', 'warehouse', 'client', 'eventualClient', 'commercialOrder', 'serviceOrder', 'referenceDocument', 'items', 'events', 'creator', 'updater']);
    }

    private function resolveSourceBranchId($business, $branchId, $warehouse = null): int
    {
        if (!$business) {
            throw new \Exception('Falta la empresa del origen de facturacion');
        }

        if ($warehouse) {
            return BusinessScope::branchIdFromWarehouse($business, $warehouse, $branchId);
        }

        $branch = BusinessScope::requireBranchForBusiness($business, $branchId);
        return (int) $branch->id;
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

    private function buildDetractionMetadata(BillingDocument $document, array $options): ?array
    {
        $trackedKeys = ['detraction_enabled', 'detraction_percent', 'detraction_amount', 'detraction_code', 'detraction_payment_method_code'];
        $hasDetractionInput = false;
        foreach ($trackedKeys as $key) {
            if (array_key_exists($key, $options)) {
                $hasDetractionInput = true;
                break;
            }
        }

        if (!$hasDetractionInput) {
            return null;
        }

        $metadata = $document->metadata ?? [];
        $enabled = $this->boolValue($options['detraction_enabled'] ?? Arr::get($metadata, 'detraction_enabled'), false);
        $code = (string) ($options['detraction_code'] ?? Arr::get($metadata, 'detraction_code', '022'));
        $paymentMethodCode = (string) ($options['detraction_payment_method_code'] ?? Arr::get($metadata, 'detraction_payment_method_code', '001'));

        if (!$enabled) {
            return array_merge($metadata, [
                'detraction_enabled' => false,
                'detraction_percent' => null,
                'detraction_amount' => null,
                'detraction_code' => $code ?: '022',
                'detraction_payment_method_code' => $paymentMethodCode ?: '001',
            ]);
        }

        $percent = $this->decimalValue($options['detraction_percent'] ?? Arr::get($metadata, 'detraction_percent'));
        if ($percent <= 0) {
            $percent = $this->maxItemDetractionPercent($document);
        }
        if ($percent <= 0) {
            $percent = 12;
        }

        $amount = $this->decimalValue($options['detraction_amount'] ?? Arr::get($metadata, 'detraction_amount'));
        if ($amount <= 0) {
            $amount = round(abs((float) $document->total) * $percent / 100, 2);
        }

        return array_merge($metadata, [
            'detraction_enabled' => true,
            'detraction_percent' => round($percent, 2),
            'detraction_amount' => round($amount, 2),
            'detraction_code' => $code ?: '022',
            'detraction_payment_method_code' => $paymentMethodCode ?: '001',
        ]);
    }

    private function documentHasDetractionEnabled(BillingDocument $document): bool
    {
        return $this->boolValue(Arr::get($document->metadata ?? [], 'detraction_enabled'), false);
    }

    private function maxItemDetractionPercent(BillingDocument $document): float
    {
        $document->loadMissing('items');

        return (float) $document->items
            ->where('status', true)
            ->reduce(fn($carry, $item) => max((float) $carry, $this->decimalValue(Arr::get($item->metadata, 'detraction_percent'))), 0);
    }

    private function boolValue($value, bool $fallback = false): bool
    {
        $parsed = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        return $parsed === null ? $fallback : $parsed;
    }

    private function decimalValue($value, float $fallback = 0): float
    {
        if ($value === null || $value === '') {
            return $fallback;
        }

        $normalized = str_replace(',', '.', (string) $value);
        return is_numeric($normalized) ? (float) $normalized : $fallback;
    }

    private function assertReadyForIssue(BillingDocument $document): void
    {
        $readiness = $this->buildFiscalReadiness($document);
        if ($readiness['can_issue']) {
            return;
        }

        throw new \RuntimeException('No se puede emitir el comprobante: ' . implode(' | ', $readiness['errors']));
    }

    private function buildReadinessSummary(string $status, array $errors, array $warnings): string
    {
        if ($status === 'blocked') {
            return implode(' | ', array_slice($errors, 0, 2));
        }

        if ($status === 'warning') {
            return implode(' | ', array_slice($warnings, 0, 2));
        }

        return 'Listo para emitir';
    }

    private function hasExplicitSeriesForType(string $documentType, ?BusinessBranch $branch = null): bool
    {
        if (!$branch) {
            return false;
        }

        $normalized = $this->normalizeDocumentType($documentType);

        return match ($normalized) {
            'boleta' => trim((string) $branch->series_boleta) !== '',
            'nota de credito' => trim((string) $branch->series_nota_credito) !== '',
            default => trim((string) $branch->series_factura) !== '',
        };
    }

    private function normalizeDocumentType(?string $documentType): string
    {
        $normalized = mb_strtolower(trim((string) $documentType));

        return match ($normalized) {
            'nota_credito', 'credit_note' => 'nota de credito',
            default => $normalized,
        };
    }

    private function isCreditNoteType(string $documentType): bool
    {
        return $documentType === 'nota de credito';
    }

    private function normalizeIdentityDocumentType(?string $documentType): string
    {
        $normalized = mb_strtolower(trim((string) $documentType));

        return match ($normalized) {
            'ruc', '6', '06' => 'ruc',
            'dni', '1', '01' => 'dni',
            'ce', '4', '04' => 'ce',
            'pasaporte', '7', '07' => 'pasaporte',
            default => '',
        };
    }

    private function isValidIdentityDocumentNumber(string $documentType, string $documentNumber): bool
    {
        $documentNumber = trim($documentNumber);
        if ($documentNumber === '') {
            return false;
        }

        return match ($documentType) {
            'ruc' => (bool) preg_match('/^\d{11}$/', $documentNumber),
            'dni' => (bool) preg_match('/^\d{8}$/', $documentNumber),
            'ce', 'pasaporte' => mb_strlen($documentNumber) >= 6,
            default => false,
        };
    }

    private function resolveSeries(string $documentType, ?BusinessBranch $branch = null): string
    {
        $normalized = $this->normalizeDocumentType($documentType);

        if ($normalized === 'boleta' && $branch?->series_boleta) return (string) $branch->series_boleta;
        if (in_array($normalized, ['nota de credito', 'nota_credito', 'credit_note'], true) && $branch?->series_nota_credito) return (string) $branch->series_nota_credito;
        if ($branch?->series_factura && !in_array($normalized, ['boleta', 'nota de credito', 'nota_credito', 'credit_note'], true)) return (string) $branch->series_factura;

        if ($normalized === 'boleta') return (string) config('facturadorpro5.series.boleta', 'B001');
        if (in_array($normalized, ['nota de credito', 'nota_credito', 'credit_note'], true)) return (string) config('facturadorpro5.series.nota_credito', 'FC01');
        return (string) config('facturadorpro5.series.factura', 'F001');
    }

    private function nextCode(): string
    {
        $next = 1;
        $latest = BillingDocument::query()->latest('id')->value('code');
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) $next = ((int) $matches[1]) + 1;
        return 'FAC-' . str_pad((string) $next, 6, '0', STR_PAD_LEFT);
    }

    private function nextSequence(BillingDocument $document): string
    {
        $series = trim((string) $document->series);
        $query = BillingDocument::query()->where('series', $series);
        if ($document->id) $query->where('id', '!=', $document->id);

        $max = 0;
        foreach ($query->pluck('sequence') as $sequence) {
            if ($sequence && preg_match('/(\d+)$/', (string) $sequence, $matches)) {
                $max = max($max, (int) $matches[1]);
            }
        }

        return str_pad((string) ($max + 1), 8, '0', STR_PAD_LEFT);
    }
}
