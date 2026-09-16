<?php

namespace App\Console\Commands;

use App\Models\BillingDocument;
use App\Services\BillingDocumentService;
use App\Services\StorageTaxSettings;
use Illuminate\Console\Command;

/**
 * Las prefacturas creadas antes de que el IGV se calculara quedaron con impuesto en cero, y SUNAT
 * las habria recibido como exoneradas. Este comando las vuelve a desglosar con la configuracion
 * vigente (ver StorageTaxSettings), sin alterar lo que paga el cliente: si el desglose cambiaria
 * el total, la prefactura se deja intacta y se reporta para revisarla a mano.
 *
 * Solo toca prefacturas pendientes: las ya emitidas o anuladas no se tocan nunca.
 */
class DesagregarIgvPrefacturasCommand extends Command
{
    protected $signature = 'almacenamiento:desagregar-igv
        {--aplicar : Guarda los cambios. Sin esta opcion solo muestra lo que haria}';

    protected $description = 'Recalcula el IGV de las prefacturas de almacenamiento que siguen pendientes.';

    public function handle(StorageTaxSettings $impuestos, BillingDocumentService $facturacion): int
    {
        $aplicar = (bool) $this->option('aplicar');

        $this->line(sprintf(
            'Configuracion vigente: IGV %s%% · la tarifa %s el impuesto.',
            rtrim(rtrim(number_format($impuestos->rate() * 100, 2, '.', ''), '0'), '.'),
            $impuestos->pricesIncludeTax() ? 'YA incluye' : 'NO incluye'
        ));

        $prefacturas = BillingDocument::query()
            ->where('source_type', 'service_order')
            ->where('local_status', 'pending')
            ->whereIn('external_status', ['draft', 'pending'])
            ->where('status', true)
            ->orderBy('code')
            ->get();

        if ($prefacturas->isEmpty()) {
            $this->info('No hay prefacturas pendientes que revisar.');
            return self::SUCCESS;
        }

        $ajustadas = 0;
        $omitidas = 0;
        $filas = [];

        foreach ($prefacturas as $prefactura) {
            $bruto = round((float) $prefactura->items()->where('status', true)->sum('total'), 2);
            if ($bruto <= 0) $bruto = round((float) $prefactura->total, 2);

            $montos = $impuestos->breakdown($bruto, $prefactura->document_type);

            $sinCambio = abs((float) $prefactura->subtotal - $montos['subtotal']) < 0.005
                && abs((float) $prefactura->tax_amount - $montos['tax_amount']) < 0.005
                && abs((float) $prefactura->total - $montos['total']) < 0.005;

            if ($sinCambio) {
                $filas[] = [$prefactura->code, $prefactura->document_type, number_format($prefactura->total, 2), '-', 'ya estaba bien'];
                continue;
            }

            // Freno: este comando solo desglosa. Cambiar el total de un documento ya creado es
            // una decision comercial, no un arreglo tecnico.
            if (abs((float) $prefactura->total - $montos['total']) >= 0.005) {
                $omitidas++;
                $filas[] = [
                    $prefactura->code,
                    $prefactura->document_type,
                    number_format($prefactura->total, 2),
                    number_format($montos['total'], 2),
                    'NO se toca: cambiaria el total',
                ];
                continue;
            }

            $filas[] = [
                $prefactura->code,
                $prefactura->document_type,
                number_format($prefactura->subtotal, 2) . ' + IGV ' . number_format($prefactura->tax_amount, 2),
                number_format($montos['subtotal'], 2) . ' + IGV ' . number_format($montos['tax_amount'], 2),
                $aplicar ? 'ajustada' : 'se ajustaria',
            ];

            if (!$aplicar) continue;

            $prefactura->update([
                'subtotal' => $montos['subtotal'],
                'tax_amount' => $montos['tax_amount'],
                'total' => $montos['total'],
            ]);
            $facturacion->refreshConnectorPayload($prefactura->fresh([
                'items', 'client', 'eventualClient', 'business', 'branch', 'serviceOrder',
            ]));
            $ajustadas++;
        }

        $this->table(['Prefactura', 'Tipo', 'Antes', 'Despues', 'Resultado'], $filas);

        if (!$aplicar) {
            $this->warn('Modo prueba: no se guardo nada. Repite con --aplicar para confirmar.');
            return self::SUCCESS;
        }

        $this->info("Prefacturas ajustadas: {$ajustadas}");
        if ($omitidas > 0) {
            $this->warn("Prefacturas que requieren revision manual: {$omitidas}");
        }

        return self::SUCCESS;
    }
}
