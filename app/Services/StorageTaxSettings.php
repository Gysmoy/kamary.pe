<?php

namespace App\Services;

use App\Models\SystemSetting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

/**
 * Como se aplica el IGV en los servicios de almacenamiento.
 *
 * Son dos decisiones distintas y conviene no mezclarlas:
 *   - la TASA (18 % en Lima; hay zonas exoneradas donde seria 0)
 *   - si la tarifa que se escribe en la orden YA incluye el impuesto o se le suma encima
 *
 * De la segunda depende cuanto termina pagando el cliente con el mismo numero escrito: una tarifa
 * de 400 puede facturarse como 400 (desagregando 61.02 de IGV) o como 472 (sumando 72). Por eso es
 * configurable y no una constante escondida en el codigo.
 *
 * Los valores viven en system_settings, la misma tabla donde ya se guarda el modo del facturador.
 */
class StorageTaxSettings
{
    public const RATE_KEY = 'storage.igv_rate';
    public const INCLUDED_KEY = 'storage.tarifa_incluye_igv';

    private const CACHE_RATE = 'system-setting:storage.igv_rate';
    private const CACHE_INCLUDED = 'system-setting:storage.tarifa_incluye_igv';

    /** Tasa de IGV, como fraccion (0.18 = 18 %). */
    public function rate(): float
    {
        $valor = $this->leer(self::RATE_KEY, self::CACHE_RATE, (string) config('facturadorpro5.igv_rate', '0.18'));
        $tasa = (float) str_replace(',', '.', trim((string) $valor));

        // Si alguien escribe "18" en vez de "0.18", se entiende igual.
        if ($tasa > 1) $tasa = $tasa / 100;

        return ($tasa >= 0 && $tasa < 1) ? $tasa : 0.18;
    }

    /** true = la tarifa escrita ya incluye IGV; false = el IGV se suma encima. */
    public function pricesIncludeTax(): bool
    {
        $valor = $this->leer(self::INCLUDED_KEY, self::CACHE_INCLUDED, '1');

        return filter_var($valor, FILTER_VALIDATE_BOOLEAN);
    }

    /**
     * Desglose de un monto de servicios de almacenamiento.
     *
     * @return array{subtotal: float, tax_amount: float, total: float}
     */
    public function breakdown(float $monto, ?string $documentType = 'Factura'): array
    {
        $monto = round(max(0, $monto), 2);
        $tipo = mb_strtolower(trim((string) ($documentType ?: 'Factura')));

        // Una nota de pedido no es comprobante electronico: no lleva IGV.
        $gravado = in_array($tipo, ['factura', 'boleta'], true) && $this->rate() > 0;
        if (!$gravado) {
            return ['subtotal' => $monto, 'tax_amount' => 0.0, 'total' => $monto];
        }

        $tasa = $this->rate();

        if ($this->pricesIncludeTax()) {
            $subtotal = round($monto / (1 + $tasa), 2);

            return ['subtotal' => $subtotal, 'tax_amount' => round($monto - $subtotal, 2), 'total' => $monto];
        }

        $impuesto = round($monto * $tasa, 2);

        return ['subtotal' => $monto, 'tax_amount' => $impuesto, 'total' => round($monto + $impuesto, 2)];
    }

    public function update(?string $rate, ?string $included, ?int $userId = null): array
    {
        if ($rate !== null) {
            SystemSetting::query()->updateOrCreate(['key' => self::RATE_KEY], ['value' => $rate, 'updated_by' => $userId]);
            Cache::forget(self::CACHE_RATE);
        }

        if ($included !== null) {
            $valor = filter_var($included, FILTER_VALIDATE_BOOLEAN) ? '1' : '0';
            SystemSetting::query()->updateOrCreate(['key' => self::INCLUDED_KEY], ['value' => $valor, 'updated_by' => $userId]);
            Cache::forget(self::CACHE_INCLUDED);
        }

        return ['rate' => $this->rate(), 'prices_include_tax' => $this->pricesIncludeTax()];
    }

    private function leer(string $clave, string $cacheKey, string $porDefecto): string
    {
        try {
            if (!Schema::hasTable('system_settings')) return $porDefecto;

            return (string) Cache::remember($cacheKey, now()->addMinutes(5), function () use ($clave, $porDefecto) {
                $valor = SystemSetting::query()->where('key', $clave)->value('value');

                return ($valor === null || $valor === '') ? $porDefecto : (string) $valor;
            });
        } catch (\Throwable) {
            return $porDefecto;
        }
    }
}
