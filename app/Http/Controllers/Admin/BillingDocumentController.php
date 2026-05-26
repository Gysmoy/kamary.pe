<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\BillingDocument;
use App\Models\CommercialOrder;
use App\Models\ServiceOrder;
use App\Models\Warehouse;
use App\Services\BillingDocumentService;
use App\Services\FacturadorPro5Service;
use App\Support\BusinessScope;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use SoDe\Extend\Response;

class BillingDocumentController extends BasicController
{
    public $model = BillingDocument::class;
    public $reactView = 'Admin/BillingDocuments';
    public $prefix4filter = 'billing_documents';

    public function setReactViewProperties(Request $request)
    {
        return ['requiredPermission' => 'services-billing'];
    }

    public function setPaginationInstance(string $model)
    {
        $query = $model::select('billing_documents.*')
            ->with([
                'business:id,name,tax_number,soap_send_id,soap_type_id,soap_username,soap_password,detraction_account,facturador_company_id,facturador_sync_status,status',
                'branch:id,business_id,name,establishment_code,ubigeo,address,email,telephone,facturador_establishment_id,facturador_sync_status,facturador_sync_message,facturador_last_sync_at,series_factura,series_boleta,series_nota_credito,status',
                'warehouse:id,name',
                'client:id,full_name,document_type,document_number,email,billing_email,phone,ubigeo,full_address',
                'eventualClient:id,business_name,document_type,document_number,email,phone,address',
                'commercialOrder:id,code,billing_status,dispatch_status,total,ubigeo,delivery_address,dispatch_contact_phone',
                'serviceOrder:id,code,order_status,billing_status,total',
                'referenceDocument:id,code,document_type,series,sequence,local_status,total',
                'items:id,billing_document_id,commercial_order_item_id,service_order_item_id,item_type,item_code,description,quantity,unit_price,total,metadata,status',
                'events:id,billing_document_id,event_type,local_status,external_status,message,created_at',
                'creator:id,name,lastname,username,fullname', 'updater:id,name,lastname,username,fullname',
            ])
            ->join('users as creator', 'creator.id', '=', 'billing_documents.created_by')
            ->join('users as updater', 'updater.id', '=', 'billing_documents.updated_by');

        $scopeKey = BusinessScope::scopedKeyForRequest(request());
        $query->whereHas('business', function ($business) use ($scopeKey) {
            $business->whereIn('business_key', BusinessScope::fixedKeys());
            if ($scopeKey) $business->where('business_key', $scopeKey);
        });

        return $query;
    }

    protected function billingDocumentQueryForRequest(Request $request)
    {
        return BillingDocument::query();
    }

    protected function findBillingDocumentForRequest(Request $request, string|int $id, array $with = []): BillingDocument
    {
        return $this->billingDocumentQueryForRequest($request)
            ->with($with)
            ->findOrFail($id);
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $userId = Auth::id();
        $id = $body['id'] ?? null;
        $commercialOrderId = $this->toNullableInt($body['commercial_order_id'] ?? null);
        $serviceOrderId = $this->toNullableInt($body['service_order_id'] ?? null);

        if (!$id && !$commercialOrderId && !$serviceOrderId) throw new \Exception('Debes seleccionar un pedido comercial u orden de servicio');
        if ($commercialOrderId && $serviceOrderId) throw new \Exception('No puedes mezclar pedido comercial y orden de servicio en el mismo comprobante');

        $document = $id ? $this->findBillingDocumentForRequest($request, $id) : null;
        if ($document && $document->local_status !== 'pending') {
            throw new \Exception('Solo puedes editar comprobantes pendientes');
        }

        $sourceType = $commercialOrderId ? 'commercial_order' : ($serviceOrderId ? 'service_order' : $document?->source_type);
        $sourceId = $commercialOrderId ?: ($serviceOrderId ?: $document?->source_id);

        $businessId = $document?->business_id;
        $branchId = $document?->business_branch_id;
        $warehouseId = $document?->warehouse_id;
        $clientId = $document?->client_id;
        $eventualClientId = $document?->eventual_client_id;
        $subtotal = $document?->subtotal ?? 0;
        $taxAmount = $document?->tax_amount ?? 0;
        $total = $document?->total ?? 0;
        $currency = $document?->currency ?? 'PEN';
        $paymentCondition = $document?->payment_condition;
        $paymentMethod = $document?->payment_method;
        $customerEmail = $document?->customer_email;
        $dueDate = $document?->due_date?->format('Y-m-d');
        $defaultDocumentType = $document?->document_type ?? 'Factura';

        if ($sourceType === 'commercial_order') {
            $source = CommercialOrder::findOrFail($sourceId);
            $businessId = $source->business_id;
            $branchId = $source->business_branch_id;
            $warehouseId = $source->warehouse_id;
            $clientId = $source->client_id;
            $eventualClientId = $source->eventual_client_id;
            $subtotal = $source->subtotal;
            $taxAmount = $source->tax_amount;
            $total = $source->total;
            $currency = $source->currency;
            $paymentCondition = $paymentCondition ?: $source->payment_condition;
            $paymentMethod = $paymentMethod ?: $source->payment_method;
            $dueDate = $dueDate ?: optional($source->first_due_date)->format('Y-m-d');
            $defaultDocumentType = $defaultDocumentType ?: ($source->document_type ?: 'Factura');
        }
        if ($sourceType === 'service_order') {
            $source = ServiceOrder::findOrFail($sourceId);
            $businessId = $source->business_id;
            $branchId = $source->business_branch_id;
            $warehouseId = null;
            $clientId = $source->client_id;
            $eventualClientId = null;
            $subtotal = $source->subtotal;
            $taxAmount = $source->tax_amount;
            $total = $source->total;
            $currency = $source->currency;
            $paymentCondition = $paymentCondition ?: $source->payment_condition;
            $dueDate = $dueDate ?: optional($source->first_due_date)->format('Y-m-d');
            $defaultDocumentType = $defaultDocumentType ?: ($source->expected_document_type ?: 'Factura');
        }

        if (!$businessId) {
            throw new \Exception('Falta la empresa del origen de facturacion');
        }
        $business = BusinessScope::findFixedBusinessForRequest($businessId, $request);
        if ($warehouseId) {
            $warehouse = Warehouse::findOrFail($warehouseId);
            $branchId = BusinessScope::branchIdFromWarehouse($business, $warehouse, $branchId);
        } else {
            $branch = BusinessScope::requireBranchForBusiness($business, $branchId);
            $branchId = (int) $branch->id;
        }

        $metadata = $this->normalizeArray($body['metadata'] ?? ($document?->metadata ?? []));
        $metadata = array_merge($metadata, array_filter([
            'detraction_enabled' => filter_var($body['detraction_enabled'] ?? Arr::get($metadata, 'detraction_enabled'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE),
            'detraction_percent' => $this->toNullableFloat($body['detraction_percent'] ?? Arr::get($metadata, 'detraction_percent')),
            'detraction_amount' => $this->toNullableFloat($body['detraction_amount'] ?? Arr::get($metadata, 'detraction_amount')),
            'customer_email_cc' => trim((string) ($body['customer_email_cc'] ?? Arr::get($metadata, 'customer_email_cc'))),
        ], fn($value) => !is_null($value) && $value !== ''));

        if (!$id) {
            DB::table('businesses')->where('id', $businessId)->lockForUpdate()->value('id');
            $body['code'] = $this->nextCode();
            $body['created_by'] = $userId;
            $body['status'] = true;
            $body['provider'] = 'facturadorpro5';
        }

        $body['updated_by'] = $userId;
        $body['source_type'] = $sourceType;
        $body['source_id'] = $sourceId;
        $body['commercial_order_id'] = $sourceType === 'commercial_order' ? $sourceId : null;
        $body['service_order_id'] = $sourceType === 'service_order' ? $sourceId : null;
        $body['reference_billing_document_id'] = $this->toNullableInt($body['reference_billing_document_id'] ?? $document?->reference_billing_document_id);
        $body['business_id'] = $businessId;
        $body['business_branch_id'] = $branchId;
        $body['warehouse_id'] = $warehouseId;
        $body['client_id'] = $clientId;
        $body['eventual_client_id'] = $eventualClientId;
        $body['document_type'] = trim((string) ($body['document_type'] ?? $defaultDocumentType)) ?: 'Factura';
        $body['series'] = trim((string) ($body['series'] ?? '')) ?: null;
        $body['sequence'] = trim((string) ($body['sequence'] ?? '')) ?: null;
        $body['issue_date'] = $this->normalizeDate($body['issue_date'] ?? now()->toDateString());
        $body['due_date'] = $this->normalizeDate($body['due_date'] ?? $dueDate);
        $body['currency'] = strtoupper(trim((string) ($body['currency'] ?? $currency)));
        $body['payment_condition'] = trim((string) ($body['payment_condition'] ?? $paymentCondition)) ?: null;
        $body['payment_method'] = trim((string) ($body['payment_method'] ?? $paymentMethod)) ?: null;
        $body['customer_email'] = trim((string) ($body['customer_email'] ?? $customerEmail)) ?: null;
        $body['local_status'] = $this->normalizeLocalStatus($body['local_status'] ?? ($document?->local_status ?? 'pending'));
        $body['external_status'] = trim((string) ($body['external_status'] ?? ($document?->external_status ?? 'draft'))) ?: 'draft';
        $body['external_id'] = trim((string) ($body['external_id'] ?? '')) ?: null;
        $body['external_reference'] = trim((string) ($body['external_reference'] ?? '')) ?: null;
        $body['provider_endpoint'] = trim((string) ($body['provider_endpoint'] ?? '')) ?: null;
        $body['provider_mode'] = trim((string) ($body['provider_mode'] ?? config('facturadorpro5.mode', 'demo'))) ?: 'demo';
        $body['error_message'] = trim((string) ($body['error_message'] ?? '')) ?: null;
        $body['observations'] = trim((string) ($body['observations'] ?? '')) ?: null;
        $body['subtotal'] = $subtotal;
        $body['tax_amount'] = $taxAmount;
        $body['total'] = $total;
        $body['metadata'] = $metadata;

        return $body;
    }

    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        DB::beginTransaction();
        try {
            $prepared = app(BillingDocumentService::class)->prepareDocument($jpa);
            app(BillingDocumentService::class)->registerEvent($prepared, $isNew ? 'prepared' : 'updated', [
                'message' => $isNew ? 'Documento preparado para integracion REST' : 'Documento actualizado y preparado para integracion REST',
            ]);
            DB::commit();
            return $prepared->fresh(['business', 'branch', 'warehouse', 'client', 'eventualClient', 'commercialOrder', 'serviceOrder', 'referenceDocument', 'items', 'events', 'creator', 'updater']);
        } catch (\Throwable $th) {
            DB::rollBack();
            throw $th;
        }
    }

    public function connectorPayload(Request $request, string $id): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            $document = $this->findBillingDocumentForRequest($request, $id, ['items', 'client', 'eventualClient', 'commercialOrder', 'serviceOrder', 'referenceDocument']);
            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = app(BillingDocumentService::class)->buildConnectorPayload($document);
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function issue(Request $request, string $id): HttpResponse|ResponseFactory
    {
        $response = new Response();
        DB::beginTransaction();
        try {
            $document = $this->findBillingDocumentForRequest($request, $id);
            $updated = app(BillingDocumentService::class)->issueDocument($document);
            DB::commit();
            $response->status = 200;
            $response->message = 'Comprobante emitido correctamente';
            $response->data = $updated;
        } catch (\Throwable $th) {
            DB::rollBack();
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function prepareVoucher(Request $request, string $id): HttpResponse|ResponseFactory
    {
        $response = new Response();
        DB::beginTransaction();
        try {
            $document = $this->findBillingDocumentForRequest($request, $id);
            $updated = app(BillingDocumentService::class)->prepareVoucher($document, $request->only([
                'detraction_enabled',
                'detraction_percent',
                'detraction_amount',
                'detraction_code',
                'detraction_payment_method_code',
            ]));
            DB::commit();
            $response->status = 200;
            $response->message = 'Comprobante preparado';
            $response->data = $updated;
        } catch (\Throwable $th) {
            DB::rollBack();
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function cancel(Request $request, string $id): HttpResponse|ResponseFactory
    {
        $response = new Response();
        DB::beginTransaction();
        try {
            $document = $this->findBillingDocumentForRequest($request, $id);
            $updated = app(BillingDocumentService::class)->cancelDocument($document, trim((string) $request->input('reason')));
            DB::commit();
            $response->status = 200;
            $response->message = 'Comprobante anulado correctamente';
            $response->data = $updated;
        } catch (\Throwable $th) {
            DB::rollBack();
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function creditNote(Request $request, string $id): HttpResponse|ResponseFactory
    {
        $response = new Response();
        DB::beginTransaction();
        try {
            $document = $this->findBillingDocumentForRequest($request, $id);
            $updated = app(BillingDocumentService::class)->createCreditNote($document, [
                'series' => trim((string) $request->input('series')),
                'issue_date' => $this->normalizeDate($request->input('issue_date') ?? now()->toDateString()),
                'reason' => trim((string) $request->input('reason')) ?: 'Anulacion de la operacion',
                'note' => trim((string) $request->input('note')) ?: null,
            ]);
            DB::commit();
            $response->status = 200;
            $response->message = 'Nota de credito emitida correctamente';
            $response->data = $updated;
        } catch (\Throwable $th) {
            DB::rollBack();
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function registerProviderResponse(Request $request, string $id): HttpResponse|ResponseFactory
    {
        $response = new Response();
        DB::beginTransaction();
        try {
            $document = $this->findBillingDocumentForRequest($request, $id);
            $localStatus = $this->normalizeLocalStatus($request->input('local_status') ?? $document->local_status);
            $externalStatus = trim((string) ($request->input('external_status') ?? $document->external_status)) ?: $document->external_status;
            $externalId = trim((string) ($request->input('external_id') ?? '')) ?: null;
            $externalReference = trim((string) ($request->input('external_reference') ?? '')) ?: null;
            $errorMessage = trim((string) ($request->input('error_message') ?? '')) ?: null;
            $responsePayload = $request->input('response_payload');
            $sentAt = in_array($localStatus, ['sent', 'accepted', 'observed', 'rejected'], true) ? now() : null;
            $acceptedAt = $localStatus === 'accepted' ? now() : null;
            $cancelledAt = $localStatus === 'cancelled' ? now() : null;

            $document->update([
                'local_status' => $localStatus,
                'external_status' => $externalStatus,
                'external_id' => $externalId,
                'external_reference' => $externalReference,
                'response_payload' => is_array($responsePayload) ? json_encode($responsePayload, JSON_UNESCAPED_UNICODE) : (is_string($responsePayload) ? $responsePayload : $document->response_payload),
                'error_message' => $errorMessage,
                'sent_at' => $sentAt ?: $document->sent_at,
                'accepted_at' => $acceptedAt,
                'cancelled_at' => $cancelledAt,
                'updated_by' => Auth::id(),
            ]);

            app(BillingDocumentService::class)->registerEvent($document->fresh(), 'provider_response', [
                'local_status' => $localStatus,
                'external_status' => $externalStatus,
                'response_payload' => is_array($responsePayload) ? $responsePayload : null,
                'message' => $errorMessage ?: 'Respuesta registrada manualmente',
            ]);
            app(BillingDocumentService::class)->syncSourceBillingStatus($document->fresh());

            DB::commit();
            $response->status = 200;
            $response->message = 'Estado del proveedor actualizado';
            $response->data = $this->findBillingDocumentForRequest($request, $id, ['business', 'branch', 'warehouse', 'client', 'eventualClient', 'commercialOrder', 'serviceOrder', 'referenceDocument', 'items', 'events', 'creator', 'updater']);
        } catch (\Throwable $th) {
            DB::rollBack();
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function providerStatus(Request $request, string $id): HttpResponse|ResponseFactory
    {
        $response = new Response();
        DB::beginTransaction();
        try {
            $document = $this->findBillingDocumentForRequest($request, $id);
            $updated = app(BillingDocumentService::class)->syncProviderStatus($document);
            DB::commit();
            $response->status = 200;
            $response->message = 'Estado sincronizado con el proveedor';
            $response->data = $updated;
        } catch (\Throwable $th) {
            DB::rollBack();
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function download(Request $request, string $id, string $type): HttpResponse|ResponseFactory
    {
        try {
            $document = $this->findBillingDocumentForRequest($request, $id);
            $file = app(FacturadorPro5Service::class)->downloadFile($document, $type);

            return response($file['content'], 200, [
                'Content-Type' => $file['content_type'],
                'Content-Disposition' => 'inline; filename="' . $file['filename'] . '"',
                'Cache-Control' => 'private, max-age=0, must-revalidate',
            ]);
        } catch (\Throwable $th) {
            return response([
                'status' => 400,
                'message' => $th->getMessage(),
            ], 400);
        }
    }

    public function status(Request $request)
    {
        $response = new Response();
        try {
            $document = $this->findBillingDocumentForRequest($request, $request->id);
            if ($document->local_status !== 'pending') {
                throw new \Exception('Solo puedes cambiar el estado interno de comprobantes pendientes');
            }

            $document->update([
                'status' => $request->status ? 0 : 1,
                'updated_by' => Auth::id(),
            ]);

            $response->status = 200;
            $response->message = 'Operacion correcta';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function delete(Request $request, string $id)
    {
        $response = new Response();
        try {
            $document = $this->findBillingDocumentForRequest($request, $id);
            if ($document->local_status !== 'pending') {
                throw new \Exception('Solo puedes eliminar comprobantes pendientes');
            }

            $document->update([
                'status' => null,
                'updated_by' => Auth::id(),
            ]);

            $response->status = 200;
            $response->message = 'Operacion correcta';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    private function toNullableInt($value): ?int
    {
        if ($value === null) return null;
        $text = trim((string) $value);
        if ($text === '') return null;
        if (!ctype_digit(ltrim($text, '+'))) throw new \Exception("Valor entero invalido: {$value}");
        return (int) $text;
    }

    private function toNullableFloat($value): ?float
    {
        if ($value === null) return null;
        $text = trim((string) $value);
        if ($text === '') return null;
        if (!is_numeric($text)) throw new \Exception("Valor decimal invalido: {$value}");
        return round((float) $text, 2);
    }

    private function normalizeDate($value): ?string
    {
        if ($value === null) return null;
        $text = trim((string) $value);
        if ($text === '') return null;
        $timestamp = strtotime($text);
        if ($timestamp === false) throw new \Exception("Fecha invalida: {$value}");
        return date('Y-m-d', $timestamp);
    }

    private function normalizeLocalStatus($value): string
    {
        $allowed = ['pending', 'sent', 'accepted', 'observed', 'rejected', 'cancelled'];
        $normalized = mb_strtolower(trim((string) $value));
        return in_array($normalized, $allowed, true) ? $normalized : 'pending';
    }

    private function normalizeArray($value): array
    {
        if (is_array($value)) return $value;
        if (is_string($value) && trim($value) !== '') {
            $decoded = json_decode($value, true);
            return is_array($decoded) ? $decoded : [];
        }
        return [];
    }

    private function nextCode(): string
    {
        $next = 1;
        $latest = BillingDocument::query()->lockForUpdate()->latest('id')->value('code');
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) $next = ((int) $matches[1]) + 1;
        return 'FAC-' . str_pad((string) $next, 6, '0', STR_PAD_LEFT);
    }
}
