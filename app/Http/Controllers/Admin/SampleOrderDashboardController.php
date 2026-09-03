<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\DeliveryDelayReason;
use App\Models\SampleOrder;
use App\Support\DashboardPeriod;
use Carbon\Carbon;
use Illuminate\Http\Request;
use SoDe\Extend\Response;

class SampleOrderDashboardController extends BasicController
{
    public $reactView = 'Admin/SampleOrdersDashboard';
    public $reactRootView = 'admin';

    /** Estados del pedido de muestra, en el orden de la linea de tiempo. */
    private const STATUS_LABELS = [
        'registered' => 'Registrado',
        'approved' => 'Aprobado',
        'preparing' => 'En preparacion',
        'in_route' => 'En ruta',
        'delivered' => 'Entregado',
        'cancelled' => 'Anulado',
    ];

    /** Estados legados que quedaron guardados con otro nombre. */
    private const STATUS_ALIASES = [
        'processing' => 'preparing',
        'completed' => 'delivered',
    ];

    /** Fechas del pedido sobre las que se puede acotar el periodo. */
    private const DATE_FIELDS = [
        'created_at' => 'Fecha de registro',
        'approved_at' => 'Fecha de aprobacion',
        'requested_at' => 'Fecha solicitada de entrega',
        'delivered_at' => 'Fecha de entrega real',
    ];

    /** Lo que se muestra cuando la entrega salio en fecha o antes: no lleva motivo. */
    private const ON_TIME_LABEL = 'Entrega conforme';

    /** Retraso al que nadie le puso motivo todavia. */
    private const UNSPECIFIED_LABEL = 'Sin motivo registrado';

    private const MAX_ROWS = 500;

    public function setReactViewProperties(Request $request)
    {
        $filters = $this->normalizeFilters($request);

        return [
            'moduleTitle' => 'Muestras - Dashboard',
            'requiredPermission' => 'sample-orders',
            'statusOptions' => $this->options(self::STATUS_LABELS),
            'dateFieldOptions' => $this->options(self::DATE_FIELDS),
            'delayReasonOptions' => $this->delayReasonOptions(),
            'clientOptions' => $this->clientOptions(),
            'availableYears' => DashboardPeriod::availableYears([
                'sample_orders' => ['created_at', 'requested_at', 'delivered_at'],
            ]),
            'initialFilters' => $filters,
            'initialDashboard' => $this->build($filters),
        ];
    }

    /** Recalcula el dashboard para los filtros que manda la pantalla. */
    public function data(Request $request)
    {
        $response = new Response();

        try {
            $filters = $this->normalizeFilters($request);
            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = [
                'filters' => $filters,
                'dashboard' => $this->build($filters),
            ];
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    private function build(array $filters): array
    {
        $rows = $this->query($filters)->with('delayReason:id,description')->get()
            ->map(fn($order) => $this->row($order))
            ->values();

        return [
            'period' => [
                'start' => $filters['start'],
                'end' => $filters['end'],
                'label' => $filters['periodLabel'],
                'dateField' => $filters['date_field'],
                'dateFieldLabel' => self::DATE_FIELDS[$filters['date_field']],
            ],
            'summary' => $this->summary($rows->all()),
            'statusBreakdown' => $this->statusBreakdown($rows->all()),
            'diffBuckets' => $this->diffBuckets($rows->all()),
            'delayReasons' => $this->delayReasons($rows->all()),
            'rows' => $rows->take(self::MAX_ROWS)->all(),
            'rowsTruncated' => $rows->count() > self::MAX_ROWS,
            'totalRows' => $rows->count(),
        ];
    }

    private function query(array $filters)
    {
        $query = SampleOrder::query()
            ->whereNotNull('status')
            ->whereDate($filters['date_field'], '>=', $filters['start'])
            ->whereDate($filters['date_field'], '<=', $filters['end'])
            ->orderByDesc('created_at');

        if ($filters['order_status']) {
            // Se busca la clave actual y tambien el alias legado del mismo estado.
            $aliases = array_keys(self::STATUS_ALIASES, $filters['order_status'], true);
            $query->whereIn('order_status', array_merge([$filters['order_status']], $aliases));
        }

        if ($filters['client_name']) {
            $query->where('client_name', $filters['client_name']);
        }

        if ($filters['delay_reason']) {
            $query->where('delay_reason_id', $filters['delay_reason']);
        }

        if ($filters['only_delayed']) {
            $query->whereNotNull('delivered_at')
                ->whereNotNull('requested_at')
                ->whereColumn('delivered_at', '>', 'requested_at');
        }

        return $query;
    }

    private function row(SampleOrder $order): array
    {
        $status = $this->normalizeStatus($order->order_status);
        $requestedAt = $this->asDate($order->requested_at);
        $deliveredAt = $this->asDate($order->delivered_at);

        // Diferencia en dias: positiva si la entrega salio despues de lo solicitado.
        $diffDays = $requestedAt && $deliveredAt
            ? Carbon::parse($requestedAt)->diffInDays(Carbon::parse($deliveredAt), false)
            : null;

        $isDelayed = $diffDays !== null && $diffDays > 0;
        $delayReason = $order->delay_reason_id;

        return [
            'id' => $order->id,
            'orderNumber' => $order->order_number,
            'clientName' => $order->client_name,
            'registeredAt' => $this->asDate($order->created_at),
            'approvedAt' => $order->approved_at ? $this->asDate($order->approved_at) : null,
            'requestedAt' => $requestedAt,
            'deliveredAt' => $deliveredAt,
            'orderStatus' => $status,
            'orderStatusLabel' => self::STATUS_LABELS[$status] ?? $status,
            'diffDays' => $diffDays,
            'isDelayed' => $isDelayed,
            'delayReason' => $isDelayed ? $delayReason : null,
            // Si no hubo desface el pedido va como conforme, sin motivo que registrar.
            'delayReasonLabel' => $isDelayed
                ? ($order->delayReason?->description ?: self::UNSPECIFIED_LABEL)
                : ($diffDays !== null ? self::ON_TIME_LABEL : null),
            'delayReasonNotes' => $order->delay_reason_notes,
        ];
    }

    private function summary(array $rows): array
    {
        $closed = array_values(array_filter($rows, fn($row) => $row['diffDays'] !== null));
        $delayed = array_values(array_filter($closed, fn($row) => $row['diffDays'] > 0));
        $diffDays = array_column($closed, 'diffDays');
        $delayDays = array_column($delayed, 'diffDays');

        return [
            'total' => count($rows),
            'preparing' => count(array_filter($rows, fn($row) => $row['orderStatus'] === 'preparing')),
            'inRoute' => count(array_filter($rows, fn($row) => $row['orderStatus'] === 'in_route')),
            'delivered' => count(array_filter($rows, fn($row) => $row['orderStatus'] === 'delivered')),
            'cancelled' => count(array_filter($rows, fn($row) => $row['orderStatus'] === 'cancelled')),
            'closed' => count($closed),
            'delayed' => count($delayed),
            'onTime' => count(array_filter($closed, fn($row) => $row['diffDays'] === 0)),
            'early' => count(array_filter($closed, fn($row) => $row['diffDays'] < 0)),
            'withoutReason' => count(array_filter($delayed, fn($row) => !$row['delayReason'])),
            // Promedio sobre los pedidos ya entregados: negativo significa que se adelanto.
            'avgDiffDays' => $diffDays ? round(array_sum($diffDays) / count($diffDays), 1) : 0,
            'avgDelayDays' => $delayDays ? round(array_sum($delayDays) / count($delayDays), 1) : 0,
            'maxDelayDays' => $delayDays ? max($delayDays) : 0,
            'onTimePct' => $closed
                ? round(((count($closed) - count($delayed)) / count($closed)) * 100, 1)
                : 0,
        ];
    }

    private function statusBreakdown(array $rows): array
    {
        $total = max(1, count($rows));
        $breakdown = [];

        foreach (self::STATUS_LABELS as $status => $label) {
            $count = count(array_filter($rows, fn($row) => $row['orderStatus'] === $status));
            if (!$count) continue;

            $breakdown[] = [
                'status' => $status,
                'label' => $label,
                'count' => $count,
                'pct' => round(($count / $total) * 100, 1),
            ];
        }

        return $breakdown;
    }

    /** Reparto de los pedidos entregados entre anticipos, a tiempo y retrasos. */
    private function diffBuckets(array $rows): array
    {
        $closed = array_values(array_filter($rows, fn($row) => $row['diffDays'] !== null));
        $total = max(1, count($closed));

        $buckets = [
            'early' => [
                'label' => 'Anticipos',
                'hint' => 'Entregado antes de lo solicitado',
                'filter' => fn($row) => $row['diffDays'] < 0,
            ],
            'on_time' => [
                'label' => 'A tiempo',
                'hint' => 'Entregado el mismo dia solicitado',
                'filter' => fn($row) => $row['diffDays'] === 0,
            ],
            'late' => [
                'label' => 'Retrasos',
                'hint' => 'Entregado despues de lo solicitado',
                'filter' => fn($row) => $row['diffDays'] > 0,
            ],
        ];

        $result = [];
        foreach ($buckets as $key => $bucket) {
            $matched = array_values(array_filter($closed, $bucket['filter']));
            $days = array_column($matched, 'diffDays');

            $result[] = [
                'key' => $key,
                'label' => $bucket['label'],
                'hint' => $bucket['hint'],
                'count' => count($matched),
                'pct' => round((count($matched) / $total) * 100, 1),
                'avgDays' => $days ? round(array_sum($days) / count($days), 1) : 0,
            ];
        }

        return $result;
    }

    /** Motivos de retraso, solo sobre los pedidos entregados fuera de fecha. */
    private function delayReasons(array $rows): array
    {
        $delayed = array_values(array_filter($rows, fn($row) => $row['isDelayed']));
        $total = max(1, count($delayed));
        $reasons = [];

        foreach ($this->delayReasonOptions() as $option) {
            $key = (int) $option['value'];
            $matched = array_values(array_filter($delayed, fn($row) => (int) $row['delayReason'] === $key));
            if (!$matched) continue;

            $days = array_column($matched, 'diffDays');
            $reasons[] = [
                'key' => $key,
                'label' => $option['label'],
                'count' => count($matched),
                'pct' => round((count($matched) / $total) * 100, 1),
                'avgDays' => round(array_sum($days) / count($days), 1),
            ];
        }

        // Los retrasos a los que nadie les puso motivo se muestran igual, para que no se pierdan.
        $withoutReason = array_values(array_filter($delayed, fn($row) => !$row['delayReason']));
        if ($withoutReason) {
            $days = array_column($withoutReason, 'diffDays');
            $reasons[] = [
                'key' => 'unspecified',
                'label' => self::UNSPECIFIED_LABEL,
                'count' => count($withoutReason),
                'pct' => round((count($withoutReason) / $total) * 100, 1),
                'avgDays' => round(array_sum($days) / count($days), 1),
            ];
        }

        usort($reasons, fn($a, $b) => $b['count'] <=> $a['count']);

        return $reasons;
    }

    private function normalizeFilters(Request $request): array
    {
        $dateField = (string) $request->input('date_field', 'requested_at');
        if (!isset(self::DATE_FIELDS[$dateField])) $dateField = 'requested_at';

        $period = DashboardPeriod::resolve($request);

        $orderStatus = $this->normalizeStatus($request->input('order_status'));
        if (!isset(self::STATUS_LABELS[$orderStatus])) $orderStatus = '';

        return [
            'date_field' => $dateField,
            'mode' => $period['mode'],
            'month' => $period['month'],
            'year' => $period['year'],
            'start' => $period['start'],
            'end' => $period['end'],
            'periodLabel' => $period['label'],
            'order_status' => $orderStatus,
            'client_name' => trim((string) $request->input('client_name')) ?: '',
            'delay_reason' => (string) ($this->nullableInt($request->input('delay_reason')) ?? ''),
            'only_delayed' => filter_var($request->input('only_delayed', false), FILTER_VALIDATE_BOOLEAN),
        ];
    }

    /** Catalogo real de motivos, el mismo que mantiene el negocio desde Pedidos. */
    private function delayReasonOptions(): array
    {
        return DeliveryDelayReason::query()
            ->where('status', true)
            ->orderBy('description')
            ->get(['id', 'description'])
            ->map(fn($row) => ['value' => (string) $row->id, 'label' => $row->description])
            ->all();
    }

    private function nullableInt($value): ?int
    {
        $id = filter_var($value, FILTER_VALIDATE_INT);

        return $id === false || $id <= 0 ? null : $id;
    }

    private function clientOptions(): array
    {
        return SampleOrder::query()
            ->whereNotNull('status')
            ->whereNotNull('client_name')
            ->where('client_name', '!=', '')
            ->distinct()
            ->orderBy('client_name')
            ->pluck('client_name')
            ->map(fn($name) => ['value' => $name, 'label' => $name])
            ->all();
    }

    private function normalizeStatus($value): string
    {
        $status = trim((string) $value);

        return self::STATUS_ALIASES[$status] ?? $status;
    }

    private function asDate($value): ?string
    {
        if (!$value) return null;

        try {
            return Carbon::parse($value)->toDateString();
        } catch (\Throwable) {
            return null;
        }
    }

    private function options(array $labels): array
    {
        $options = [];
        foreach ($labels as $value => $label) {
            $options[] = ['value' => $value, 'label' => $label];
        }

        return $options;
    }
}
