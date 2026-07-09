<?php

namespace App\Services;

use App\Models\BusinessBranch;
use App\Models\BillingDocument;
use App\Models\Business;
use App\Models\ReferralGuide;
use App\Support\BusinessScope;
use App\Support\SimpleQrCode;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class FacturadorPro5Service
{
    private ?Business $contextBusiness = null;

    /**
     * Cada empresa puede tener su propio tenant del facturador (monoempresa);
     * el contexto define base_url/credenciales, con fallback a la config global.
     */
    public function forBusiness(?Business $business): self
    {
        $this->contextBusiness = $business;
        return $this;
    }

    private function useDocumentContext(BillingDocument $document): void
    {
        $document->loadMissing('business');
        if ($document->business) {
            $this->contextBusiness = $document->business;
        }
    }

    private function useGuideContext(ReferralGuide $guide): void
    {
        $guide->loadMissing('business');
        if ($guide->business) {
            $this->contextBusiness = $guide->business;
        }
    }

    private function connectionValue(string $key): ?string
    {
        $override = trim((string) ($this->contextBusiness?->{'facturador_' . $key} ?? ''));
        if ($override !== '') {
            return $override;
        }

        $value = config('facturadorpro5.' . $key);
        return $value === null || $value === '' ? null : (string) $value;
    }

    public function issue(BillingDocument $document, array $payload): array
    {
        $this->useDocumentContext($document);
        if ($this->usesDemoMode()) {
            return $this->demoIssueResponse($document, $payload);
        }

        $requestBody = Arr::get($payload, 'request.body', []);
        $response = $this->requestJson('POST', (string) config('facturadorpro5.issue_endpoint'), $requestBody, true);

        return $this->normalizeDocumentResponse($document, $response, 'issue', $requestBody);
    }

    public function issueReferralGuide(ReferralGuide $guide, array $payload): array
    {
        $this->useGuideContext($guide);
        if ($this->usesDemoMode()) {
            return $this->demoReferralGuideResponse($guide, $payload);
        }

        $requestBody = Arr::get($payload, 'request.body', []);
        $response = $this->requestJson('POST', (string) config('facturadorpro5.dispatch_endpoint', '/api/dispatches'), $requestBody, true);

        return $this->normalizeReferralGuideResponse($guide, $response, $requestBody);
    }

    public function cancel(BillingDocument $document, array $payload): array
    {
        $this->useDocumentContext($document);
        if ($this->usesDemoMode()) {
            return $this->demoCancelResponse($document, $payload);
        }

        $requestBody = Arr::get($payload, 'request.body', []);
        $response = $this->requestJson('POST', (string) config('facturadorpro5.cancel_endpoint'), $requestBody, true);

        return [
            'success' => (bool) ($response['success'] ?? false),
            'provider' => 'facturadorpro5',
            'mode' => $this->mode(),
            'operation' => 'voided',
            'local_status' => 'cancelled',
            'external_status' => 'Anulado',
            'external_id' => $document->external_id ?: ('FP5-' . $document->code),
            'external_reference' => $document->external_reference,
            'ticket' => Arr::get($response, 'data.ticket'),
            'voided_external_id' => Arr::get($response, 'data.external_id'),
            'request_echo' => $requestBody,
            'response' => $response,
        ];
    }

    public function cancelReferralGuide(ReferralGuide $guide, array $payload): array
    {
        $this->useGuideContext($guide);
        if ($this->usesDemoMode()) {
            return $this->demoReferralGuideCancelResponse($guide, $payload);
        }

        $requestBody = Arr::get($payload, 'request.body', []);
        $endpoint = trim((string) config('facturadorpro5.dispatch_cancel_endpoint', ''));
        if ($endpoint === '') {
            throw new \RuntimeException('El facturador hijo no expone aun un endpoint de anulacion fiscal para guias de remision. Configura FACTURADORPRO5_DISPATCH_CANCEL_ENDPOINT cuando ese endpoint exista.');
        }

        $response = $this->requestJson('POST', $endpoint, $requestBody, true);

        return [
            'success' => (bool) ($response['success'] ?? false),
            'provider' => 'facturadorpro5',
            'mode' => $this->mode(),
            'operation' => 'dispatch_voided',
            'local_status' => 'cancelled',
            'external_status' => 'Anulado',
            'external_id' => $guide->external_id ?: ('FP5-GRE-' . $guide->code),
            'external_reference' => $guide->external_reference,
            'ticket' => Arr::get($response, 'data.ticket'),
            'voided_external_id' => Arr::get($response, 'data.external_id'),
            'request_echo' => $requestBody,
            'response' => $response,
        ];
    }

    public function creditNote(BillingDocument $document, array $payload): array
    {
        $this->useDocumentContext($document);
        if ($this->usesDemoMode()) {
            return $this->demoCreditNoteResponse($document, $payload);
        }

        $requestBody = Arr::get($payload, 'request.body', []);
        $response = $this->requestJson('POST', (string) config('facturadorpro5.credit_note_endpoint'), $requestBody, true);

        return $this->normalizeDocumentResponse($document, $response, 'credit_note', $requestBody);
    }

    public function status(BillingDocument $document): array
    {
        $this->useDocumentContext($document);
        if ($this->usesDemoMode()) {
            $decoded = $this->decodeJson($document->response_payload);

            return [
                'success' => true,
                'provider' => 'facturadorpro5',
                'mode' => $this->mode(),
                'operation' => 'status',
                'local_status' => $document->local_status,
                'external_status' => $document->external_status,
                'external_id' => $document->external_id,
                'external_reference' => $document->external_reference,
                'links' => Arr::get($decoded, 'links', []),
                'request_echo' => [],
                'provider_endpoint' => $this->makeUrl((string) config('facturadorpro5.status_endpoint')),
                'response' => $decoded,
            ];
        }

        if ($this->shouldUseVoidedStatus($document)) {
            $requestBody = $this->buildCancelStatusRequestBody($document);
            $endpoint = (string) config('facturadorpro5.cancel_status_endpoint');
            $response = $this->requestJson('POST', $endpoint, $requestBody, true);

            return [
                'success' => (bool) ($response['success'] ?? false),
                'provider' => 'facturadorpro5',
                'mode' => $this->mode(),
                'operation' => 'voided_status',
                'local_status' => (bool) ($response['success'] ?? false) ? 'cancelled' : $document->local_status,
                'external_status' => (bool) ($response['success'] ?? false) ? 'Anulado' : $document->external_status,
                'external_id' => (string) Arr::get($response, 'data.external_id', (Arr::get($document->metadata, 'voided_external_id') ?: $document->external_id)),
                'external_reference' => $document->external_reference,
                'filename' => (string) Arr::get($response, 'data.filename', ''),
                'ticket' => (string) Arr::get($requestBody, 'ticket', Arr::get($document->metadata, 'voided_ticket', '')),
                'state_type_id' => (bool) ($response['success'] ?? false) ? '11' : null,
                'links' => Arr::get($response, 'links', []),
                'request_echo' => $requestBody,
                'provider_endpoint' => $this->makeUrl($endpoint),
                'response' => Arr::get($response, 'response', $response),
            ];
        }

        $requestBody = $this->buildStatusRequestBody($document);
        $endpoint = (string) config('facturadorpro5.status_endpoint');
        $response = $this->requestJson('POST', $endpoint, $requestBody, true);
        $stateTypeId = (string) Arr::get($response, 'data.status_id', '');

        return [
            'success' => (bool) ($response['success'] ?? false),
            'provider' => 'facturadorpro5',
            'mode' => $this->mode(),
            'operation' => 'status',
            'local_status' => $this->mapStateTypeToLocalStatus($stateTypeId),
            'external_status' => (string) Arr::get($response, 'data.status', $document->external_status),
            'external_id' => (string) Arr::get($response, 'data.external_id', $document->external_id),
            'external_reference' => (string) Arr::get($response, 'data.number', $document->external_reference),
            'filename' => (string) Arr::get($response, 'data.filename', ''),
            'state_type_id' => $stateTypeId,
            'links' => Arr::get($response, 'links', []),
            'qr' => Arr::get($response, 'data.qr'),
            'number_to_letter' => Arr::get($response, 'data.number_to_letter'),
            'request_echo' => $requestBody,
            'provider_endpoint' => $this->makeUrl($endpoint),
            'response' => $response,
        ];
    }

    public function downloadFile(BillingDocument $document, string $type): array
    {
        $this->useDocumentContext($document);
        $type = strtolower(trim($type));
        if (!in_array($type, ['pdf', 'xml', 'cdr'], true)) {
            throw new \InvalidArgumentException('Tipo de archivo no soportado');
        }

        $stored = $this->decodeJson($document->response_payload);
        if ($type === 'pdf' && $this->shouldServeLocalPdf($document, $stored)) {
            return $this->buildLocalPdfFile($document);
        }

        try {
            $status = $this->status($document);
        } catch (\Throwable $th) {
            if ($type === 'pdf' && $this->canBuildLocalPdf($document, $stored)) {
                return $this->buildLocalPdfFile($document);
            }

            throw $th;
        }

        $downloadUrl = Arr::get($status, "links.{$type}");
        if (!$downloadUrl) {
            $downloadUrl = Arr::get($stored, "links.{$type}");
        }

        if (!$downloadUrl) {
            if ($type === 'pdf' && $this->canBuildLocalPdf($document, $stored, $status)) {
                return $this->buildLocalPdfFile($document);
            }
            throw new \RuntimeException("El proveedor no devolvio enlace para {$type}");
        }

        $response = $this->requestBinary($downloadUrl, true);
        $contentType = $response->header('Content-Type') ?: $this->fallbackContentType($type);
        $disposition = $response->header('Content-Disposition');
        $filename = $this->resolveDownloadFilename($type, $document, $downloadUrl, $disposition);

        return [
            'content' => $response->body(),
            'content_type' => $contentType,
            'filename' => $filename,
        ];
    }

    public function downloadReferralGuideFile(ReferralGuide $guide, string $type): array
    {
        $this->useGuideContext($guide);
        $type = strtolower(trim($type));
        if (!in_array($type, ['pdf', 'xml', 'cdr'], true)) {
            throw new \InvalidArgumentException('Tipo de archivo no soportado');
        }

        $stored = $this->decodeJson($guide->response_payload);
        $downloadUrl = Arr::get($stored, "links.{$type}");
        if (!$downloadUrl) {
            throw new \RuntimeException("El proveedor no devolvio enlace para {$type}");
        }

        $response = $this->requestBinary($downloadUrl, true);
        $contentType = $response->header('Content-Type') ?: $this->fallbackContentType($type);
        $disposition = $response->header('Content-Disposition');
        $filename = $this->resolveReferralGuideDownloadFilename($type, $guide, $downloadUrl, $disposition);

        return [
            'content' => $response->body(),
            'content_type' => $contentType,
            'filename' => $filename,
        ];
    }

    public function resolveEndpointUrl(string $endpoint): string
    {
        return $this->makeUrl($endpoint);
    }

    public function companyRecord(): array
    {
        return $this->requestJson('GET', (string) config('facturadorpro5.company_endpoint') . '/record', [], true);
    }

    public function syncCompany(array $payload): array
    {
        return $this->requestJson('POST', (string) config('facturadorpro5.company_endpoint'), $payload, true);
    }

    public function establishments(): array
    {
        return $this->requestJson('GET', (string) config('facturadorpro5.establishments_endpoint'), [], true);
    }

    public function syncEstablishments(array $records): array
    {
        return $this->requestJson(
            'POST',
            (string) config('facturadorpro5.establishments_endpoint') . '/sync',
            ['records' => $records],
            true
        );
    }

    public function series(): array
    {
        return $this->requestJson('GET', (string) config('facturadorpro5.series_endpoint'), [], true);
    }

    public function syncSeries(array $records): array
    {
        return $this->requestJson(
            'POST',
            (string) config('facturadorpro5.series_endpoint') . '/sync',
            ['records' => $records],
            true
        );
    }

    public function uploadCompanyLogo(string $absolutePath): array
    {
        return $this->requestMultipart(
            'POST',
            (string) config('facturadorpro5.company_endpoint') . '/logo',
            [],
            ['file' => $absolutePath],
            true
        );
    }

    public function uploadCompanyCertificate(string $absolutePath, string $password): array
    {
        return $this->requestMultipart(
            'POST',
            (string) config('facturadorpro5.company_endpoint') . '/certificate',
            ['password' => $password],
            ['file' => $absolutePath],
            true
        );
    }

    public function buildIssueRequestBody(BillingDocument $document): array
    {
        $document->loadMissing('items', 'client', 'eventualClient', 'commercialOrder', 'serviceOrder', 'referenceDocument', 'branch', 'business');

        $documentTypeId = $this->mapDocumentTypeId($document->document_type);
        $issueDate = optional($document->issue_date)->format('Y-m-d') ?: now('America/Lima')->format('Y-m-d');
        $customer = $document->client ?: $document->eventualClient;
        $source = $document->source_type === 'commercial_order' ? $document->commercialOrder : $document->serviceOrder;
        $paymentConditionId = $this->mapPaymentConditionId($document->payment_condition);
        $sequence = $this->normalizeSequenceForProvider($document->sequence);
        $effectiveTaxRate = $this->resolveEffectiveTaxRate($document);
        $establishmentId = $this->resolveEstablishmentIdForBranch($document->branch);
        $detractionPayload = $documentTypeId !== '07' && $this->hasDetraction($document)
            ? $this->buildDetractionPayload($document)
            : null;

        $payload = [
            'serie_documento' => $document->series ?: $this->resolveSeriesFromTypeId($documentTypeId),
            'numero_documento' => $sequence,
            'fecha_de_emision' => $issueDate,
            'hora_de_emision' => now('America/Lima')->format('H:i:s'),
            'codigo_tipo_documento' => $documentTypeId,
            'codigo_tipo_operacion' => $detractionPayload ? '1001' : '0101',
            'fecha_de_vencimiento' => optional($document->due_date)->format('Y-m-d') ?: $issueDate,
            'codigo_tipo_moneda' => $document->currency ?: 'PEN',
            'factor_tipo_de_cambio' => 1,
            'codigo_condicion_de_pago' => $paymentConditionId,
            'datos_del_cliente_o_receptor' => [
                'codigo_tipo_documento_identidad' => $this->mapIdentityDocumentTypeId($customer?->document_type),
                'numero_documento' => $customer?->document_number ?: '00000000',
                'apellidos_y_nombres_o_razon_social' => $this->resolveCustomerName($document),
                'nombre_comercial' => $this->resolveCustomerName($document),
                'codigo_pais' => 'PE',
                'ubigeo' => $this->resolveCustomerUbigeo($document),
                'direccion' => $this->resolveCustomerAddress($document),
                'correo_electronico' => $document->customer_email ?: ($customer?->email ?: null),
                'telefono' => $customer?->phone ?: $source?->dispatch_contact_phone ?: null,
            ],
            'totales' => $this->buildTotalsPayload($document),
            'items' => $this->buildItemsPayload($document, $effectiveTaxRate),
            'acciones' => [
                'enviar_email' => false,
                'formato_pdf' => 'a4',
            ],
            'informacion_adicional' => $this->buildAdditionalInformation($document),
        ];

        if ($establishmentId) {
            $payload['establishment_id'] = $establishmentId;
        }

        if ($detractionPayload) {
            $payload['detraccion'] = $detractionPayload;
            $payload['totales']['total_detraccion'] = $detractionPayload['monto'];
            $payload['total_detraccion'] = $detractionPayload['monto'];
        }

        if ($paymentConditionId === '01' && $documentTypeId !== '07') {
            $payload['pagos'] = [[
                'fecha_de_emision' => $issueDate,
                'codigo_metodo_pago' => $this->mapPaymentMethodCode($document->payment_method),
                'codigo_destino_pago' => $this->mapPaymentDestination($document->payment_method),
                'monto' => round(max(0, abs((float) $document->total) - (float) Arr::get($detractionPayload ?? [], 'monto', 0)), 2),
            ]];
        }

        if ($paymentConditionId === '02' && $documentTypeId !== '07') {
            $payload['cuotas'] = $this->buildFeesPayload($document);
        }

        if ($documentTypeId === '07') {
            $payload['codigo_tipo_nota'] = $this->mapCreditNoteReasonCode(Arr::get($document->metadata, 'credit_note_reason'));
            $payload['motivo_o_sustento_de_nota'] = Arr::get($document->metadata, 'credit_note_reason')
                ?: Arr::get($document->metadata, 'credit_note_note')
                ?: 'Anulacion de la operacion';
            $payload['documento_afectado'] = $this->buildAffectedDocumentPayload($document);
        }

        return $payload;
    }

    public function buildCancelRequestBody(BillingDocument $document, ?string $reason): array
    {
        $externalId = $this->providerExternalId($document);
        if (!$this->usesDemoMode() && !$externalId) {
            throw new \RuntimeException('El comprobante no tiene identificador externo del facturador; no se puede enviar la comunicacion de baja.');
        }

        // El facturador espera la fecha de emision de los documentos a dar de baja y los identifica por external_id.
        return [
            'fecha_de_emision_de_documentos' => optional($document->issue_date)->format('Y-m-d') ?: now('America/Lima')->format('Y-m-d'),
            'documentos' => [[
                'external_id' => $externalId,
                'motivo_anulacion' => $reason ?: 'Anulacion operativa',
            ]],
        ];
    }

    public function buildReferralGuideCancelRequestBody(ReferralGuide $guide, ?string $reason): array
    {
        return [
            'external_id' => 'void-gre-' . strtolower($guide->code),
            'date_of_reference' => optional($guide->issue_date)->format('Y-m-d') ?: now()->format('Y-m-d'),
            'date_of_issue' => now()->format('Y-m-d'),
            'documents' => [[
                'document_type_id' => '09',
                'series' => $guide->series,
                'number' => $this->normalizeSequenceForProvider($guide->sequence),
                'description' => $reason ?: 'Anulacion de guia de remision',
            ]],
        ];
    }

    public function previewHeaders(): array
    {
        $headers = [
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
        ];

        if ($this->mode() === 'demo') {
            if ($this->connectionValue('token')) {
                $headers['Authorization'] = 'Bearer ' . (string) $this->connectionValue('token');
            }
            return $headers;
        }

        $authMode = strtolower((string) ($this->connectionValue('auth_mode') ?: 'token'));
        if ($authMode === 'token' && $this->connectionValue('token')) {
            $headers['Authorization'] = 'Bearer ' . (string) $this->connectionValue('token');
        } elseif ($authMode === 'login') {
            $headers['Authorization'] = 'Bearer {runtime-token}';
        }

        return $headers;
    }

    private function demoIssueResponse(BillingDocument $document, array $payload): array
    {
        $template = $this->loadTemplate('issue-response.json');
        $reference = $document->series . '-' . str_pad((string) ($document->sequence ?: $document->id), 8, '0', STR_PAD_LEFT);

        return array_replace_recursive($template, [
            'success' => true,
            'provider' => 'facturadorpro5',
            'mode' => $this->mode(),
            'operation' => 'issue',
            'local_status' => 'accepted',
            'issued_at' => Carbon::now()->toIso8601String(),
            'external_status' => 'accepted',
            'external_id' => 'FP5-' . $document->code,
            'external_reference' => 'SUNAT-' . $reference,
            'cdr_code' => '0',
            'cdr_description' => 'La factura fue aceptada',
            'request_echo' => Arr::get($payload, 'request.body', []),
        ]);
    }

    private function demoCancelResponse(BillingDocument $document, array $payload): array
    {
        $template = $this->loadTemplate('cancel-response.json');

        return array_replace_recursive($template, [
            'success' => true,
            'provider' => 'facturadorpro5',
            'mode' => $this->mode(),
            'operation' => 'cancel',
            'local_status' => 'cancelled',
            'cancelled_at' => Carbon::now()->toIso8601String(),
            'external_status' => 'cancelled',
            'external_id' => $document->external_id ?: ('FP5-' . $document->code),
            'external_reference' => $document->external_reference,
            'reason' => Arr::get($payload, 'request.body.documentos.0.motivo_anulacion'),
        ]);
    }

    private function demoCreditNoteResponse(BillingDocument $document, array $payload): array
    {
        $template = $this->loadTemplate('credit-note-response.json');
        $reference = $document->series . '-' . str_pad((string) ($document->sequence ?: $document->id), 8, '0', STR_PAD_LEFT);

        return array_replace_recursive($template, [
            'success' => true,
            'provider' => 'facturadorpro5',
            'mode' => $this->mode(),
            'operation' => 'credit_note',
            'local_status' => 'accepted',
            'issued_at' => Carbon::now()->toIso8601String(),
            'external_status' => 'accepted',
            'external_id' => 'FP5-' . $document->code,
            'external_reference' => 'SUNAT-' . $reference,
            'cdr_code' => '0',
            'cdr_description' => 'La nota de credito fue aceptada',
            'request_echo' => Arr::get($payload, 'request.body', []),
        ]);
    }

    private function demoReferralGuideResponse(ReferralGuide $guide, array $payload): array
    {
        $reference = $guide->series . '-' . str_pad((string) ($guide->sequence ?: $guide->id), 8, '0', STR_PAD_LEFT);

        return [
            'success' => true,
            'provider' => 'facturadorpro5',
            'mode' => $this->mode(),
            'operation' => 'dispatch',
            'local_status' => 'accepted',
            'issued_at' => Carbon::now()->toIso8601String(),
            'external_status' => 'accepted',
            'external_id' => 'FP5-GRE-' . $guide->code,
            'external_reference' => 'SUNAT-' . $reference,
            'filename' => preg_replace('/[^A-Za-z0-9._-]/', '_', $reference),
            'state_type_id' => '05',
            'cdr_code' => '0',
            'cdr_description' => 'La guia de remision fue aceptada en modo demo',
            'links' => [],
            'request_echo' => Arr::get($payload, 'request.body', []),
        ];
    }

    private function demoReferralGuideCancelResponse(ReferralGuide $guide, array $payload): array
    {
        return [
            'success' => true,
            'provider' => 'facturadorpro5',
            'mode' => $this->mode(),
            'operation' => 'dispatch_voided',
            'local_status' => 'cancelled',
            'cancelled_at' => Carbon::now()->toIso8601String(),
            'external_status' => 'Anulado',
            'external_id' => $guide->external_id ?: ('FP5-GRE-' . $guide->code),
            'external_reference' => $guide->external_reference,
            'ticket' => 'DEMO-GRE-' . $guide->code,
            'voided_external_id' => 'VOID-GRE-' . $guide->code,
            'reason' => Arr::get($payload, 'request.body.documents.0.description'),
            'request_echo' => Arr::get($payload, 'request.body', []),
        ];
    }

    private function normalizeDocumentResponse(BillingDocument $document, array $response, string $operation, array $requestBody): array
    {
        $stateTypeId = (string) Arr::get($response, 'data.state_type_id', '');
        $externalReference = (string) Arr::get($response, 'data.number', $document->external_reference);
        $filename = (string) Arr::get($response, 'data.filename', '');
        $localStatus = $this->mapStateTypeToLocalStatus($stateTypeId);
        $externalStatus = (string) Arr::get($response, 'data.state_type_description', $this->mapStateTypeToExternalStatus($stateTypeId));

        return [
            'success' => (bool) ($response['success'] ?? false),
            'provider' => 'facturadorpro5',
            'mode' => $this->mode(),
            'operation' => $operation,
            'local_status' => $localStatus,
            'external_status' => $externalStatus,
            'external_id' => (string) Arr::get($response, 'data.external_id', ('FP5-' . $document->code)),
            'external_reference' => $externalReference,
            'filename' => $filename,
            'state_type_id' => $stateTypeId,
            'hash' => Arr::get($response, 'data.hash'),
            'qr' => Arr::get($response, 'data.qr'),
            'links' => Arr::get($response, 'links', []),
            'response' => Arr::get($response, 'response'),
            'request_echo' => $requestBody,
        ];
    }

    private function normalizeReferralGuideResponse(ReferralGuide $guide, array $response, array $requestBody): array
    {
        $stateTypeId = (string) Arr::get($response, 'data.state_type_id', '');
        $externalReference = (string) Arr::get($response, 'data.number', $guide->external_reference);
        $filename = (string) Arr::get($response, 'data.filename', '');
        $localStatus = $this->mapStateTypeToLocalStatus($stateTypeId);
        $externalStatus = (string) Arr::get($response, 'data.state_type_description', $this->mapStateTypeToExternalStatus($stateTypeId));

        return [
            'success' => (bool) ($response['success'] ?? false),
            'provider' => 'facturadorpro5',
            'mode' => $this->mode(),
            'operation' => 'dispatch',
            'local_status' => $localStatus,
            'external_status' => $externalStatus,
            'external_id' => (string) Arr::get($response, 'data.external_id', ('FP5-GRE-' . $guide->code)),
            'external_reference' => $externalReference,
            'filename' => $filename,
            'state_type_id' => $stateTypeId,
            'hash' => Arr::get($response, 'data.hash'),
            'qr' => Arr::get($response, 'data.qr'),
            'links' => Arr::get($response, 'links', []),
            'response' => Arr::get($response, 'response'),
            'request_echo' => $requestBody,
        ];
    }

    private function buildTotalsPayload(BillingDocument $document): array
    {
        // SUNAT exige montos positivos tambien en notas de credito; el signo negativo es solo contable interno.
        $isCreditNote = $this->mapDocumentTypeId($document->document_type) === '07';
        $subtotal = round($isCreditNote ? abs((float) $document->subtotal) : (float) $document->subtotal, 2);
        $taxAmount = round($isCreditNote ? abs((float) $document->tax_amount) : (float) $document->tax_amount, 2);
        $total = round($isCreditNote ? abs((float) $document->total) : (float) $document->total, 2);

        $totalPending = 0;
        $source = $document->source_type === 'commercial_order' ? $document->commercialOrder : $document->serviceOrder;
        if (!$isCreditNote && $this->mapPaymentConditionId($document->payment_condition) === '02') {
            $totalPending = round(abs((float) ($source?->balance_amount ?? $document->total)), 2);
        }

        return [
            'total_anticipos' => 0,
            'total_descuentos' => 0,
            'total_cargos' => 0,
            'total_exportacion' => 0,
            'total_operaciones_gratuitas' => 0,
            'total_operaciones_gravadas' => $subtotal,
            'total_operaciones_inafectas' => 0,
            'total_operaciones_exoneradas' => 0,
            'total_igv' => $taxAmount,
            'total_igv_operaciones_gratuitas' => 0,
            'total_base_isc' => 0,
            'total_isc' => 0,
            'total_base_otros_impuestos' => 0,
            'total_otros_impuestos' => 0,
            'total_impuestos_bolsa_plastica' => 0,
            'total_impuestos' => $taxAmount,
            'total_valor' => $subtotal,
            'subtotal_venta' => $total,
            'total_venta' => $total,
            'total_pendiente_pago' => $totalPending,
        ];
    }

    private function buildItemsPayload(BillingDocument $document, float $effectiveTaxRate): array
    {
        $pricesIncludeTax = $document->source_type === 'commercial_order' && $effectiveTaxRate > 0;
        // SUNAT exige cantidades y montos positivos tambien en notas de credito.
        $isCreditNote = $this->mapDocumentTypeId($document->document_type) === '07';

        return $document->items
            ->where('status', true)
            ->values()
            ->map(function ($item) use ($effectiveTaxRate, $pricesIncludeTax, $isCreditNote) {
                $quantity = round($isCreditNote ? abs((float) $item->quantity) : (float) $item->quantity, 3);
                $storedUnitPrice = round($isCreditNote ? abs((float) $item->unit_price) : (float) $item->unit_price, 2);
                $storedLineTotal = round($isCreditNote ? abs((float) $item->total) : (float) $item->total, 2);

                if ($pricesIncludeTax) {
                    $lineTotal = $storedLineTotal;
                    $lineValue = round($lineTotal / (1 + $effectiveTaxRate), 2);
                    $lineTax = round($lineTotal - $lineValue, 2);
                    $unitValue = $quantity === 0 ? round($storedUnitPrice / (1 + $effectiveTaxRate), 6) : round($lineValue / $quantity, 6);
                    $unitPrice = $quantity === 0 ? $storedUnitPrice : round($lineTotal / $quantity, 6);
                } else {
                    $unitValue = $storedUnitPrice;
                    $lineValue = $storedLineTotal;
                    $lineTax = round($lineValue * $effectiveTaxRate, 2);
                    $lineTotal = round($lineValue + $lineTax, 2);
                    $unitPrice = $quantity === 0 ? $unitValue : round($lineTotal / $quantity, 6);
                }

                return [
                    'codigo_interno' => $item->item_code ?: ('ITEM-' . $item->id),
                    'descripcion' => $item->description,
                    'codigo_tipo_item' => $item->item_type === 'service' ? '02' : '01',
                    'codigo_producto_sunat' => (string) Arr::get($item->metadata, 'sunat_product_code', ''),
                    'unidad_de_medida' => $this->resolveUnitCode($item),
                    'cantidad' => $quantity,
                    'valor_unitario' => $unitValue,
                    'codigo_tipo_precio' => '01',
                    'precio_unitario' => $unitPrice,
                    'codigo_tipo_afectacion_igv' => $effectiveTaxRate > 0 ? '10' : '20',
                    'total_base_igv' => $lineValue,
                    'porcentaje_igv' => round($effectiveTaxRate * 100, 2),
                    'total_igv' => $lineTax,
                    'total_impuestos' => $lineTax,
                    'total_valor_item' => $lineValue,
                    'total_item' => $lineTotal,
                ];
            })
            ->all();
    }

    private function buildFeesPayload(BillingDocument $document): array
    {
        $source = $document->source_type === 'commercial_order' ? $document->commercialOrder : $document->serviceOrder;
        $installments = max(1, (int) ($source?->installments ?? 1));
        $firstDueDate = optional($document->due_date)->copy() ?: Carbon::parse(optional($source?->first_due_date)->format('Y-m-d') ?: now()->format('Y-m-d'));
        $amount = round(abs((float) $document->total), 2);
        $baseQuota = round($amount / $installments, 2);
        $quotas = [];
        $accumulator = 0;

        for ($index = 1; $index <= $installments; $index++) {
            $quotaAmount = $index === $installments ? round($amount - $accumulator, 2) : $baseQuota;
            $accumulator += $quotaAmount;
            $quotaDate = $firstDueDate->copy()->addDays(($index - 1) * 30)->format('Y-m-d');

            $quotas[] = [
                'fecha' => $quotaDate,
                'codigo_tipo_moneda' => $document->currency ?: 'PEN',
                'monto' => $quotaAmount,
                'codigo_metodo_de_pago' => $this->mapPaymentMethodCode($document->payment_method),
            ];
        }

        return $quotas;
    }

    private function buildAffectedDocumentPayload(BillingDocument $document): array
    {
        $reference = $document->referenceDocument;
        if (!$reference) {
            return [];
        }

        return [
            'external_id' => $this->providerExternalId($reference),
            'serie_documento' => $reference->series,
            'numero_documento' => $this->normalizeSequenceForProvider($reference->sequence),
            'codigo_tipo_documento' => $this->mapDocumentTypeId($reference->document_type),
        ];
    }

    private function providerExternalId(BillingDocument $document): ?string
    {
        // Los ids 'FP5-*' son placeholders del modo demo; no existen en el facturador y su lookup falla.
        $externalId = trim((string) $document->external_id);
        if ($externalId === '' || str_starts_with($externalId, 'FP5-')) {
            return null;
        }

        return $externalId;
    }

    private function hasDetraction(BillingDocument $document): bool
    {
        $enabled = filter_var(Arr::get($document->metadata ?? [], 'detraction_enabled'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        return $enabled === true;
    }

    private function buildDetractionPayload(BillingDocument $document): array
    {
        $percent = $this->resolveDetractionPercent($document);
        $amount = $this->resolveDetractionAmount($document, $percent);
        $code = (string) Arr::get($document->metadata ?? [], 'detraction_code', '022');
        $paymentMethodCode = (string) Arr::get($document->metadata ?? [], 'detraction_payment_method_code', '001');
        $account = trim((string) $document->business?->detraction_account);

        return [
            'codigo_tipo_detraccion' => $code ?: '022',
            'codigo_bien_servicio' => $code ?: '022',
            'codigo_medio_pago' => $paymentMethodCode ?: '001',
            'codigo_metodo_pago' => $paymentMethodCode ?: '001',
            'cuenta_bancaria' => $account,
            'porcentaje' => round($percent, 2),
            'monto' => round($amount, 2),
        ];
    }

    private function resolveDetractionPercent(BillingDocument $document): float
    {
        $metadataPercent = $this->decimalValue(Arr::get($document->metadata ?? [], 'detraction_percent'));
        if ($metadataPercent > 0) {
            return $metadataPercent;
        }

        return (float) $document->items
            ->where('status', true)
            ->reduce(fn($carry, $item) => max((float) $carry, $this->decimalValue(Arr::get($item->metadata, 'detraction_percent'))), 0);
    }

    private function resolveDetractionAmount(BillingDocument $document, float $percent): float
    {
        $metadataAmount = $this->decimalValue(Arr::get($document->metadata ?? [], 'detraction_amount'));
        if ($metadataAmount > 0) {
            return $metadataAmount;
        }

        return round(abs((float) $document->total) * $percent / 100, 2);
    }

    private function decimalValue($value, float $fallback = 0): float
    {
        if ($value === null || $value === '') {
            return $fallback;
        }

        $normalized = str_replace(',', '.', (string) $value);
        return is_numeric($normalized) ? (float) $normalized : $fallback;
    }

    private function buildAdditionalInformation(BillingDocument $document): string
    {
        $lines = array_filter([
            $document->observations,
            Arr::get($document->metadata, 'source_code') ? 'Origen: ' . Arr::get($document->metadata, 'source_code') : null,
            $this->hasDetraction($document) ? 'Detraccion: ' . number_format($this->resolveDetractionAmount($document, $this->resolveDetractionPercent($document)), 2, '.', '') : null,
            Arr::get($document->metadata, 'delivery_address') ? 'Entrega: ' . Arr::get($document->metadata, 'delivery_address') : null,
        ]);

        $paymentAccounts = $this->paymentAccountTextLines($document->business?->payment_accounts);
        if (!empty($paymentAccounts)) {
            $lines[] = 'Cuentas bancarias: ' . implode(' / ', array_slice($paymentAccounts, 0, 5));
        }

        return implode(' | ', $lines);
    }

    private function isStorageBillingDocument(BillingDocument $document): bool
    {
        $origin = (string) Arr::get($document->metadata ?? [], 'document_origin', '');
        if (in_array($origin, [
            'storage_service_order',
            'storage_general_service_order',
            'storage_billing_control_demo',
            'storage_demo_seed',
        ], true)) {
            return true;
        }

        if (!$document->relationLoaded('serviceOrder') && $document->service_order_id) {
            $document->loadMissing('serviceOrder');
        }

        return $document->source_type === 'service_order'
            && in_array((string) $document->serviceOrder?->order_type, ['storage_service', 'storage_general'], true);
    }

    private function paymentAccountTextLines($value): array
    {
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            $value = is_array($decoded) ? $decoded : ['lines' => preg_split('/\r\n|\r|\n/', $value)];
        }

        if (!is_array($value)) {
            return [];
        }

        $lines = [];
        foreach (['title', 'subtitle'] as $key) {
            $text = trim((string) ($value[$key] ?? ''));
            if ($text !== '') {
                $lines[] = $text;
            }
        }

        foreach (($value['lines'] ?? []) as $line) {
            $line = trim((string) $line);
            if ($line !== '') {
                $lines[] = $line;
            }
        }

        return array_values($lines);
    }

    private function buildStatusRequestBody(BillingDocument $document): array
    {
        return [
            'external_id' => $document->external_id,
            'serie_number' => trim((string) $document->series) . '-' . trim((string) $document->sequence),
        ];
    }

    private function buildCancelStatusRequestBody(BillingDocument $document): array
    {
        $ticket = trim((string) Arr::get($document->metadata, 'voided_ticket', ''));
        if ($ticket !== '') {
            return ['ticket' => $ticket];
        }

        $externalId = trim((string) Arr::get($document->metadata, 'voided_external_id', ''));
        if ($externalId !== '') {
            return ['external_id' => $externalId];
        }

        if ($document->external_id) {
            return ['external_id' => $document->external_id];
        }

        return ['ticket' => ''];
    }

    private function buildClient(bool $requiresAuth)
    {
        $request = Http::acceptJson()
            ->timeout((int) config('facturadorpro5.timeout', 30))
            ->withOptions([
                'verify' => (bool) config('facturadorpro5.verify_ssl', false),
            ]);

        if (!$requiresAuth) {
            return $request;
        }

        $authMode = strtolower((string) ($this->connectionValue('auth_mode') ?: 'token'));
        if ($authMode === 'none') {
            return $request;
        }

        if ($authMode === 'token' && $this->connectionValue('token')) {
            return $request->withToken((string) $this->connectionValue('token'));
        }

        if ($authMode === 'login') {
            return $request->withToken($this->resolveRuntimeToken());
        }

        return $request;
    }

    private function requestJson(string $method, string $endpoint, array $payload, bool $requiresAuth): array
    {
        $options = [];
        if ($method === 'GET') {
            $options['query'] = $payload;
        } else {
            $options['json'] = $payload;
        }

        $response = $this->buildClient($requiresAuth)->send($method, $this->makeUrl($endpoint), $options);

        if (!$response->successful()) {
            throw new \RuntimeException($this->providerErrorMessage($response));
        }

        return $response->json() ?: [];
    }

    private function providerErrorMessage($response): string
    {
        $message = Arr::get($response->json() ?? [], 'message')
            ?: Arr::get($response->json() ?? [], 'error')
            ?: $response->body()
            ?: 'Error de comunicacion con el facturador';

        // El facturador puede devolver message como array (errores de validacion)
        return is_array($message) ? json_encode($message, JSON_UNESCAPED_UNICODE) : (string) $message;
    }

    private function requestMultipart(string $method, string $endpoint, array $fields, array $files, bool $requiresAuth): array
    {
        if (strtoupper($method) !== 'POST') {
            throw new \RuntimeException('Solo se soporta multipart POST en esta integracion');
        }

        $client = $this->buildClient($requiresAuth);
        foreach ($files as $name => $absolutePath) {
            if (!file_exists($absolutePath)) {
                throw new \RuntimeException("No se encontro el archivo requerido para {$name}");
            }

            $client = $client->attach($name, file_get_contents($absolutePath), basename($absolutePath));
        }

        $response = $client->post($this->makeUrl($endpoint), $fields);

        if (!$response->successful()) {
            throw new \RuntimeException($this->providerErrorMessage($response));
        }

        return $response->json() ?: [];
    }

    private function requestBinary(string $url, bool $requiresAuth)
    {
        $response = $this->buildClient($requiresAuth)->get($this->normalizeDownloadUrl($url));
        if (!$response->successful()) {
            $message = $response->body() ?: 'No se pudo descargar el archivo desde el facturador';
            throw new \RuntimeException($message);
        }

        return $response;
    }

    private function resolveRuntimeToken(): string
    {
        $cacheKey = 'facturadorpro5-token-' . md5(((string) $this->connectionValue('base_url')) . '|' . ((string) $this->connectionValue('api_email')));

        return Cache::remember($cacheKey, now()->addMinutes(50), function () {
            $email = trim((string) $this->connectionValue('api_email'));
            $password = (string) $this->connectionValue('api_password');

            if ($email === '' || $password === '') {
                throw new \RuntimeException('Faltan credenciales API del facturador');
            }

            $response = Http::acceptJson()
                ->timeout((int) config('facturadorpro5.timeout', 30))
                ->withOptions([
                    'verify' => (bool) config('facturadorpro5.verify_ssl', false),
                ])
                ->post($this->makeUrl((string) config('facturadorpro5.login_endpoint')), [
                    'email' => $email,
                    'password' => $password,
                ]);

            if (!$response->successful()) {
                $message = Arr::get($response->json() ?? [], 'message') ?: $response->body() ?: 'No se pudo autenticar contra el facturador';
                throw new \RuntimeException($message);
            }

            $token = (string) Arr::get($response->json() ?? [], 'token', '');
            if ($token === '') {
                throw new \RuntimeException('El facturador no devolvio token API');
            }

            return $token;
        });
    }

    private function resolveUnitCode($item): string
    {
        $unit = strtoupper(trim((string) Arr::get($item->metadata, 'unit_code', '')));
        if ($unit !== '') {
            return $unit;
        }

        return $item->item_type === 'service' ? 'ZZ' : 'NIU';
    }

    private function resolveCustomerName(BillingDocument $document): string
    {
        return $document->client?->full_name
            ?: $document->eventualClient?->business_name
            ?: 'Cliente';
    }

    private function resolveCustomerAddress(BillingDocument $document): string
    {
        return $document->client?->full_address
            ?: $document->eventualClient?->address
            ?: $document->commercialOrder?->delivery_address
            ?: '-';
    }

    private function resolveCustomerUbigeo(BillingDocument $document): string
    {
        return $document->client?->ubigeo
            ?: $document->commercialOrder?->ubigeo
            ?: '150101';
    }

    private function resolveEstablishmentIdForBranch(?BusinessBranch $branch): ?int
    {
        if (!$branch) {
            return null;
        }

        if ($branch->facturador_establishment_id) {
            return (int) $branch->facturador_establishment_id;
        }

        return null;
    }

    private function resolveEffectiveTaxRate(BillingDocument $document): float
    {
        $subtotal = (float) $document->subtotal;
        if ($subtotal === 0.0) {
            return 0.0;
        }

        return round(((float) $document->tax_amount) / $subtotal, 6);
    }

    private function mapDocumentTypeId(?string $documentType): string
    {
        $normalized = mb_strtolower(trim((string) $documentType));

        return match ($normalized) {
            'boleta' => '03',
            'nota de credito', 'nota_credito', 'credit_note' => '07',
            default => '01',
        };
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

    private function mapPaymentConditionId(?string $paymentCondition): string
    {
        return mb_strtolower(trim((string) $paymentCondition)) === 'credito' ? '02' : '01';
    }

    private function mapPaymentMethodCode(?string $paymentMethod): string
    {
        $normalized = mb_strtolower(trim((string) $paymentMethod));

        return match ($normalized) {
            'deposito', 'depósito', 'transferencia' => '02',
            default => '01',
        };
    }

    private function mapPaymentDestination(?string $paymentMethod): string
    {
        $normalized = mb_strtolower(trim((string) $paymentMethod));

        return match ($normalized) {
            'deposito', 'depósito', 'transferencia' => 'bank',
            default => 'cash',
        };
    }

    private function mapCreditNoteReasonCode(?string $reason): string
    {
        $normalized = mb_strtolower(trim((string) $reason));
        if (preg_match('/^\d{2}$/', $normalized)) {
            return $normalized;
        }

        return match ($normalized) {
            'anulacion de la operacion', 'anulacion operativa', 'anulacion' => '01',
            'anulacion por error en el ruc' => '02',
            'correccion por error en la descripcion' => '03',
            'devolucion total' => '07',
            'descuento global' => '13',
            default => '01',
        };
    }

    private function mapStateTypeToLocalStatus(?string $stateTypeId): string
    {
        return match ((string) $stateTypeId) {
            '05' => 'accepted',
            '07' => 'observed',
            '09' => 'rejected',
            '11' => 'cancelled',
            '03', '13' => 'sent',
            default => 'pending',
        };
    }

    private function mapStateTypeToExternalStatus(?string $stateTypeId): string
    {
        return match ((string) $stateTypeId) {
            '05' => 'Aceptado',
            '07' => 'Observado',
            '09' => 'Rechazado',
            '11' => 'Anulado',
            '13' => 'Por anular',
            '03' => 'Enviado',
            default => 'Registrado',
        };
    }

    private function resolveSeriesFromTypeId(string $documentTypeId): string
    {
        return match ($documentTypeId) {
            '03' => (string) config('facturadorpro5.series.boleta', 'B001'),
            '07' => (string) config('facturadorpro5.series.nota_credito', 'FC01'),
            default => (string) config('facturadorpro5.series.factura', 'F001'),
        };
    }

    private function normalizeSequenceForProvider(?string $sequence)
    {
        $sequence = trim((string) $sequence);
        if ($sequence === '') {
            return '#';
        }

        $normalized = ltrim($sequence, '0');
        return $normalized === '' ? 0 : (int) $normalized;
    }

    private function shouldUseVoidedStatus(BillingDocument $document): bool
    {
        return trim((string) Arr::get($document->metadata, 'voided_ticket', '')) !== ''
            || trim((string) Arr::get($document->metadata, 'voided_external_id', '')) !== '';
    }

    private function normalizeDownloadUrl(string $url): string
    {
        if (preg_match('/^https?:\/\//i', $url)) {
            return $url;
        }

        return $this->resolveAppBaseUrl() . '/' . ltrim($url, '/');
    }

    private function resolveDownloadFilename(string $type, BillingDocument $document, string $url, ?string $disposition): string
    {
        if ($disposition && preg_match('/filename="?([^"]+)"?/i', $disposition, $matches)) {
            return $matches[1];
        }

        $path = parse_url($url, PHP_URL_PATH);
        $basename = $path ? basename($path) : null;
        if ($basename && str_contains($basename, '.')) {
            return $basename;
        }

        $reference = $document->external_reference ?: $document->code;
        return preg_replace('/[^A-Za-z0-9._-]/', '_', $reference) . '.' . $type;
    }

    private function resolveReferralGuideDownloadFilename(string $type, ReferralGuide $guide, string $url, ?string $disposition): string
    {
        if ($disposition && preg_match('/filename="?([^"]+)"?/i', $disposition, $matches)) {
            return $matches[1];
        }

        $path = parse_url($url, PHP_URL_PATH);
        $basename = $path ? basename($path) : null;
        if ($basename && str_contains($basename, '.')) {
            return $basename;
        }

        $reference = $guide->external_reference ?: $guide->code;
        return preg_replace('/[^A-Za-z0-9._-]/', '_', $reference) . '.' . $type;
    }

    private function shouldServeLocalPdf(BillingDocument $document, array $stored = [], array $status = []): bool
    {
        return $document->provider_mode === 'demo'
            || Arr::get($document->metadata ?? [], 'document_origin') === 'storage_billing_control_demo'
            || Arr::get($stored, 'mode') === 'demo'
            || Arr::get($status, 'mode') === 'demo'
            || $this->usesCompanyLocalPdfFormat($document);
    }

    private function canBuildLocalPdf(BillingDocument $document, array $stored = [], array $status = []): bool
    {
        return $this->shouldServeLocalPdf($document, $stored, $status)
            || (trim((string) $document->series) !== '' && trim((string) $document->sequence) !== '');
    }

    private function usesCompanyLocalPdfFormat(BillingDocument $document): bool
    {
        if (trim((string) $document->series) === '' || trim((string) $document->sequence) === '') {
            return false;
        }

        if (!$document->relationLoaded('business')) {
            try {
                $document->loadMissing('business:id,business_key');
            } catch (\Throwable) {
                return false;
            }
        }

        return in_array((string) $document->business?->business_key, BusinessScope::fixedKeys(), true);
    }

    private function buildLocalPdfFile(BillingDocument $document): array
    {
        $document->loadMissing('business', 'branch', 'client', 'eventualClient', 'serviceOrder', 'commercialOrder', 'referenceDocument', 'items');
        $this->reloadDocumentBusiness($document);

        $lines = [
            'Comprobante demo de facturacion',
            'Documento: ' . trim(($document->series ?: '-') . ' - ' . ($document->sequence ?: '-')),
            'Codigo interno: ' . ($document->code ?: '-'),
            'Tipo: ' . ($document->document_type ?: '-'),
            'Estado: ' . ($document->external_status ?: $document->local_status ?: '-'),
            'Empresa: ' . ($document->business?->name ?: '-'),
            'Sede: ' . ($document->branch?->name ?: '-'),
            'Cliente: ' . $this->resolveCustomerName($document),
            'Documento cliente: ' . ($document->client?->document_number ?: $document->eventualClient?->document_number ?: '-'),
            'Origen: ' . ($document->serviceOrder?->code ?: $document->commercialOrder?->code ?: Arr::get($document->metadata, 'source_code', '-')),
            'Fecha emision: ' . $this->formatPdfDate($document->issue_date),
            'Fecha vencimiento: ' . $this->formatPdfDate($document->due_date),
            'Moneda: ' . ($document->currency ?: 'PEN'),
            'Subtotal: ' . number_format((float) $document->subtotal, 2, '.', ''),
            'IGV: ' . number_format((float) $document->tax_amount, 2, '.', ''),
            'Total: ' . number_format((float) $document->total, 2, '.', ''),
        ];

        if ($document->referenceDocument) {
            $lines[] = 'Documento afecto: ' . trim(($document->referenceDocument->series ?: '-') . ' - ' . ($document->referenceDocument->sequence ?: '-'));
        }

        $lines[] = '';
        $lines[] = 'Detalle';
        foreach ($document->items as $item) {
            $lines[] = '- ' . ($item->description ?: $item->item_code ?: 'Item') . ' | Cant: ' . number_format((float) $item->quantity, 2, '.', '') . ' | Total: ' . number_format((float) $item->total, 2, '.', '');
        }

        if ($document->observations) {
            $lines[] = '';
            $lines[] = 'Observaciones: ' . $document->observations;
        }

        $lines[] = '';
        $lines[] = 'Archivo generado localmente para datos demo sin enlace PDF del proveedor.';

        return [
            'content' => $this->invoiceLikePdf($document, $lines),
            'content_type' => 'application/pdf',
            'filename' => preg_replace('/[^A-Za-z0-9._-]/', '_', ($document->external_reference ?: $document->code ?: 'comprobante-demo')) . '.pdf',
        ];
    }

    private function formatPdfDate($value): string
    {
        if (!$value) {
            return '-';
        }

        try {
            return Carbon::parse($value)->format('Y-m-d');
        } catch (\Throwable) {
            return (string) $value;
        }
    }

    private function invoiceLikePdf(BillingDocument $document, array $fallbackLines): string
    {
        $commands = [];
        $margin = 42.52;
        $width = 510.24;
        $rightBoxX = 399.69;
        $businessName = $document->business?->trade_name ?: ($document->business?->name ?: 'KAMARY MEDICAL S.A.C.');
        $businessRuc = $document->business?->tax_number ?: '20604718237';
        $businessAddress = $document->business?->fiscal_address
            ?: ($document->branch?->address ?: 'CAL.YEN ESCOBEDO GARRO NRO. 800');
        $documentTitle = $this->pdfDocumentTitle($document->document_type);
        $number = trim(($document->series ?: '-') . ' - ' . ($document->sequence ?: '-'));
        $currencyName = $this->pdfCurrencyName($document->currency);
        $customer = $document->client ?: $document->eventualClient;
        $customerDocument = $customer?->document_number ?: '-';
        $customerName = $this->resolveCustomerName($document);
        $customerAddress = $this->resolveCustomerAddress($document);
        $logoImage = $this->fiscalPdfLogoImage($document);
        $verificationService = app(BillingDocumentVerificationService::class);
        $verificationUrl = $verificationService->verificationUrl($document);
        $xmlUrl = $verificationService->providerXmlUrl($document);

        $this->pdfRect($commands, $rightBoxX, 745, 153.07, 68);
        $this->pdfRect($commands, $margin, 616, 331.65, 92);
        $this->pdfRect($commands, $rightBoxX, 616, 153.07, 92);

        if ($logoImage) {
            [$logoWidth, $logoHeight] = $this->fitPdfImage($logoImage['width'], $logoImage['height'], 62, 54);
            $this->pdfImage($commands, $logoImage['name'], 54, 755 + ((54 - $logoHeight) / 2), $logoWidth, $logoHeight);
        } else {
            $this->pdfText($commands, 'KM', 54, 787, 18, 'F2');
        }

        $this->pdfText($commands, $businessName, 134, 797, 14.5, 'F2');
        $this->pdfWrappedText($commands, $businessAddress, 134, 779, 260, 9.2, 10, 3);

        $this->pdfText($commands, 'RUC ' . $businessRuc, $rightBoxX, 797, 10, 'F2', 153.07, 'C');
        $this->pdfText($commands, $documentTitle, $rightBoxX, 781, 10, 'F2', 153.07, 'C');
        $this->pdfText($commands, 'ELECTRONICA', $rightBoxX, 766, 10, 'F2', 153.07, 'C');
        $this->pdfText($commands, $number, $rightBoxX, 751, 10, 'F2', 153.07, 'C');

        $this->pdfText($commands, 'DATOS DEL CLIENTE', 46.52, 693, 8.8, 'F2');
        $this->pdfLabelValue($commands, 'DOCUMENTO', $customerDocument, 46.52, 678, 10);
        $this->pdfLabelValue($commands, 'DENOMINACION', $customerName, 46.52, 666, 10);
        $this->pdfLabelValue($commands, 'DIRECCION', $customerAddress, 46.52, 654, 10, 205, 2);
        $this->pdfLabelValue($commands, 'FECHA EMISION', $this->formatPdfDate($document->issue_date), 407, 693, 10, 67, 1, 88);
        $this->pdfLabelValue($commands, 'MONEDA', $currencyName, 407, 681, 10, 67, 1, 88);
        $this->pdfLabelValue($commands, 'FECHA VENCIMIENTO', $this->formatPdfDate($document->due_date), 407, 669, 10, 67, 1, 88);

        $columns = [
            ['CODIGO', 68, 'L'],
            ['DESCRIPCION', 178, 'L'],
            ['SERV / M3', 54, 'R'],
            ['P. SIN IGV', 70, 'R'],
            ['P. CON IGV', 70, 'R'],
            ['IMPORTE', 70.24, 'R'],
        ];
        $tableTop = 585;
        $headerBottom = $tableTop - 28;
        $y = $headerBottom - 15;
        $rowHeight = 44;
        $rowBottom = $headerBottom;
        $items = $document->items->where('status', true)->take(6);
        if ($items->isEmpty()) {
            foreach ($fallbackLines as $index => $line) {
                if ($index < 3 || trim($line) === '') continue;
                $this->pdfCellText($commands, $line, 46, $y, 500, 8, 'L', 1);
                $rowBottom = $y - 12;
                $y -= 13;
            }
        } else {
            foreach ($items as $item) {
                $description = $item->description ?: $item->item_code ?: 'Servicio';
                $quantity = max((float) $item->quantity, 1);
                $lineTotal = (float) $item->total;
                $unitPrice = (float) $item->unit_price;
                $grossUnit = $quantity > 0 ? $lineTotal / $quantity : $lineTotal;
                $rowBottom = $y - $rowHeight;
                $this->pdfLine($commands, $margin, $rowBottom, $margin + $width, $rowBottom);
                $cursor = $margin;
                $this->pdfCellText($commands, $item->item_code ?: 'COD001', $cursor, $y, $columns[0][1], 6.6, 'L', 1);
                $cursor += $columns[0][1];
                $this->pdfCellText($commands, $description, $cursor, $y, $columns[1][1], 6.8, 'L', 2);
                $cursor += $columns[1][1];
                $this->pdfCellText($commands, number_format($quantity, 2, '.', ''), $cursor, $y, $columns[2][1], 6.8, 'R');
                $cursor += $columns[2][1];
                $this->pdfCellText($commands, number_format($unitPrice, 4, '.', ''), $cursor, $y, $columns[3][1], 6.8, 'R');
                $cursor += $columns[3][1];
                $this->pdfCellText($commands, number_format($grossUnit, 2, '.', ''), $cursor, $y, $columns[4][1], 6.8, 'R');
                $cursor += $columns[4][1];
                $this->pdfCellText($commands, number_format($lineTotal, 2, '.', ''), $cursor, $y, $columns[5][1], 6.8, 'R');
                $y -= $rowHeight;
            }
        }

        $tableBottom = max(330, $rowBottom - 88);
        $this->pdfRect($commands, $margin, $tableBottom, $width, $tableTop - $tableBottom);
        $this->pdfTableHeader($commands, $margin, $tableTop, $columns);
        $this->pdfLine($commands, $margin, $headerBottom, $margin + $width, $headerBottom);

        $totalsY = $rowBottom - 20;
        $totalsLabelX = $margin + $width - 150;
        $totalsValueX = $margin + $width - 72;
        $this->pdfText($commands, 'GRAVADA:', $totalsLabelX, $totalsY, 8.8, 'F2', 80, 'R');
        $this->pdfText($commands, number_format((float) $document->subtotal, 2, '.', ''), $totalsValueX, $totalsY, 8.8, 'F2', 64, 'R');
        $this->pdfText($commands, 'IGV 18.00 %:', $totalsLabelX, $totalsY - 13, 8.8, 'F2', 80, 'R');
        $this->pdfText($commands, number_format((float) $document->tax_amount, 2, '.', ''), $totalsValueX, $totalsY - 13, 8.8, 'F2', 64, 'R');
        $this->pdfText($commands, 'TOTAL:', $totalsLabelX, $totalsY - 26, 8.8, 'F2', 80, 'R');
        $this->pdfText($commands, number_format((float) $document->total, 2, '.', ''), $totalsValueX, $totalsY - 26, 8.8, 'F2', 64, 'R');

        $lettersY = $tableBottom + 15;
        $this->pdfText($commands, 'IMPORTE EN LETRAS:', 46.52, $lettersY, 8.8, 'F2');
        $this->pdfWrappedText($commands, $this->amountInWords((float) $document->total, $document->currency), 147, $lettersY, 395, 8.8, 10, 2);

        $bankLineCount = 0;
        $bankLines = [];
        foreach (array_slice($this->paymentAccountTextLines($document->business?->payment_accounts), 0, 6) as $index => $line) {
            $bankLines[] = [$line, $index === 0 ? 'F2' : 'F1'];
        }

        $bankLineCount = count($bankLines);
        if ($bankLineCount > 0) {
            $bankBoxHeight = max(45, 16 + ($bankLineCount * 11));
            $bankBoxTop = $tableBottom - 30;
            $bankBoxY = max(92, $bankBoxTop - $bankBoxHeight);
            $this->pdfRect($commands, $margin, $bankBoxY, $width, $bankBoxHeight);
            foreach ($bankLines as $index => [$line, $font]) {
                $this->pdfCellText($commands, $line, 46.52, $bankBoxTop - 16 - ($index * 11), 440, 8.5, 'L', 1, 9, $font);
            }
        } else {
            $bankBoxY = $tableBottom - 30;
        }

        $verificationBoxTop = $bankBoxY - 30;
        $verificationBoxHeight = 150;
        $verificationBoxY = max(38, $verificationBoxTop - $verificationBoxHeight);
        $this->pdfRect($commands, $margin, $verificationBoxY, $width, $verificationBoxHeight);
        $this->pdfWrappedText($commands, 'Representacion impresa de la ' . $documentTitle . ' ELECTRONICA, visita ' . $verificationUrl, 46.52, $verificationBoxTop - 14, 490, 8.5, 10, 2);
        $this->pdfText($commands, 'Autorizado mediante Resolucion de Intendencia No.034-005-0005315', 46.52, $verificationBoxTop - 36, 8.2);
        $this->pdfQrCode($commands, $verificationUrl, 50, $verificationBoxY + 42, 66);
        $this->pdfText($commands, 'Archivo XML:', 46.52, $verificationBoxY + 28, 8.5, 'F2');
        $this->pdfWrappedText($commands, $xmlUrl ?: 'Disponible cuando el proveedor genere el XML fiscal', 107, $verificationBoxY + 28, 440, 8.5, 10, 2);

        return $this->pdfDocument(implode("\n", $commands) . "\n", $logoImage ? [$logoImage] : []);
    }

    private function pdfDocumentTitle(?string $documentType): string
    {
        $normalized = mb_strtolower(trim((string) $documentType));
        return match ($normalized) {
            'boleta' => 'BOLETA',
            'nota de credito', 'nota_credito', 'credit_note' => 'NOTA DE CREDITO',
            default => 'FACTURA',
        };
    }

    private function reloadDocumentBusiness(BillingDocument $document): void
    {
        if (!$document->business_id) {
            return;
        }

        try {
            $business = Business::query()->find($document->business_id);
        } catch (\Throwable) {
            return;
        }

        if ($business) {
            $document->setRelation('business', $business);
        }
    }

    private function pdfCurrencyName(?string $currency): string
    {
        return strtoupper(trim((string) $currency)) === 'USD' ? 'Dolares' : 'Soles';
    }

    private function pdfLabelValue(array &$commands, string $label, string $value, float $x, float $y, float $lineHeight = 10, float $valueWidth = 250, int $maxLines = 1, float $separatorX = 71): void
    {
        $this->pdfText($commands, $label, $x, $y, 8, 'F2');
        $this->pdfText($commands, ':', $x + $separatorX, $y, 8);
        $this->pdfWrappedText($commands, $value, $x + $separatorX + 13, $y, $valueWidth, 8, $lineHeight, $maxLines);
    }

    private function pdfTableHeader(array &$commands, float $x, float $y, array $columns): void
    {
        $cursor = $x;
        foreach ($columns as $column) {
            [$label, $width] = $column;
            $align = $column[2] ?? 'L';
            $this->pdfCellText($commands, $label, $cursor, $y - 17, $width, 7.8, $align, 1, 8, 'F2');
            $cursor += $width;
        }
    }

    private function pdfCellText(array &$commands, string $text, float $x, float $y, float $width, float $size = 8, string $align = 'L', int $maxLines = 1, float $lineHeight = 9, string $font = 'F1'): void
    {
        $availableWidth = max(4, $width - 7);
        $textX = $x + 3.5;

        if ($align !== 'L' || $maxLines <= 1) {
            $line = $this->pdfFitText($text, $availableWidth, $size);
            $this->pdfText($commands, $line, $textX, $y, $size, $font, $availableWidth, $align);
            return;
        }

        $lines = $this->pdfWrap($text, $availableWidth, $size, $maxLines);
        foreach ($lines as $index => $line) {
            $this->pdfText($commands, $this->pdfFitText($line, $availableWidth, $size), $textX, $y - ($index * $lineHeight), $size, $font);
        }
    }

    private function amountInWords(float $amount, ?string $currency): string
    {
        $integer = (int) floor(abs($amount));
        $cents = (int) round((abs($amount) - $integer) * 100);
        $currencyName = strtoupper($this->pdfCurrencyName($currency));
        return strtoupper(trim($this->numberToSpanish($integer))) . ' CON ' . str_pad((string) $cents, 2, '0', STR_PAD_LEFT) . '/100 ' . $currencyName;
    }

    private function numberToSpanish(int $number): string
    {
        if ($number === 0) return 'cero';

        $units = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciseis', 'diecisiete', 'dieciocho', 'diecinueve'];
        $tens = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
        $hundreds = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

        if ($number < 20) return $units[$number];
        if ($number < 30) return $number === 20 ? 'veinte' : 'veinti' . $units[$number - 20];
        if ($number < 100) return $tens[intdiv($number, 10)] . (($number % 10) ? ' y ' . $units[$number % 10] : '');
        if ($number === 100) return 'cien';
        if ($number < 1000) return $hundreds[intdiv($number, 100)] . (($number % 100) ? ' ' . $this->numberToSpanish($number % 100) : '');
        if ($number < 1000000) {
            $thousands = intdiv($number, 1000);
            $rest = $number % 1000;
            return ($thousands === 1 ? 'mil' : $this->numberToSpanish($thousands) . ' mil') . ($rest ? ' ' . $this->numberToSpanish($rest) : '');
        }

        return (string) $number;
    }

    private function fiscalPdfLogoImage(BillingDocument $document): ?array
    {
        $path = trim((string) $document->business?->fiscal_logo_path);
        if ($path === '' || !Storage::disk('public')->exists($path)) {
            return null;
        }

        $data = @file_get_contents(Storage::disk('public')->path($path));
        if ($data === false || $data === '') {
            return null;
        }

        $info = @getimagesizefromstring($data);
        if (!$info) {
            return null;
        }

        $width = (int) ($info[0] ?? 0);
        $height = (int) ($info[1] ?? 0);
        $mime = strtolower((string) ($info['mime'] ?? ''));
        if ($width <= 0 || $height <= 0) {
            return null;
        }

        if ($mime !== 'image/jpeg') {
            $converted = $this->convertImageDataToJpeg($data);
            if ($converted === null) {
                return null;
            }
            $data = $converted;
        }

        return [
            'name' => 'FiscalLogo',
            'width' => $width,
            'height' => $height,
            'data' => $data,
            'filter' => 'DCTDecode',
            'color_space' => 'DeviceRGB',
            'bits' => 8,
        ];
    }

    private function convertImageDataToJpeg(string $data): ?string
    {
        if (!function_exists('imagecreatefromstring') || !function_exists('imagecreatetruecolor') || !function_exists('imagejpeg')) {
            return null;
        }

        $source = @imagecreatefromstring($data);
        if (!$source) {
            return null;
        }

        $width = imagesx($source);
        $height = imagesy($source);
        $canvas = imagecreatetruecolor($width, $height);
        $white = imagecolorallocate($canvas, 255, 255, 255);
        imagefilledrectangle($canvas, 0, 0, $width, $height, $white);
        imagecopy($canvas, $source, 0, 0, 0, 0, $width, $height);

        ob_start();
        imagejpeg($canvas, null, 90);
        $jpeg = ob_get_clean();

        imagedestroy($source);
        imagedestroy($canvas);

        return is_string($jpeg) && $jpeg !== '' ? $jpeg : null;
    }

    private function fitPdfImage(int $sourceWidth, int $sourceHeight, float $maxWidth, float $maxHeight): array
    {
        if ($sourceWidth <= 0 || $sourceHeight <= 0) {
            return [$maxWidth, $maxHeight];
        }

        $scale = min($maxWidth / $sourceWidth, $maxHeight / $sourceHeight);
        return [max(1, $sourceWidth * $scale), max(1, $sourceHeight * $scale)];
    }

    private function pdfRect(array &$commands, float $x, float $y, float $w, float $h): void
    {
        $commands[] = $this->pdfNumber($x) . ' ' . $this->pdfNumber($y) . ' ' . $this->pdfNumber($w) . ' ' . $this->pdfNumber($h) . ' re S';
    }

    private function pdfLine(array &$commands, float $x1, float $y1, float $x2, float $y2): void
    {
        $commands[] = $this->pdfNumber($x1) . ' ' . $this->pdfNumber($y1) . ' m ' . $this->pdfNumber($x2) . ' ' . $this->pdfNumber($y2) . ' l S';
    }

    private function pdfImage(array &$commands, string $name, float $x, float $y, float $width, float $height): void
    {
        $name = preg_replace('/[^A-Za-z0-9]/', '', $name) ?: 'Image';
        $commands[] = 'q ' . $this->pdfNumber($width) . ' 0 0 ' . $this->pdfNumber($height) . ' ' . $this->pdfNumber($x) . ' ' . $this->pdfNumber($y) . ' cm /' . $name . ' Do Q';
    }

    private function pdfQrCode(array &$commands, string $text, float $x, float $y, float $size): void
    {
        try {
            $matrix = SimpleQrCode::matrix($text);
        } catch (\Throwable) {
            return;
        }

        $count = count($matrix);
        if ($count === 0) {
            return;
        }

        $module = $size / $count;
        foreach ($matrix as $rowIndex => $row) {
            foreach ($row as $columnIndex => $dark) {
                if (!$dark) {
                    continue;
                }

                $moduleX = $x + ($columnIndex * $module);
                $moduleY = $y + (($count - 1 - $rowIndex) * $module);
                $commands[] = $this->pdfNumber($moduleX) . ' ' . $this->pdfNumber($moduleY) . ' ' . $this->pdfNumber($module + 0.02) . ' ' . $this->pdfNumber($module + 0.02) . ' re f';
            }
        }
    }

    private function pdfText(array &$commands, string $text, float $x, float $y, float $size = 8, string $font = 'F1', ?float $boxWidth = null, string $align = 'L'): void
    {
        $text = $this->pdfTextValue($text);
        $actualX = $x;
        if ($boxWidth !== null && $align !== 'L') {
            $textWidth = $this->pdfApproxTextWidth($text, $size);
            if ($align === 'C') $actualX = $x + max(0, ($boxWidth - $textWidth) / 2);
            if ($align === 'R') $actualX = $x + max(0, $boxWidth - $textWidth);
        }

        $commands[] = 'BT /' . $font . ' ' . $this->pdfNumber($size) . ' Tf ' . $this->pdfNumber($actualX) . ' ' . $this->pdfNumber($y) . ' Td (' . $this->pdfEscape($text) . ') Tj ET';
    }

    private function pdfWrappedText(array &$commands, string $text, float $x, float $y, float $width, float $size = 8, float $lineHeight = 10, int $maxLines = 2): void
    {
        $lines = $this->pdfWrap($text, $width, $size, $maxLines);
        foreach ($lines as $index => $line) {
            $this->pdfText($commands, $line, $x, $y - ($index * $lineHeight), $size);
        }
    }

    private function pdfWrap(string $text, float $width, float $size, int $maxLines): array
    {
        $text = trim(preg_replace('/\s+/', ' ', $this->pdfTextValue($text)));
        if ($text === '') return ['-'];

        $words = explode(' ', $text);
        $lines = [];
        $current = '';
        foreach ($words as $word) {
            if ($this->pdfApproxTextWidth($word, $size) > $width) {
                if ($current !== '') {
                    $lines[] = $current;
                    $current = '';
                    if (count($lines) >= $maxLines) break;
                }

                $lines[] = $this->pdfFitText($word, $width, $size);
                if (count($lines) >= $maxLines) break;
                continue;
            }

            $candidate = trim($current . ' ' . $word);
            if ($current !== '' && $this->pdfApproxTextWidth($candidate, $size) > $width) {
                $lines[] = $current;
                $current = $word;
                if (count($lines) >= $maxLines) break;
            } else {
                $current = $candidate;
            }
        }
        if ($current !== '' && count($lines) < $maxLines) $lines[] = $current;
        if (count($lines) === $maxLines && count($words) > 0 && $this->pdfApproxTextWidth(implode(' ', $words), $size) > $width * $maxLines) {
            $lines[$maxLines - 1] = rtrim(substr($lines[$maxLines - 1], 0, 45)) . '...';
        }

        return $lines;
    }

    private function pdfFitText(string $text, float $width, float $size): string
    {
        $text = trim(preg_replace('/\s+/', ' ', $this->pdfTextValue($text)));
        if ($text === '') {
            return '-';
        }

        if ($this->pdfApproxTextWidth($text, $size) <= $width) {
            return $text;
        }

        $suffix = '...';
        while (mb_strlen($text) > 1 && $this->pdfApproxTextWidth($text . $suffix, $size) > $width) {
            $text = mb_substr($text, 0, -1);
        }

        return rtrim($text) . $suffix;
    }

    private function pdfApproxTextWidth(string $text, float $size): float
    {
        return strlen($this->pdfTextValue($text)) * $size * 0.62;
    }

    private function pdfNumber(float $value): string
    {
        return rtrim(rtrim(number_format($value, 3, '.', ''), '0'), '.');
    }

    private function pdfDocument(string $content, array $images = []): string
    {
        $xObjects = [];
        $imageObjects = [];
        $nextObjectId = 7;
        foreach ($images as $image) {
            $name = preg_replace('/[^A-Za-z0-9]/', '', (string) ($image['name'] ?? 'Image' . $nextObjectId)) ?: 'Image' . $nextObjectId;
            $data = (string) ($image['data'] ?? '');
            if ($data === '') {
                continue;
            }

            $xObjects[] = '/' . $name . ' ' . $nextObjectId . ' 0 R';
            $imageObjects[] = $nextObjectId . ' 0 obj << /Type /XObject /Subtype /Image /Width ' . (int) ($image['width'] ?? 1)
                . ' /Height ' . (int) ($image['height'] ?? 1)
                . ' /ColorSpace /' . preg_replace('/[^A-Za-z0-9]/', '', (string) ($image['color_space'] ?? 'DeviceRGB'))
                . ' /BitsPerComponent ' . (int) ($image['bits'] ?? 8)
                . ' /Filter /' . preg_replace('/[^A-Za-z0-9]/', '', (string) ($image['filter'] ?? 'DCTDecode'))
                . ' /Length ' . strlen($data) . " >> stream\n" . $data . "\nendstream endobj";
            $nextObjectId++;
        }

        $resources = '/Font << /F1 5 0 R /F2 6 0 R >>';
        if (!empty($xObjects)) {
            $resources .= ' /XObject << ' . implode(' ', $xObjects) . ' >>';
        }

        $objects = [
            '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
            '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
            '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << ' . $resources . ' >> /Contents 4 0 R >> endobj',
            '4 0 obj << /Length ' . strlen($content) . " >> stream\n" . $content . 'endstream endobj',
            '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
            '6 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj',
        ];
        $objects = array_merge($objects, $imageObjects);

        $pdf = "%PDF-1.4\n";
        $offsets = [0];
        foreach ($objects as $object) {
            $offsets[] = strlen($pdf);
            $pdf .= $object . "\n";
        }

        $xref = strlen($pdf);
        $pdf .= "xref\n0 " . count($offsets) . "\n";
        $pdf .= "0000000000 65535 f \n";
        for ($i = 1; $i < count($offsets); $i++) {
            $pdf .= str_pad((string) $offsets[$i], 10, '0', STR_PAD_LEFT) . " 00000 n \n";
        }

        $pdf .= "trailer << /Size " . count($offsets) . " /Root 1 0 R >>\n";
        $pdf .= "startxref\n{$xref}\n%%EOF\n";

        return $pdf;
    }

    private function pdfFromLines(array $lines): string
    {
        $content = "BT\n/F1 11 Tf\n50 760 Td\n16 TL\n";
        foreach ($lines as $index => $line) {
            if ($index > 0) {
                $content .= "T*\n";
            }
            $content .= '(' . $this->pdfEscape($this->pdfTextValue((string) $line)) . ") Tj\n";
        }
        $content .= "ET\n";

        $objects = [
            '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
            '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
            '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >> endobj',
            '4 0 obj << /Length ' . strlen($content) . " >> stream\n" . $content . 'endstream endobj',
            '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
        ];

        $pdf = "%PDF-1.4\n";
        $offsets = [0];
        foreach ($objects as $object) {
            $offsets[] = strlen($pdf);
            $pdf .= $object . "\n";
        }

        $xref = strlen($pdf);
        $pdf .= "xref\n0 " . count($offsets) . "\n";
        $pdf .= "0000000000 65535 f \n";
        for ($i = 1; $i < count($offsets); $i++) {
            $pdf .= str_pad((string) $offsets[$i], 10, '0', STR_PAD_LEFT) . " 00000 n \n";
        }

        $pdf .= "trailer << /Size " . count($offsets) . " /Root 1 0 R >>\n";
        $pdf .= "startxref\n{$xref}\n%%EOF\n";

        return $pdf;
    }

    private function pdfTextValue(string $value): string
    {
        $text = strip_tags($value);
        $converted = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text);
        return $converted !== false ? $converted : preg_replace('/[^\x20-\x7E]/', '', $text);
    }

    private function pdfEscape(string $value): string
    {
        return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $value);
    }

    private function fallbackContentType(string $type): string
    {
        return match ($type) {
            'pdf' => 'application/pdf',
            'xml' => 'application/xml',
            default => 'application/octet-stream',
        };
    }

    private function decodeJson(?string $payload): array
    {
        if (!$payload) {
            return [];
        }

        $decoded = json_decode($payload, true);
        return is_array($decoded) ? $decoded : [];
    }

    private function loadTemplate(string $filename): array
    {
        $path = trim((string) config('facturadorpro5.demo_template_path', 'demo/facturadorpro5'), '/');
        $fullPath = "{$path}/{$filename}";
        if (!Storage::exists($fullPath)) {
            return [];
        }

        $decoded = json_decode((string) Storage::get($fullPath), true);
        return is_array($decoded) ? $decoded : [];
    }

    private function makeUrl(string $endpoint): string
    {
        $baseUrl = rtrim((string) $this->connectionValue('base_url'), '/');
        $endpoint = '/' . ltrim($endpoint, '/');

        if (str_ends_with($baseUrl, '/api') && str_starts_with($endpoint, '/api/')) {
            return $baseUrl . substr($endpoint, 4);
        }

        if (str_ends_with($baseUrl, '/api') && $endpoint === '/api') {
            return $baseUrl;
        }

        return $baseUrl . $endpoint;
    }

    private function resolveAppBaseUrl(): string
    {
        return preg_replace('#/api/?$#', '', rtrim((string) $this->connectionValue('base_url'), '/'));
    }

    private function usesDemoMode(): bool
    {
        return $this->mode() === 'demo';
    }

    private function mode(): string
    {
        return trim((string) config('facturadorpro5.mode', 'demo')) ?: 'demo';
    }
}
