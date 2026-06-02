<?php

namespace App\Services;

use App\Models\BillingDocument;
use Illuminate\Support\Arr;

class BillingDocumentVerificationService
{
    public function verificationUrl(BillingDocument $document): string
    {
        if (!$document->getKey()) {
            return url('/');
        }

        return route('billing-documents.verify', [
            'document' => $document->getKey(),
            'token' => $this->verificationToken($document),
        ], true);
    }

    public function verificationToken(BillingDocument $document): string
    {
        return substr(hash_hmac('sha256', $this->signaturePayload($document), (string) config('app.key')), 0, 24);
    }

    public function isValidToken(BillingDocument $document, string $token): bool
    {
        return hash_equals($this->verificationToken($document), trim($token));
    }

    public function isStorageDocument(BillingDocument $document): bool
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

    public function providerXmlUrl(BillingDocument $document): ?string
    {
        $payload = $this->decodePayload($document->response_payload);
        $url = Arr::get($payload, 'links.xml')
            ?: Arr::get($payload, 'response.links.xml')
            ?: Arr::get($payload, 'data.xml_url')
            ?: Arr::get($payload, 'data.xml')
            ?: Arr::get($payload, 'xml_url')
            ?: Arr::get($payload, 'xml');

        $url = trim((string) $url);
        if ($url === '') {
            return null;
        }

        if (preg_match('/^https?:\/\//i', $url)) {
            return $url;
        }

        return url('/' . ltrim($url, '/'));
    }

    private function signaturePayload(BillingDocument $document): string
    {
        return implode('|', [
            $document->getKey(),
            $document->code,
            $document->business_id,
            optional($document->created_at)->timestamp,
        ]);
    }

    private function decodePayload($payload): array
    {
        if (is_array($payload)) {
            return $payload;
        }

        if (!is_string($payload) || trim($payload) === '') {
            return [];
        }

        $decoded = json_decode($payload, true);
        return is_array($decoded) ? $decoded : [];
    }
}
