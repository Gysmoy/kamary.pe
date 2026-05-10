<?php

namespace App\Http\Controllers\Admin\Magistrales;

use App\Http\Controllers\BasicController;
use App\Http\Controllers\Admin\Magistrales\Concerns\RunsMagistralSaveInTransaction;
use App\Models\Article;
use App\Models\MagistralOutput;
use App\Models\MagistralOutputItem;
use App\Models\Warehouse;
use App\Support\MagistralesStock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class OutputController extends BasicController
{
    use RunsMagistralSaveInTransaction;

    public $model = MagistralOutput::class;
    public $reactView = 'Admin/Magistrales/Outputs';
    public $prefix4filter = 'magistral_outputs';

    private array $parsedItems = [];

    public function setReactViewProperties(Request $request)
    {
        return [
            'moduleTitle' => 'Magistrales - Salidas',
            'requiredPermission' => 'magistrales-outputs',
        ];
    }

    public function setPaginationInstance(string $model)
    {
        return $model::select('magistral_outputs.*')
            ->with([
                'originWarehouse:id,name',
                'items:id,magistral_output_id,article_id,code,name,lot,expiration_date,stock,unit_label,quantity,total,status',
                'items.article:id,code,name,unit_id',
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

        $warehouseId = $this->toNullableInt($body['origin_warehouse_id'] ?? null);
        if ($warehouseId) Warehouse::findOrFail($warehouseId);

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
        $body['destination'] = trim((string)($body['destination'] ?? '')) ?: null;
        $body['reason'] = trim((string)($body['reason'] ?? '')) ?: null;
        $body['observations'] = trim((string)($body['observations'] ?? '')) ?: null;
        $body['output_date'] = $this->normalizeDate($body['output_date'] ?? now()->toDateString());

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
            return $jpa->fresh(['originWarehouse', 'items.article.unit', 'creator', 'updater']);
        } catch (\Throwable $th) {
            DB::rollBack();
            throw $th;
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
