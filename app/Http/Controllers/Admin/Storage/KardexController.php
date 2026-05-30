<?php

namespace App\Http\Controllers\Admin\Storage;

use App\Http\Classes\dxResponse;
use App\Http\Controllers\BasicController;
use App\Models\Business;
use App\Models\dxDataGrid;
use App\Models\StorageLocation;
use App\Models\Warehouse;
use App\Support\BusinessScope;
use App\Support\StorageScope;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
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
                ->get([
                    'id',
                    'status',
                    'warehouse_id',
                    'warehouse_name',
                    'client_id',
                    'client_name',
                    'code',
                    'temperature_range',
                    'occupancy_status',
                    'occupied_clients',
                    'occupied_products',
                    'occupied_stock',
                    'occupied_from',
                    'occupied_until',
                ]);

            $clients = StorageScope::clientQuery()
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
            $warehouse = $warehouseId ? $this->storageWarehouse($warehouseId) : new Warehouse();

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
            $warehouse = $this->storageWarehouse($id);
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
            $clientId = $this->nullableInt($request->input('client_id'));
            $code = trim((string) $request->input('code'));
            $temperature = trim((string) $request->input('temperature_range'));

            if (!$clientId) {
                throw new \Exception('El cliente es obligatorio');
            }
            StorageScope::assertClient($clientId);
            if ($code === '') {
                throw new \Exception('La codificacion es obligatoria');
            }
            if (!in_array($temperature, self::TEMPERATURES, true)) {
                throw new \Exception('La temperatura es obligatoria');
            }

            DB::beginTransaction();

            Warehouse::query()->whereKey($warehouse->id)->lockForUpdate()->first();

            $locationId = $this->nullableInt($request->input('id'));
            $location = $locationId ? $this->storageLocation($locationId) : new StorageLocation();
            if ($location->exists && $location->client_id && (int) $location->client_id !== $clientId) {
                throw new \Exception('No se puede cambiar el cliente de una ubicacion registrada');
            }

            $duplicatedLocation = StorageLocation::query()
                ->where('warehouse_id', $warehouse->id)
                ->whereNotNull('status')
                ->whereRaw('LOWER(TRIM(code)) = ?', [mb_strtolower($code)])
                ->when($locationId, fn($query) => $query->whereKeyNot($locationId))
                ->lockForUpdate()
                ->exists();
            if ($duplicatedLocation) {
                throw new \Exception('Ya existe una ubicacion con esa codificacion en el almacen seleccionado');
            }

            if (!$location->exists) {
                $location->created_by = Auth::id();
            }

            $location->fill([
                'warehouse_id' => $warehouse->id,
                'client_id' => $clientId,
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
            $location = $this->storageLocation($id);
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
            fputcsv($output, [
                'ESTADO',
                'OCUPACION',
                'ALMACEN',
                'CLIENTE_ASIGNADO',
                'UBICACION',
                'TEMPERATURA',
                'CLIENTE_OCUPANTE',
                'PRODUCTOS_OCUPANTES',
                'STOCK_OCUPADO',
                'OCUPADO_DESDE',
                'OCUPADO_HASTA',
                'FECHA_REGISTRO',
                'USUARIO_REGISTRO',
            ]);
            foreach ($rows as $row) {
                fputcsv($output, [
                    $row->status ? 'Activo' : 'Inactivo',
                    $row->occupancy_status,
                    $row->warehouse_name,
                    $row->client_name,
                    $row->code,
                    $row->temperature_range,
                    $row->occupied_clients,
                    $row->occupied_products,
                    number_format((float) $row->occupied_stock, 3, '.', ''),
                    $row->occupied_from,
                    $row->occupied_until,
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

    public function movements(Request $request): HttpResponse|ResponseFactory
    {
        $response = new Response();

        try {
            $articleId = $this->nullableInt($request->input('article_id'));
            if (!$articleId) {
                throw new \Exception('El articulo es obligatorio');
            }

            $warehouseId = $this->nullableInt($request->input('warehouse_id'));
            $clientId = $this->nullableInt($request->input('client_id'));
            if ($clientId) StorageScope::assertClient($clientId);
            $lot = trim((string) $request->input('lot', ''));
            $expirationDate = $this->nullableDate($request->input('expiration_date'));
            $location = trim((string) $request->input('location', ''));
            $startDate = $this->monthBoundary($request->input('start_month'), false);
            $endDate = $this->monthBoundary($request->input('end_month'), true);

            $entryMovements = DB::table('entry_note_items as entry_item')
                ->join('entry_notes as entry_note', 'entry_note.id', '=', 'entry_item.entry_note_id')
                ->join('businesses as entry_business', 'entry_business.id', '=', 'entry_note.business_id')
                ->where('entry_note.status', 1)
                ->where('entry_note.entry_status', 'approved')
                ->where('entry_item.status', 1)
                ->where('entry_business.business_key', BusinessScope::KAMARY_MEDICALS)
                ->where('entry_item.article_id', $articleId)
                ->when($warehouseId, fn($query) => $query->whereRaw('COALESCE(entry_item.warehouse_id, entry_note.warehouse_id) = ?', [$warehouseId]))
                ->when($clientId, fn($query) => $query->where('entry_note.client_id', $clientId))
                ->whereRaw("COALESCE(NULLIF(entry_item.lot, ''), NULLIF(entry_item.batch_code, ''), '') = ?", [$lot])
                ->whereRaw("COALESCE(entry_item.expiration_date, '1000-01-01') = COALESCE(?, '1000-01-01')", [$expirationDate])
                ->whereRaw("COALESCE(NULLIF(entry_item.location, ''), '') = ?", [$location])
                ->selectRaw("
                    CONCAT('entry-', entry_item.id) as id,
                    COALESCE(entry_note.updated_at, entry_note.created_at) as movement_date,
                    COALESCE(entry_note.code, CONCAT('NE', LPAD(entry_note.id, 5, '0'))) as code,
                    TRIM(CONCAT(
                        COALESCE(entry_note.document_type, ''),
                        CASE WHEN COALESCE(entry_note.document_series, '') <> '' OR COALESCE(entry_note.document_sequence, '') <> '' THEN ' ' ELSE '' END,
                        COALESCE(entry_note.document_series, ''),
                        CASE WHEN COALESCE(entry_note.document_series, '') <> '' AND COALESCE(entry_note.document_sequence, '') <> '' THEN '-' ELSE '' END,
                        COALESCE(entry_note.document_sequence, '')
                    )) as document,
                    'ENTRADA' as operation,
                    entry_item.quantity as quantity_in,
                    0 as quantity_out,
                    1 as sort_order
                ");

            $exitMovements = DB::table('exit_note_items as exit_item')
                ->join('exit_notes as exit_note', 'exit_note.id', '=', 'exit_item.exit_note_id')
                ->join('businesses as exit_business', 'exit_business.id', '=', 'exit_note.business_id')
                ->where('exit_note.status', 1)
                ->where('exit_item.status', 1)
                ->where('exit_business.business_key', BusinessScope::KAMARY_MEDICALS)
                ->when(Schema::hasColumn('exit_notes', 'exit_status'), fn($query) => $query->where('exit_note.exit_status', 'approved'))
                ->where('exit_item.article_id', $articleId)
                ->when($warehouseId, fn($query) => $query->whereRaw('COALESCE(exit_item.warehouse_id, exit_note.warehouse_id) = ?', [$warehouseId]))
                ->when($clientId, fn($query) => $query->where('exit_note.client_id', $clientId))
                ->whereRaw("COALESCE(NULLIF(exit_item.batch_code, ''), '') = ?", [$lot])
                ->whereRaw("COALESCE(exit_item.expiration_date, '1000-01-01') = COALESCE(?, '1000-01-01')", [$expirationDate])
                ->whereRaw("COALESCE(NULLIF(exit_item.location, ''), '') = ?", [$location])
                ->selectRaw("
                    CONCAT('exit-', exit_item.id) as id,
                    COALESCE(exit_note.updated_at, exit_note.created_at) as movement_date,
                    CONCAT('NS', LPAD(exit_note.id, 5, '0')) as code,
                    COALESCE(NULLIF(exit_note.client_name, ''), NULLIF(exit_note.observations, ''), '') as document,
                    'SALIDA' as operation,
                    0 as quantity_in,
                    exit_item.quantity as quantity_out,
                    2 as sort_order
                ");

            $movementQuery = $entryMovements
                ->unionAll($exitMovements);

            $rows = DB::query()
                ->fromSub($movementQuery, 'movements')
                ->when($endDate, fn($query) => $query->whereDate('movement_date', '<=', $endDate))
                ->orderBy('movement_date')
                ->orderBy('sort_order')
                ->get();

            $balance = 0;
            $visibleRows = [];
            foreach ($rows as $row) {
                $qtyIn = (float) ($row->quantity_in ?? 0);
                $qtyOut = (float) ($row->quantity_out ?? 0);
                $balance = round($balance + $qtyIn - $qtyOut, 3);

                if ($startDate && substr((string) $row->movement_date, 0, 10) < $startDate) {
                    continue;
                }

                $row->quantity_in = $qtyIn;
                $row->quantity_out = $qtyOut;
                $row->balance = $balance;
                $visibleRows[] = $row;
            }

            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = $visibleRows;
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
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
            ->leftJoin('clients as assigned_client', 'assigned_client.id', '=', 'location.client_id')
            ->leftJoin('users as creator', 'creator.id', '=', 'location.created_by')
            ->leftJoinSub($this->locationOccupancySummaryQuery(), 'occupancy', function ($join) {
                $join->on('occupancy.warehouse_id', '=', 'location.warehouse_id')
                    ->whereRaw('occupancy.location = location.code')
                    ->whereRaw('COALESCE(occupancy.client_id, 0) = COALESCE(location.client_id, 0)');
            })
            ->whereNotNull('location.status')
            ->whereIn('business.business_key', $this->listBusinessKeys())
            ->whereNotNull('business.status')
            ->selectRaw("
                location.id,
                location.status,
                location.warehouse_id,
                warehouse.name as warehouse_name,
                location.client_id,
                COALESCE(assigned_client.full_name, '') as client_name,
                location.code,
                location.temperature_range,
                CASE WHEN COALESCE(occupancy.occupied_stock, 0) > 0 THEN 'Ocupado' ELSE 'Libre' END as occupancy_status,
                COALESCE(occupancy.occupied_clients, '') as occupied_clients,
                COALESCE(occupancy.occupied_products, '') as occupied_products,
                COALESCE(occupancy.occupied_stock, 0) as occupied_stock,
                occupancy.occupied_from,
                occupancy.occupied_until,
                location.created_at,
                COALESCE(NULLIF(creator.fullname, ''), NULLIF(TRIM(CONCAT(COALESCE(creator.name, ''), ' ', COALESCE(creator.lastname, ''))), ''), creator.username, '') as creator_label
            ");

        return DB::query()->fromSub($base, 'rows')->select('rows.*');
    }

    private function locationOccupancySummaryQuery()
    {
        $entryMovements = DB::table('entry_note_items as entry_item')
            ->join('entry_notes as entry_note', 'entry_note.id', '=', 'entry_item.entry_note_id')
            ->join('businesses as entry_business', 'entry_business.id', '=', 'entry_note.business_id')
            ->leftJoin('clients as entry_client', 'entry_client.id', '=', 'entry_note.client_id')
            ->where('entry_note.status', 1)
            ->where('entry_note.entry_status', 'approved')
            ->where('entry_item.status', 1)
            ->where('entry_business.business_key', BusinessScope::KAMARY_MEDICALS)
            ->selectRaw("
                entry_item.article_id as article_id,
                COALESCE(entry_item.warehouse_id, entry_note.warehouse_id) as warehouse_id,
                COALESCE(NULLIF(entry_item.lot, ''), NULLIF(entry_item.batch_code, ''), '') as lot,
                entry_item.expiration_date as expiration_date,
                COALESCE(NULLIF(entry_item.location, ''), '') as location,
                entry_note.client_id as client_id,
                COALESCE(entry_client.full_name, '') as client_name,
                COALESCE(entry_note.entry_date, DATE(entry_note.created_at)) as occupied_from,
                entry_item.quantity as quantity
            ");

        $incomingTotals = DB::query()
            ->fromSub($entryMovements, 'incoming')
            ->selectRaw("
                incoming.article_id,
                incoming.warehouse_id,
                incoming.lot,
                incoming.expiration_date,
                incoming.location,
                incoming.client_id,
                GROUP_CONCAT(DISTINCT NULLIF(incoming.client_name, '') SEPARATOR ', ') as client_name,
                MIN(incoming.occupied_from) as occupied_from,
                COALESCE(SUM(incoming.quantity), 0) as qty_in
            ")
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

        $currentRows = DB::query()
            ->fromSub($incomingTotals, 'stock')
            ->join('articles as article', 'article.id', '=', 'stock.article_id')
            ->when(Schema::hasColumn('articles', 'module_scope'), fn($query) => $query->where('article.module_scope', 'storage'))
            ->leftJoinSub($outgoingTotals, 'outgoing', function ($join) {
                $join->on('outgoing.article_id', '=', 'stock.article_id')
                    ->on('outgoing.warehouse_id', '=', 'stock.warehouse_id')
                    ->whereRaw("COALESCE(outgoing.lot, '') = COALESCE(stock.lot, '')")
                    ->whereRaw("COALESCE(outgoing.location, '') = COALESCE(stock.location, '')")
                    ->whereRaw("COALESCE(outgoing.expiration_date, '1000-01-01') = COALESCE(stock.expiration_date, '1000-01-01')")
                    ->whereRaw("COALESCE(outgoing.client_id, 0) = COALESCE(stock.client_id, 0)");
            })
            ->whereRaw('(COALESCE(stock.qty_in, 0) - COALESCE(outgoing.qty_out, 0)) > 0')
            ->selectRaw("
                stock.warehouse_id,
                COALESCE(stock.location, '') as location,
                stock.client_id,
                COALESCE(stock.client_name, '') as client_name,
                CONCAT(
                    COALESCE(article.name, ''),
                    CASE WHEN COALESCE(stock.lot, '') <> '' THEN CONCAT(' lote ', stock.lot) ELSE '' END,
                    ' (',
                    ROUND(COALESCE(stock.qty_in, 0) - COALESCE(outgoing.qty_out, 0), 3),
                    ')'
                ) as product_label,
                stock.occupied_from,
                stock.expiration_date as occupied_until,
                COALESCE(stock.qty_in, 0) - COALESCE(outgoing.qty_out, 0) as current_stock
            ");

        return DB::query()
            ->fromSub($currentRows, 'current')
            ->selectRaw("
                current.warehouse_id,
                current.location,
                current.client_id,
                SUM(current.current_stock) as occupied_stock,
                MIN(current.occupied_from) as occupied_from,
                MAX(current.occupied_until) as occupied_until,
                GROUP_CONCAT(DISTINCT NULLIF(current.client_name, '') SEPARATOR ', ') as occupied_clients,
                GROUP_CONCAT(DISTINCT current.product_label SEPARATOR '; ') as occupied_products
            ")
            ->groupBy('current.warehouse_id', 'current.location', 'current.client_id');
    }

    private function kardexQuery(Request $request)
    {
        $warehouseId = $this->nullableInt($request->input('warehouse_id'));
        $clientId = $this->nullableInt($request->input('client_id'));
        if ($clientId) StorageScope::assertClient($clientId);
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
                entry_item.quantity as quantity,
                entry_note.client_id as client_id,
                COALESCE(entry_note.updated_at, entry_note.created_at) as movement_at
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
                COALESCE(SUM(incoming.quantity), 0) as qty_in,
                incoming.client_id,
                MAX(incoming.movement_at) as last_movement_at
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
                COALESCE(SUM(exit_item.quantity), 0) as qty_out,
                exit_note.client_id as client_id,
                MAX(COALESCE(exit_note.updated_at, exit_note.created_at)) as last_movement_at
            ")
            ->groupBy('exit_item.article_id', 'warehouse_id', 'lot', 'exit_item.expiration_date', 'location', 'exit_note.client_id');

        $base = DB::query()
            ->fromSub($incomingTotals, 'stock')
            ->join('articles as article', 'article.id', '=', 'stock.article_id')
            ->when(Schema::hasColumn('articles', 'module_scope'), fn($query) => $query->where('article.module_scope', 'storage'))
            ->leftJoin('units as unit', 'unit.id', '=', 'article.unit_id')
            ->leftJoin('warehouses as warehouse', 'warehouse.id', '=', 'stock.warehouse_id')
            ->leftJoin('storage_locations as storage_location', function ($join) {
                $join->on('storage_location.warehouse_id', '=', 'stock.warehouse_id')
                    ->whereRaw("storage_location.code = stock.location")
                    ->whereRaw("COALESCE(storage_location.client_id, 0) = COALESCE(stock.client_id, 0)")
                    ->whereNotNull('storage_location.status');
            })
            ->leftJoin('clients as client', 'client.id', '=', 'stock.client_id')
            ->leftJoinSub($outgoingTotals, 'outgoing', function ($join) {
                $join->on('outgoing.article_id', '=', 'stock.article_id')
                    ->on('outgoing.warehouse_id', '=', 'stock.warehouse_id')
                    ->whereRaw("COALESCE(outgoing.lot, '') = COALESCE(stock.lot, '')")
                    ->whereRaw("COALESCE(outgoing.location, '') = COALESCE(stock.location, '')")
                    ->whereRaw("COALESCE(outgoing.expiration_date, '1000-01-01') = COALESCE(stock.expiration_date, '1000-01-01')")
                    ->whereRaw("COALESCE(outgoing.client_id, 0) = COALESCE(stock.client_id, 0)");
            })
            ->when($warehouseId, fn($query) => $query->where('stock.warehouse_id', $warehouseId))
            ->when($clientId, fn($query) => $query->where('stock.client_id', $clientId))
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
                stock.client_id,
                client.full_name as client_name,
                COALESCE(stock.qty_in, 0) - COALESCE(outgoing.qty_out, 0) as system_stock,
                CASE
                    WHEN outgoing.last_movement_at IS NULL THEN stock.last_movement_at
                    WHEN stock.last_movement_at IS NULL THEN outgoing.last_movement_at
                    WHEN outgoing.last_movement_at > stock.last_movement_at THEN outgoing.last_movement_at
                    ELSE stock.last_movement_at
                END as last_movement_at
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
            default => $query->orderBy('last_movement_at', 'DESC')->orderBy('inventory')->orderBy('lot'),
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

    private function storageLocation($id): StorageLocation
    {
        $location = StorageLocation::query()
            ->whereKey($this->nullableInt($id))
            ->whereHas('warehouse.branch.business', function ($business) {
                $business->where('business_key', BusinessScope::KAMARY_MEDICALS)->whereNotNull('status');
            })
            ->first();

        if (!$location) {
            throw new \Exception('La ubicacion seleccionada no existe');
        }

        return $location;
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

    private function nullableDate($value): ?string
    {
        if ($value === null) return null;
        $text = trim((string) $value);
        if ($text === '' || $text === '0000-00-00') return null;
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $text)) {
            throw new \Exception("Fecha invalida: {$value}");
        }
        return $text;
    }

    private function monthBoundary($value, bool $endOfMonth): ?string
    {
        if ($value === null) return null;
        $text = trim((string) $value);
        if ($text === '') return null;
        if (!preg_match('/^\d{4}-\d{2}$/', $text)) {
            throw new \Exception("Mes invalido: {$value}");
        }

        $date = Carbon::createFromFormat('Y-m-d', "{$text}-01");
        return ($endOfMonth ? $date->endOfMonth() : $date->startOfMonth())->format('Y-m-d');
    }

    private function requestBool($value): bool
    {
        if (is_bool($value)) return $value;
        return in_array((string) $value, ['1', 'true', 'on', 'yes'], true);
    }
}
