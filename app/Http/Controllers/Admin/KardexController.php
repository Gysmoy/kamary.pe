<?php

namespace App\Http\Controllers\Admin;

use App\Http\Classes\dxResponse;
use App\Http\Controllers\BasicController;
use App\Models\dxDataGrid;
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

class KardexController extends BasicController
{
    public $reactView = 'Admin/Kardex';
    public $reactRootView = 'admin';
    protected string $moduleScope = 'standard';

    public function setReactViewProperties(Request $request)
    {
        return [
            'moduleTitle' => 'Kardex por articulo',
            'requiredPermission' => 'kardex',
        ];
    }

    public function paginate(Request $request): HttpResponse|ResponseFactory
    {
        $response = new dxResponse();

        try {
            $section = (string) $request->input('section', 'kardex');
            $query = match ($section) {
                'packs' => $this->packsQuery(),
                'warehouses' => $this->warehousesQuery($request),
                'locations' => $this->locationsQuery($request),
                default => $this->monthlyKardexQuery($request),
            };

            $this->applyDxFiltering($query, $request);
            $this->applyDxSorting($query, $request, $section);

            $totalCount = 0;
            if ($request->requireTotalCount) {
                $totalCount = DB::query()->fromSub(clone $query, 'total_rows')->count();
            }

            $rows = $request->isLoadingAll
                ? $query->get()
                : $query->skip($request->skip ?? 0)->take($request->take ?? 25)->get();

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

    public function saveLocation(Request $request): HttpResponse|ResponseFactory
    {
        $response = new Response();

        try {
            if (!Schema::hasTable('warehouse_locations')) {
                throw new \Exception('La tabla de ubicaciones de almacen no existe');
            }

            $warehouse = $this->standardWarehouse($request->input('warehouse_id'));
            $code = trim((string) $request->input('code'));

            if ($code === '') {
                throw new \Exception('La ubicacion es obligatoria');
            }

            DB::beginTransaction();

            $locationId = $this->nullableInt($request->input('id'));
            $location = $locationId ? WarehouseLocation::find($locationId) : new WarehouseLocation();

            if ($locationId && !$location) {
                throw new \Exception('La ubicacion seleccionada no existe');
            }

            if (!$location->exists) {
                $location->created_by = Auth::id();
            }

            $location->fill([
                'warehouse_id' => $warehouse->id,
                'code' => $code,
                'status' => $this->requestBool($request->input('status', true)),
                'updated_by' => Auth::id(),
            ]);
            $location->save();

            DB::commit();

            $response->status = 200;
            $response->message = 'Ubicacion guardada correctamente';
            $response->data = $location->fresh(['warehouse']);
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
            if (!Schema::hasTable('warehouse_locations')) {
                throw new \Exception('La tabla de ubicaciones de almacen no existe');
            }

            $location = WarehouseLocation::find($id);
            if (!$location) {
                throw new \Exception('La ubicacion seleccionada no existe');
            }

            $location->update([
                'status' => null,
                'updated_by' => Auth::id(),
            ]);

            $response->status = 200;
            $response->message = 'Ubicacion eliminada correctamente';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    private function monthlyKardexQuery(Request $request)
    {
        $businessId = $this->nullableInt($request->input('business_id'));
        $branchId = $this->nullableInt($request->input('business_branch_id'));
        $warehouseId = $this->nullableInt($request->input('warehouse_id'));
        $laboratoryId = $this->nullableInt($request->input('laboratory_id'));
        $stockMode = (string) $request->input('stock_mode', 'all');

        $entryMovements = DB::table('entry_note_items as entry_item')
            ->join('entry_notes as entry_note', 'entry_note.id', '=', 'entry_item.entry_note_id')
            ->join('businesses as business', 'business.id', '=', 'entry_note.business_id')
            ->join('articles as article', 'article.id', '=', 'entry_item.article_id')
            ->where('entry_note.status', 1)
            ->where('entry_item.status', 1)
            ->whereIn('business.business_key', BusinessScope::fixedKeys())
            ->selectRaw("
                CONCAT('entry-', entry_item.id) as source_key,
                entry_note.business_id,
                entry_note.business_branch_id,
                entry_item.article_id,
                article.laboratory_id,
                COALESCE(entry_item.warehouse_id, entry_note.warehouse_id) as warehouse_id,
                COALESCE(NULLIF(entry_item.lot, ''), NULLIF(entry_item.batch_code, ''), '') as lot,
                CAST(NULL AS DATE) as expiration_date,
                COALESCE(NULLIF(entry_item.location, ''), '') as location,
                entry_item.quantity as quantity,
                entry_item.total as total
            ");

        $receiptMovements = DB::table('purchase_receipt_items as receipt_item')
            ->join('purchase_receipts as receipt', 'receipt.id', '=', 'receipt_item.purchase_receipt_id')
            ->join('businesses as business', 'business.id', '=', 'receipt.business_id')
            ->join('articles as article', 'article.id', '=', 'receipt_item.article_id')
            ->where('receipt.status', 1)
            ->where('receipt.receipt_status', 'confirmed')
            ->where('receipt_item.status', 1)
            ->whereIn('business.business_key', BusinessScope::fixedKeys())
            ->selectRaw("
                CONCAT('purchase-receipt-', receipt_item.id) as source_key,
                receipt.business_id,
                receipt.business_branch_id,
                receipt_item.article_id,
                article.laboratory_id,
                receipt_item.warehouse_id,
                COALESCE(NULLIF(receipt_item.lot, ''), NULLIF(receipt_item.batch_code, ''), '') as lot,
                receipt_item.expiration_date,
                COALESCE(NULLIF(receipt_item.location, ''), '') as location,
                receipt_item.quantity,
                receipt_item.total
            ");

        $entryMovements
            ->when($businessId, fn($query) => $query->where('entry_note.business_id', $businessId))
            ->when($branchId, fn($query) => $query->where('entry_note.business_branch_id', $branchId))
            ->when($laboratoryId, fn($query) => $query->where('article.laboratory_id', $laboratoryId));

        $receiptMovements
            ->when($businessId, fn($query) => $query->where('receipt.business_id', $businessId))
            ->when($branchId, fn($query) => $query->where('receipt.business_branch_id', $branchId))
            ->when($laboratoryId, fn($query) => $query->where('article.laboratory_id', $laboratoryId));

        if (Schema::hasColumn('articles', 'module_scope')) {
            $entryMovements->where('article.module_scope', $this->moduleScope);
            $receiptMovements->where('article.module_scope', $this->moduleScope);
        }

        if ($warehouseId) {
            $entryMovements->whereRaw('COALESCE(entry_item.warehouse_id, entry_note.warehouse_id) = ?', [$warehouseId]);
            $receiptMovements->where('receipt_item.warehouse_id', $warehouseId);
        }

        $incomingTotals = DB::query()
            ->fromSub($entryMovements->unionAll($receiptMovements), 'incoming')
            ->selectRaw('
                MIN(incoming.source_key) as source_key,
                incoming.business_id,
                incoming.business_branch_id,
                incoming.article_id,
                incoming.laboratory_id,
                incoming.warehouse_id,
                incoming.lot,
                incoming.expiration_date,
                incoming.location,
                COALESCE(SUM(incoming.quantity), 0) as qty_in,
                COALESCE(SUM(incoming.total), 0) as total_in
            ')
            ->groupBy(
                'incoming.business_id',
                'incoming.business_branch_id',
                'incoming.article_id',
                'incoming.laboratory_id',
                'incoming.warehouse_id',
                'incoming.lot',
                'incoming.expiration_date',
                'incoming.location'
            );

        $outgoingTotals = DB::table('exit_note_items as exit_item')
            ->join('exit_notes as exit_note', 'exit_note.id', '=', 'exit_item.exit_note_id')
            ->join('businesses as business', 'business.id', '=', 'exit_note.business_id')
            ->join('articles as article', 'article.id', '=', 'exit_item.article_id')
            ->where('exit_note.status', 1)
            ->where('exit_item.status', 1)
            ->whereIn('business.business_key', BusinessScope::fixedKeys())
            ->when($businessId, fn($query) => $query->where('exit_note.business_id', $businessId))
            ->when($branchId, fn($query) => $query->where('exit_note.business_branch_id', $branchId))
            ->when($warehouseId, fn($query) => $query->whereRaw('COALESCE(exit_item.warehouse_id, exit_note.warehouse_id) = ?', [$warehouseId]))
            ->when($laboratoryId, fn($query) => $query->where('article.laboratory_id', $laboratoryId))
            ->when(Schema::hasColumn('articles', 'module_scope'), fn($query) => $query->where('article.module_scope', $this->moduleScope))
            ->selectRaw("
                exit_note.business_id,
                exit_note.business_branch_id,
                exit_item.article_id,
                article.laboratory_id,
                COALESCE(exit_item.warehouse_id, exit_note.warehouse_id) as warehouse_id,
                COALESCE(NULLIF(exit_item.batch_code, ''), '') as lot,
                exit_item.expiration_date,
                COALESCE(NULLIF(exit_item.location, ''), '') as location,
                COALESCE(SUM(exit_item.quantity), 0) as qty_out
            ")
            ->groupBy(
                'exit_note.business_id',
                'exit_note.business_branch_id',
                'exit_item.article_id',
                'article.laboratory_id',
                'warehouse_id',
                'lot',
                'exit_item.expiration_date',
                'location'
            );

        $base = DB::query()
            ->fromSub($incomingTotals, 'stock')
            ->join('articles as article', 'article.id', '=', 'stock.article_id')
            ->leftJoin('units as unit', 'unit.id', '=', 'article.unit_id')
            ->leftJoin('laboratories as laboratory', 'laboratory.id', '=', 'article.laboratory_id')
            ->leftJoin('warehouses as warehouse', 'warehouse.id', '=', 'stock.warehouse_id')
            ->leftJoin('businesses as business', 'business.id', '=', 'stock.business_id')
            ->leftJoin('business_branches as branch', 'branch.id', '=', 'stock.business_branch_id')
            ->leftJoinSub($outgoingTotals, 'outgoing', function ($join) {
                $join->on('outgoing.business_id', '=', 'stock.business_id')
                    ->on('outgoing.business_branch_id', '=', 'stock.business_branch_id')
                    ->on('outgoing.article_id', '=', 'stock.article_id')
                    ->on('outgoing.warehouse_id', '=', 'stock.warehouse_id')
                    ->whereRaw("COALESCE(outgoing.lot, '') = COALESCE(stock.lot, '')")
                    ->whereRaw("COALESCE(outgoing.location, '') = COALESCE(stock.location, '')")
                    ->whereRaw("COALESCE(outgoing.expiration_date, '1000-01-01') = COALESCE(stock.expiration_date, '1000-01-01')");
            })
            ->selectRaw("
                stock.source_key as id,
                stock.business_id,
                COALESCE(business.name, '') as business_name,
                stock.business_branch_id,
                COALESCE(branch.name, '') as branch_name,
                stock.article_id,
                stock.laboratory_id,
                stock.warehouse_id,
                COALESCE(warehouse.name, '') as warehouse_name,
                COALESCE(article.code, '') as code,
                COALESCE(stock.location, '') as ubic,
                COALESCE(article.volume, 0) as mt2,
                COALESCE(stock.lot, '') as lot,
                COALESCE(article.name, '') as nombre,
                COALESCE(unit.symbol, unit.name, '') as unidad,
                COALESCE(stock.qty_in, 0) - COALESCE(outgoing.qty_out, 0) as stock,
                COALESCE(article.volume, 0) * (COALESCE(stock.qty_in, 0) - COALESCE(outgoing.qty_out, 0)) as mt3,
                CASE WHEN COALESCE(stock.qty_in, 0) > 0 THEN COALESCE(stock.total_in, 0) / stock.qty_in ELSE 0 END as valor,
                (COALESCE(stock.qty_in, 0) - COALESCE(outgoing.qty_out, 0)) * CASE WHEN COALESCE(stock.qty_in, 0) > 0 THEN COALESCE(stock.total_in, 0) / stock.qty_in ELSE 0 END as total_price,
                COALESCE(laboratory.name, '') as laboratorio
            ");

        $query = DB::query()->fromSub($base, 'rows')->select('rows.*');

        if ($stockMode === 'without_stock') {
            $query->where('stock', '<=', 0);
        } elseif ($stockMode === 'with_stock') {
            $query->where('stock', '>', 0);
        }

        return $query;
    }

    private function packsQuery()
    {
        $empty = DB::table('warehouses')->whereRaw('1 = 0')->selectRaw("
            CONCAT('pack-', warehouses.id) as id,
            '' as lot,
            0 as possible_stock,
            '' as laboratory_name,
            '' as description,
            '' as components_quantity,
            1 as status
        ");

        return DB::query()->fromSub($empty, 'rows')->select('rows.*');
    }

    private function warehousesQuery(Request $request)
    {
        $businessId = $this->nullableInt($request->input('business_id'));
        $branchId = $this->nullableInt($request->input('business_branch_id'));

        $base = DB::table('warehouses as warehouse')
            ->leftJoin('business_branches as branch', 'branch.id', '=', 'warehouse.business_branch_id')
            ->leftJoin('businesses as business', 'business.id', '=', 'branch.business_id')
            ->leftJoin('users as creator', 'creator.id', '=', 'warehouse.created_by')
            ->whereNotNull('warehouse.status')
            ->whereIn('business.business_key', BusinessScope::fixedKeys())
            ->when($businessId, fn($query) => $query->where('business.id', $businessId))
            ->when($branchId, fn($query) => $query->where('branch.id', $branchId))
            ->selectRaw("
                warehouse.id,
                warehouse.status,
                warehouse.name as warehouse_name,
                warehouse.description,
                branch.id as branch_id,
                branch.name as branch_name,
                business.id as business_id,
                business.name as business_name,
                'Peru' as country,
                warehouse.created_at,
                COALESCE(NULLIF(creator.fullname, ''), NULLIF(TRIM(CONCAT(COALESCE(creator.name, ''), ' ', COALESCE(creator.lastname, ''))), ''), creator.username, '') as creator_label
            ");

        return DB::query()->fromSub($base, 'rows')->select('rows.*');
    }

    private function locationsQuery(Request $request)
    {
        $businessId = $this->nullableInt($request->input('business_id'));
        $branchId = $this->nullableInt($request->input('business_branch_id'));
        $warehouseId = $this->nullableInt($request->input('warehouse_id'));

        $registered = $this->registeredLocationsQuery($businessId, $branchId, $warehouseId);
        $movementLocations = $this->movementLocationsQuery($businessId, $branchId, $warehouseId);

        $union = $registered
            ? $registered->unionAll($movementLocations)
            : $movementLocations;

        return DB::query()->fromSub($union, 'rows')->select('rows.*');
    }

    private function registeredLocationsQuery(?int $businessId, ?int $branchId, ?int $warehouseId)
    {
        if (!Schema::hasTable('warehouse_locations')) {
            return null;
        }

        return DB::table('warehouse_locations as location')
            ->leftJoin('warehouses as warehouse', 'warehouse.id', '=', 'location.warehouse_id')
            ->leftJoin('business_branches as branch', 'branch.id', '=', 'warehouse.business_branch_id')
            ->leftJoin('businesses as business', 'business.id', '=', 'branch.business_id')
            ->leftJoin('users as creator', 'creator.id', '=', 'location.created_by')
            ->whereNotNull('location.status')
            ->whereIn('business.business_key', BusinessScope::fixedKeys())
            ->when($businessId, fn($query) => $query->where('business.id', $businessId))
            ->when($branchId, fn($query) => $query->where('branch.id', $branchId))
            ->when($warehouseId, fn($query) => $query->where('warehouse.id', $warehouseId))
            ->selectRaw("
                CONCAT('registered-', location.id) as id,
                location.id as location_id,
                'registered' as source,
                location.status,
                location.warehouse_id,
                COALESCE(warehouse.name, '') as warehouse_name,
                location.code,
                location.created_at,
                COALESCE(NULLIF(creator.fullname, ''), NULLIF(TRIM(CONCAT(COALESCE(creator.name, ''), ' ', COALESCE(creator.lastname, ''))), ''), creator.username, '') as creator_label
            ");
    }

    private function movementLocationsQuery(?int $businessId, ?int $branchId, ?int $warehouseId)
    {
        $entry = DB::table('entry_note_items as item')
            ->join('entry_notes as note', 'note.id', '=', 'item.entry_note_id')
            ->join('businesses as business', 'business.id', '=', 'note.business_id')
            ->leftJoin('warehouses as warehouse', 'warehouse.id', '=', DB::raw('COALESCE(item.warehouse_id, note.warehouse_id)'))
            ->leftJoin('users as creator', 'creator.id', '=', 'note.created_by')
            ->where('note.status', 1)
            ->where('item.status', 1)
            ->whereRaw("COALESCE(NULLIF(item.location, ''), '') <> ''")
            ->whereIn('business.business_key', BusinessScope::fixedKeys())
            ->when($businessId, fn($query) => $query->where('note.business_id', $businessId))
            ->when($branchId, fn($query) => $query->where('note.business_branch_id', $branchId))
            ->when($warehouseId, fn($query) => $query->whereRaw('COALESCE(item.warehouse_id, note.warehouse_id) = ?', [$warehouseId]))
            ->selectRaw("
                CONCAT('entry-', MIN(item.id)) as id,
                NULL as location_id,
                'movement' as source,
                1 as status,
                COALESCE(item.warehouse_id, note.warehouse_id) as warehouse_id,
                COALESCE(warehouse.name, '') as warehouse_name,
                item.location as code,
                MIN(note.created_at) as created_at,
                COALESCE(MAX(NULLIF(creator.fullname, '')), MAX(NULLIF(TRIM(CONCAT(COALESCE(creator.name, ''), ' ', COALESCE(creator.lastname, ''))), '')), MAX(creator.username), '') as creator_label
            ")
            ->groupBy('warehouse_id', 'warehouse_name', 'item.location');

        $exit = DB::table('exit_note_items as item')
            ->join('exit_notes as note', 'note.id', '=', 'item.exit_note_id')
            ->join('businesses as business', 'business.id', '=', 'note.business_id')
            ->leftJoin('warehouses as warehouse', 'warehouse.id', '=', DB::raw('COALESCE(item.warehouse_id, note.warehouse_id)'))
            ->leftJoin('users as creator', 'creator.id', '=', 'note.created_by')
            ->where('note.status', 1)
            ->where('item.status', 1)
            ->whereRaw("COALESCE(NULLIF(item.location, ''), '') <> ''")
            ->whereIn('business.business_key', BusinessScope::fixedKeys())
            ->when($businessId, fn($query) => $query->where('note.business_id', $businessId))
            ->when($branchId, fn($query) => $query->where('note.business_branch_id', $branchId))
            ->when($warehouseId, fn($query) => $query->whereRaw('COALESCE(item.warehouse_id, note.warehouse_id) = ?', [$warehouseId]))
            ->selectRaw("
                CONCAT('exit-', MIN(item.id)) as id,
                NULL as location_id,
                'movement' as source,
                1 as status,
                COALESCE(item.warehouse_id, note.warehouse_id) as warehouse_id,
                COALESCE(warehouse.name, '') as warehouse_name,
                item.location as code,
                MIN(note.created_at) as created_at,
                COALESCE(MAX(NULLIF(creator.fullname, '')), MAX(NULLIF(TRIM(CONCAT(COALESCE(creator.name, ''), ' ', COALESCE(creator.lastname, ''))), '')), MAX(creator.username), '') as creator_label
            ")
            ->groupBy('warehouse_id', 'warehouse_name', 'item.location');

        $receipt = DB::table('purchase_receipt_items as item')
            ->join('purchase_receipts as note', 'note.id', '=', 'item.purchase_receipt_id')
            ->join('businesses as business', 'business.id', '=', 'note.business_id')
            ->leftJoin('warehouses as warehouse', 'warehouse.id', '=', 'item.warehouse_id')
            ->leftJoin('users as creator', 'creator.id', '=', 'note.created_by')
            ->where('note.status', 1)
            ->where('note.receipt_status', 'confirmed')
            ->where('item.status', 1)
            ->whereRaw("COALESCE(NULLIF(item.location, ''), '') <> ''")
            ->whereIn('business.business_key', BusinessScope::fixedKeys())
            ->when($businessId, fn($query) => $query->where('note.business_id', $businessId))
            ->when($branchId, fn($query) => $query->where('note.business_branch_id', $branchId))
            ->when($warehouseId, fn($query) => $query->where('item.warehouse_id', $warehouseId))
            ->selectRaw("
                CONCAT('receipt-', MIN(item.id)) as id,
                NULL as location_id,
                'movement' as source,
                1 as status,
                item.warehouse_id,
                COALESCE(warehouse.name, '') as warehouse_name,
                item.location as code,
                MIN(note.created_at) as created_at,
                COALESCE(MAX(NULLIF(creator.fullname, '')), MAX(NULLIF(TRIM(CONCAT(COALESCE(creator.name, ''), ' ', COALESCE(creator.lastname, ''))), '')), MAX(creator.username), '') as creator_label
            ")
            ->groupBy('item.warehouse_id', 'warehouse_name', 'item.location');

        $allLocations = $entry->unionAll($exit)->unionAll($receipt);

        return DB::query()
            ->fromSub($allLocations, 'movement_locations')
            ->selectRaw("
                MIN(id) as id,
                NULL as location_id,
                'movement' as source,
                1 as status,
                warehouse_id,
                warehouse_name,
                code,
                MIN(created_at) as created_at,
                MAX(creator_label) as creator_label
            ")
            ->groupBy('warehouse_id', 'warehouse_name', 'code');
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
                $selector = $sorting['selector'] ?? '';
                if ($selector === '') continue;
                $query->orderBy($selector, ($sorting['desc'] ?? false) ? 'DESC' : 'ASC');
            }
            return;
        }

        match ($section) {
            'packs' => $query->orderBy('lot'),
            'warehouses' => $query->orderBy('warehouse_name'),
            'locations' => $query->orderBy('warehouse_name')->orderBy('code'),
            default => $query->orderBy('nombre')->orderBy('lot'),
        };
    }

    private function standardWarehouse($id): Warehouse
    {
        $warehouse = Warehouse::query()
            ->whereKey($this->nullableInt($id))
            ->whereNotNull('status')
            ->whereHas('branch.business', function ($business) {
                $business->whereIn('business_key', BusinessScope::fixedKeys())->whereNotNull('status');
            })
            ->first();

        if (!$warehouse) {
            throw new \Exception('El almacen es obligatorio');
        }

        return $warehouse;
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
