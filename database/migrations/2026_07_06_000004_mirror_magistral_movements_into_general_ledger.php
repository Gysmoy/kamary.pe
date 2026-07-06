<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Etapa 2 (cutover de ledger): espeja los movimientos de Magistrales hacia el ledger general
 * (entry_notes / exit_notes) replicando EXACTAMENTE los signos y filtros de App\Support\MagistralesStock:
 *   incomes  (+)  -> entry_notes(approved)             origen = income.warehouse_id
 *   outputs  (-)  -> exit_notes(approved)              origen = output.origin_warehouse_id  (la transferencia NO suma al destino)
 *   sales    (-)  -> exit_notes(approved)              solo is_quote=false, warehouse = item.warehouse_id
 *   producto (+)  -> entry_notes(approved)             producción finished, article terminado, warehouse = destination_warehouse_id
 *   consumo  (-)  -> exit_notes(approved)              producción finished, items (COALESCE(total,quantity))
 * Tras esto, StockService::getNetStockByWarehouse(article, wh) debe dar el MISMO stock que MagistralesStock.
 * Idempotente por código; reversible en down().
 */
return new class extends Migration
{
    private array $branchCache = [];

    public function up(): void
    {
        foreach (['magistral_incomes', 'magistral_outputs', 'magistral_sales', 'magistral_production_orders'] as $t) {
            if (!Schema::hasTable($t)) return;
        }

        $this->mirrorIncomes();
        $this->mirrorOutputs();
        $this->mirrorSales();
        $this->mirrorProduction();
    }

    public function down(): void
    {
        // Borra las notas espejo por prefijo de código (los generados por esta migración).
        $entryCodes = ['ING-MAG-%', 'OPP-MAG-%'];
        $exitCodes  = ['SAL-MAG-%', 'VTA-MAG-%', 'OPC-MAG-%'];

        foreach ($entryCodes as $like) {
            $ids = DB::table('entry_notes')->where('code', 'like', $like)->pluck('id');
            if ($ids->isNotEmpty()) {
                DB::table('entry_note_items')->whereIn('entry_note_id', $ids)->delete();
                DB::table('entry_notes')->whereIn('id', $ids)->delete();
            }
        }
        foreach ($exitCodes as $like) {
            $ids = DB::table('exit_notes')->where('code', 'like', $like)->pluck('id');
            if ($ids->isNotEmpty()) {
                DB::table('exit_note_items')->whereIn('exit_note_id', $ids)->delete();
                DB::table('exit_notes')->whereIn('id', $ids)->delete();
            }
        }
    }

    private function branchAndBusiness(?int $warehouseId): array
    {
        if (!$warehouseId) return [null, null];
        if (array_key_exists($warehouseId, $this->branchCache)) return $this->branchCache[$warehouseId];

        $wh = DB::table('warehouses')->where('id', $warehouseId)->first();
        $branchId = $wh->business_branch_id ?? null;
        $businessId = $branchId ? (DB::table('business_branches')->where('id', $branchId)->value('business_id')) : null;

        return $this->branchCache[$warehouseId] = [$businessId ? (int)$businessId : null, $branchId ? (int)$branchId : null];
    }

    private function entryExists(string $code): bool
    {
        return DB::table('entry_notes')->where('code', $code)->exists();
    }

    private function exitExists(string $code): bool
    {
        return DB::table('exit_notes')->where('code', $code)->exists();
    }

    private function createEntry(string $code, int $warehouseId, array $extra, array $items): void
    {
        if ($this->entryExists($code) || empty($items)) return;
        [$businessId, $branchId] = $this->branchAndBusiness($warehouseId);
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

    private function createExit(string $code, int $warehouseId, array $extra, array $items): void
    {
        if ($this->exitExists($code) || empty($items)) return;
        [$businessId, $branchId] = $this->branchAndBusiness($warehouseId);
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

    private function mirrorIncomes(): void
    {
        $incomes = DB::table('magistral_incomes')->whereNotNull('status')->get();
        foreach ($incomes as $inc) {
            $items = DB::table('magistral_income_items')
                ->where('magistral_income_id', $inc->id)->whereNotNull('status')->get()
                ->map(fn($it) => [
                    'article_id' => $it->article_id,
                    'quantity' => (float)$it->quantity,
                    'cost_unit' => (float)($it->price_without_igv ?? 0),
                    'lot' => $it->lot ?? null,
                    'expiration_date' => $it->expiration_date ?? null,
                ])->all();

            $this->createEntry('ING-MAG-' . str_pad((string)$inc->id, 6, '0', STR_PAD_LEFT), (int)$inc->warehouse_id, [
                'supplier_id' => $inc->supplier_id ?? null,
                'entry_date' => $inc->issue_date ?? ($inc->created_at ?? now()),
                'currency' => $inc->currency ?? 'PEN',
                'observations' => $inc->observations ?? null,
                'created_by' => $inc->created_by ?? null,
                'updated_by' => $inc->updated_by ?? null,
            ], $items);
        }
    }

    private function mirrorOutputs(): void
    {
        $outputs = DB::table('magistral_outputs')->whereNotNull('status')->get();
        foreach ($outputs as $out) {
            $items = DB::table('magistral_output_items')
                ->where('magistral_output_id', $out->id)->whereNotNull('status')->get()
                ->map(fn($it) => [
                    'article_id' => $it->article_id,
                    'quantity' => (float)$it->quantity,
                    'total' => (float)($it->total ?? 0),
                    'lot' => $it->lot ?? null,
                    'expiration_date' => $it->expiration_date ?? null,
                ])->all();

            $this->createExit('SAL-MAG-' . str_pad((string)$out->id, 6, '0', STR_PAD_LEFT), (int)$out->origin_warehouse_id, [
                'exit_date' => $out->output_date ?? ($out->created_at ?? now()),
                'motives' => json_encode(array_filter([$out->reason ?? null])),
                'client_name' => $out->destination ?? null,
                'observations' => $out->observations ?? null,
                'created_by' => $out->created_by ?? null,
                'updated_by' => $out->updated_by ?? null,
            ], $items);
        }
    }

    private function mirrorSales(): void
    {
        $hasQuote = Schema::hasColumn('magistral_sales', 'is_quote');
        $sales = DB::table('magistral_sales')->whereNotNull('status')
            ->when($hasQuote, fn($q) => $q->where('is_quote', false))->get();

        foreach ($sales as $sale) {
            $itemsRaw = DB::table('magistral_sale_items')
                ->where('magistral_sale_id', $sale->id)->whereNotNull('status')->get();
            // agrupar por warehouse_id del item (magistral: normalmente uno solo)
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
            foreach ($byWh as $wid => $items) {
                $code = 'VTA-MAG-' . str_pad((string)$sale->id, 6, '0', STR_PAD_LEFT) . ($wid !== (int)array_key_first($byWh) ? '-' . $wid : '');
                $this->createExit($code, $wid, [
                    'exit_date' => $sale->sale_date ?? ($sale->created_at ?? now()),
                    'client_name' => $sale->patient ?? null,
                    'observations' => $sale->observations ?? null,
                    'created_by' => $sale->created_by ?? null,
                    'updated_by' => $sale->updated_by ?? null,
                ], $items);
            }
        }
    }

    private function mirrorProduction(): void
    {
        $hasDest = Schema::hasColumn('magistral_production_orders', 'destination_warehouse_id');
        $orders = DB::table('magistral_production_orders')
            ->where('order_status', 'finished')->whereNotNull('status')->get();

        foreach ($orders as $ord) {
            $whId = $hasDest ? (int)($ord->destination_warehouse_id ?? 0) : 0;
            if (!$whId) continue;

            // Producto terminado (+)
            $this->createEntry('OPP-MAG-' . str_pad((string)$ord->id, 6, '0', STR_PAD_LEFT), $whId, [
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
                ->where('magistral_production_order_id', $ord->id)->whereNotNull('status')->get()
                ->map(fn($it) => [
                    'article_id' => $it->article_id,
                    'quantity' => (float)($it->total ?? $it->quantity),
                    'total' => 0,
                    'lot' => null,
                    'expiration_date' => $it->expiration_date ?? null,
                ])->all();

            $this->createExit('OPC-MAG-' . str_pad((string)$ord->id, 6, '0', STR_PAD_LEFT), $whId, [
                'exit_date' => $ord->registration_date ?? ($ord->created_at ?? now()),
                'observations' => 'Consumo produccion ' . ($ord->code ?? $ord->id),
                'created_by' => $ord->created_by ?? null,
                'updated_by' => $ord->updated_by ?? null,
            ], $consItems);
        }
    }
};
