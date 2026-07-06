<?php

namespace App\Http\Controllers\Admin\Magistrales;

use App\Http\Controllers\BasicController;
use App\Http\Controllers\Admin\Magistrales\Concerns\RunsMagistralSaveInTransaction;
use App\Models\Article;
use App\Models\ExitNote;
use App\Models\ExitNoteItem;
use App\Models\Warehouse;
use App\Support\MagistralesWarehouse;
use App\Support\MagistralesStock;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use SoDe\Extend\Response;

/**
 * Magistrales - Salidas.
 *
 * Guarda/lee directamente sobre el ledger general (exit_notes / exit_note_items) en vez de las
 * tablas viejas magistral_outputs/magistral_output_items (ya retiradas). Los registros se
 * identifican por el prefijo de codigo 'SAL-MAG-' para no mezclarse con otras notas de salida
 * generales ni con las de venta (VTA-MAG-) / consumo de produccion (OPC-MAG-) que tambien caen
 * en el mismo almacen.
 *
 * exit_notes no tiene columnas propias para "motivo" (usa `motives` json), "destino" de
 * transferencia (usa `client_name` como etiqueta libre) ni `destination_warehouse_id`; este
 * ultimo se guarda dentro de `external_payload` (columna generica ya existente en exit_notes)
 * solo para poder re-seleccionar el almacen destino al editar una transferencia, sin necesidad
 * de una migracion nueva.
 */
class OutputController extends BasicController
{
    use RunsMagistralSaveInTransaction;

    private const CODE_PREFIX = 'SAL-MAG-';

    private const REASON_TRANSFER = 'TRANSFERENCIA';
    private const REASON_OPTIONS = [
        self::REASON_TRANSFER,
        'REGULARIZACION DE STOCK',
        'VENTA INTERNA',
        'PREPARACION DE BASES',
        'PREPARACION DE BASE GEL DE CARBOPOL',
        'PREPARACION DE BASE CREMA NO IONICA',
    ];

    public $model = ExitNote::class;
    public $reactView = 'Admin/Magistrales/Outputs';
    public $prefix4filter = 'exit_notes';

    private array $parsedItems = [];

    public function setReactViewProperties(Request $request)
    {
        $fixedWarehouse = MagistralesWarehouse::warehouse();
        $availableWarehouses = $this->resolveAvailableOriginWarehouses((int) $fixedWarehouse->business_branch_id, (int) $fixedWarehouse->id);

        return [
            'moduleTitle' => 'Magistrales - Salidas',
            'requiredPermission' => ['magistrales-outputs', 'magistrales-warehouse'],
            'fixedWarehouse' => MagistralesWarehouse::summary(),
            'availableWarehouses' => $availableWarehouses,
            'reasonOptions' => self::REASON_OPTIONS,
        ];
    }

    public function setPaginationInstance(string $model)
    {
        return $model::select('exit_notes.*')
            ->selectRaw('exit_notes.client_name as destination')
            ->selectRaw('JSON_UNQUOTE(JSON_EXTRACT(exit_notes.motives, \'$[0]\')) as reason')
            ->selectRaw('JSON_UNQUOTE(JSON_EXTRACT(exit_notes.external_payload, \'$.destination_warehouse_id\')) as destination_warehouse_id')
            ->where('exit_notes.code', 'like', self::CODE_PREFIX . '%')
            ->with([
                'originWarehouse:id,name',
                'originWarehouse.branch:id,name,business_id',
                'originWarehouse.branch.business:id,name',
                'items' => function ($query) {
                    $query->select('exit_note_items.*')
                        ->selectRaw('exit_note_items.batch_code as lot')
                        ->selectRaw('(select a.code from articles a where a.id = exit_note_items.article_id) as code')
                        ->selectRaw('(select a.name from articles a where a.id = exit_note_items.article_id) as name')
                        ->selectRaw('(select coalesce(u.symbol, u.name) from articles a left join units u on u.id = a.unit_id where a.id = exit_note_items.article_id) as unit_label')
                        ->orderBy('exit_note_items.id');
                },
                'items.article:id,code,name,unit_id,article_type',
                'items.article.unit:id,name,symbol',
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ])
            ->leftJoin('warehouses as origin_warehouse', 'origin_warehouse.id', '=', 'exit_notes.warehouse_id')
            ->leftJoin('business_branches as origin_branch', 'origin_branch.id', '=', 'origin_warehouse.business_branch_id')
            ->leftJoin('businesses as origin_business', 'origin_business.id', '=', 'origin_branch.business_id')
            ->leftJoin('users as creator', 'creator.id', '=', 'exit_notes.created_by')
            ->leftJoin('users as updater', 'updater.id', '=', 'exit_notes.updated_by');
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $id = $body['id'] ?? null;
        $code = trim((string)($body['code'] ?? ''));
        if ($code === '') $code = $this->nextCode();

        $exists = ExitNote::whereRaw('LOWER(code) = ?', [mb_strtolower($code)])
            ->when($id, fn($query) => $query->where('id', '!=', $id))
            ->exists();
        if ($exists) throw new \Exception('Ya existe una salida magistral con este codigo');

        $originWarehouse = $this->resolveOriginWarehouse($this->toNullableInt($body['origin_warehouse_id'] ?? null));
        $warehouseId = (int) $originWarehouse->id;
        $reason = $this->normalizeReason($body['reason'] ?? null);
        if ($reason === null) throw new \Exception('Debes seleccionar un motivo para la salida');

        $this->parsedItems = $this->parseItems(is_array($request->items) ? $request->items : [], $warehouseId, $id ? (int)$id : null);
        if (count($this->parsedItems) === 0) {
            throw new \Exception('Debes agregar al menos un articulo a la salida');
        }

        $outputDate = $this->normalizeDate($body['output_date'] ?? now()->toDateString());
        if ($outputDate === null) throw new \Exception('La fecha de salida es obligatoria');

        [$destinationWarehouseId, $destinationLabel] = $this->resolveDestination($body, $warehouseId, $reason);

        $businessId = MagistralesWarehouse::summary()['business_id'] ?? null;
        if (!$businessId) {
            throw new \Exception('No se encontro la configuracion fija de Kamary Peru para Magistrales');
        }

        $mapped = [
            'code' => $code,
            'business_id' => $businessId,
            'business_branch_id' => $originWarehouse->business_branch_id,
            'warehouse_id' => $warehouseId,
            'client_name' => $destinationLabel ?: null,
            'motives' => [$reason],
            'exit_date' => $outputDate,
            'observations' => trim((string)($body['observations'] ?? '')) ?: null,
            'exit_status' => 'approved',
            'external_payload' => $destinationWarehouseId ? ['destination_warehouse_id' => $destinationWarehouseId] : null,
            'updated_by' => Auth::id(),
        ];

        if ($id) $mapped['id'] = $id;
        if (!$id) {
            $mapped['created_by'] = Auth::id();
            $mapped['status'] = true;
        }

        return $mapped;
    }

    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        DB::beginTransaction();
        try {
            if (!$jpa->code) {
                $jpa->code = $this->nextCode();
                $jpa->save();
            }

            ExitNoteItem::where('exit_note_id', $jpa->id)->delete();

            $warehouseId = (int) $jpa->warehouse_id;
            foreach ($this->parsedItems as $item) {
                ExitNoteItem::create([
                    'exit_note_id' => $jpa->id,
                    'article_id' => $item['article_id'],
                    'warehouse_id' => $warehouseId,
                    'batch_code' => $item['lot'],
                    'expiration_date' => $item['expiration_date'],
                    'stock' => $item['stock'],
                    'quantity' => $item['quantity'],
                    'total' => $item['total'],
                    'status' => true,
                ]);
            }

            DB::commit();

            return $jpa->fresh(['originWarehouse', 'items.article.unit', 'creator', 'updater']);
        } catch (\Throwable $th) {
            DB::rollBack();
            throw $th;
        }
    }

    public function delete(Request $request, string $id)
    {
        $response = new Response();
        try {
            $updated = ExitNote::where('id', $id)
                ->where('code', 'like', self::CODE_PREFIX . '%')
                ->update([
                    'status' => null,
                    'exit_status' => 'cancelled',
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

    public function availableStock(Request $request): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            $warehouse = $this->resolveOriginWarehouse($this->toNullableInt($request->input('warehouse_id')));
            $search = trim((string)$request->input('q', ''));
            $outputId = $this->toNullableInt($request->input('output_id')) ?? 0;

            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = $this->buildAvailableStockRows((int)$warehouse->id, $search, $outputId);
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    private function parseItems(array $items, ?int $warehouseId, ?int $outputId): array
    {
        $parsed = [];

        foreach ($items as $index => $item) {
            if (!is_array($item)) continue;

            $articleId = $this->toNullableInt($item['article_id'] ?? null);
            if (!$articleId) continue;

            $article = Article::query()
                ->with('unit:id,name,symbol')
                ->when(Schema::hasColumn('articles', 'module_scope'), fn($query) => $query->where('module_scope', 'magistrales'))
                ->findOrFail($articleId);

            $quantity = $this->toNullableDecimal($item['quantity'] ?? null) ?? 0;
            if ($quantity <= 0) throw new \Exception('La cantidad del item ' . ($index + 1) . ' debe ser mayor a 0');

            $lot = trim((string)($item['lot'] ?? '')) ?: null;
            $expirationDate = $this->normalizeDate($item['expiration_date'] ?? null);
            $stock = MagistralesStock::stock($articleId, $warehouseId, $lot, $expirationDate)
                + $this->existingOutputQuantity($outputId, $articleId, $warehouseId, $lot, $expirationDate);

            $parsed[] = [
                'article_id' => $articleId,
                'code' => trim((string)($item['code'] ?? '')) ?: $article->code,
                'name' => trim((string)($item['name'] ?? '')) ?: $article->name,
                'lot' => $lot,
                'expiration_date' => $expirationDate,
                'stock' => $stock,
                'unit_label' => trim((string)($item['unit_label'] ?? '')) ?: ($article->unit?->symbol ?: $article->unit?->name),
                'quantity' => $quantity,
                'total' => $this->toNullableDecimal($item['total'] ?? null) ?? $quantity,
            ];
        }

        $this->assertStockAvailable($parsed, $warehouseId, $outputId);

        return $parsed;
    }

    private function buildAvailableStockRows(int $warehouseId, string $search = '', int $outputId = 0): array
    {
        $articles = Article::query()
            ->select('articles.id', 'articles.code', 'articles.name', 'articles.article_type', 'articles.default_expiration_date', 'articles.stock_has_lot', 'articles.stock_has_expiration', 'articles.unit_id')
            ->with('unit:id,name,symbol')
            ->when(Schema::hasColumn('articles', 'module_scope'), fn($query) => $query->where('module_scope', 'magistrales'))
            ->whereNotNull('articles.status')
            ->orderBy('articles.name')
            ->get()
            ->keyBy('id');

        if ($articles->isEmpty()) return [];

        $lotRows = collect();

        if (Schema::hasTable('entry_note_items') && Schema::hasTable('entry_notes')) {
            $lotRows = $lotRows->merge(
                DB::table('entry_note_items as item')
                    ->join('entry_notes as note', 'note.id', '=', 'item.entry_note_id')
                    ->where('item.warehouse_id', $warehouseId)
                    ->where('note.entry_status', 'approved')
                    ->whereNotNull('note.status')
                    ->whereNotNull('item.status')
                    ->whereNotNull('item.article_id')
                    ->selectRaw('item.article_id, COALESCE(item.lot, item.batch_code) as lot, item.expiration_date')
                    ->distinct()
                    ->get()
            );
        }

        $groupedLotRows = $lotRows
            ->groupBy(fn($row) => (int)$row->article_id)
            ->map(fn($rows) => $rows->unique(fn($row) => mb_strtolower(trim((string)($row->lot ?? ''))) . '|' . ($row->expiration_date ?? ''))->values());

        $result = [];

        foreach ($articles as $articleId => $article) {
            $totalStock = MagistralesStock::stock((int)$articleId, $warehouseId) + $this->existingOutputQuantity($outputId, (int)$articleId, $warehouseId);
            if ($totalStock <= 0.0005) continue;

            $articleLotRows = $groupedLotRows->get((int)$articleId, collect());
            $scopedTotal = 0.0;

            foreach ($articleLotRows as $lotRow) {
                $lot = trim((string)($lotRow->lot ?? '')) ?: null;
                $expirationDate = $this->normalizeDate($lotRow->expiration_date ?? null);
                $stock = MagistralesStock::stock((int)$articleId, $warehouseId, $lot, $expirationDate)
                    + $this->existingOutputQuantity($outputId, (int)$articleId, $warehouseId, $lot, $expirationDate);

                if ($stock <= 0.0005) continue;

                $scopedTotal += $stock;
                $result[] = $this->formatAvailableStockRow($article, $stock, $lot, $expirationDate, true);
            }

            $genericStock = round($totalStock - $scopedTotal, 3);
            if ($genericStock > 0.0005) {
                $result[] = $this->formatAvailableStockRow(
                    $article,
                    $genericStock,
                    null,
                    $this->normalizeDate($article->default_expiration_date?->format('Y-m-d') ?? $article->default_expiration_date ?? null),
                    false
                );
            }
        }

        $rows = collect($result)
            ->filter(function (array $row) use ($search) {
                if ($search === '') return true;
                $haystack = mb_strtolower(implode(' ', [
                    $row['code'],
                    $row['name'],
                    $row['lot'],
                    $row['expiration_date'],
                    $row['type'],
                ]));
                return str_contains($haystack, mb_strtolower($search));
            })
            ->sortBy([
                ['name', 'asc'],
                ['lot', 'asc'],
                ['expiration_date', 'asc'],
            ])
            ->values();

        return $rows->all();
    }

    private function formatAvailableStockRow(Article $article, float $stock, ?string $lot, ?string $expirationDate, bool $isLotTracked): array
    {
        $expirationDate = $this->normalizeDate($expirationDate);
        $unitLabel = $article->unit?->symbol ?: $article->unit?->name;

        return [
            'id' => implode('|', [
                (int)$article->id,
                $lot ?? '',
                $expirationDate ?? '',
                $isLotTracked ? 'LOT' : 'GEN',
            ]),
            'article_id' => (int)$article->id,
            'code' => $article->code,
            'name' => $article->name,
            'lot' => $lot,
            'expiration_date' => $expirationDate,
            'stock' => round($stock, 3),
            'unit_label' => $unitLabel,
            'type' => mb_strtoupper(trim((string)($article->article_type ?? 'INSUMO'))),
            'is_lot_tracked' => $isLotTracked,
        ];
    }

    private function assertStockAvailable(array $items, ?int $warehouseId, ?int $outputId): void
    {
        $requestedTotal = [];
        $requestedScoped = [];

        foreach ($items as $item) {
            $articleId = (int)$item['article_id'];
            $quantity = (float)$item['quantity'];
            $requestedTotal[$articleId] = ($requestedTotal[$articleId] ?? 0) + $quantity;

            $lot = $item['lot'] ?? null;
            $expirationDate = $item['expiration_date'] ?? null;
            if ($lot !== null || $expirationDate !== null) {
                $key = $articleId . '|' . ($lot ?? '') . '|' . ($expirationDate ?? '');
                $requestedScoped[$key] ??= [
                    'article_id' => $articleId,
                    'lot' => $lot,
                    'expiration_date' => $expirationDate,
                    'quantity' => 0,
                ];
                $requestedScoped[$key]['quantity'] += $quantity;
            }
        }

        foreach ($requestedTotal as $articleId => $quantity) {
            $available = MagistralesStock::stock($articleId, $warehouseId)
                + $this->existingOutputQuantity($outputId, $articleId, $warehouseId);

            if ($quantity > ($available + 0.0005)) {
                throw new \Exception("Stock insuficiente para el articulo {$articleId}. Disponible: " . round($available, 3));
            }
        }

        foreach ($requestedScoped as $row) {
            $available = MagistralesStock::stock($row['article_id'], $warehouseId, $row['lot'], $row['expiration_date'])
                + $this->existingOutputQuantity($outputId, $row['article_id'], $warehouseId, $row['lot'], $row['expiration_date']);

            if ($row['quantity'] > ($available + 0.0005)) {
                $scope = trim(' lote ' . ($row['lot'] ?? '-') . ' vencimiento ' . ($row['expiration_date'] ?? '-'));
                throw new \Exception("Stock insuficiente para el articulo {$row['article_id']} {$scope}. Disponible: " . round($available, 3));
            }
        }
    }

    private function existingOutputQuantity(?int $outputId, int $articleId, ?int $warehouseId, ?string $lot = null, ?string $expirationDate = null): float
    {
        if (!$outputId) return 0;

        return (float) DB::table('exit_note_items as item')
            ->join('exit_notes as note', 'note.id', '=', 'item.exit_note_id')
            ->where('note.id', $outputId)
            ->where('item.article_id', $articleId)
            ->whereNotNull('note.status')
            ->whereNotNull('item.status')
            ->when($warehouseId, fn($query) => $query->where('item.warehouse_id', $warehouseId))
            ->when($lot !== null, fn($query) => $query->where('item.batch_code', $lot))
            ->when($expirationDate !== null, fn($query) => $query->whereDate('item.expiration_date', $expirationDate))
            ->sum('item.quantity');
    }

    private function nextCode(): string
    {
        // exit_notes mezcla varias familias de codigo (SAL-MAG-, VTA-MAG-, OPC-MAG-, notas
        // generales) en la misma tabla, asi que el id mas alto no necesariamente tiene el
        // numero de codigo mas alto: se calcula el maximo real sobre el sufijo numerico de
        // todos los codigos con este prefijo en vez de asumir el orden de insercion.
        $max = (int) ExitNote::where('code', 'like', self::CODE_PREFIX . '%')
            ->selectRaw('MAX(CAST(SUBSTRING(code, ?) AS UNSIGNED)) as max_num', [strlen(self::CODE_PREFIX) + 1])
            ->value('max_num');

        return self::CODE_PREFIX . str_pad((string)($max + 1), 6, '0', STR_PAD_LEFT);
    }

    private function resolveDestination(array $body, int $originWarehouseId, string $reason): array
    {
        if ($reason !== self::REASON_TRANSFER) {
            return [null, null];
        }

        $destinationWarehouseId = $this->toNullableInt($body['destination_warehouse_id'] ?? null);
        if (!$destinationWarehouseId) throw new \Exception('Debes seleccionar el almacen destino para la transferencia');
        if ($destinationWarehouseId === $originWarehouseId) throw new \Exception('El almacen destino no puede ser el mismo almacen origen');

        $destinationWarehouse = Warehouse::query()
            ->with('branch:id,name,business_id')
            ->whereKey($destinationWarehouseId)
            ->whereNotNull('status')
            ->first();

        if (!$destinationWarehouse) throw new \Exception('El almacen destino seleccionado no existe o esta inactivo');

        $destinationLabel = collect([
            $destinationWarehouse->branch?->name,
            $destinationWarehouse->name,
        ])->filter()->implode(' - ');

        return [$destinationWarehouseId, $destinationLabel ?: $destinationWarehouse->name];
    }

    private function resolveOriginWarehouse(?int $warehouseId): Warehouse
    {
        if ($warehouseId) {
            $warehouse = Warehouse::query()
                ->with('branch:id,name,business_id')
                ->whereKey($warehouseId)
                ->whereNotNull('status')
                ->first();

            if (!$warehouse) {
                throw new \Exception('El almacen origen seleccionado no existe o esta inactivo');
            }

            return $warehouse;
        }

        return MagistralesWarehouse::warehouse();
    }

    private function resolveAvailableOriginWarehouses(int $branchId, int $fixedWarehouseId): array
    {
        $warehouses = Warehouse::query()
            ->where('business_branch_id', $branchId)
            ->whereNotNull('status')
            ->orderBy('name')
            ->get(['id', 'name', 'description', 'business_branch_id', 'status']);

        $grouped = [];

        foreach ($warehouses as $warehouse) {
            $label = $this->normalizeOriginWarehouseLabel($warehouse);
            if ($label === null || isset($grouped[$label])) {
                continue;
            }

            $grouped[$label] = [
                'id' => (int) $warehouse->id,
                'name' => $label,
                'business_branch_id' => (int) $warehouse->business_branch_id,
                'status' => $warehouse->status,
            ];
        }

        if (!isset($grouped['INSUMOS Y ENVASES'])) {
            $fixedWarehouse = $warehouses->firstWhere('id', $fixedWarehouseId);
            if ($fixedWarehouse) {
                $grouped = ['INSUMOS Y ENVASES' => [
                    'id' => (int) $fixedWarehouse->id,
                    'name' => 'INSUMOS Y ENVASES',
                    'business_branch_id' => (int) $fixedWarehouse->business_branch_id,
                    'status' => $fixedWarehouse->status,
                ]] + $grouped;
            }
        }

        return array_values($grouped);
    }

    private function normalizeOriginWarehouseLabel(Warehouse $warehouse): ?string
    {
        $normalized = mb_strtolower(trim(implode(' ', [
            $warehouse->name,
            $warehouse->description,
        ])));

        if ($normalized === '') {
            return null;
        }

        if (
            str_contains($normalized, 'terminado')
            || str_contains($normalized, 'preparacion')
            || str_contains($normalized, 'producto')
            || str_contains($normalized, 'reserva')
        ) {
            return 'PREPARACIONES FARMACEUTICAS (TERMINADO)';
        }

        if (
            str_contains($normalized, 'insumo')
            || str_contains($normalized, 'envase')
            || str_contains($normalized, 'principal')
            || str_contains($normalized, 'magistrales')
        ) {
            return 'INSUMOS Y ENVASES';
        }

        return null;
    }

    private function normalizeReason($value): ?string
    {
        if ($value === null) return null;
        $text = trim((string)$value);
        if ($text === '') return null;
        return mb_strtoupper($text);
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
