<?php

namespace App\Http\Controllers\Admin;

use App\Http\Classes\dxResponse;
use App\Http\Controllers\BasicController;
use App\Models\dxDataGrid;
use App\Support\BusinessScope;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use SoDe\Extend\Response;

class KardexController extends BasicController
{
    public $reactView = 'Admin/Kardex';
    public $reactRootView = 'admin';
    protected string $moduleScope = 'standard';

    public function paginate(Request $request): HttpResponse|ResponseFactory
    {
        return $this->paginateProductSelection($request);
    }

    public function movements(Request $request): HttpResponse|ResponseFactory
    {
        $response = new Response();

        try {
            $articleId = $this->toNullableInt($request->input('article_id'));
            if (!$articleId) throw new \Exception('El articulo es obligatorio');

            $warehouseId = $this->toNullableInt($request->input('warehouse_id'));
            $startDate = $this->normalizeDate($request->input('start_date'));
            $endDate = $this->normalizeDate($request->input('end_date'));

            $priorBalance = 0.0;
            if ($startDate) {
                $prior = $this->standardMovementUnion($articleId, $warehouseId, null, $startDate);
                $priorBalance = (float)DB::query()
                    ->fromSub($prior, 'prior_kardex')
                    ->selectRaw('COALESCE(SUM(quantity_in - quantity_out), 0) as balance')
                    ->value('balance');
            }

            $union = $this->standardMovementUnion($articleId, $warehouseId, $startDate, null);
            $query = DB::query()->fromSub($union, 'kardex')
                ->when($endDate, fn($inner) => $inner->whereDate('movement_date', '<=', $endDate))
                ->orderBy('movement_date')
                ->orderBy('id');

            $rows = $query->get();
            $balance = round($priorBalance, 3);
            $mapped = $rows->map(function ($row) use (&$balance) {
                $qtyIn = round((float)$row->quantity_in, 3);
                $qtyOut = round((float)$row->quantity_out, 3);
                $balance = round($balance + $qtyIn - $qtyOut, 3);

                return [
                    'id' => (string)$row->id,
                    'movement_date' => $row->movement_date,
                    'operation' => (string)$row->operation,
                    'document' => (string)$row->document,
                    'partner' => (string)$row->partner,
                    'warehouse_name' => (string)$row->warehouse_name,
                    'location' => (string)$row->location,
                    'lot' => (string)$row->lot,
                    'quantity_in' => $qtyIn,
                    'quantity_out' => $qtyOut,
                    'balance' => $balance,
                    'unit_label' => (string)$row->unit_label,
                ];
            })->values();

            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = $mapped;
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    private function paginateProductSelection(Request $request): HttpResponse|ResponseFactory
    {
        $response = new dxResponse();

        try {
            $warehouseId = $this->toNullableInt($request->input('warehouse_id'));
            $laboratoryId = $this->toNullableInt($request->input('laboratory_id'));
            $articleId = $this->toNullableInt($request->input('article_id'));
            $stockMode = trim((string)$request->input('stock_mode', 'with_stock'));

            $incoming = $this->incomingTotalsByArticleQuery();
            $outgoing = $this->outgoingTotalsByArticleQuery();

            $instance = DB::query()
                ->fromSub($incoming, 'stock')
                ->join('articles as article', 'article.id', '=', 'stock.article_id')
                ->leftJoin('laboratories as laboratory', 'laboratory.id', '=', 'article.laboratory_id')
                ->leftJoin('active_principles as active_principle', 'active_principle.id', '=', 'article.active_principle_id')
                ->leftJoin('units as unit', 'unit.id', '=', 'article.unit_id')
                ->leftJoin('warehouses as warehouse', 'warehouse.id', '=', 'stock.warehouse_id')
                ->leftJoinSub($outgoing, 'outgoing', function ($join) {
                    $join->on('outgoing.article_id', '=', 'stock.article_id')
                        ->on('outgoing.warehouse_id', '=', 'stock.warehouse_id');
                })
                ->when($warehouseId, fn($query) => $query->where('stock.warehouse_id', $warehouseId))
                ->when($laboratoryId, fn($query) => $query->where('article.laboratory_id', $laboratoryId))
                ->when($articleId, fn($query) => $query->where('article.id', $articleId))
                ->when(Schema::hasColumn('articles', 'module_scope'), function ($query) {
                    $query->where(function ($scope) {
                        $scope->where('article.module_scope', $this->moduleScope)
                            ->orWhereNull('article.module_scope');
                    });
                })
                ->selectRaw("
                    CONCAT(stock.article_id, '-', stock.warehouse_id) as id,
                    stock.article_id,
                    stock.warehouse_id,
                    COALESCE(article.code, '') as article_code,
                    COALESCE(article.name, '') as article_name,
                    article.laboratory_id,
                    COALESCE(laboratory.name, '') as laboratory_name,
                    COALESCE(active_principle.name, '') as principle_name,
                    COALESCE(unit.symbol, unit.name, '') as unit_label,
                    COALESCE(warehouse.name, '') as warehouse_name,
                    COALESCE(stock.qty_in, 0) as qty_in,
                    COALESCE(outgoing.qty_out, 0) as qty_out,
                    COALESCE(stock.qty_in, 0) - COALESCE(outgoing.qty_out, 0) as stock,
                    CASE WHEN COALESCE(stock.qty_in, 0) > 0 THEN COALESCE(stock.total_in, 0) / stock.qty_in ELSE 0 END as cost_unit,
                    (COALESCE(stock.qty_in, 0) - COALESCE(outgoing.qty_out, 0)) *
                        CASE WHEN COALESCE(stock.qty_in, 0) > 0 THEN COALESCE(stock.total_in, 0) / stock.qty_in ELSE 0 END as total_cost
                ");

            if ($stockMode === 'with_stock') {
                $instance->whereRaw('(COALESCE(stock.qty_in, 0) - COALESCE(outgoing.qty_out, 0)) > 0');
            }

            if ($request->filter) {
                $instance->where(function ($query) use ($request) {
                    dxDataGrid::filter($query, $request->filter ?? [], false, null);
                });
            }

            $sortMap = [
                'article_code' => 'article_code',
                'article_name' => 'article_name',
                'laboratory_name' => 'laboratory_name',
                'principle_name' => 'principle_name',
                'warehouse_name' => 'warehouse_name',
                'qty_in' => 'qty_in',
                'qty_out' => 'qty_out',
                'stock' => 'stock',
                'cost_unit' => 'cost_unit',
                'total_cost' => 'total_cost',
            ];

            if ($request->sort) {
                foreach ($request->sort as $sorting) {
                    $selector = $sorting['selector'] ?? '';
                    if (!isset($sortMap[$selector])) continue;
                    $instance->orderBy($sortMap[$selector], ($sorting['desc'] ?? false) ? 'DESC' : 'ASC');
                }
            } else {
                $instance->orderBy('article_name')->orderBy('warehouse_name');
            }

            $totalCount = 0;
            if ($request->requireTotalCount) {
                $totalCount = (clone $instance)->count();
            }

            $jpas = $request->isLoadingAll
                ? $instance->get()
                : $instance->skip($request->skip ?? 0)->take($request->take ?? 25)->get();

            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = $jpas;
            $response->totalCount = $totalCount;
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage() . ' Ln.' . $th->getLine();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    private function incomingTotalsByArticleQuery()
    {
        return DB::query()
            ->fromSub($this->incomingMovementsQuery(), 'incoming')
            ->selectRaw('
                incoming.article_id,
                incoming.warehouse_id,
                COALESCE(SUM(incoming.quantity), 0) as qty_in,
                COALESCE(SUM(incoming.total), 0) as total_in
            ')
            ->groupBy('incoming.article_id', 'incoming.warehouse_id');
    }

    private function outgoingTotalsByArticleQuery()
    {
        return DB::query()
            ->fromSub($this->outgoingMovementsQuery(), 'outgoing_base')
            ->selectRaw('
                outgoing_base.article_id,
                outgoing_base.warehouse_id,
                COALESCE(SUM(outgoing_base.quantity), 0) as qty_out
            ')
            ->groupBy('outgoing_base.article_id', 'outgoing_base.warehouse_id');
    }

    private function standardMovementUnion(int $articleId, ?int $warehouseId = null, ?string $startDate = null, ?string $beforeDate = null)
    {
        $incoming = DB::query()
            ->fromSub($this->incomingMovementsQuery(), 'movement')
            ->where('article_id', $articleId)
            ->when($warehouseId, fn($query) => $query->where('warehouse_id', $warehouseId))
            ->when($startDate, fn($query) => $query->whereDate('movement_date', '>=', $startDate))
            ->when($beforeDate, fn($query) => $query->whereDate('movement_date', '<', $beforeDate))
            ->selectRaw("
                id,
                movement_date,
                operation,
                document,
                partner,
                article_id,
                warehouse_id,
                warehouse_name,
                unit_label,
                lot,
                expiration_date,
                location,
                quantity as quantity_in,
                0 as quantity_out
            ");

        $outgoing = DB::query()
            ->fromSub($this->outgoingMovementsQuery(), 'movement')
            ->where('article_id', $articleId)
            ->when($warehouseId, fn($query) => $query->where('warehouse_id', $warehouseId))
            ->when($startDate, fn($query) => $query->whereDate('movement_date', '>=', $startDate))
            ->when($beforeDate, fn($query) => $query->whereDate('movement_date', '<', $beforeDate))
            ->selectRaw("
                id,
                movement_date,
                operation,
                document,
                partner,
                article_id,
                warehouse_id,
                warehouse_name,
                unit_label,
                lot,
                expiration_date,
                location,
                0 as quantity_in,
                quantity as quantity_out
            ");

        return $incoming->unionAll($outgoing);
    }

    private function incomingMovementsQuery()
    {
        $entryMovements = DB::table('entry_note_items as movement_item')
            ->join('entry_notes as movement_note', 'movement_note.id', '=', 'movement_item.entry_note_id')
            ->join('businesses as business', 'business.id', '=', 'movement_note.business_id')
            ->join('articles as article', 'article.id', '=', 'movement_item.article_id')
            ->leftJoin('units as unit', 'unit.id', '=', 'article.unit_id')
            ->leftJoin('warehouses as warehouse', function ($join) {
                $join->on('warehouse.id', '=', DB::raw('COALESCE(movement_item.warehouse_id, movement_note.warehouse_id)'));
            })
            ->leftJoin('suppliers as supplier', 'supplier.id', '=', 'movement_note.supplier_id')
            ->where('movement_note.status', 1)
            ->where('movement_note.entry_status', 'approved')
            ->where('movement_item.status', 1)
            ->where('business.business_key', BusinessScope::KAMARY_PERU)
            ->selectRaw("
                CONCAT('entry-', movement_item.id) as id,
                COALESCE(movement_note.entry_date, DATE(movement_note.created_at)) as movement_date,
                'Entrada' as operation,
                CONCAT(COALESCE(movement_note.document_type, 'Entrada'), ' ', COALESCE(movement_note.document_series, ''), '-', COALESCE(movement_note.document_sequence, movement_note.code, movement_note.id)) as document,
                COALESCE(supplier.business_name, supplier.trade_name, '') as partner,
                movement_item.article_id,
                COALESCE(movement_item.warehouse_id, movement_note.warehouse_id) as warehouse_id,
                COALESCE(warehouse.name, '') as warehouse_name,
                COALESCE(unit.symbol, unit.name, '') as unit_label,
                COALESCE(NULLIF(movement_item.lot, ''), NULLIF(movement_item.batch_code, ''), '') as lot,
                movement_item.expiration_date,
                COALESCE(NULLIF(movement_item.location, ''), '') as location,
                movement_item.quantity,
                COALESCE(movement_item.total, movement_item.quantity * movement_item.cost_unit, 0) as total
            ");

        $receiptMovements = DB::table('purchase_receipt_items as movement_item')
            ->join('purchase_receipts as movement_note', 'movement_note.id', '=', 'movement_item.purchase_receipt_id')
            ->join('businesses as business', 'business.id', '=', 'movement_note.business_id')
            ->join('articles as article', 'article.id', '=', 'movement_item.article_id')
            ->leftJoin('units as unit', 'unit.id', '=', 'article.unit_id')
            ->leftJoin('warehouses as warehouse', function ($join) {
                $join->on('warehouse.id', '=', DB::raw('COALESCE(movement_item.warehouse_id, movement_note.warehouse_id)'));
            })
            ->leftJoin('suppliers as supplier', 'supplier.id', '=', 'movement_note.supplier_id')
            ->where('movement_note.status', 1)
            ->where('movement_note.receipt_status', 'confirmed')
            ->where('movement_item.status', 1)
            ->where('business.business_key', BusinessScope::KAMARY_PERU)
            ->selectRaw("
                CONCAT('receipt-', movement_item.id) as id,
                COALESCE(movement_note.issue_date, DATE(movement_note.created_at)) as movement_date,
                'Entrada' as operation,
                CONCAT(COALESCE(movement_note.document_type, 'Recepcion'), ' ', COALESCE(movement_note.document_series, ''), '-', COALESCE(movement_note.document_sequence, movement_note.code, movement_note.id)) as document,
                COALESCE(supplier.business_name, supplier.trade_name, '') as partner,
                movement_item.article_id,
                COALESCE(movement_item.warehouse_id, movement_note.warehouse_id) as warehouse_id,
                COALESCE(warehouse.name, '') as warehouse_name,
                COALESCE(unit.symbol, unit.name, '') as unit_label,
                COALESCE(NULLIF(movement_item.lot, ''), NULLIF(movement_item.batch_code, ''), '') as lot,
                movement_item.expiration_date,
                COALESCE(NULLIF(movement_item.location, ''), '') as location,
                movement_item.quantity,
                COALESCE(movement_item.total, movement_item.quantity * movement_item.cost_unit, 0) as total
            ");

        return $entryMovements->unionAll($receiptMovements);
    }

    private function outgoingMovementsQuery()
    {
        $query = DB::table('exit_note_items as movement_item')
            ->join('exit_notes as movement_note', 'movement_note.id', '=', 'movement_item.exit_note_id')
            ->join('businesses as business', 'business.id', '=', 'movement_note.business_id')
            ->join('articles as article', 'article.id', '=', 'movement_item.article_id')
            ->leftJoin('units as unit', 'unit.id', '=', 'article.unit_id')
            ->leftJoin('warehouses as warehouse', function ($join) {
                $join->on('warehouse.id', '=', DB::raw('COALESCE(movement_item.warehouse_id, movement_note.warehouse_id)'));
            })
            ->where('movement_note.status', 1)
            ->where('movement_item.status', 1)
            ->where('business.business_key', BusinessScope::KAMARY_PERU)
            ->selectRaw("
                CONCAT('exit-', movement_item.id) as id,
                COALESCE(movement_note.exit_date, DATE(movement_note.created_at)) as movement_date,
                'Salida' as operation,
                CONCAT(COALESCE(movement_note.document_type, 'Salida'), ' ', COALESCE(movement_note.document_series, ''), '-', COALESCE(movement_note.document_sequence, movement_note.id)) as document,
                COALESCE(movement_note.client_name, '') as partner,
                movement_item.article_id,
                COALESCE(movement_item.warehouse_id, movement_note.warehouse_id) as warehouse_id,
                COALESCE(warehouse.name, '') as warehouse_name,
                COALESCE(unit.symbol, unit.name, '') as unit_label,
                COALESCE(NULLIF(movement_item.batch_code, ''), '') as lot,
                movement_item.expiration_date,
                COALESCE(NULLIF(movement_item.location, ''), '') as location,
                movement_item.quantity,
                movement_item.total
            ");

        if (Schema::hasColumn('exit_notes', 'exit_status')) {
            $query->where('movement_note.exit_status', 'approved');
        }

        return $query;
    }

    private function toNullableInt($value): ?int
    {
        if ($value === null) return null;
        $text = trim((string)$value);
        if ($text === '') return null;
        if (!ctype_digit(ltrim($text, '+'))) throw new \Exception("Valor entero invalido: {$value}");
        return (int)$text;
    }

    private function normalizeDate($value): ?string
    {
        if ($value === null) return null;
        $text = trim((string)$value);
        if ($text === '') return null;
        $timestamp = strtotime($text);
        if ($timestamp === false) throw new \Exception("Fecha invalida: {$value}");
        return date('Y-m-d', $timestamp);
    }
}
