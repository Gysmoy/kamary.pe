<?php

namespace App\Services;

use App\Models\CommercialOrder;
use App\Models\CommercialOrderTrackingEvent;
use App\Models\DeliveryEvidence;
use App\Models\Dispatch;
use App\Models\ReferralGuide;
use Illuminate\Support\Facades\Auth;

class CommercialOrderTrackingService
{
    public function record(
        CommercialOrder $order,
        string $eventType,
        string $title,
        ?string $eventStatus = null,
        ?string $description = null,
        array $metadata = [],
        ?int $dispatchId = null,
        ?int $referralGuideId = null,
        mixed $happenedAt = null
    ): CommercialOrderTrackingEvent {
        return CommercialOrderTrackingEvent::create([
            'commercial_order_id' => $order->id,
            'dispatch_id' => $dispatchId,
            'referral_guide_id' => $referralGuideId,
            'event_type' => $eventType,
            'event_status' => $eventStatus,
            'title' => $title,
            'description' => $description,
            'happened_at' => $happenedAt ?: now(),
            'metadata' => empty($metadata) ? null : $metadata,
            'status' => true,
            'created_by' => Auth::id(),
            'updated_by' => Auth::id(),
        ]);
    }

    public function recordStatusChange(CommercialOrder $order, string $field, string $status, ?Dispatch $dispatch = null): CommercialOrderTrackingEvent
    {
        $fieldLabel = match ($field) {
            'order_status' => 'Estado comercial',
            'dispatch_status' => 'Estado de despacho',
            'billing_status' => 'Estado de facturacion',
            default => 'Estado',
        };

        return $this->record(
            $order,
            'status_change',
            "{$fieldLabel}: " . $this->statusLabel($status),
            $status,
            null,
            ['field' => $field],
            $dispatch?->id
        );
    }

    public function recordReferralGuide(CommercialOrder $order, ReferralGuide $guide): CommercialOrderTrackingEvent
    {
        $number = $guide->external_reference ?: trim(implode('-', array_filter([$guide->series, $guide->sequence]))) ?: $guide->code;

        return $this->record(
            $order,
            'referral_guide',
            "Guia de remision {$number}",
            $guide->guide_status,
            $this->statusLabel($guide->guide_status),
            ['guide_code' => $guide->code],
            $guide->dispatch_id,
            $guide->id,
            $guide->issue_date ?: now()
        );
    }

    public function recordDeliveryEvidence(CommercialOrder $order, DeliveryEvidence $evidence): CommercialOrderTrackingEvent
    {
        return $this->record(
            $order,
            'delivery_evidence',
            'Evidencia de entrega registrada',
            'delivered',
            $evidence->recipient_name ? "Recibido por {$evidence->recipient_name}" : null,
            ['evidence_code' => $evidence->code, 'evidence_url' => $evidence->evidence_url],
            $evidence->dispatch_id,
            null,
            $evidence->delivered_at ?: now()
        );
    }

    private function statusLabel(?string $status): string
    {
        return match ($status) {
            'draft' => 'Borrador',
            'pending' => 'Pendiente',
            'confirmed' => 'Confirmado',
            'preparing' => 'En preparacion',
            'prepared' => 'Preparado',
            'dispatched' => 'Despacho',
            'in_route' => 'En ruta',
            'delivered' => 'Entregado',
            'billed' => 'Facturado',
            'closed' => 'Cerrado',
            'cancelled' => 'Cancelado',
            'partial' => 'Parcial',
            'paid' => 'Pagado',
            'accepted' => 'Aceptado',
            'observed' => 'Observado',
            'rejected' => 'Rechazado',
            default => $status ?: '-',
        };
    }
}
