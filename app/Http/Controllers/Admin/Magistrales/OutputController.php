<?php

namespace App\Http\Controllers\Admin\Magistrales;

use App\Http\Controllers\BasicController;
use App\Http\Controllers\Admin\Magistrales\Concerns\RunsMagistralSaveInTransaction;
use App\Models\Article;
use App\Models\MagistralOutput;
use App\Models\MagistralOutputItem;
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

class OutputController extends BasicController
{
    use RunsMagistralSaveInTransaction;

    private const REASON_TRANSFER = 'TRANSFERENCIA';
    private const REASON_OPTIONS = [
        self::REASON_TRANSFER,
        'REGULARIZACION DE STOCK',
        'VENTA INTERNA',
        'PREPARACION DE BASES',
        'PREPARACION DE BASE GEL DE CARBOPOL',
        'PREPARACION DE BASE CREMA NO IONICA',
    ];

    public $model = MagistralOutput::class;
    public $reactView = 'Admin/Magistrales/Outputs';
    public $prefix4filter = 'magistral_outputs';

    private array $parsedItems = [];

    public function setReactViewProperties(Request $request)
    {
        return [
            'moduleTitle' => 'Magistrales - Salidas',
            'requiredPermission' => ['magistrales-outputs', 'magistrales-warehouse'],
            'fixedWarehouse' => MagistralesWarehouse::summary(),
            'reasonOptions' => self::REASON_OPTIONS,
        ];
    }

    public function setPaginationInstance(string $model)
    {
        return $model::select('magistral_outputs.*')
            ->with([
                'originWarehouse:id,name',
                'destinationWarehouse:id,name,business_branch_id',
                'destinationWarehouse.branch:id,name,business_id',
                'items:id,magistral_output_id,article_id,code,name,lot,expiration_date,stock,unit_label,quantity,total,status',
                'items.article:id,code,name,unit_id,article_type',
                'items.article.unit:id,name,symbol',
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ])
            ->leftJoin('warehouses as origin_warehouse', 'origin_warehouse.id', '=', 'magistral_outputs.origin_warehouse_id')
            ->leftJoin('users as creator', 'creator.id', '=', 'magistral_outputs.created_by')
            ->leftJoin('users as updater', 'updater.id', '=', 'magistral_outputs.updated_by');
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $id = $body['id'] ?? null;
        $code = trim((string)($body['code'] ?? ''));
        if ($code === '') $code = $this->nextCode();

        $exists = MagistralOutput::whereRaw('LOWER(code) = ?', [mb_strtolower($code)])
            ->when($id, fn($query) => $query->where('id', '!=', $id))
            ->exists();
        if ($exists) throw new \Exception('Ya existe una salida magistral con este codigo');

        $warehouse = MagistralesWarehouse::warehouse();
        $warehouseId = (int) $warehouse->id;
        $reason = $this->normalizeReason($body['reason'] ?? null);
        if ($reason === null) throw new \Exception('Debes seleccionar un motivo para la salida');

        $this->parsedItems = $this->parseItems(is_array($request->items) ? $request->items : [], $warehouseId, $id ? (int)$id : null);
        if (count($this->parsedItems) === 0) {
            throw new \Exception('Debes agregar al menos un articulo a la salida');
        }

        if (!$id) {
            $body['created_by'] = Auth::id();
            $body['status'] = true;
        }

        $body['updated_by'] = Auth::id();
        $body['code'] = $code;
        $body['origin_warehouse_id'] = $warehouseId;
        $body['reason'] = $reason;
        $body['observations'] = trim((string)($body['observations'] ?? '')) ?: null;
        $body['output_date'] = $this->normalizeDate($body['output_date'] ?? now()->toDateString());
        if ($body['output_date'] === null) throw new \Exception('La fecha de salida es obligatoria');

        [$destinationWarehouseId, $destinationLabel] = $this->resolveDestination($body, $warehouseId, $reason);
        $body['destination_warehouse_id'] = $destinationWarehouseId;
        $body['destination'] = $destinationLabel;

        unset($body['items']);

        return $body;
    }

    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        DB::beginTransaction();
        try {
            MagistralOutputItem::where('magistral_output_id', $jpa->id)->delete();

            foreach ($this->parsedItems as $item) {
                MagistralOutputItem::create([
                    'magistral_output_id' => $jpa->id,
                    'article_id' => $item['article_id'],
                    'code' => $item['code'],
                    'name' => $item['name'],
                    'lot' => $item['lot'],
                    'expiration_date' => $item['expiration_date'],
                    'stock' => $item['stock'],
                    'unit_label' => $item['unit_label'],
                    'quantity' => $item['quantity'],
                    'total' => $item['total'],
                    'status' => true,
                ]);
            }

            DB::commit();
            return $jpa->fresh(['originWarehouse', 'destinationWarehouse.branch', 'items.article.unit', 'creator', 'updater']);
        } catch (\Throwable $th) {
            DB::rollBack();
            throw $th;
        }
    }

    public function availableStock(Request $request): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            $warehouse = MagistralesWarehouse::warehouse();
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

        if (Schema::hasTable('magistral_income_items') && Schema::hasTable('magistral_incomes')) {
            $lotRows = $lotRows->merge(
                DB::table('magistral_income_items as item')
                    ->join('magistral_incomes as income', 'income.id', '=', 'item.magistral_income_id')
                    ->where('income.warehouse_id', $warehouseId)
                    ->whereNotNull('income.status')
                    ->whereNotNull('item.status')
                    ->whereNotNull('item.article_id')
                    ->select('item.article_id', 'item.lot', 'item.expiration_date')
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

        return (float) DB::table('magistral_output_items as item')
            ->join('magistral_outputs as output', 'output.id', '=', 'item.magistral_output_id')
            ->where('output.id', $outputId)
            ->where('item.article_id', $articleId)
            ->whereNotNull('output.status')
            ->whereNotNull('item.status')
            ->when($warehouseId, fn($query) => $query->where('output.origin_warehouse_id', $warehouseId))
            ->when($lot !== null, fn($query) => $query->where('item.lot', $lot))
            ->when($expirationDate !== null, fn($query) => $query->whereDate('item.expiration_date', $expirationDate))
            ->sum('item.quantity');
    }

    private function nextCode(): string
    {
        $next = 1;
        $latest = MagistralOutput::query()->latest('id')->value('code');
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) $next = ((int)$matches[1]) + 1;
        return 'SAL-MAG-' . str_pad((string)$next, 6, '0', STR_PAD_LEFT);
    }

    private function resolveDestination(array $body, int $originWarehouseId, string $reason): array
    {
        if ($reason !== self::REASON_TRANSFER) {
            return [null, null];
        }

        $destinationWarehouseId = $this->toNullableInt($body['destination_warehouse_id'] ?? null);
        if (!$destinationWarehouseId) throw new \Exception('Debes seleccionar el almacen destino para la transferencia');
        if ($destinationWarehouseId === $originWarehouseId) throw new \Exception('El almacen destino no puede ser el mismo almacen magistral');

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
