<?php

namespace App\Http\Controllers\Admin;

use App\Http\Classes\dxResponse;
use App\Http\Controllers\BasicController;
use App\Models\EntryNote;
use App\Models\ExitNote;
use App\Models\PurchaseReceipt;
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
                    'source_type' => (string)$row->source_type,
                    'source_id' => $row->source_id ? (int)$row->source_id : null,
                    'source_item_id' => $row->source_item_id ? (int)$row->source_item_id : null,
                    'movement_date' => $row->movement_date,
                    'operation' => (string)$row->operation,
                    'document' => (string)$row->document,
                    'document_url' => $this->documentUrl($row->source_type, $row->source_id, $row->document_file),
                    'partner' => (string)$row->partner,
                    'branch_name' => (string)$row->branch_name,
                    'warehouse_name' => (string)$row->warehouse_name,
                    'location' => (string)$row->location,
                    'lot' => (string)$row->lot,
                    'expiration_date' => $row->expiration_date,
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

    public function document(Request $request, string $sourceType, string $sourceId): HttpResponse|ResponseFactory
    {
        $response = new Response();

        try {
            $document = $this->sourceDocument($sourceType, (int)$sourceId);
            $documentFile = $this->sourceDocumentFile($sourceType, $document);

            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = [
                'type' => $sourceType,
                'document' => $document,
                'file_url' => $this->documentFileExists($sourceType, $documentFile)
                    ? $this->documentUrl($sourceType, $document->id, $documentFile)
                    : null,
            ];
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function documentFile(Request $request, string $sourceType, string $sourceId)
    {
        $document = $this->sourceDocument($sourceType, (int)$sourceId);
        $file = $this->sourceDocumentFile($sourceType, $document);
        if (!$file) abort(404, 'Documento no encontrado');

        if (preg_match('/^https?:\/\//i', $file)) {
            return redirect()->away($file);
        }

        $path = $this->resolveDocumentPath($file, $this->documentFolder($sourceType));
        if (!$path) abort(404, 'Archivo no encontrado');

        $filename = basename(str_replace('\\', '/', $file));
        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

        return response()->file($path, [
            'Content-Type' => $extension === 'pdf' ? 'application/pdf' : 'application/octet-stream',
            'Content-Disposition' => 'inline; filename="' . $filename . '"',
        ]);
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
                source_type,
                source_id,
                source_item_id,
                movement_date,
                operation,
                document,
                document_file,
                partner,
                article_id,
                warehouse_id,
                branch_name,
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
                source_type,
                source_id,
                source_item_id,
                movement_date,
                operation,
                document,
                document_file,
                partner,
                article_id,
                warehouse_id,
                branch_name,
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
            ->leftJoin('business_branches as branch', 'branch.id', '=', 'movement_note.business_branch_id')
            ->leftJoin('suppliers as supplier', 'supplier.id', '=', 'movement_note.supplier_id')
            ->where('movement_note.status', 1)
            ->where('movement_note.entry_status', 'approved')
            ->where('movement_item.status', 1)
            ->where('business.business_key', BusinessScope::KAMARY_PERU)
            ->selectRaw("
                CONCAT('entry-', movement_item.id) as id,
                'entry_note' as source_type,
                movement_note.id as source_id,
                movement_item.id as source_item_id,
                COALESCE(movement_note.entry_date, DATE(movement_note.created_at)) as movement_date,
                'Entrada' as operation,
                CONCAT(COALESCE(movement_note.document_type, 'Entrada'), ' ', COALESCE(movement_note.document_series, ''), '-', COALESCE(movement_note.document_sequence, movement_note.code, movement_note.id)) as document,
                movement_note.document_file as document_file,
                COALESCE(supplier.business_name, supplier.trade_name, '') as partner,
                movement_item.article_id,
                COALESCE(movement_item.warehouse_id, movement_note.warehouse_id) as warehouse_id,
                COALESCE(branch.name, '') as branch_name,
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
            ->leftJoin('business_branches as branch', 'branch.id', '=', 'movement_note.business_branch_id')
            ->leftJoin('suppliers as supplier', 'supplier.id', '=', 'movement_note.supplier_id')
            ->where('movement_note.status', 1)
            ->where('movement_note.receipt_status', 'confirmed')
            ->where('movement_item.status', 1)
            ->where('business.business_key', BusinessScope::KAMARY_PERU)
            ->selectRaw("
                CONCAT('receipt-', movement_item.id) as id,
                'purchase_receipt' as source_type,
                movement_note.id as source_id,
                movement_item.id as source_item_id,
                COALESCE(movement_note.issue_date, DATE(movement_note.created_at)) as movement_date,
                'Entrada' as operation,
                CONCAT(COALESCE(movement_note.document_type, 'Recepcion'), ' ', COALESCE(movement_note.document_series, ''), '-', COALESCE(movement_note.document_sequence, movement_note.code, movement_note.id)) as document,
                movement_note.document_file as document_file,
                COALESCE(supplier.business_name, supplier.trade_name, '') as partner,
                movement_item.article_id,
                COALESCE(movement_item.warehouse_id, movement_note.warehouse_id) as warehouse_id,
                COALESCE(branch.name, '') as branch_name,
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
            ->leftJoin('business_branches as branch', 'branch.id', '=', 'movement_note.business_branch_id')
            ->where('movement_note.status', 1)
            ->where('movement_item.status', 1)
            ->where('business.business_key', BusinessScope::KAMARY_PERU)
            ->selectRaw("
                CONCAT('exit-', movement_item.id) as id,
                'exit_note' as source_type,
                movement_note.id as source_id,
                movement_item.id as source_item_id,
                COALESCE(movement_note.exit_date, DATE(movement_note.created_at)) as movement_date,
                'Salida' as operation,
                CONCAT(COALESCE(movement_note.document_type, 'Salida'), ' ', COALESCE(movement_note.document_series, ''), '-', COALESCE(movement_note.document_sequence, movement_note.id)) as document,
                NULL as document_file,
                COALESCE(movement_note.client_name, '') as partner,
                movement_item.article_id,
                COALESCE(movement_item.warehouse_id, movement_note.warehouse_id) as warehouse_id,
                COALESCE(branch.name, '') as branch_name,
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

    private function sourceDocument(string $sourceType, int $sourceId)
    {
        if (!$sourceId) throw new \Exception('Documento invalido');

        $relations = [
            'business:id,name,business_key',
            'branch:id,business_id,name',
            'warehouse:id,name',
            'items.article:id,code,name,laboratory_id,active_principle_id,unit_id',
            'items.article.laboratory:id,name',
            'items.article.activePrinciple:id,name',
            'items.article.unit:id,name,symbol',
            'items.warehouse:id,name',
        ];

        $query = match ($sourceType) {
            'entry_note' => EntryNote::query()
                ->with(array_merge($relations, [
                    'supplier:id,ruc,business_name,trade_name',
                    'client:id,document_number,full_name',
                    'items:id,entry_note_id,batch_code,lot,expiration_date,article_id,warehouse_id,cost_unit,location,quantity,total,status',
                ])),
            'purchase_receipt' => PurchaseReceipt::query()
                ->with(array_merge($relations, [
                    'purchaseOrder:id,code',
                    'supplier:id,ruc,business_name,trade_name',
                    'items:id,purchase_receipt_id,batch_code,lot,expiration_date,article_id,warehouse_id,cost_unit,location,quantity,total,status',
                ])),
            'exit_note' => ExitNote::query()
                ->with(array_merge($relations, [
                    'client:id,document_number,full_name',
                    'items:id,exit_note_id,batch_code,article_id,warehouse_id,expiration_date,location,destination_location,quantity,total,status',
                ])),
            default => throw new \Exception('Tipo de documento no soportado'),
        };

        $document = $query->whereKey($sourceId)->first();
        if (!$document) throw new \Exception('Documento no encontrado');
        if ($document->business?->business_key !== BusinessScope::KAMARY_PERU) {
            throw new \Exception('El documento no pertenece a Kamary Peru');
        }

        return $document;
    }

    private function sourceDocumentFile(string $sourceType, object $document): ?string
    {
        return match ($sourceType) {
            'entry_note', 'purchase_receipt' => trim((string)($document->document_file ?? '')) ?: null,
            default => null,
        };
    }

    private function documentUrl(?string $sourceType, $sourceId, $documentFile): ?string
    {
        if (!$sourceType || !$sourceId || !trim((string)$documentFile)) return null;
        return "/api/admin/kardex/documents/{$sourceType}/{$sourceId}/file";
    }

    private function documentFolder(string $sourceType): ?string
    {
        return match ($sourceType) {
            'entry_note' => 'entry_note',
            'purchase_receipt' => 'purchase_receipt',
            default => null,
        };
    }

    private function documentFileExists(string $sourceType, ?string $file): bool
    {
        if (!$file) return false;
        if (preg_match('/^https?:\/\//i', $file)) return true;
        return $this->resolveDocumentPath($file, $this->documentFolder($sourceType)) !== null;
    }

    private function resolveDocumentPath(string $file, ?string $folder): ?string
    {
        $normalized = trim(str_replace('\\', '/', $file));
        if ($normalized === '') return null;

        $candidates = [];
        if (str_starts_with($normalized, '/')) {
            $candidates[] = $normalized;
        }

        $publicPosition = strpos($normalized, '/public/');
        if ($publicPosition !== false) {
            $candidates[] = public_path(substr($normalized, $publicPosition + 8));
        }

        $relative = ltrim($normalized, '/');
        $candidates[] = public_path($relative);
        $candidates[] = storage_path("app/{$relative}");
        if ($folder) {
            $candidates[] = storage_path("app/images/{$folder}/" . basename($normalized));
        }

        foreach (array_unique($candidates) as $candidate) {
            if ($candidate && is_file($candidate)) return $candidate;
        }

        return null;
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
