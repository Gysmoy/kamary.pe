<?php

namespace App\Http\Controllers\Admin\Storage;

use App\Http\Classes\dxResponse;
use App\Http\Controllers\BasicController;
use App\Models\Business;
use App\Models\Client;
use App\Models\dxDataGrid;
use App\Models\StorageLocation;
use App\Models\Warehouse;
use App\Support\BusinessScope;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use SoDe\Extend\Response;

class KardexController extends BasicController
{
    public $reactView = 'Admin/Kardex';

    private const TEMPERATURES = [
        '-15°C a -25°C',
        '2°C a 8°C',
        '15°C a 25°C',
        '-15°C a -40°C',
    ];

    public function setReactViewProperties(Request $request)
    {
        return [
            'moduleTitle' => 'Kárdex por artículo',
            'requiredPermission' => 'storage-kardex',
            'storageContext' => true,
        ];
    }

    public function options(Request $request): HttpResponse|ResponseFactory
    {
        $response = new Response();

        try {
            $businesses = Business::query()
                ->where('business_key', BusinessScope::KAMARY_MEDICALS)
                ->whereNotNull('status')
                ->orderBy('name')
                ->get(['id', 'business_key', 'name', 'status']);

            $branches = DB::table('business_branches as branch')
                ->join('businesses as business', 'business.id', '=', 'branch.business_id')
                ->where('business.business_key', BusinessScope::KAMARY_MEDICALS)
                ->whereNotNull('business.status')
                ->whereNotNull('branch.status')
                ->orderBy('branch.name')
                ->select('branch.id', 'branch.business_id', 'branch.name', 'branch.status')
                ->get();

            $warehouses = $this->warehouseOptionsQuery()->get(['id', 'business_branch_id', 'name', 'status']);
            $locations = $this->locationsQuery()
                ->orderBy('warehouse_name')
                ->orderBy('code')
                ->get(['id', 'status', 'warehouse_id', 'warehouse_name', 'code', 'temperature_range']);

            $clients = Client::query()
                ->whereNotNull('status')
                ->where(function ($query) {
                    $query->where('has_storage_service', true)
                        ->orWhere('storage_tariff_enabled', true);
                })
                ->orderBy('full_name')
                ->get(['id', 'document_type', 'document_number', 'full_name', 'short_code', 'status']);

            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = [
                'businesses' => $businesses,
                'branches' => $branches,
                'warehouses' => $warehouses,
                'locations' => $locations,
                'clients' => $clients,
                'temperatures' => self::TEMPERATURES,
                'countries' => ['Perú'],
            ];
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function paginate(Request $request): HttpResponse|ResponseFactory
    {
        $response = new dxResponse();

        try {
            $section = (string) $request->input('section', 'kardex');
            $query = match ($section) {
                'warehouses' => $this->warehousesQuery(),
                'locations' => $this->locationsQuery(),
                default => $this->kardexQuery($request),
            };

            $this->applyDxFiltering($query, $request);
            $this->applyDxSorting($query, $request, $section);

            $totalCount = 0;
            if ($request->requireTotalCount) {
                $totalQuery = clone $query;
                $totalCount = DB::query()->fromSub($totalQuery, 'total_rows')->count();
            }

            $rows = $request->isLoadingAll
                ? $query->get()
                : $query->skip($request->skip ?? 0)->take($request->take ?? 10)->get();

            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = $rows;
            $response->totalCount = $totalCount;
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage() . ' Ln.' . $th->getLine();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function saveWarehouse(Request $request): HttpResponse|ResponseFactory
    {
        $response = new Response();

        try {
            $business = Business::query()
                ->whereKey($this->nullableInt($request->input('business_id')))
                ->where('business_key', BusinessScope::KAMARY_MEDICALS)
                ->whereNotNull('status')
                ->first();

            if (!$business) {
                throw new \Exception('La empresa es obligatoria');
            }

            $branch = BusinessScope::requireBranchForBusiness($business, $request->input('business_branch_id'));
            $name = trim((string) $request->input('name'));
            if ($name === '') {
                throw new \Exception('El nombre del almacen es obligatorio');
            }

            DB::beginTransaction();

            $warehouseId = $this->nullableInt($request->input('id'));
            $warehouse = $warehouseId ? Warehouse::find($warehouseId) : new Warehouse();
            if ($warehouseId && !$warehouse) {
                throw new \Exception('El almacen seleccionado no existe');
            }

            if (!$warehouse->exists) {
                $warehouse->created_by = Auth::id();
            }

            $warehouse->fill([
                'business_branch_id' => $branch->id,
                'name' => $name,
                'description' => trim((string) $request->input('description')) ?: null,
                'status' => $this->requestBool($request->input('status', true)),
                'updated_by' => Auth::id(),
            ]);
            $warehouse->save();

            DB::commit();

            $response->status = 200;
            $response->message = 'Almacen guardado correctamente';
            $response->data = $warehouse->fresh(['branch.business']);
        } catch (\Throwable $th) {
            if (DB::transactionLevel() > 0) DB::rollBack();
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function deleteWarehouse(Request $request, string $id): HttpResponse|ResponseFactory
    {
        $response = new Response();

        try {
            $warehouse = Warehouse::find($id);
            if (!$warehouse) {
                throw new \Exception('El almacen seleccionado no existe');
            }
            $warehouse->update(['status' => null, 'updated_by' => Auth::id()]);

            $response->status = 200;
            $response->message = 'Almacen eliminado correctamente';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function saveLocation(Request $request): HttpResponse|ResponseFactory
    {
        $response = new Response();

        try {
            $warehouse = $this->storageWarehouse($request->input('warehouse_id'));
            $code = trim((string) $request->input('code'));
            $temperature = trim((string) $request->input('temperature_range'));

            if ($code === '') {
                throw new \Exception('La codificacion es obligatoria');
            }
            if (!in_array($temperature, self::TEMPERATURES, true)) {
                throw new \Exception('La temperatura es obligatoria');
            }

            DB::beginTransaction();

            $locationId = $this->nullableInt($request->input('id'));
            $location = $locationId ? StorageLocation::find($locationId) : new StorageLocation();
            if ($locationId && !$location) {
                throw new \Exception('La ubicacion seleccionada no existe');
            }

            if (!$location->exists) {
                $location->created_by = Auth::id();
            }

            $location->fill([
                'warehouse_id' => $warehouse->id,
                'client_id' => null,
                'code' => $code,
                'temperature_range' => $temperature,
                'service_order_code' => null,
                'status' => $this->requestBool($request->input('status', true)),
                'updated_by' => Auth::id(),
            ]);
            $location->save();

            DB::commit();

            $response->status = 200;
            $response->message = 'Ubicacion guardada correctamente';
            $response->data = $location->fresh(['warehouse', 'client']);
        } catch (\Throwable $th) {
            if (DB::transactionLevel() > 0) DB::rollBack();
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function deleteLocation(Request $request, string $id): HttpResponse|ResponseFactory
    {
        $response = new Response();

        try {
            $location = StorageLocation::find($id);
            if (!$location) {
                throw new \Exception('La ubicacion seleccionada no existe');
            }
            $location->update(['status' => null, 'updated_by' => Auth::id()]);

            $response->status = 200;
            $response->message = 'Ubicacion eliminada correctamente';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function locationsReport(Request $request)
    {
        $rows = $this->locationsQuery()->orderBy('warehouse_name')->orderBy('code')->get();

        return response()->streamDownload(function () use ($rows) {
            $output = fopen('php://output', 'w');
            fwrite($output, "\xEF\xBB\xBF");
            fputcsv($output, ['ESTADO', 'ALMACEN', 'UBICACION', 'TEMPERATURA', 'FECHA_REGISTRO', 'USUARIO_REGISTRO']);
            foreach ($rows as $row) {
                fputcsv($output, [
                    $row->status ? 'Activo' : 'Inactivo',
                    $row->warehouse_name,
                    $row->code,
                    $row->temperature_range,
                    $row->created_at,
                    $row->creator_label,
                ]);
            }
            fclose($output);
        }, 'ubicaciones_almacenamiento.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    public function inventoryReport(Request $request)
    {
        $rows = $this->kardexQuery($request)->orderBy('inventory')->orderBy('lot')->get();

        return response()->streamDownload(function () use ($rows) {
            $output = fopen('php://output', 'w');
            fwrite($output, "\xEF\xBB\xBF");
            fputcsv($output, ['INVENTARIO', 'LOTE', 'F_V', 'U_MEDIDA', 'STOCK_SISTEMA', 'UBICACION', 'ALMACEN']);
            foreach ($rows as $row) {
                fputcsv($output, [
                    $row->inventory,
                    $row->lot,
                    $row->expiration_date,
                    $row->unit_label,
                    number_format((float) $row->system_stock, 3, '.', ''),
                    $row->location,
                    $row->warehouse_name,
                ]);
            }
            fclose($output);
        }, 'reporte_inventario_almacenamiento.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function warehousesQuery()
    {
        $base = DB::table('warehouses as warehouse')
            ->leftJoin('business_branches as branch', 'branch.id', '=', 'warehouse.business_branch_id')
            ->leftJoin('businesses as business', 'business.id', '=', 'branch.business_id')
            ->leftJoin('users as creator', 'creator.id', '=', 'warehouse.created_by')
            ->whereNotNull('warehouse.status')
            ->whereIn('business.business_key', $this->listBusinessKeys())
            ->whereNotNull('business.status')
            ->selectRaw("
                warehouse.id,
                warehouse.status,
                warehouse.name as warehouse_name,
                warehouse.description,
                branch.id as branch_id,
                branch.name as branch_name,
                business.id as business_id,
                business.name as business_name,
                'Perú' as country,
                warehouse.created_at,
                COALESCE(NULLIF(creator.fullname, ''), NULLIF(TRIM(CONCAT(COALESCE(creator.name, ''), ' ', COALESCE(creator.lastname, ''))), ''), creator.username, '') as creator_label
            ");

        return DB::query()->fromSub($base, 'rows')->select('rows.*');
    }

    private function locationsQuery()
    {
        $base = DB::table('storage_locations as location')
            ->leftJoin('warehouses as warehouse', 'warehouse.id', '=', 'location.warehouse_id')
            ->leftJoin('business_branches as branch', 'branch.id', '=', 'warehouse.business_branch_id')
            ->leftJoin('businesses as business', 'business.id', '=', 'branch.business_id')
            ->leftJoin('users as creator', 'creator.id', '=', 'location.created_by')
            ->whereNotNull('location.status')
            ->whereIn('business.business_key', $this->listBusinessKeys())
            ->whereNotNull('business.status')
            ->selectRaw("
                location.id,
                location.status,
                location.warehouse_id,
                warehouse.name as warehouse_name,
                location.code,
                location.temperature_range,
                location.created_at,
                COALESCE(NULLIF(creator.fullname, ''), NULLIF(TRIM(CONCAT(COALESCE(creator.name, ''), ' ', COALESCE(creator.lastname, ''))), ''), creator.username, '') as creator_label
            ");

        return DB::query()->fromSub($base, 'rows')->select('rows.*');
    }

    private function kardexQuery(Request $request)
    {
        $warehouseId = $this->nullableInt($request->input('warehouse_id'));
        $clientId = $this->nullableInt($request->input('client_id'));
        $stockMode = (string) $request->input('stock_mode', 'with_stock');

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
                entry_item.quantity as quantity
            ");

        $receiptMovements = DB::table('purchase_receipt_items as receipt_item')
            ->join('purchase_receipts as receipt', 'receipt.id', '=', 'receipt_item.purchase_receipt_id')
            ->join('businesses as receipt_business', 'receipt_business.id', '=', 'receipt.business_id')
            ->where('receipt.status', 1)
            ->where('receipt.receipt_status', 'confirmed')
            ->where('receipt_item.status', 1)
            ->where('receipt_business.business_key', BusinessScope::KAMARY_MEDICALS)
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
            ->where('exit_business.business_key', BusinessScope::KAMARY_MEDICALS)
            ->selectRaw("
                exit_item.article_id,
                COALESCE(exit_item.warehouse_id, exit_note.warehouse_id) as warehouse_id,
                COALESCE(NULLIF(exit_item.batch_code, ''), '') as lot,
                exit_item.expiration_date as expiration_date,
                COALESCE(NULLIF(exit_item.location, ''), '') as location,
                COALESCE(SUM(exit_item.quantity), 0) as qty_out
            ")
            ->groupBy('exit_item.article_id', 'warehouse_id', 'lot', 'exit_item.expiration_date', 'location');

        $base = DB::query()
            ->fromSub($incomingTotals, 'stock')
            ->join('articles as article', 'article.id', '=', 'stock.article_id')
            ->leftJoin('units as unit', 'unit.id', '=', 'article.unit_id')
            ->leftJoin('warehouses as warehouse', 'warehouse.id', '=', 'stock.warehouse_id')
            ->leftJoin('storage_locations as storage_location', function ($join) {
                $join->on('storage_location.warehouse_id', '=', 'stock.warehouse_id')
                    ->whereRaw("storage_location.code = stock.location")
                    ->whereNotNull('storage_location.status');
            })
            ->leftJoin('clients as client', 'client.id', '=', 'storage_location.client_id')
            ->leftJoinSub($outgoingTotals, 'outgoing', function ($join) {
                $join->on('outgoing.article_id', '=', 'stock.article_id')
                    ->on('outgoing.warehouse_id', '=', 'stock.warehouse_id')
                    ->whereRaw("COALESCE(outgoing.lot, '') = COALESCE(stock.lot, '')")
                    ->whereRaw("COALESCE(outgoing.location, '') = COALESCE(stock.location, '')")
                    ->whereRaw("COALESCE(outgoing.expiration_date, '1000-01-01') = COALESCE(stock.expiration_date, '1000-01-01')");
            })
            ->when($warehouseId, fn($query) => $query->where('stock.warehouse_id', $warehouseId))
            ->when($clientId, fn($query) => $query->where('storage_location.client_id', $clientId))
            ->selectRaw("
                stock.source_key as id,
                stock.source_key,
                stock.article_id,
                stock.warehouse_id,
                COALESCE(article.name, '') as inventory,
                COALESCE(stock.lot, '') as lot,
                stock.expiration_date,
                COALESCE(unit.symbol, unit.name, '') as unit_label,
                COALESCE(stock.location, '') as location,
                COALESCE(warehouse.name, '') as warehouse_name,
                storage_location.temperature_range,
                storage_location.client_id,
                client.full_name as client_name,
                COALESCE(stock.qty_in, 0) - COALESCE(outgoing.qty_out, 0) as system_stock
            ");

        $query = DB::query()->fromSub($base, 'rows')->select('rows.*');

        if ($stockMode === 'without_stock') {
            $query->where('system_stock', '<=', 0);
        } elseif ($stockMode !== 'all') {
            $query->where('system_stock', '>', 0);
        }

        return $query;
    }

    private function applyDxFiltering($query, Request $request): void
    {
        if ($request->filter) {
            $query->where(function ($subQuery) use ($request) {
                dxDataGrid::filter($subQuery, $request->filter ?? [], false);
            });
        }

        if ($request->group != null) {
            [$grouping] = $request->group;
            $selector = $grouping['selector'];
            $query->select(DB::raw("{$selector} AS `key`"))->groupBy($selector);
        }
    }

    private function applyDxSorting($query, Request $request, string $section): void
    {
        if ($request->group != null) {
            return;
        }

        if ($request->sort != null) {
            foreach ($request->sort as $sorting) {
                $query->orderBy($sorting['selector'], $sorting['desc'] ? 'DESC' : 'ASC');
            }
            return;
        }

        match ($section) {
            'warehouses' => $query->orderBy('warehouse_name'),
            'locations' => $query->orderBy('warehouse_name')->orderBy('code'),
            default => $query->orderBy('inventory')->orderBy('lot'),
        };
    }

    private function storageWarehouse($id): Warehouse
    {
        $warehouse = Warehouse::query()
            ->whereKey($this->nullableInt($id))
            ->whereNotNull('status')
            ->whereHas('branch.business', function ($business) {
                $business->where('business_key', BusinessScope::KAMARY_MEDICALS)->whereNotNull('status');
            })
            ->first();

        if (!$warehouse) {
            throw new \Exception('El almacen es obligatorio');
        }

        return $warehouse;
    }

    private function warehouseOptionsQuery()
    {
        return Warehouse::query()
            ->with(['branch:id,name,business_id', 'branch.business:id,name,business_key'])
            ->whereNotNull('status')
            ->whereHas('branch.business', function ($business) {
                $business->whereIn('business_key', $this->listBusinessKeys())->whereNotNull('status');
            })
            ->orderBy('name');
    }

    private function listBusinessKeys(): array
    {
        return [BusinessScope::KAMARY_MEDICALS];
    }

    private function nullableInt($value): ?int
    {
        if ($value === null) return null;
        $text = trim((string) $value);
        if ($text === '') return null;
        if (!ctype_digit(ltrim($text, '+'))) {
            throw new \Exception("Valor entero invalido: {$value}");
        }
        return (int) $text;
    }

    private function requestBool($value): bool
    {
        if (is_bool($value)) return $value;
        return in_array((string) $value, ['1', 'true', 'on', 'yes'], true);
    }
}
