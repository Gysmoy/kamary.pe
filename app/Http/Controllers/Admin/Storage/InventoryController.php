<?php

namespace App\Http\Controllers\Admin\Storage;

use App\Http\Controllers\BasicController;
use App\Models\EntryNote;
use App\Models\EntryNoteItem;
use App\Models\ExitNote;
use App\Models\ExitNoteItem;
use App\Models\StorageInventoryCount;
use App\Models\StorageInventoryCountItem;
use App\Models\Warehouse;
use App\Services\StockService;
use App\Support\BusinessScope;
use App\Support\StorageScope;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use SoDe\Extend\Response;

class InventoryController extends BasicController
{
    public $model = StorageInventoryCount::class;
    public $reactView = 'Admin/Inventory';
    public $prefix4filter = 'storage_inventory_counts';

    public function setReactViewProperties(Request $request)
    {
        return [
            'moduleTitle' => 'Serv. Almacenamiento - Inventario',
            'requiredPermission' => 'storage-inventory',
            'storageContext' => true,
        ];
    }

    public function setPaginationInstance(string $model)
    {
        return $model::select('storage_inventory_counts.*')
            ->with([
                'branch:id,name,business_id',
                'warehouse:id,name,business_branch_id',
                'client:id,document_type,document_number,full_name',
                'items:id,storage_inventory_count_id,article_id,lot,expiration_date,article_name,client_name,unit_label,location,temperature_range,system_stock,real_stock,difference,status',
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ])
            ->leftJoin('business_branches as branch', 'branch.id', '=', 'storage_inventory_counts.business_branch_id')
            ->leftJoin('warehouses as warehouse', 'warehouse.id', '=', 'storage_inventory_counts.warehouse_id')
            ->leftJoin('clients as client', 'client.id', '=', 'storage_inventory_counts.client_id')
            ->leftJoin('users as creator', 'creator.id', '=', 'storage_inventory_counts.created_by')
            ->leftJoin('users as updater', 'updater.id', '=', 'storage_inventory_counts.updated_by')
            ->whereHas('client', fn($query) => StorageScope::applyClientScope($query));
    }

    public function options(Request $request): HttpResponse|ResponseFactory
    {
        $response = new Response();

        try {
            $warehouses = Warehouse::query()
                ->with(['branch:id,name,business_id', 'branch.business:id,name,business_key'])
                ->whereNotNull('status')
                ->whereHas('branch.business', function ($business) {
                    $business->where('business_key', BusinessScope::KAMARY_MEDICALS)->whereNotNull('status');
                })
                ->orderBy('name')
                ->get(['id', 'business_branch_id', 'name', 'status']);

            $clients = StorageScope::clientQuery()
                ->orderBy('full_name')
                ->get(['id', 'document_type', 'document_number', 'full_name', 'short_code', 'status']);

            $locations = $this->locationOptions();

            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = compact('warehouses', 'clients', 'locations');
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
            $clientId = $this->toNullableInt($request->input('client_id'));
            if (!$clientId) throw new \Exception('El cliente es obligatorio');
            StorageScope::assertClient($clientId);

            $warehouseId = $this->toNullableInt($request->input('warehouse_id'));
            $location = trim((string)($request->input('location') ?? ''));
            if ($warehouseId && $location !== '') {
                $this->assertLocationBelongsToClient($warehouseId, $location, $clientId);
            }

            $rows = $this->stockRows($warehouseId, $location, $clientId);

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
            $count = $this->storageInventoryQuery()->with([
                'branch:id,name,business_id',
                'warehouse:id,name,business_branch_id',
                'client:id,document_type,document_number,full_name',
                'items' => fn($query) => $query->whereNotNull('status')->orderBy('id'),
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ])->findOrFail($id);

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
            $warehouseId = $this->toNullableInt($request->input('warehouse_id'));
            if (!$warehouseId) throw new \Exception('El almacen es obligatorio');

            $warehouse = Warehouse::with('branch')->findOrFail($warehouseId);
            $clientId = $this->toNullableInt($request->input('client_id'));
            if (!$clientId) throw new \Exception('El cliente es obligatorio');
            StorageScope::assertClient($clientId);

            $location = trim((string)($request->input('location') ?? '')) ?: null;
            if ($location !== null) {
                $this->assertLocationBelongsToClient($warehouseId, $location, $clientId);
            }
            $rows = $this->stockRows($warehouseId, $location ?? '', $clientId);
            if (count($rows) === 0) {
                throw new \Exception('No hay stock para registrar con los filtros seleccionados');
            }

            DB::beginTransaction();

            Warehouse::query()->whereKey($warehouseId)->lockForUpdate()->first();

            $count = StorageInventoryCount::create([
                'code' => $this->nextCode(),
                'business_branch_id' => $warehouse->business_branch_id,
                'warehouse_id' => $warehouseId,
                'client_id' => $clientId,
                'location' => $location,
                'count_date' => now()->toDateString(),
                'inventory_status' => 'En espera',
                'status' => true,
                'created_by' => Auth::id(),
                'updated_by' => Auth::id(),
            ]);

            foreach ($rows as $row) {
                $systemStock = (float)($row['system_stock'] ?? 0);
                StorageInventoryCountItem::create([
                    'storage_inventory_count_id' => $count->id,
                    'source_key' => $row['source_key'] ?? null,
                    'article_id' => $row['article_id'] ?? null,
                    'warehouse_id' => $row['warehouse_id'] ?? null,
                    'lot' => $row['lot'] ?: null,
                    'expiration_date' => $row['expiration_date'] ?: null,
                    'article_name' => $row['article_name'] ?: null,
                    'client_name' => $row['client_name'] ?: null,
                    'unit_label' => $row['unit_label'] ?: null,
                    'location' => $row['location'] ?: null,
                    'temperature_range' => $row['temperature_range'] ?: null,
                    'system_stock' => $systemStock,
                    'real_stock' => 0,
                    'difference' => round(0 - $systemStock, 3),
                    'status' => true,
                ]);
            }

            DB::commit();

            $response->status = 200;
            $response->message = 'Inventario registrado correctamente';
            $response->data = $count->fresh([
                'branch:id,name,business_id',
                'warehouse:id,name,business_branch_id',
                'client:id,document_type,document_number,full_name',
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
        $count = $this->storageInventoryQuery()->with([
            'warehouse:id,name',
            'items' => fn($query) => $query->whereNotNull('status')->orderBy('id'),
        ])
            ->findOrFail($id);
        $filename = "{$count->code}_formato_ajuste_inventario.csv";

        return response()->streamDownload(function () use ($count) {
            $output = fopen('php://output', 'w');
            fwrite($output, "\xEF\xBB\xBF");
            fputcsv($output, ['Formato de ajuste de inventario - ' . ($count->warehouse?->name ?: 'Almacen')]);
            fputcsv($output, []);
            fputcsv($output, [
                'ID',
                'LOTE',
                'F. VENCIMIENTO',
                'ARTÍCULO',
                'CLIENTE',
                'U. MEDIDA',
                'UBICACION',
                'TEMPERATURA',
                'STOCK SISTEMA',
                'STOCK REAL',
            ]);

            foreach ($count->items as $item) {
                fputcsv($output, [
                    $item->id,
                    $item->lot,
                    $item->expiration_date?->format('Y-m-d'),
                    $item->article_name,
                    $item->client_name,
                    $item->unit_label,
                    $item->location,
                    $item->temperature_range,
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
            $count = $this->storageInventoryQuery()->findOrFail($id);
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

                $item = StorageInventoryCountItem::where('storage_inventory_count_id', $count->id)
                    ->whereKey($itemId)
                    ->first();
                if (!$item) continue;

                $item->update([
                    'real_stock' => $realStock,
                    'difference' => round($realStock - (float)$item->system_stock, 3),
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

            $hasDifferences = StorageInventoryCountItem::where('storage_inventory_count_id', $count->id)
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

            $count = $this->storageInventoryQuery()->with([
                'items' => fn($query) => $query->whereNotNull('status')->orderBy('id'),
                'warehouse.branch.business',
                'client:id,full_name,document_number',
            ])->lockForUpdate()->findOrFail($id);

            if (!$count->status) throw new \Exception('El inventario esta eliminado');
            if ($count->inventory_status === 'Aplicado') throw new \Exception('Este inventario ya fue aplicado');
            // Ver nota en InventoryController::apply: sin conteo subido, todas las lineas valen 0
            // y aplicar vaciaria el stock del cliente.
            if ($count->inventory_status === 'En espera') {
                throw new \Exception('Todavia no se subio el conteo. Sube la hoja con el stock real antes de aplicar el inventario.');
            }
            if (!$count->client_id) throw new \Exception('El inventario no tiene cliente asignado');
            StorageScope::assertClient((int)$count->client_id);

            $warehouse = $count->warehouse;
            if (!$warehouse || !$warehouse->business_branch_id) throw new \Exception('El inventario no tiene almacen valido');

            $business = $warehouse->branch?->business;
            if (!$business || $business->business_key !== BusinessScope::KAMARY_MEDICALS) {
                throw new \Exception('El inventario no pertenece al grupo de almacenamiento');
            }

            $stockService = app(StockService::class);
            $positiveRows = [];
            $negativeRows = [];
            foreach ($count->items as $item) {
                if (!$item->article_id || !$item->warehouse_id) {
                    throw new \Exception("El item {$item->id} no tiene articulo o almacen valido");
                }
                StorageScope::assertArticleBelongsToClient((int)$item->article_id, (int)$count->client_id);

                $currentStock = round($stockService->getAvailableStockByStorageKey(
                    (int)$item->article_id,
                    (int)$item->warehouse_id,
                    trim((string)($item->lot ?? '')),
                    $item->expiration_date ? $item->expiration_date->format('Y-m-d') : null,
                    trim((string)($item->location ?? '')),
                    0,
                    (int)$business->id,
                    false,
                    (int)$count->client_id
                ), 3);
                $realStock = round((float)$item->real_stock, 3);
                $difference = round($realStock - $currentStock, 3);

                if (
                    abs(round((float)$item->system_stock, 3) - $currentStock) > 0.0001
                    || abs(round((float)$item->difference, 3) - $difference) > 0.0001
                ) {
                    $item->update([
                        'system_stock' => $currentStock,
                        'difference' => $difference,
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
                $createdEntryNote = $this->createInventoryEntryAdjustment($count, $positiveRows, $business->id, $warehouse->business_branch_id);
            }

            $createdExitNote = null;
            if (count($negativeRows) > 0) {
                $createdExitNote = $this->createInventoryExitAdjustment($count, $negativeRows, $business->id, $warehouse->business_branch_id);
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
                'branch:id,name,business_id',
                'warehouse:id,name,business_branch_id',
                'client:id,document_type,document_number,full_name',
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

    private function stockRows(?int $warehouseId, string $location, ?int $clientId): array
    {
        $entryMovements = DB::table('entry_note_items as entry_item')
            ->join('entry_notes as entry_note', 'entry_note.id', '=', 'entry_item.entry_note_id')
            ->join('businesses as entry_business', 'entry_business.id', '=', 'entry_note.business_id')
            ->where('entry_note.status', 1)
            ->where('entry_note.entry_status', 'approved')
            ->where('entry_item.status', 1)
            ->where('entry_business.business_key', BusinessScope::KAMARY_MEDICALS)
            ->selectRaw("
                CONCAT('entry-', entry_item.id) as source_key,
                entry_item.article_id as article_id,
                COALESCE(entry_item.warehouse_id, entry_note.warehouse_id) as warehouse_id,
                COALESCE(NULLIF(entry_item.lot, ''), NULLIF(entry_item.batch_code, ''), '') as lot,
                entry_item.expiration_date as expiration_date,
                COALESCE(NULLIF(entry_item.location, ''), '') as location,
                entry_note.client_id as client_id,
                entry_item.quantity as quantity
            ");

        $incomingTotals = DB::query()
            ->fromSub($entryMovements, 'incoming')
            ->selectRaw('
                MIN(incoming.source_key) as source_key,
                incoming.article_id,
                incoming.warehouse_id,
                incoming.lot,
                incoming.expiration_date,
                incoming.location,
                incoming.client_id,
                COALESCE(SUM(incoming.quantity), 0) as qty_in
            ')
            ->groupBy('incoming.article_id', 'incoming.warehouse_id', 'incoming.lot', 'incoming.expiration_date', 'incoming.location', 'incoming.client_id');

        $outgoingTotals = DB::table('exit_note_items as exit_item')
            ->join('exit_notes as exit_note', 'exit_note.id', '=', 'exit_item.exit_note_id')
            ->join('businesses as exit_business', 'exit_business.id', '=', 'exit_note.business_id')
            ->where('exit_note.status', 1)
            ->where('exit_item.status', 1)
            ->where('exit_business.business_key', BusinessScope::KAMARY_MEDICALS)
            ->when(Schema::hasColumn('exit_notes', 'exit_status'), fn($query) => $query->where('exit_note.exit_status', 'approved'))
            ->selectRaw("
                exit_item.article_id,
                COALESCE(exit_item.warehouse_id, exit_note.warehouse_id) as warehouse_id,
                COALESCE(NULLIF(exit_item.batch_code, ''), '') as lot,
                exit_item.expiration_date as expiration_date,
                COALESCE(NULLIF(exit_item.location, ''), '') as location,
                exit_note.client_id as client_id,
                COALESCE(SUM(exit_item.quantity), 0) as qty_out
            ")
            ->groupBy('exit_item.article_id', 'warehouse_id', 'lot', 'exit_item.expiration_date', 'location', 'exit_note.client_id');

        $query = DB::query()
            ->fromSub($incomingTotals, 'stock')
            ->join('articles as article', 'article.id', '=', 'stock.article_id')
            ->when(Schema::hasColumn('articles', 'module_scope'), fn($query) => $query->where('article.module_scope', 'storage'))
            ->leftJoin('units as unit', 'unit.id', '=', 'article.unit_id')
            ->leftJoin('warehouses as warehouse', 'warehouse.id', '=', 'stock.warehouse_id')
            ->leftJoin('clients as client', 'client.id', '=', 'stock.client_id')
            ->leftJoin('client_storage_tariffs as tariff', 'tariff.client_id', '=', 'stock.client_id')
            ->leftJoin('storage_locations as storage_location', function ($join) {
                $join->on('storage_location.warehouse_id', '=', 'stock.warehouse_id')
                    ->whereRaw('storage_location.code = stock.location')
                    ->whereRaw('COALESCE(storage_location.client_id, 0) = COALESCE(stock.client_id, 0)')
                    ->whereNotNull('storage_location.status');
            })
            ->leftJoinSub($outgoingTotals, 'outgoing', function ($join) {
                $join->on('outgoing.article_id', '=', 'stock.article_id')
                    ->on('outgoing.warehouse_id', '=', 'stock.warehouse_id')
                    ->whereRaw("COALESCE(outgoing.lot, '') = COALESCE(stock.lot, '')")
                    ->whereRaw("COALESCE(outgoing.location, '') = COALESCE(stock.location, '')")
                    ->whereRaw("COALESCE(outgoing.expiration_date, '1000-01-01') = COALESCE(stock.expiration_date, '1000-01-01')")
                    ->whereRaw("COALESCE(outgoing.client_id, 0) = COALESCE(stock.client_id, 0)");
            })
            ->when($warehouseId, fn($query) => $query->where('stock.warehouse_id', $warehouseId))
            ->when($location !== '', fn($query) => $query->where('stock.location', $location))
            ->when($clientId, fn($query) => $query->where('stock.client_id', $clientId))
            ->whereRaw('(COALESCE(stock.qty_in, 0) - COALESCE(outgoing.qty_out, 0)) > 0')
            ->orderBy('article.name')
            ->orderBy('stock.lot')
            ->selectRaw("
                stock.source_key,
                stock.article_id,
                stock.warehouse_id,
                COALESCE(stock.lot, '') as lot,
                stock.expiration_date,
                COALESCE(article.name, '') as article_name,
                stock.client_id,
                COALESCE(client.full_name, '') as client_name,
                COALESCE(unit.symbol, unit.name, '') as unit_label,
                COALESCE(stock.location, '') as location,
                COALESCE(storage_location.temperature_range, tariff.temperature_range, '') as registered_temperature_range,
                COALESCE(stock.qty_in, 0) - COALESCE(outgoing.qty_out, 0) as system_stock
            ");

        return $query->get()
            ->values()
            ->map(function ($row, $index) {
                $systemStock = round((float)$row->system_stock, 3);
                return [
                    'id' => $index + 1,
                    'source_key' => $row->source_key,
                    'article_id' => $row->article_id,
                    'warehouse_id' => $row->warehouse_id,
                    'lot' => (string)($row->lot ?? ''),
                    'expiration_date' => $row->expiration_date ? substr((string)$row->expiration_date, 0, 10) : '',
                    'article_name' => (string)($row->article_name ?? ''),
                    'client_name' => (string)($row->client_name ?? ''),
                    'unit_label' => (string)($row->unit_label ?? ''),
                    'location' => (string)($row->location ?? ''),
                    'temperature_range' => (string)($row->registered_temperature_range ?? ''),
                    'system_stock' => $systemStock,
                    'real_stock' => 0,
                ];
            })
            ->all();
    }

    private function locationOptions(): array
    {
        $registeredLocations = DB::table('storage_locations as storage_location')
            ->join('warehouses as warehouse', 'warehouse.id', '=', 'storage_location.warehouse_id')
            ->join('business_branches as branch', 'branch.id', '=', 'warehouse.business_branch_id')
            ->join('businesses as business', 'business.id', '=', 'branch.business_id')
            ->whereNotNull('storage_location.status')
            ->whereNotNull('warehouse.status')
            ->where('business.business_key', BusinessScope::KAMARY_MEDICALS)
            ->selectRaw("
                storage_location.code as location,
                storage_location.warehouse_id,
                storage_location.client_id,
                storage_location.temperature_range
            ");

        $rows = DB::query()
            ->fromSub($registeredLocations, 'locations')
            ->distinct()
            ->whereNotNull('location')
            ->orderBy('location')
            ->get();

        return $rows
            ->map(fn($row) => [
                'location' => (string)$row->location,
                'warehouse_id' => $row->warehouse_id ? (int)$row->warehouse_id : null,
                'client_id' => $row->client_id ? (int)$row->client_id : null,
                'temperature_range' => $row->temperature_range,
            ])
            ->unique(fn($row) => ($row['warehouse_id'] ?? 'all') . '|' . ($row['client_id'] ?? 'all') . '|' . $row['location'])
            ->values()
            ->all();
    }

    private function assertLocationBelongsToClient(int $warehouseId, string $location, int $clientId): void
    {
        $exists = DB::table('storage_locations')
            ->where('warehouse_id', $warehouseId)
            ->where('client_id', $clientId)
            ->whereRaw('LOWER(TRIM(code)) = ?', [mb_strtolower($location)])
            ->whereNotNull('status')
            ->exists();

        if (!$exists) {
            throw new \Exception('La ubicacion seleccionada no pertenece al cliente');
        }
    }

    public function status(Request $request)
    {
        $response = new Response();
        try {
            $updated = $this->storageInventoryQuery()
                ->where($this->identifier, $request->id)
                ->update([
                    'status' => $request->status ? 0 : 1,
                    'updated_by' => Auth::id(),
                ]);
            if (!$updated) throw new \Exception('Inventario no encontrado en almacenamiento');

            $response->status = 200;
            $response->message = 'Operacion correcta';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function delete(Request $request, string $id)
    {
        $response = new Response();
        try {
            $updated = $this->storageInventoryQuery()
                ->where($this->identifier, $id)
                ->update([
                    'status' => null,
                    'updated_by' => Auth::id(),
                ]);
            if (!$updated) throw new \Exception('No se ha eliminado ningun registro');

            $response->status = 200;
            $response->message = 'Operacion correcta';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    private function storageInventoryQuery()
    {
        return $this->model::query()
            ->whereHas('client', fn($query) => StorageScope::applyClientScope($query));
    }

    private function nextCode(): string
    {
        $next = 1;
        $latest = StorageInventoryCount::query()->lockForUpdate()->latest('id')->value('code');
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) {
            $next = ((int)$matches[1]) + 1;
        }

        return 'AI' . str_pad((string)$next, 5, '0', STR_PAD_LEFT);
    }

    private function createInventoryEntryAdjustment(StorageInventoryCount $count, array $items, int $businessId, int $branchId): EntryNote
    {
        $today = now()->toDateString();
        $userId = Auth::id();

        $entryNote = EntryNote::create([
            'business_id' => $businessId,
            'business_branch_id' => $branchId,
            'warehouse_id' => $count->warehouse_id,
            'client_id' => $count->client_id,
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
            'created_by' => $userId,
            'updated_by' => $userId,
        ]);

        $entryNote->code = 'NE' . str_pad((string)$entryNote->id, 5, '0', STR_PAD_LEFT);
        $entryNote->save();

        foreach ($items as $item) {
            $quantity = round((float)$item->difference, 3);
            EntryNoteItem::create([
                'entry_note_id' => $entryNote->id,
                'batch_code' => $item->lot ?: null,
                'lot' => $item->lot ?: null,
                'expiration_date' => $item->expiration_date?->format('Y-m-d'),
                'article_id' => $item->article_id,
                'warehouse_id' => $item->warehouse_id,
                'stock' => (float)$item->system_stock,
                'cost_unit' => 0,
                'location' => $item->location ?: null,
                'requested_quantity' => $quantity,
                'received_quantity' => $quantity,
                'quantity' => $quantity,
                'total' => 0,
                'status' => true,
            ]);
        }

        return $entryNote;
    }

    private function createInventoryExitAdjustment(StorageInventoryCount $count, array $items, int $businessId, int $branchId): ExitNote
    {
        $userId = Auth::id();
        $today = now()->toDateString();
        $exitNote = ExitNote::create([
            'business_id' => $businessId,
            'business_branch_id' => $branchId,
            'warehouse_id' => $count->warehouse_id,
            'client_id' => $count->client_id,
            'client_name' => $count->client?->full_name ?: null,
            'exit_date' => $today,
            'document_type' => 'Ajuste inventario',
            'document_series' => 'AJE',
            'document_sequence' => $count->code,
            'document_date' => $today,
            'exit_status' => 'approved',
            'motives' => ["Ajuste negativo generado desde inventario {$count->code}"],
            'observations' => "Ajuste negativo generado desde inventario {$count->code}",
            'status' => true,
            'created_by' => $userId,
            'updated_by' => $userId,
        ]);

        $reservedStock = [];
        foreach ($items as $item) {
            $quantity = abs(round((float)$item->difference, 3));
            $lot = trim((string)($item->lot ?? ''));
            $location = trim((string)($item->location ?? ''));
            $expirationDate = $item->expiration_date?->format('Y-m-d');

            $availableStock = app(StockService::class)->getAvailableStockByStorageKey(
                (int)$item->article_id,
                (int)$item->warehouse_id,
                $lot,
                $expirationDate,
                $location,
                (int)$exitNote->id,
                $businessId,
                false,
                (int)$count->client_id
            );
            $stockKey = implode('|', [
                $item->article_id,
                $item->warehouse_id,
                $count->client_id,
                mb_strtolower($lot),
                $expirationDate ?: '',
                mb_strtolower($location),
            ]);
            $alreadyReserved = (float)($reservedStock[$stockKey] ?? 0);
            $remainingStock = round($availableStock - $alreadyReserved, 3);
            if ($quantity > $remainingStock + 0.0001) {
                throw new \Exception("Stock insuficiente para aplicar inventario. Item {$item->id}, lote {$lot}. Disponible: {$remainingStock}");
            }
            $reservedStock[$stockKey] = round($alreadyReserved + $quantity, 3);

            ExitNoteItem::create([
                'exit_note_id' => $exitNote->id,
                'batch_code' => $lot ?: null,
                'article_id' => $item->article_id,
                'warehouse_id' => $item->warehouse_id,
                'stock' => $availableStock,
                'expiration_date' => $expirationDate,
                'location' => $location ?: null,
                'destination_location' => null,
                'quantity' => $quantity,
                'total' => $quantity,
                'status' => true,
            ]);
        }

        return $exitNote;
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
}
