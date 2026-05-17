<?php

namespace App\Services\Integrations;

use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

class MultivendeClient
{
    public function getCheckoutsLight(string $fromUtc, string $toUtc, int $limit = 50, ?string $scrollId = null, ?string $marketplaceConnectionId = null): array
    {
        $limit = max(50, min(1000, $limit));
        $query = [
            '_updated_at_from' => $fromUtc,
            '_updated_at_to' => $toUtc,
        ];

        if ($scrollId) $query['_scroll_id'] = $scrollId;
        if ($marketplaceConnectionId) $query['_marketplace_connection_id'] = $marketplaceConnectionId;

        return $this->getConfigured('checkouts_light', ['limit' => $limit], $query);
    }

    public function getCheckout(string $checkoutId): array
    {
        return $this->getConfigured('checkout', ['checkout_id' => $checkoutId]);
    }

    public function getDeliveryOrder(string $deliveryOrderId): array
    {
        return $this->getConfigured('delivery_order', ['delivery_order_id' => $deliveryOrderId]);
    }

    public function updateDeliveryOrderStatus(string $deliveryOrderId, string $deliveryOrderStatusId, ?string $comment = null): array
    {
        return $this->postConfigured('delivery_status', ['delivery_order_id' => $deliveryOrderId], [
            'DeliveryOrderStatusId' => $deliveryOrderStatusId,
            'comment' => $comment,
        ]);
    }

    public function updateDeliveryOrderTracking(string $deliveryOrderId, ?string $trackingNumber, ?string $trackingUrl = null): array
    {
        return $this->putConfigured('delivery_tracking', ['delivery_order_id' => $deliveryOrderId], [
            'trackingNumber' => $trackingNumber,
            'trackingUrl' => $trackingUrl,
        ]);
    }

    public function bulkUpdateStock(string $warehouseId, array $items): array
    {
        return $this->postConfigured('bulk_stock', ['warehouse_id' => $warehouseId], [
            'warehouse_id' => $warehouseId,
            'items' => array_values($items),
        ]);
    }

    public function createCheckoutDte(string $checkoutId, array $payload): array
    {
        return $this->postConfigured('checkout_dte', ['checkout_id' => $checkoutId], $payload);
    }

    public function createDeliveryOrderDte(string $deliveryOrderId, array $payload): array
    {
        return $this->postConfigured('delivery_dte', ['delivery_order_id' => $deliveryOrderId], $payload);
    }

    public function authenticateWithCode(string $code): array
    {
        return $this->postConfigured('auth', [], [
            'client_id' => $this->clientId(),
            'client_secret' => $this->clientSecret(),
            'grant_type' => 'authorization_code',
            'code' => $code,
        ], false);
    }

    public function refreshAccessToken(?string $refreshToken = null): array
    {
        return $this->postConfigured('refresh', [], [
            'client_id' => $this->clientId(),
            'client_secret' => $this->clientSecret(),
            'grant_type' => 'refresh_token',
            'refresh_token' => $refreshToken ?: config('integrations.multivende.refresh_token'),
        ], false);
    }

    private function getConfigured(string $key, array $pathParams = [], array $query = []): array
    {
        return $this->decode(
            $this->http()
                ->withToken($this->accessToken())
                ->get($this->url($key, $pathParams), $query)
        );
    }

    private function postConfigured(string $key, array $pathParams, array $payload, bool $authenticated = true): array
    {
        $client = $this->http();
        if ($authenticated) $client = $client->withToken($this->accessToken());

        return $this->decode($client->post($this->url($key, $pathParams), $payload));
    }

    private function putConfigured(string $key, array $pathParams, array $payload): array
    {
        return $this->decode(
            $this->http()
                ->withToken($this->accessToken())
                ->put($this->url($key, $pathParams), $payload)
        );
    }

    private function http()
    {
        return Http::timeout((int) config('integrations.multivende.timeout', 30))
            ->acceptJson()
            ->asJson()
            ->withOptions([
                'verify' => filter_var(config('integrations.multivende.verify_ssl', true), FILTER_VALIDATE_BOOLEAN),
            ]);
    }

    private function url(string $key, array $params = []): string
    {
        $path = config("integrations.multivende.paths.{$key}");
        if (!$path) {
            throw new \RuntimeException("Ruta Multivende no configurada: {$key}");
        }

        $params = array_merge([
            'merchant_id' => config('integrations.multivende.merchant_id'),
        ], $params);

        foreach ($params as $name => $value) {
            $path = str_replace('{' . $name . '}', rawurlencode((string) $value), $path);
        }

        if (preg_match('/\{[a-zA-Z0-9_]+\}/', $path)) {
            throw new \RuntimeException("Faltan parametros para ruta Multivende: {$path}");
        }

        return rtrim((string) config('integrations.multivende.base_url'), '/') . '/' . ltrim($path, '/');
    }

    private function decode(Response $response): array
    {
        $body = $response->json();
        if ($response->failed()) {
            $message = is_array($body) ? json_encode($body, JSON_UNESCAPED_UNICODE) : $response->body();
            throw new \RuntimeException("Error Multivende HTTP {$response->status()}: {$message}");
        }

        return is_array($body) ? $body : ['raw' => $response->body()];
    }

    private function accessToken(): string
    {
        $token = trim((string) config('integrations.multivende.access_token'));
        if ($token === '') throw new \RuntimeException('MULTIVENDE_ACCESS_TOKEN no configurado');
        return $token;
    }

    private function clientId(): string
    {
        $clientId = trim((string) config('integrations.multivende.client_id'));
        if ($clientId === '') throw new \RuntimeException('MULTIVENDE_CLIENT_ID no configurado');
        return $clientId;
    }

    private function clientSecret(): string
    {
        $clientSecret = trim((string) config('integrations.multivende.client_secret'));
        if ($clientSecret === '') throw new \RuntimeException('MULTIVENDE_CLIENT_SECRET no configurado');
        return $clientSecret;
    }
}
