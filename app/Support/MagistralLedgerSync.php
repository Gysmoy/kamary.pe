<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Mantiene sincronizado, registro a registro, el ledger general (entry_notes/exit_notes)
 * con los movimientos de Magistrales. Replica EXACTAMENTE el mismo mapeo de campos, signos,
 * filtros y códigos que la migración `2026_07_06_000004_mirror_magistral_movements_into_general_ledger`
 * (fuente de verdad), pero de forma idempotente por registro individual: antes de escribir,
 * borra la nota general existente (por su `code`) y sus items, y sólo la recrea si corresponde.
 *
 * NO toca App\Support\MagistralesStock ni los controladores generales de Kardex/Inventory:
 * esto sólo alimenta el ledger general para que ambos caminos den el mismo stock.
 */
class MagistralLedgerSync
{
    // ---------------------------------------------------------------------
    // API pública
    // ---------------------------------------------------------------------

    public static function syncIncome(int $incomeId): void
    {
        if (!self::ready(['magistral_incomes', 'magistral_income_items', 'entry_notes', 'entry_note_items'])) return;

        $code = self::incomeCode($incomeId);
        $inc = DB::table('magistral_incomes')->where('id', $incomeId)->first();

        if (!$inc || is_null($inc->status)) {
            self::deleteEntry($code);
            return;
        }

        $items = DB::table('magistral_income_items')
            ->where('magistral_income_id', $incomeId)->whereNotNull('status')->get()
            ->map(fn($it) => [
                'article_id' => $it->article_id,
                'quantity' => (float)$it->quantity,
                'cost_unit' => (float)($it->price_without_igv ?? 0),
                'lot' => $it->lot ?? null,
                'expiration_date' => $it->expiration_date ?? null,
            ])->all();

        self::createEntry($code, (int)$inc->warehouse_id, [
            'supplier_id' => $inc->supplier_id ?? null,
            'entry_date' => $inc->issue_date ?? ($inc->created_at ?? now()),
            'currency' => $inc->currency ?? 'PEN',
            'observations' => $inc->observations ?? null,
            'created_by' => $inc->created_by ?? null,
            'updated_by' => $inc->updated_by ?? null,
        ], $items);
    }

    public static function removeIncome(int $incomeId): void
    {
        if (!self::ready(['entry_notes', 'entry_note_items'])) return;
        self::deleteEntry(self::incomeCode($incomeId));
    }

    public static function syncOutput(int $outputId): void
    {
        if (!self::ready(['magistral_outputs', 'magistral_output_items', 'exit_notes', 'exit_note_items'])) return;

        $code = self::outputCode($outputId);
        $out = DB::table('magistral_outputs')->where('id', $outputId)->first();

        if (!$out || is_null($out->status)) {
            self::deleteExit($code);
            return;
        }

        $items = DB::table('magistral_output_items')
            ->where('magistral_output_id', $outputId)->whereNotNull('status')->get()
            ->map(fn($it) => [
                'article_id' => $it->article_id,
                'quantity' => (float)$it->quantity,
                'total' => (float)($it->total ?? 0),
                'lot' => $it->lot ?? null,
                'expiration_date' => $it->expiration_date ?? null,
            ])->all();

        // La transferencia NO genera entrada de destino, igual que la migración.
        self::createExit($code, (int)$out->origin_warehouse_id, [
            'exit_date' => $out->output_date ?? ($out->created_at ?? now()),
            'motives' => json_encode(array_filter([$out->reason ?? null])),
            'client_name' => $out->destination ?? null,
            'observations' => $out->observations ?? null,
            'created_by' => $out->created_by ?? null,
            'updated_by' => $out->updated_by ?? null,
        ], $items);
    }

    public static function removeOutput(int $outputId): void
    {
        if (!self::ready(['exit_notes', 'exit_note_items'])) return;
        self::deleteExit(self::outputCode($outputId));
    }

    public static function syncSale(int $saleId): void
    {
        if (!self::ready(['magistral_sales', 'magistral_sale_items', 'exit_notes', 'exit_note_items'])) return;

        $baseCode = self::saleCode($saleId);
        // Idempotente: borra TODOS los codigos previos de esta venta (el base y los sufijados
        // por almacen, ver mirrorSales) antes de recrear, porque los almacenes involucrados
        // pueden cambiar entre una edicion y otra.
        self::deleteExitsLike($baseCode . '%');

        $sale = DB::table('magistral_sales')->where('id', $saleId)->first();
        if (!$sale || is_null($sale->status)) return;

        $hasQuote = Schema::hasColumn('magistral_sales', 'is_quote');
        if ($hasQuote && (bool)$sale->is_quote) return; // cotizacion: no aporta al ledger general

        $itemsRaw = DB::table('magistral_sale_items')
            ->where('magistral_sale_id', $saleId)->whereNotNull('status')->get();

        // agrupar por warehouse_id del item (magistral: normalmente uno solo), igual que mirrorSales
        $byWh = [];
        foreach ($itemsRaw as $it) {
            $wid = (int)($it->warehouse_id ?? 0);
            if (!$wid) continue;
            $byWh[$wid][] = [
                'article_id' => $it->article_id,
                'quantity' => (float)$it->quantity,
                'total' => (float)($it->subtotal ?? 0),
                'lot' => null,
                'expiration_date' => null,
            ];
        }

        $firstWh = array_key_first($byWh);
        foreach ($byWh as $wid => $items) {
            $code = $baseCode . ($wid !== $firstWh ? '-' . $wid : '');
            self::createExit($code, $wid, [
                'exit_date' => $sale->sale_date ?? ($sale->created_at ?? now()),
                'client_name' => $sale->patient ?? null,
                'observations' => $sale->observations ?? null,
                'created_by' => $sale->created_by ?? null,
                'updated_by' => $sale->updated_by ?? null,
            ], $items);
        }
    }

    public static function removeSale(int $saleId): void
    {
        if (!self::ready(['exit_notes', 'exit_note_items'])) return;
        self::deleteExitsLike(self::saleCode($saleId) . '%');
    }

    public static function syncProduction(int $orderId): void
    {
        if (!self::ready(['magistral_production_orders', 'magistral_production_order_items', 'entry_notes', 'entry_note_items', 'exit_notes', 'exit_note_items'])) return;

        $entryCode = self::productionEntryCode($orderId);
        $exitCode = self::productionExitCode($orderId);

        $ord = DB::table('magistral_production_orders')->where('id', $orderId)->first();

        if (!$ord || is_null($ord->status) || $ord->order_status !== 'finished') {
            self::deleteEntry($entryCode);
            self::deleteExit($exitCode);
            return;
        }

        $hasDest = Schema::hasColumn('magistral_production_orders', 'destination_warehouse_id');
        $whId = $hasDest ? (int)($ord->destination_warehouse_id ?? 0) : 0;
        if (!$whId) {
            self::deleteEntry($entryCode);
            self::deleteExit($exitCode);
            return;
        }

        // Producto terminado (+)
        self::createEntry($entryCode, $whId, [
            'entry_date' => $ord->registration_date ?? ($ord->created_at ?? now()),
            'observations' => $ord->observations ?? null,
            'created_by' => $ord->created_by ?? null,
            'updated_by' => $ord->updated_by ?? null,
        ], [[
            'article_id' => $ord->article_id,
            'quantity' => (float)$ord->quantity,
            'cost_unit' => 0,
            'lot' => null,
            'expiration_date' => null,
        ]]);

        // Consumo de insumos (-) usando COALESCE(total, quantity)
        $consItems = DB::table('magistral_production_order_items')
            ->where('magistral_production_order_id', $orderId)->whereNotNull('status')->get()
            ->map(fn($it) => [
                'article_id' => $it->article_id,
                'quantity' => (float)($it->total ?? $it->quantity),
                'total' => 0,
                'lot' => null,
                'expiration_date' => $it->expiration_date ?? null,
            ])->all();

        self::createExit($exitCode, $whId, [
            'exit_date' => $ord->registration_date ?? ($ord->created_at ?? now()),
            'observations' => 'Consumo produccion ' . ($ord->code ?? $ord->id),
            'created_by' => $ord->created_by ?? null,
            'updated_by' => $ord->updated_by ?? null,
        ], $consItems);
    }

    public static function removeProduction(int $orderId): void
    {
        if (!self::ready(['entry_notes', 'entry_note_items', 'exit_notes', 'exit_note_items'])) return;
        self::deleteEntry(self::productionEntryCode($orderId));
        self::deleteExit(self::productionExitCode($orderId));
    }

    // ---------------------------------------------------------------------
    // Códigos (idénticos a la migración)
    // ---------------------------------------------------------------------

    private static function incomeCode(int $id): string
    {
        return 'ING-MAG-' . str_pad((string)$id, 6, '0', STR_PAD_LEFT);
    }

    private static function outputCode(int $id): string
    {
        return 'SAL-MAG-' . str_pad((string)$id, 6, '0', STR_PAD_LEFT);
    }

    private static function saleCode(int $id): string
    {
        return 'VTA-MAG-' . str_pad((string)$id, 6, '0', STR_PAD_LEFT);
    }

    private static function productionEntryCode(int $id): string
    {
        return 'OPP-MAG-' . str_pad((string)$id, 6, '0', STR_PAD_LEFT);
    }

    private static function productionExitCode(int $id): string
    {
        return 'OPC-MAG-' . str_pad((string)$id, 6, '0', STR_PAD_LEFT);
    }

    // ---------------------------------------------------------------------
    // Helpers (extraidos de la migración)
    // ---------------------------------------------------------------------

    private static function ready(array $tables): bool
    {
        foreach ($tables as $t) {
            if (!Schema::hasTable($t)) return false;
        }
        return true;
    }

    private static function branchAndBusiness(?int $warehouseId): array
    {
        if (!$warehouseId) return [null, null];
        if (!Schema::hasTable('warehouses') || !Schema::hasTable('business_branches')) return [null, null];

        $wh = DB::table('warehouses')->where('id', $warehouseId)->first();
        $branchId = $wh->business_branch_id ?? null;
        $businessId = $branchId ? DB::table('business_branches')->where('id', $branchId)->value('business_id') : null;

        return [$businessId ? (int)$businessId : null, $branchId ? (int)$branchId : null];
    }

    private static function deleteEntry(string $code): void
    {
        $id = DB::table('entry_notes')->where('code', $code)->value('id');
        if (!$id) return;
        DB::table('entry_note_items')->where('entry_note_id', $id)->delete();
        DB::table('entry_notes')->where('id', $id)->delete();
    }

    private static function deleteExit(string $code): void
    {
        $id = DB::table('exit_notes')->where('code', $code)->value('id');
        if (!$id) return;
        DB::table('exit_note_items')->where('exit_note_id', $id)->delete();
        DB::table('exit_notes')->where('id', $id)->delete();
    }

    private static function deleteExitsLike(string $like): void
    {
        $ids = DB::table('exit_notes')->where('code', 'like', $like)->pluck('id');
        if ($ids->isEmpty()) return;
        DB::table('exit_note_items')->whereIn('exit_note_id', $ids)->delete();
        DB::table('exit_notes')->whereIn('id', $ids)->delete();
    }

    private static function createEntry(string $code, int $warehouseId, array $extra, array $items): void
    {
        self::deleteEntry($code);
        if (empty($items)) return;

        [$businessId, $branchId] = self::branchAndBusiness($warehouseId);
        if (!$businessId || !$branchId) return;

        $entryId = DB::table('entry_notes')->insertGetId(array_merge([
            'code' => $code,
            'business_id' => $businessId,
            'business_branch_id' => $branchId,
            'warehouse_id' => $warehouseId,
            'currency' => 'PEN',
            'document_type' => 'Boleta',
            'status' => 1,
            'entry_status' => 'approved',
            'created_at' => now(),
            'updated_at' => now(),
        ], $extra));

        foreach ($items as $it) {
            $qty = (float)($it['quantity'] ?? 0);
            $cost = (float)($it['cost_unit'] ?? 0);
            DB::table('entry_note_items')->insert([
                'entry_note_id' => $entryId,
                'article_id' => $it['article_id'],
                'warehouse_id' => $warehouseId,
                'lot' => $it['lot'] ?? null,
                'batch_code' => $it['lot'] ?? null,
                'expiration_date' => $it['expiration_date'] ?? null,
                'quantity' => $qty,
                'requested_quantity' => $qty,
                'received_quantity' => $qty,
                'cost_unit' => $cost,
                'total' => round($qty * $cost, 4),
                'stock' => 0,
                'status' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    private static function createExit(string $code, int $warehouseId, array $extra, array $items): void
    {
        self::deleteExit($code);
        if (empty($items)) return;

        [$businessId, $branchId] = self::branchAndBusiness($warehouseId);
        if (!$businessId || !$branchId) return;

        $exitId = DB::table('exit_notes')->insertGetId(array_merge([
            'code' => $code,
            'business_id' => $businessId,
            'business_branch_id' => $branchId,
            'warehouse_id' => $warehouseId,
            'status' => 1,
            'exit_status' => 'approved',
            'created_at' => now(),
            'updated_at' => now(),
        ], $extra));

        foreach ($items as $it) {
            $qty = (float)($it['quantity'] ?? 0);
            DB::table('exit_note_items')->insert([
                'exit_note_id' => $exitId,
                'article_id' => $it['article_id'],
                'warehouse_id' => $warehouseId,
                'batch_code' => $it['lot'] ?? null,
                'expiration_date' => $it['expiration_date'] ?? null,
                'quantity' => $qty,
                'total' => (float)($it['total'] ?? 0),
                'stock' => 0,
                'status' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
