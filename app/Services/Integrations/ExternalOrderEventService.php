<?php

namespace App\Services\Integrations;

use App\Models\CommercialOrder;
use App\Models\IntegrationLog;

class ExternalOrderEventService
{
    public function recordOrderStatus(CommercialOrder $order, string $reason = 'status_changed'): void
    {
        if (!$order->external_source || !$order->external_order_id) return;

        IntegrationLog::create([
            'provider' => $order->external_source,
            'direction' => 'outbound',
            'event_type' => 'order_status',
            'external_id' => $order->external_order_id,
            'status' => 'pending',
            'request_payload' => [
                'reason' => $reason,
                'commercial_order_id' => $order->id,
                'commercial_order_code' => $order->code,
                'external_order_id' => $order->external_order_id,
                'external_checkout_id' => $order->external_checkout_id,
                'external_delivery_order_id' => $order->external_delivery_order_id,
                'order_status' => $order->order_status,
                'dispatch_status' => $order->dispatch_status,
                'billing_status' => $order->billing_status,
            ],
            'message' => 'Evento pendiente de envio. Falta configurar catalogo de estados/API OMS.',
        ]);

        $order->update([
            'external_sync_status' => 'pending_status_sync',
        ]);
    }
}
