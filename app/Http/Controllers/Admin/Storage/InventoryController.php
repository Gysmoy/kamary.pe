<?php

namespace App\Http\Controllers\Admin\Storage;

use App\Http\Controllers\BasicController;
use App\Models\Client;
use App\Models\ClientStorageTariff;
use App\Models\StorageInventoryCount;
use App\Models\StorageInventoryCountItem;
use App\Models\Warehouse;
use App\Support\BusinessScope;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
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
            ->leftJoin('users as updater', 'updater.id', '=', 'storage_inventory_counts.updated_by');
    }

    public function options(Request $request): HttpResponse|ResponseFactory
    {
        $response = new Response();

        try {
            $warehouses = Warehouse::query()
                ->with(['branch:id,name,business_id', 'branch.business:id,name,business_key'])
                ->whereNotNull('status')
                ->whereHas('branch.business', function ($business) {
                    $business->where('business_key', BusinessScope::KAMARY_PERU)->whereNotNull('status');
                })
                ->orderBy('name')
                ->get(['id', 'business_branch_id', 'name', 'status']);

            $clients = Client::query()
                ->whereNotNull('status')
                ->where(function ($query) {
                    $query->where('has_storage_service', true)->orWhere('storage_tariff_enabled', true);
                })
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
            $rows = $this->stockRows(
                $this->toNullableInt($request->input('warehouse_id')),
                trim((string)($request->input('location') ?? '')),
                $this->toNullableInt($request->input('client_id'))
            );

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
            $count = StorageInventoryCount::with([
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
            if ($clientId) Client::findOrFail($clientId);

            $location = trim((string)($request->input('location') ?? '')) ?: null;
            $rows = $this->stockRows($warehouseId, $location ?? '', $clientId);
            if (count($rows) === 0) {
                throw new \Exception('No hay stock para registrar con los filtros seleccionados');
            }

            DB::beginTransaction();

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
        $count = StorageInventoryCount::with(['items' => fn($query) => $query->whereNotNull('status')->orderBy('id')])
            ->findOrFail($id);
        $filename = "{$count->code}_inventario.csv";

        return response()->streamDownload(function () use ($count) {
            $output = fopen('php://output', 'w');
            fwrite($output, "\xEF\xBB\xBF");
            fputcsv($output, [
                'ID',
                'LOTE',
                'F_VENCIMIENTO',
                'ARTICULO',
                'CLIENTE',
                'U_MEDIDA',
                'UBICACION',
                'TEMPERATURA',
                'STOCK_SISTEMA',
                'STOCK_REAL',
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
                    number_format((float)$item->real_stock, 3, '.', ''),
                ]);
            }
            fclose($output);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    public function import(Request $request, string $id): HttpResponse|ResponseFactory
    {
        $response = new Response();

        try {
            $count = StorageInventoryCount::findOrFail($id);
            if (!$request->hasFile('format_file')) {
                throw new \Exception('Debes seleccionar el formato a subir');
            }

            $path = $request->file('format_file')->getRealPath();
            $handle = fopen($path, 'r');
            if (!$handle) throw new \Exception('No se pudo leer el archivo');

            $updated = 0;
            $rowNumber = 0;

            DB::beginTransaction();
            while (($row = fgetcsv($handle)) !== false) {
                $rowNumber++;
                if ($rowNumber === 1) continue;
                if (count($row) < 10) continue;

                $itemId = $this->toNullableInt($row[0] ?? null);
                if (!$itemId) continue;

                $realStock = $this->toNullableDecimal($row[9] ?? null) ?? 0;
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

            $count->update(['updated_by' => Auth::id()]);
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

    private function stockRows(?int $warehouseId, string $location, ?int $clientId): array
    {
        $client = $clientId ? Client::find($clientId) : null;
        $clientName = $client?->full_name ?? '';
        $temperature = $clientId
            ? (ClientStorageTariff::where('client_id', $clientId)->value('temperature_range') ?? '')
            : '';

        $entryMovements = DB::table('entry_note_items as entry_item')
            ->join('entry_notes as entry_note', 'entry_note.id', '=', 'entry_item.entry_note_id')
            ->join('businesses as entry_business', 'entry_business.id', '=', 'entry_note.business_id')
            ->where('entry_note.status', 1)
            ->where('entry_item.status', 1)
            ->where('entry_business.business_key', BusinessScope::KAMARY_PERU)
            ->selectRaw("
                CONCAT('entry-', entry_item.id) as source_key,
                entry_item.article_id as article_id,
                COALESCE(entry_item.warehouse_id, entry_note.warehouse_id) as warehouse_id,
                COALESCE(NULLIF(entry_item.lot, ''), NULLIF(entry_item.batch_code, ''), '') as lot,
                CAST(NULL AS DATE) as expiration_date,
                COALESCE(NULLIF(entry_item.location, ''), '') as location,
                entry_item.quantity as quantity
            ");

        $receiptMovements = DB::table('purchase_receipt_items as receipt_item')
            ->join('purchase_receipts as receipt', 'receipt.id', '=', 'receipt_item.purchase_receipt_id')
            ->join('businesses as receipt_business', 'receipt_business.id', '=', 'receipt.business_id')
            ->where('receipt.status', 1)
            ->where('receipt.receipt_status', 'confirmed')
            ->where('receipt_item.status', 1)
            ->where('receipt_business.business_key', BusinessScope::KAMARY_PERU)
            ->selectRaw("
                CONCAT('purchase-receipt-', receipt_item.id) as source_key,
                receipt_item.article_id as article_id,
                receipt_item.warehouse_id as warehouse_id,
                COALESCE(NULLIF(receipt_item.lot, ''), NULLIF(receipt_item.batch_code, ''), '') as lot,
                receipt_item.expiration_date as expiration_date,
                COALESCE(NULLIF(receipt_item.location, ''), '') as location,
                receipt_item.quantity as quantity
            ");

        $incomingTotals = DB::query()
            ->fromSub($entryMovements->unionAll($receiptMovements), 'incoming')
            ->selectRaw('
                MIN(incoming.source_key) as source_key,
                incoming.article_id,
                incoming.warehouse_id,
                incoming.lot,
                incoming.expiration_date,
                incoming.location,
                COALESCE(SUM(incoming.quantity), 0) as qty_in
            ')
            ->groupBy('incoming.article_id', 'incoming.warehouse_id', 'incoming.lot', 'incoming.expiration_date', 'incoming.location');

        $outgoingTotals = DB::table('exit_note_items as exit_item')
            ->join('exit_notes as exit_note', 'exit_note.id', '=', 'exit_item.exit_note_id')
            ->join('businesses as exit_business', 'exit_business.id', '=', 'exit_note.business_id')
            ->where('exit_note.status', 1)
            ->where('exit_item.status', 1)
            ->where('exit_business.business_key', BusinessScope::KAMARY_PERU)
            ->selectRaw("
                exit_item.article_id,
                COALESCE(exit_item.warehouse_id, exit_note.warehouse_id) as warehouse_id,
                COALESCE(NULLIF(exit_item.batch_code, ''), '') as lot,
                exit_item.expiration_date as expiration_date,
                COALESCE(NULLIF(exit_item.location, ''), '') as location,
                COALESCE(SUM(exit_item.quantity), 0) as qty_out
            ")
            ->groupBy('exit_item.article_id', 'warehouse_id', 'lot', 'exit_item.expiration_date', 'location');

        $query = DB::query()
            ->fromSub($incomingTotals, 'stock')
            ->join('articles as article', 'article.id', '=', 'stock.article_id')
            ->leftJoin('units as unit', 'unit.id', '=', 'article.unit_id')
            ->leftJoin('warehouses as warehouse', 'warehouse.id', '=', 'stock.warehouse_id')
            ->leftJoinSub($outgoingTotals, 'outgoing', function ($join) {
                $join->on('outgoing.article_id', '=', 'stock.article_id')
                    ->on('outgoing.warehouse_id', '=', 'stock.warehouse_id')
                    ->whereRaw("COALESCE(outgoing.lot, '') = COALESCE(stock.lot, '')")
                    ->whereRaw("COALESCE(outgoing.location, '') = COALESCE(stock.location, '')")
                    ->whereRaw("COALESCE(outgoing.expiration_date, '1000-01-01') = COALESCE(stock.expiration_date, '1000-01-01')");
            })
            ->when($warehouseId, fn($query) => $query->where('stock.warehouse_id', $warehouseId))
            ->when($location !== '', fn($query) => $query->where('stock.location', $location))
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
                COALESCE(unit.symbol, unit.name, '') as unit_label,
                COALESCE(stock.location, '') as location,
                COALESCE(stock.qty_in, 0) - COALESCE(outgoing.qty_out, 0) as system_stock
            ");

        return $query->get()
            ->values()
            ->map(function ($row, $index) use ($clientName, $temperature) {
                $systemStock = round((float)$row->system_stock, 3);
                return [
                    'id' => $index + 1,
                    'source_key' => $row->source_key,
                    'article_id' => $row->article_id,
                    'warehouse_id' => $row->warehouse_id,
                    'lot' => (string)($row->lot ?? ''),
                    'expiration_date' => $row->expiration_date ? substr((string)$row->expiration_date, 0, 10) : '',
                    'article_name' => (string)($row->article_name ?? ''),
                    'client_name' => $clientName,
                    'unit_label' => (string)($row->unit_label ?? ''),
                    'location' => (string)($row->location ?? ''),
                    'temperature_range' => $temperature,
                    'system_stock' => $systemStock,
                    'real_stock' => 0,
                ];
            })
            ->all();
    }

    private function locationOptions(): array
    {
        $entryLocations = DB::table('entry_note_items')
            ->join('entry_notes', 'entry_notes.id', '=', 'entry_note_items.entry_note_id')
            ->join('businesses', 'businesses.id', '=', 'entry_notes.business_id')
            ->whereNotNull('entry_note_items.location')
            ->where('entry_note_items.location', '!=', '')
            ->where('businesses.business_key', BusinessScope::KAMARY_PERU)
            ->select('entry_note_items.location as location');

        $receiptLocations = DB::table('purchase_receipt_items')
            ->join('purchase_receipts', 'purchase_receipts.id', '=', 'purchase_receipt_items.purchase_receipt_id')
            ->join('businesses', 'businesses.id', '=', 'purchase_receipts.business_id')
            ->whereNotNull('purchase_receipt_items.location')
            ->where('purchase_receipt_items.location', '!=', '')
            ->where('businesses.business_key', BusinessScope::KAMARY_PERU)
            ->select('purchase_receipt_items.location as location');

        return DB::query()
            ->fromSub($entryLocations->union($receiptLocations), 'locations')
            ->distinct()
            ->orderBy('location')
            ->pluck('location')
            ->values()
            ->all();
    }

    private function nextCode(): string
    {
        $next = 1;
        $latest = StorageInventoryCount::query()->latest('id')->value('code');
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) {
            $next = ((int)$matches[1]) + 1;
        }

        return 'AI' . str_pad((string)$next, 5, '0', STR_PAD_LEFT);
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
        if (!is_numeric($text)) throw new \Exception("Valor numerico invalido: {$value}");
        return (float)$text;
    }
}
