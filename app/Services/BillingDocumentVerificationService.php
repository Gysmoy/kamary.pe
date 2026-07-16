<?php

namespace App\Services;

use App\Models\BillingDocument;
use App\Support\BusinessScope;
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

    public function isVerifiableDocument(BillingDocument $document): bool
    {
        $document->loadMissing('business');

        return in_array((string) $document->business?->business_key, BusinessScope::fixedKeys(), true);
    }

    public function providerXmlUrl(BillingDocument $document): ?string
    {
        // Solo si el proveedor ya genero el XML fiscal.
        $payload = $this->decodePayload($document->response_payload);
        $providerUrl = trim((string) (
            Arr::get($payload, 'links.xml')
            ?: Arr::get($payload, 'response.links.xml')
            ?: Arr::get($payload, 'data.xml_url')
            ?: Arr::get($payload, 'data.xml')
            ?: Arr::get($payload, 'xml_url')
            ?: Arr::get($payload, 'xml')
        ));

        if ($providerUrl === '' || !$document->getKey()) {
            return null;
        }

        // La URL del proveedor (http://facturador-nginx/...) es interna del servidor y no
        // es accesible desde el navegador; se expone una URL publica de Kamary que hace de proxy.
        return route('billing-documents.file', [
            'document' => $document->getKey(),
            'token' => $this->verificationToken($document),
            'type' => 'xml',
        ], true);
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
