<?php

namespace App\Support;

class SampleDelayReasons
{
    /**
     * Motivos con los que se explica una entrega posterior a la fecha solicitada.
     * La clave es lo que se guarda en sample_orders.delay_reason.
     */
    public const OPTIONS = [
        'customs' => 'Demora en aduana',
        'traffic' => 'Trafico vehicular',
        'logistics' => 'Fallas logisticas',
        'stock' => 'Falta de stock',
        'client' => 'Cliente no disponible',
        'documentation' => 'Documentacion incompleta',
        'other' => 'Otro motivo',
    ];

    public const UNSPECIFIED_LABEL = 'Sin motivo registrado';

    public static function label(?string $key): string
    {
        return self::OPTIONS[(string) $key] ?? self::UNSPECIFIED_LABEL;
    }

    public static function normalize($value): ?string
    {
        $key = trim((string) $value);

        return isset(self::OPTIONS[$key]) ? $key : null;
    }

    public static function options(): array
    {
        $options = [];
        foreach (self::OPTIONS as $value => $label) {
            $options[] = ['value' => $value, 'label' => $label];
        }

        return $options;
    }
}
