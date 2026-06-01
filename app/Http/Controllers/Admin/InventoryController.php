<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\Article;
use App\Models\EntryNote;
use App\Models\EntryNoteItem;
use App\Models\ExitNote;
use App\Models\ExitNoteItem;
use App\Models\InventoryCount;
use App\Models\InventoryCountItem;
use App\Models\Laboratory;
use App\Models\Warehouse;
use App\Models\WarehouseLocation;
use App\Support\BusinessScope;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use SoDe\Extend\Response;

class InventoryController extends BasicController
{
    public $model = InventoryCount::class;
    public $reactView = 'Admin/Inventory';
    public $prefix4filter = 'inventory_counts';

    public function setReactViewProperties(Request $request)
    {
        return [
            'moduleTitle' => 'Inventario Kamary Peru',
            'businessScopeKey' => BusinessScope::KAMARY_PERU,
        ];
    }

    public function setPaginationInstance(string $model)
    {
        $warehouseId = $this->toNullableInt(request('warehouse_id'));

        return $this->inventoryCountQuery()
            ->select('inventory_counts.*')
            ->with([
                'business:id,name,business_key',
                'branch:id,business_id,name',
                'warehouse:id,business_branch_id,name',
                'laboratory:id,name,code',
                'items:id,inventory_count_id,article_id,warehouse_id,lot,expiration_date,article_code,article_name,laboratory_name,unit_label,location,system_stock,real_stock,difference,cost_unit,total_cost,status',
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ])
            ->leftJoin('warehouses as warehouse', 'warehouse.id', '=', 'inventory_counts.warehouse_id')
            ->leftJoin('laboratories as laboratory', 'laboratory.id', '=', 'inventory_counts.laboratory_id')
            ->leftJoin('users as creator', 'creator.id', '=', 'inventory_counts.created_by')
            ->leftJoin('users as updater', 'updater.id', '=', 'inventory_counts.updated_by')
            ->when($warehouseId, fn($query) => $query->where('inventory_counts.warehouse_id', $warehouseId));
    }

    public function options(Request $request): HttpResponse|ResponseFactory
    {
        $response = new Response();

        try {
            $warehouses = $this->kamaryPeruWarehouses()
                ->with(['branch:id,business_id,name', 'locations:id,warehouse_id,code,description,status'])
                ->orderBy('warehouses.name')
                ->get(['warehouses.id', 'warehouses.business_branch_id', 'warehouses.name', 'warehouses.status']);

            $laboratories = Laboratory::query()
                ->whereNotNull('status')
                ->orderBy('name')
                ->get(['id', 'name', 'code', 'status']);

            $locations = WarehouseLocation::query()
                ->select('warehouse_locations.id', 'warehouse_locations.warehouse_id', 'warehouse_locations.code', 'warehouse_locations.description', 'warehouse_locations.status')
                ->join('warehouses as warehouse', 'warehouse.id', '=', 'warehouse_locations.warehouse_id')
                ->join('business_branches as branch', 'branch.id', '=', 'warehouse.business_branch_id')
                ->join('businesses as business', 'business.id', '=', 'branch.business_id')
                ->where('business.business_key', BusinessScope::KAMARY_PERU)
                ->whereNotNull('warehouse_locations.status')
                ->whereNotNull('warehouse.status')
                ->orderBy('warehouse_locations.code')
                ->get();

            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = compact('warehouses', 'laboratories', 'locations');
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function preview(Request $request): HttpResponse|ResponseFactory
    {
        $response = new Response();

        try {
            $warehouseId = $this->requiredWarehouseId($request->input('warehouse_id'));
            $laboratoryId = $this->toNullableInt($request->input('laboratory_id'));
            $rows = $this->stockRows($warehouseId, $laboratoryId);

            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = $rows;
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function get(Request $request, string $id)
    {
        $response = new Response();

        try {
            $count = $this->inventoryCountQuery()
                ->with([
                    'business:id,name,business_key',
                    'branch:id,business_id,name',
                    'warehouse:id,business_branch_id,name',
                    'laboratory:id,name,code',
                    'items' => fn($query) => $query->whereNotNull('status')->orderBy('id'),
                    'creator:id,name,lastname,username,fullname',
                    'updater:id,name,lastname,username,fullname',
                ])
                ->findOrFail($id);

            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = $count;
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function save(Request $request): HttpResponse|ResponseFactory
    {
        $response = new Response();

        try {
            $warehouseId = $this->requiredWarehouseId($request->input('warehouse_id'));
            $warehouse = $this->assertKamaryPeruWarehouse($warehouseId);
            $business = $warehouse->branch?->business;
            if (!$business) throw new \Exception('El almacen no tiene empresa asignada');

            $laboratoryId = $this->toNullableInt($request->input('laboratory_id'));
            if ($laboratoryId) Laboratory::findOrFail($laboratoryId);

            $rows = $this->stockRows($warehouseId, $laboratoryId);
            if (count($rows) === 0) {
                throw new \Exception('No hay articulos para registrar con los filtros seleccionados');
            }

            DB::beginTransaction();
            Warehouse::query()->whereKey($warehouseId)->lockForUpdate()->first();

            $count = InventoryCount::create([
                'code' => $this->nextCode(),
                'business_id' => $business->id,
                'business_branch_id' => $warehouse->business_branch_id,
                'warehouse_id' => $warehouseId,
                'laboratory_id' => $laboratoryId,
                'count_date' => now()->toDateString(),
                'inventory_status' => 'En espera',
                'status' => true,
                'created_by' => Auth::id(),
                'updated_by' => Auth::id(),
            ]);

            foreach ($rows as $row) {
                $systemStock = round((float)($row['system_stock'] ?? 0), 3);
                $costUnit = round((float)($row['cost_unit'] ?? 0), 4);
                InventoryCountItem::create([
                    'inventory_count_id' => $count->id,
                    'source_key' => $row['source_key'] ?? null,
                    'article_id' => $row['article_id'] ?? null,
                    'warehouse_id' => $row['warehouse_id'] ?? null,
                    'lot' => $row['lot'] ?: null,
                    'expiration_date' => $row['expiration_date'] ?: null,
                    'article_code' => $row['article_code'] ?: null,
                    'article_name' => $row['article_name'] ?: null,
                    'laboratory_name' => $row['laboratory_name'] ?: null,
                    'unit_label' => $row['unit_label'] ?: null,
                    'location' => $row['location'] ?: null,
                    'system_stock' => $systemStock,
                    'real_stock' => 0,
                    'difference' => round(0 - $systemStock, 3),
                    'cost_unit' => $costUnit,
                    'total_cost' => round($systemStock * $costUnit, 2),
                    'status' => true,
                ]);
            }

            DB::commit();

            $response->status = 200;
            $response->message = 'Inventario registrado correctamente';
            $response->data = $count->fresh([
                'business:id,name,business_key',
                'branch:id,business_id,name',
                'warehouse:id,business_branch_id,name',
                'laboratory:id,name,code',
                'items',
                'creator:id,name,lastname,username,fullname',
            ]);
        } catch (\Throwable $th) {
            if (DB::transactionLevel() > 0) DB::rollBack();
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function format(Request $request, string $id)
    {
        $count = $this->inventoryCountQuery()
            ->with([
                'warehouse:id,name',
                'laboratory:id,name',
                'items' => fn($query) => $query->whereNotNull('status')->orderBy('id'),
            ])
            ->findOrFail($id);

        $filename = "{$count->code}_formato_inventario_kamary_peru.csv";

        return response()->streamDownload(function () use ($count) {
            $output = fopen('php://output', 'w');
            fwrite($output, "\xEF\xBB\xBF");
            fputcsv($output, ['Formato de inventario fisico - ' . ($count->warehouse?->name ?: 'Almacen')]);
            fputcsv($output, []);
            fputcsv($output, $this->inventoryHeaders());

            foreach ($count->items as $item) {
                fputcsv($output, [
                    $item->id,
                    $item->lot,
                    $item->article_name,
                    $item->laboratory_name,
                    $item->location,
                    number_format((float)$item->system_stock, 3, '.', ''),
                    '',
                ]);
            }
            fclose($output);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    public function import(Request $request, string $id): HttpResponse|ResponseFactory
    {
        $response = new Response();

        try {
            $count = $this->inventoryCountQuery()->findOrFail($id);
            if (!$request->hasFile('format_file')) {
                throw new \Exception('Debes seleccionar el formato a subir');
            }

            $path = $request->file('format_file')->getRealPath();
            $handle = fopen($path, 'r');
            if (!$handle) throw new \Exception('No se pudo leer el archivo');

            $headerMap = null;
            $updated = 0;
            $rowNumber = 0;

            DB::beginTransaction();
            while (($row = fgetcsv($handle)) !== false) {
                $rowNumber++;
                if ($this->isInventoryFormatEmptyRow($row)) continue;

                if (!$headerMap) {
                    $headerMap = $this->inventoryFormatHeaderMap($row);
                    continue;
                }

                $itemId = $this->toNullableInt($row[$headerMap['id']] ?? null);
                if (!$itemId) continue;

                $realStockRaw = trim((string)($row[$headerMap['real_stock']] ?? ''));
                if ($realStockRaw === '') {
                    throw new \Exception("Debes ingresar STOCK REAL en la fila {$rowNumber}");
                }

                $realStock = $this->toNullableDecimal($realStockRaw) ?? 0;
                if ($realStock < 0) throw new \Exception("El stock real de la fila {$rowNumber} no puede ser negativo");

                $item = InventoryCountItem::where('inventory_count_id', $count->id)
                    ->whereKey($itemId)
                    ->first();
                if (!$item) continue;

                $difference = round($realStock - (float)$item->system_stock, 3);
                $item->update([
                    'real_stock' => $realStock,
                    'difference' => $difference,
                    'total_cost' => round($realStock * (float)$item->cost_unit, 2),
                ]);
                $updated++;
            }
            fclose($handle);

            if (!$headerMap) {
                throw new \Exception('El formato no tiene cabecera valida. Debe incluir ID y STOCK REAL');
            }
            if ($updated === 0) {
                throw new \Exception('No se actualizo ningun item del inventario');
            }

            $hasDifferences = InventoryCountItem::where('inventory_count_id', $count->id)
                ->whereNotNull('status')
                ->whereRaw('ABS(COALESCE(difference, 0)) > 0.0001')
                ->exists();

            $count->update([
                'inventory_status' => $hasDifferences ? 'Con diferencias' : 'Sin diferencias',
                'updated_by' => Auth::id(),
            ]);
            DB::commit();

            $response->status = 200;
            $response->message = "Formato procesado. Items actualizados: {$updated}";
            $response->data = $count->fresh(['items']);
        } catch (\Throwable $th) {
            if (isset($handle) && is_resource($handle)) fclose($handle);
            if (DB::transactionLevel() > 0) DB::rollBack();
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function apply(Request $request, string $id): HttpResponse|ResponseFactory
    {
        $response = new Response();

        try {
            DB::beginTransaction();

            $count = $this->inventoryCountQuery()
                ->with([
                    'items' => fn($query) => $query->whereNotNull('status')->orderBy('id'),
                    'warehouse.branch.business',
                ])
                ->lockForUpdate()
                ->findOrFail($id);

            if (!$count->status) throw new \Exception('El inventario esta eliminado');
            if ($count->inventory_status === 'Aplicado') throw new \Exception('Este inventario ya fue aplicado');

            $warehouse = $count->warehouse;
            if (!$warehouse || !$warehouse->business_branch_id) throw new \Exception('El inventario no tiene almacen valido');
            $business = $warehouse->branch?->business;
            if (!$business || $business->business_key !== BusinessScope::KAMARY_PERU) {
                throw new \Exception('El inventario no pertenece a Kamary Peru');
            }

            $positiveRows = [];
            $negativeRows = [];
            foreach ($count->items as $item) {
                if (!$item->article_id || !$item->warehouse_id) {
                    throw new \Exception("El item {$item->id} no tiene articulo o almacen valido");
                }

                $currentStock = round($this->currentStockForItem($item, (int)$business->id), 3);
                $realStock = round((float)$item->real_stock, 3);
                $difference = round($realStock - $currentStock, 3);

                if (
                    abs(round((float)$item->system_stock, 3) - $currentStock) > 0.0001
                    || abs(round((float)$item->difference, 3) - $difference) > 0.0001
                ) {
                    $item->update([
                        'system_stock' => $currentStock,
                        'difference' => $difference,
                        'total_cost' => round($realStock * (float)$item->cost_unit, 2),
                    ]);
                    $item->system_stock = $currentStock;
                    $item->difference = $difference;
                }

                if (abs($difference) <= 0.0001) continue;
                if ($difference > 0) $positiveRows[] = $item;
                else $negativeRows[] = $item;
            }

            if (count($positiveRows) === 0 && count($negativeRows) === 0) {
                throw new \Exception('No hay diferencias de inventario para aplicar');
            }

            $createdEntryNote = null;
            if (count($positiveRows) > 0) {
                $createdEntryNote = $this->createInventoryEntryAdjustment($count, $positiveRows, (int)$business->id, (int)$warehouse->business_branch_id);
            }

            $createdExitNote = null;
            if (count($negativeRows) > 0) {
                $createdExitNote = $this->createInventoryExitAdjustment($count, $negativeRows, (int)$business->id, (int)$warehouse->business_branch_id);
            }

            $count->update([
                'inventory_status' => 'Aplicado',
                'updated_by' => Auth::id(),
            ]);

            DB::commit();

            $messages = [];
            if ($createdEntryNote) $messages[] = "entrada {$createdEntryNote->code}";
            if ($createdExitNote) $messages[] = "salida #{$createdExitNote->id}";

            $response->status = 200;
            $response->message = 'Inventario aplicado correctamente' . (count($messages) ? ' (' . implode(', ', $messages) . ')' : '');
            $response->data = $count->fresh([
                'business:id,name,business_key',
                'branch:id,business_id,name',
                'warehouse:id,business_branch_id,name',
                'laboratory:id,name,code',
                'items',
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ]);
        } catch (\Throwable $th) {
            if (DB::transactionLevel() > 0) DB::rollBack();
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    private function stockRows(int $warehouseId, ?int $laboratoryId): array
    {
        $incomingTotals = $this->incomingTotalsQuery();
        $outgoingTotals = $this->outgoingTotalsQuery();

        $rows = DB::query()
            ->fromSub($incomingTotals, 'stock')
            ->join('articles as article', 'article.id', '=', 'stock.article_id')
            ->leftJoin('laboratories as laboratory', 'laboratory.id', '=', 'article.laboratory_id')
            ->leftJoin('units as unit', 'unit.id', '=', 'article.unit_id')
            ->leftJoin('warehouses as warehouse', 'warehouse.id', '=', 'stock.warehouse_id')
            ->leftJoinSub($outgoingTotals, 'outgoing', function ($join) {
                $join->on('outgoing.article_id', '=', 'stock.article_id')
                    ->on('outgoing.warehouse_id', '=', 'stock.warehouse_id')
                    ->whereRaw("COALESCE(outgoing.lot, '') = COALESCE(stock.lot, '')")
                    ->whereRaw("COALESCE(outgoing.location, '') = COALESCE(stock.location, '')")
                    ->whereRaw("COALESCE(outgoing.expiration_date, '1000-01-01') = COALESCE(stock.expiration_date, '1000-01-01')");
            })
            ->where('stock.warehouse_id', $warehouseId)
            ->when($laboratoryId, fn($query) => $query->where('article.laboratory_id', $laboratoryId))
            ->when(Schema::hasColumn('articles', 'module_scope'), function ($query) {
                $query->where(function ($scope) {
                    $scope->where('article.module_scope', 'standard')
                        ->orWhereNull('article.module_scope');
                });
            })
            ->selectRaw("
                MIN(stock.source_key) as source_key,
                stock.article_id,
                stock.warehouse_id,
                COALESCE(article.code, '') as article_code,
                COALESCE(article.name, '') as article_name,
                COALESCE(laboratory.name, '') as laboratory_name,
                COALESCE(unit.symbol, unit.name, '') as unit_label,
                COALESCE(stock.lot, '') as lot,
                stock.expiration_date,
                COALESCE(stock.location, '') as location,
                COALESCE(stock.qty_in, 0) as qty_in,
                COALESCE(outgoing.qty_out, 0) as qty_out,
                COALESCE(stock.qty_in, 0) - COALESCE(outgoing.qty_out, 0) as system_stock,
                CASE WHEN COALESCE(stock.qty_in, 0) > 0 THEN COALESCE(stock.total_in, 0) / stock.qty_in ELSE 0 END as cost_unit
            ")
            ->groupBy(
                'stock.article_id',
                'stock.warehouse_id',
                'article.code',
                'article.name',
                'laboratory.name',
                'unit.symbol',
                'unit.name',
                'stock.lot',
                'stock.expiration_date',
                'stock.location',
                'stock.qty_in',
                'outgoing.qty_out',
                'stock.total_in'
            )
            ->whereRaw('(COALESCE(stock.qty_in, 0) - COALESCE(outgoing.qty_out, 0)) > 0')
            ->orderBy('article.name')
            ->orderBy('stock.lot')
            ->get()
            ->values()
            ->map(fn($row, $index) => $this->mapStockRow($row, $index))
            ->all();

        $articleIdsWithStock = collect($rows)->pluck('article_id')->filter()->unique()->all();
        $zeroRows = Article::query()
            ->with(['laboratory:id,name', 'unit:id,name,symbol'])
            ->where('warehouse_id', $warehouseId)
            ->whereNotNull('status')
            ->when($laboratoryId, fn($query) => $query->where('laboratory_id', $laboratoryId))
            ->when(count($articleIdsWithStock) > 0, fn($query) => $query->whereNotIn('id', $articleIdsWithStock))
            ->when(Schema::hasColumn('articles', 'module_scope'), function ($query) {
                $query->where(function ($scope) {
                    $scope->where('module_scope', 'standard')
                        ->orWhereNull('module_scope');
                });
            })
            ->orderBy('name')
            ->get(['id', 'warehouse_id', 'code', 'name', 'laboratory_id', 'unit_id'])
            ->map(function (Article $article, $index) use ($warehouseId, $rows) {
                return [
                    'id' => count($rows) + $index + 1,
                    'source_key' => 'article-' . $article->id,
                    'article_id' => $article->id,
                    'warehouse_id' => $warehouseId,
                    'article_code' => (string)($article->code ?? ''),
                    'article_name' => (string)($article->name ?? ''),
                    'laboratory_name' => (string)($article->laboratory?->name ?? ''),
                    'unit_label' => (string)($article->unit?->symbol ?: $article->unit?->name ?: ''),
                    'lot' => '',
                    'expiration_date' => '',
                    'location' => '',
                    'system_stock' => 0.0,
                    'real_stock' => 0.0,
                    'difference' => 0.0,
                    'cost_unit' => 0.0,
                    'total_cost' => 0.0,
                ];
            })
            ->all();

        return array_values(array_merge($rows, $zeroRows));
    }

    private function incomingTotalsQuery()
    {
        $entryMovements = DB::table('entry_note_items as entry_item')
            ->join('entry_notes as entry_note', 'entry_note.id', '=', 'entry_item.entry_note_id')
            ->join('businesses as business', 'business.id', '=', 'entry_note.business_id')
            ->where('entry_note.status', 1)
            ->where('entry_note.entry_status', 'approved')
            ->where('entry_item.status', 1)
            ->where('business.business_key', BusinessScope::KAMARY_PERU)
            ->selectRaw("
                CONCAT('entry-', entry_item.id) as source_key,
                entry_item.article_id,
                COALESCE(entry_item.warehouse_id, entry_note.warehouse_id) as warehouse_id,
                COALESCE(NULLIF(entry_item.lot, ''), NULLIF(entry_item.batch_code, ''), '') as lot,
                entry_item.expiration_date,
                COALESCE(NULLIF(entry_item.location, ''), '') as location,
                entry_item.quantity,
                COALESCE(entry_item.total, entry_item.quantity * entry_item.cost_unit, 0) as total
            ");

        $receiptMovements = DB::table('purchase_receipt_items as receipt_item')
            ->join('purchase_receipts as receipt', 'receipt.id', '=', 'receipt_item.purchase_receipt_id')
            ->join('businesses as business', 'business.id', '=', 'receipt.business_id')
            ->where('receipt.status', 1)
            ->where('receipt.receipt_status', 'confirmed')
            ->where('receipt_item.status', 1)
            ->where('business.business_key', BusinessScope::KAMARY_PERU)
            ->selectRaw("
                CONCAT('receipt-', receipt_item.id) as source_key,
                receipt_item.article_id,
                COALESCE(receipt_item.warehouse_id, receipt.warehouse_id) as warehouse_id,
                COALESCE(NULLIF(receipt_item.lot, ''), NULLIF(receipt_item.batch_code, ''), '') as lot,
                receipt_item.expiration_date,
                COALESCE(NULLIF(receipt_item.location, ''), '') as location,
                receipt_item.quantity,
                COALESCE(receipt_item.total, receipt_item.quantity * receipt_item.cost_unit, 0) as total
            ");

        return DB::query()
            ->fromSub($entryMovements->unionAll($receiptMovements), 'incoming')
            ->selectRaw("
                MIN(incoming.source_key) as source_key,
                incoming.article_id,
                incoming.warehouse_id,
                incoming.lot,
                incoming.expiration_date,
                incoming.location,
                COALESCE(SUM(incoming.quantity), 0) as qty_in,
                COALESCE(SUM(incoming.total), 0) as total_in
            ")
            ->groupBy('incoming.article_id', 'incoming.warehouse_id', 'incoming.lot', 'incoming.expiration_date', 'incoming.location');
    }

    private function outgoingTotalsQuery()
    {
        $query = DB::table('exit_note_items as exit_item')
            ->join('exit_notes as exit_note', 'exit_note.id', '=', 'exit_item.exit_note_id')
            ->join('businesses as business', 'business.id', '=', 'exit_note.business_id')
            ->where('exit_note.status', 1)
            ->where('exit_item.status', 1)
            ->where('business.business_key', BusinessScope::KAMARY_PERU)
            ->selectRaw("
                exit_item.article_id,
                COALESCE(exit_item.warehouse_id, exit_note.warehouse_id) as warehouse_id,
                COALESCE(NULLIF(exit_item.batch_code, ''), '') as lot,
                exit_item.expiration_date,
                COALESCE(NULLIF(exit_item.location, ''), '') as location,
                COALESCE(SUM(exit_item.quantity), 0) as qty_out
            ")
            ->groupBy('exit_item.article_id', 'warehouse_id', 'lot', 'exit_item.expiration_date', 'location');

        if (Schema::hasColumn('exit_notes', 'exit_status')) {
            $query->where('exit_note.exit_status', 'approved');
        }

        return $query;
    }

    private function mapStockRow(object $row, int $index): array
    {
        $systemStock = round((float)$row->system_stock, 3);
        $costUnit = round((float)$row->cost_unit, 4);

        return [
            'id' => $index + 1,
            'source_key' => (string)$row->source_key,
            'article_id' => $row->article_id,
            'warehouse_id' => $row->warehouse_id,
            'article_code' => (string)$row->article_code,
            'article_name' => (string)$row->article_name,
            'laboratory_name' => (string)$row->laboratory_name,
            'unit_label' => (string)$row->unit_label,
            'lot' => (string)($row->lot ?? ''),
            'expiration_date' => $row->expiration_date ? substr((string)$row->expiration_date, 0, 10) : '',
            'location' => (string)($row->location ?? ''),
            'system_stock' => $systemStock,
            'real_stock' => 0.0,
            'difference' => round(0 - $systemStock, 3),
            'cost_unit' => $costUnit,
            'total_cost' => round($systemStock * $costUnit, 2),
        ];
    }

    private function currentStockForItem(InventoryCountItem $item, int $businessId): float
    {
        $lot = trim((string)($item->lot ?? ''));
        $location = trim((string)($item->location ?? ''));
        $dateKey = $item->expiration_date ? $item->expiration_date->format('Y-m-d') : '1000-01-01';

        $entryQty = (float)DB::table('entry_note_items as entry_item')
            ->join('entry_notes as entry_note', 'entry_note.id', '=', 'entry_item.entry_note_id')
            ->where('entry_note.status', 1)
            ->where('entry_note.entry_status', 'approved')
            ->where('entry_note.business_id', $businessId)
            ->where('entry_item.status', 1)
            ->where('entry_item.article_id', $item->article_id)
            ->whereRaw('COALESCE(entry_item.warehouse_id, entry_note.warehouse_id) = ?', [$item->warehouse_id])
            ->whereRaw("COALESCE(NULLIF(entry_item.lot, ''), NULLIF(entry_item.batch_code, ''), '') = ?", [$lot])
            ->whereRaw("COALESCE(NULLIF(entry_item.location, ''), '') = ?", [$location])
            ->whereRaw("COALESCE(DATE(entry_item.expiration_date), '1000-01-01') = ?", [$dateKey])
            ->sum('entry_item.quantity');

        $receiptQty = (float)DB::table('purchase_receipt_items as receipt_item')
            ->join('purchase_receipts as receipt', 'receipt.id', '=', 'receipt_item.purchase_receipt_id')
            ->where('receipt.status', 1)
            ->where('receipt.receipt_status', 'confirmed')
            ->where('receipt.business_id', $businessId)
            ->where('receipt_item.status', 1)
            ->where('receipt_item.article_id', $item->article_id)
            ->whereRaw('COALESCE(receipt_item.warehouse_id, receipt.warehouse_id) = ?', [$item->warehouse_id])
            ->whereRaw("COALESCE(NULLIF(receipt_item.lot, ''), NULLIF(receipt_item.batch_code, ''), '') = ?", [$lot])
            ->whereRaw("COALESCE(NULLIF(receipt_item.location, ''), '') = ?", [$location])
            ->whereRaw("COALESCE(DATE(receipt_item.expiration_date), '1000-01-01') = ?", [$dateKey])
            ->sum('receipt_item.quantity');

        $exitQuery = DB::table('exit_note_items as exit_item')
            ->join('exit_notes as exit_note', 'exit_note.id', '=', 'exit_item.exit_note_id')
            ->where('exit_note.status', 1)
            ->where('exit_note.business_id', $businessId)
            ->where('exit_item.status', 1)
            ->where('exit_item.article_id', $item->article_id)
            ->whereRaw('COALESCE(exit_item.warehouse_id, exit_note.warehouse_id) = ?', [$item->warehouse_id])
            ->whereRaw("COALESCE(NULLIF(exit_item.batch_code, ''), '') = ?", [$lot])
            ->whereRaw("COALESCE(NULLIF(exit_item.location, ''), '') = ?", [$location])
            ->whereRaw("COALESCE(DATE(exit_item.expiration_date), '1000-01-01') = ?", [$dateKey]);

        if (Schema::hasColumn('exit_notes', 'exit_status')) {
            $exitQuery->where('exit_note.exit_status', 'approved');
        }

        return round($entryQty + $receiptQty - (float)$exitQuery->sum('exit_item.quantity'), 3);
    }

    private function createInventoryEntryAdjustment(InventoryCount $count, array $items, int $businessId, int $branchId): EntryNote
    {
        $today = now()->toDateString();
        $entryNote = EntryNote::create([
            'business_id' => $businessId,
            'business_branch_id' => $branchId,
            'warehouse_id' => $count->warehouse_id,
            'entry_date' => $today,
            'document_type' => 'Ajuste inventario',
            'document_series' => 'AJI',
            'document_sequence' => $count->code,
            'document_date' => $today,
            'driver_name' => 'Ajuste inventario',
            'driver_license' => 'N/A',
            'vehicle_plate' => 'N/A',
            'currency' => 'PEN',
            'observations' => "Ajuste positivo generado desde inventario {$count->code}",
            'status' => true,
            'entry_status' => 'approved',
            'created_by' => Auth::id(),
            'updated_by' => Auth::id(),
        ]);

        $entryNote->code = 'NE' . str_pad((string)$entryNote->id, 5, '0', STR_PAD_LEFT);
        $entryNote->save();

        foreach ($items as $item) {
            $quantity = round((float)$item->difference, 3);
            $costUnit = round((float)$item->cost_unit, 4);
            EntryNoteItem::create([
                'entry_note_id' => $entryNote->id,
                'batch_code' => $item->lot ?: null,
                'lot' => $item->lot ?: null,
                'expiration_date' => $item->expiration_date?->format('Y-m-d'),
                'article_id' => $item->article_id,
                'warehouse_id' => $item->warehouse_id,
                'stock' => (float)$item->system_stock,
                'cost_unit' => $costUnit,
                'location' => $item->location ?: null,
                'requested_quantity' => $quantity,
                'received_quantity' => $quantity,
                'quantity' => $quantity,
                'total' => round($quantity * $costUnit, 2),
                'status' => true,
            ]);
        }

        return $entryNote;
    }

    private function createInventoryExitAdjustment(InventoryCount $count, array $items, int $businessId, int $branchId): ExitNote
    {
        $today = now()->toDateString();
        $exitNote = ExitNote::create([
            'business_id' => $businessId,
            'business_branch_id' => $branchId,
            'warehouse_id' => $count->warehouse_id,
            'client_name' => 'Ajuste inventario',
            'exit_date' => $today,
            'document_type' => 'Ajuste inventario',
            'document_series' => 'AJE',
            'document_sequence' => $count->code,
            'document_date' => $today,
            'exit_status' => 'approved',
            'motives' => ["Ajuste negativo generado desde inventario {$count->code}"],
            'observations' => "Ajuste negativo generado desde inventario {$count->code}",
            'status' => true,
            'created_by' => Auth::id(),
            'updated_by' => Auth::id(),
        ]);

        foreach ($items as $item) {
            $quantity = abs(round((float)$item->difference, 3));
            ExitNoteItem::create([
                'exit_note_id' => $exitNote->id,
                'batch_code' => $item->lot ?: null,
                'article_id' => $item->article_id,
                'warehouse_id' => $item->warehouse_id,
                'stock' => (float)$item->system_stock,
                'expiration_date' => $item->expiration_date?->format('Y-m-d'),
                'location' => $item->location ?: null,
                'destination_location' => null,
                'quantity' => $quantity,
                'total' => $quantity,
                'status' => true,
            ]);
        }

        return $exitNote;
    }

    private function inventoryCountQuery()
    {
        return InventoryCount::query()
            ->whereHas('business', fn($business) => $business->where('business_key', BusinessScope::KAMARY_PERU));
    }

    private function kamaryPeruWarehouses()
    {
        return Warehouse::query()
            ->join('business_branches as branch', 'branch.id', '=', 'warehouses.business_branch_id')
            ->join('businesses as business', 'business.id', '=', 'branch.business_id')
            ->where('business.business_key', BusinessScope::KAMARY_PERU)
            ->whereNotNull('business.status')
            ->whereNotNull('branch.status')
            ->whereNotNull('warehouses.status');
    }

    private function requiredWarehouseId($value): int
    {
        $warehouseId = $this->toNullableInt($value);
        if (!$warehouseId) throw new \Exception('El almacen es obligatorio');
        $this->assertKamaryPeruWarehouse($warehouseId);

        return $warehouseId;
    }

    private function assertKamaryPeruWarehouse(int $warehouseId): Warehouse
    {
        $warehouse = Warehouse::query()
            ->with('branch.business')
            ->whereKey($warehouseId)
            ->whereNotNull('status')
            ->first();
        if (!$warehouse || $warehouse->branch?->business?->business_key !== BusinessScope::KAMARY_PERU) {
            throw new \Exception('El almacen seleccionado no pertenece a Kamary Peru');
        }

        return $warehouse;
    }

    private function nextCode(): string
    {
        $next = 1;
        $latest = InventoryCount::query()->lockForUpdate()->latest('id')->value('code');
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) {
            $next = ((int)$matches[1]) + 1;
        }

        return 'IP' . str_pad((string)$next, 5, '0', STR_PAD_LEFT);
    }

    private function inventoryHeaders(): array
    {
        return [
            'ID',
            'CODIGO LOTE',
            'NOMBRE',
            'LABORATORIO',
            'UBICACION',
            'STOCK SISTEMA',
            'STOCK REAL',
        ];
    }

    private function inventoryFormatHeaderMap(array $row): ?array
    {
        $normalized = array_map(fn($value) => $this->normalizeInventoryFormatHeader($value), $row);
        $idIndex = array_search('ID', $normalized, true);
        $realStockIndex = array_search('STOCKREAL', $normalized, true);

        if ($idIndex === false || $realStockIndex === false) {
            return null;
        }

        return [
            'id' => $idIndex,
            'real_stock' => $realStockIndex,
        ];
    }

    private function normalizeInventoryFormatHeader($value): string
    {
        $text = mb_strtoupper(trim((string)$value), 'UTF-8');
        $text = strtr($text, [
            'Á' => 'A',
            'É' => 'E',
            'Í' => 'I',
            'Ó' => 'O',
            'Ú' => 'U',
            'Ü' => 'U',
            'Ñ' => 'N',
        ]);

        return preg_replace('/[^A-Z0-9]+/', '', $text) ?? '';
    }

    private function isInventoryFormatEmptyRow(array $row): bool
    {
        foreach ($row as $value) {
            if (trim((string)$value) !== '') return false;
        }

        return true;
    }

    private function toNullableInt($value): ?int
    {
        if ($value === null) return null;
        $text = trim((string)$value);
        if ($text === '') return null;
        if (!ctype_digit(ltrim($text, '+'))) throw new \Exception("Valor entero invalido: {$value}");
        return (int)$text;
    }

    private function toNullableDecimal($value): ?float
    {
        if ($value === null) return null;
        $text = trim((string)$value);
        if ($text === '') return null;
        if (substr_count($text, ',') === 1 && substr_count($text, '.') === 0) {
            $text = str_replace(',', '.', $text);
        }
        if (!is_numeric($text)) throw new \Exception("Valor numerico invalido: {$value}");
        return (float)$text;
    }
}
