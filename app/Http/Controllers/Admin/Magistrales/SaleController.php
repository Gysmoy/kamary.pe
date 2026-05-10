<?php

namespace App\Http\Controllers\Admin\Magistrales;

use App\Http\Controllers\BasicController;
use App\Http\Controllers\Admin\Magistrales\Concerns\RunsMagistralSaveInTransaction;
use App\Models\Article;
use App\Models\Business;
use App\Models\MagistralSale;
use App\Models\MagistralSaleItem;
use App\Models\Warehouse;
use App\Support\MagistralesStock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SaleController extends BasicController
{
    use RunsMagistralSaveInTransaction;

    public $model = MagistralSale::class;
    public $reactView = 'Admin/Magistrales/Sales';
    public $prefix4filter = 'magistral_sales';

    private array $parsedItems = [];

    public function setReactViewProperties(Request $request)
    {
        return [
            'moduleTitle' => 'Magistrales - Ventas',
            'requiredPermission' => 'magistrales-sales',
        ];
    }

    public function setPaginationInstance(string $model)
    {
        return $model::select('magistral_sales.*')
            ->with([
                'business:id,name',
                'items:id,magistral_sale_id,article_id,warehouse_id,description,stock,quantity,unit_price,discount,subtotal,status',
                'items.article:id,code,name,unit_id',
                'items.article.unit:id,name,symbol',
                'items.warehouse:id,name',
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ])
            ->leftJoin('businesses as business', 'business.id', '=', 'magistral_sales.business_id')
            ->leftJoin('users as creator', 'creator.id', '=', 'magistral_sales.created_by')
            ->leftJoin('users as updater', 'updater.id', '=', 'magistral_sales.updated_by');
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $id = $body['id'] ?? null;
        $code = trim((string)($body['code'] ?? ''));
        if ($code === '') $code = $this->nextCode();

        $exists = MagistralSale::whereRaw('LOWER(code) = ?', [mb_strtolower($code)])
            ->when($id, fn($query) => $query->where('id', '!=', $id))
            ->exists();
        if ($exists) throw new \Exception('Ya existe una venta magistral con este codigo');

        $businessId = $this->toNullableInt($body['business_id'] ?? null);
        if ($businessId) Business::findOrFail($businessId);

        $isQuote = $this->toBoolean($body['is_quote'] ?? false);
        $this->parsedItems = $this->parseItems(is_array($request->items) ? $request->items : [], $id ? (int)$id : null, $isQuote);
        if (count($this->parsedItems) === 0) {
            throw new \Exception('Debes agregar al menos un articulo a la venta');
        }

        $discountTotal = round(array_sum(array_column($this->parsedItems, 'discount')), 2);
        $total = round(array_sum(array_column($this->parsedItems, 'subtotal')), 2);
        $taxable = round($total / 1.18, 2);
        $igv = round($total - $taxable, 2);

        if (!$id) {
            $body['created_by'] = Auth::id();
            $body['status'] = true;
        }

        $body['updated_by'] = Auth::id();
        $body['code'] = $code;
        $body['pharmacy'] = trim((string)($body['pharmacy'] ?? '')) ?: null;
        $body['business_id'] = $businessId;
        $body['payment_status'] = $this->normalizePaymentStatus($body['payment_status'] ?? 'pending');
        $body['document_type'] = trim((string)($body['document_type'] ?? '')) ?: null;
        $body['document_number'] = trim((string)($body['document_number'] ?? '')) ?: null;
        $body['patient'] = trim((string)($body['patient'] ?? '')) ?: null;
        $body['doctor'] = trim((string)($body['doctor'] ?? '')) ?: null;
        $body['discount_policy'] = trim((string)($body['discount_policy'] ?? '')) ?: null;
        $body['sale_type'] = trim((string)($body['sale_type'] ?? '')) ?: null;
        $body['allergy'] = $this->toBoolean($body['allergy'] ?? false);
        $body['intolerance'] = $this->toBoolean($body['intolerance'] ?? false);
        $body['taxable_amount'] = $taxable;
        $body['unaffected_amount'] = 0;
        $body['discount_total'] = $discountTotal;
        $body['subtotal'] = $total;
        $body['igv'] = $igv;
        $body['total'] = $total;
        $body['is_quote'] = $isQuote;
        $body['sale_date'] = $this->normalizeDate($body['sale_date'] ?? now()->toDateString());

        unset($body['items']);

        foreach ([
            'doctor',
            'discount_policy',
            'sale_type',
            'allergy',
            'intolerance',
            'taxable_amount',
            'unaffected_amount',
            'discount_total',
            'subtotal',
            'igv',
            'is_quote',
        ] as $column) {
            if (!Schema::hasColumn('magistral_sales', $column)) unset($body[$column]);
        }

        return $body;
    }

    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        DB::beginTransaction();
        try {
            MagistralSaleItem::where('magistral_sale_id', $jpa->id)->delete();

            foreach ($this->parsedItems as $item) {
                MagistralSaleItem::create([
                    'magistral_sale_id' => $jpa->id,
                    'article_id' => $item['article_id'],
                    'warehouse_id' => $item['warehouse_id'],
                    'description' => $item['description'],
                    'stock' => $item['stock'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'discount' => $item['discount'],
                    'subtotal' => $item['subtotal'],
                    'status' => true,
                ]);
            }

            DB::commit();
            return $jpa->fresh(['business', 'items.article.unit', 'items.warehouse', 'creator', 'updater']);
        } catch (\Throwable $th) {
            DB::rollBack();
            throw $th;
        }
    }

    private function parseItems(array $items, ?int $saleId, bool $isQuote): array
    {
        $parsed = [];

        foreach ($items as $index => $item) {
            if (!is_array($item)) continue;

            $articleId = $this->toNullableInt($item['article_id'] ?? null);
            $warehouseId = $this->toNullableInt($item['warehouse_id'] ?? null);
            if (!$articleId) continue;

            $article = Article::query()
                ->when(Schema::hasColumn('articles', 'module_scope'), fn($query) => $query->where('module_scope', 'magistrales'))
                ->findOrFail($articleId);
            if ($warehouseId) Warehouse::findOrFail($warehouseId);

            $quantity = $this->toNullableDecimal($item['quantity'] ?? null) ?? 0;
            $unitPrice = $this->toNullableDecimal($item['unit_price'] ?? null) ?? 0;
            $discount = $this->toNullableDecimal($item['discount'] ?? null) ?? 0;
            if ($quantity <= 0) throw new \Exception('La cantidad del item ' . ($index + 1) . ' debe ser mayor a 0');
            if ($unitPrice < 0 || $discount < 0) throw new \Exception('Los importes del item ' . ($index + 1) . ' no pueden ser negativos');

            $stock = MagistralesStock::stock($articleId, $warehouseId)
                + ($isQuote ? 0 : $this->existingSaleQuantity($saleId, $articleId, $warehouseId));
            $subtotal = round(max(0, ($quantity * $unitPrice) - $discount), 2);

            $parsed[] = [
                'article_id' => $articleId,
                'warehouse_id' => $warehouseId,
                'description' => trim((string)($item['description'] ?? '')) ?: $article->name,
                'stock' => $stock,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'discount' => $discount,
                'subtotal' => $subtotal,
            ];
        }

        if (!$isQuote) $this->assertStockAvailable($parsed, $saleId);

        return $parsed;
    }

    private function assertStockAvailable(array $items, ?int $saleId): void
    {
        $requested = [];

        foreach ($items as $item) {
            $articleId = (int)$item['article_id'];
            $warehouseId = $item['warehouse_id'] ? (int)$item['warehouse_id'] : null;
            $key = $articleId . '|' . ($warehouseId ?? 'all');
            $requested[$key] ??= [
                'article_id' => $articleId,
                'warehouse_id' => $warehouseId,
                'quantity' => 0,
            ];
            $requested[$key]['quantity'] += (float)$item['quantity'];
        }

        foreach ($requested as $row) {
            $available = MagistralesStock::stock($row['article_id'], $row['warehouse_id'])
                + $this->existingSaleQuantity($saleId, $row['article_id'], $row['warehouse_id']);

            if ($row['quantity'] > ($available + 0.0005)) {
                throw new \Exception("Stock insuficiente para el articulo {$row['article_id']}. Disponible: " . round($available, 3));
            }
        }
    }

    private function existingSaleQuantity(?int $saleId, int $articleId, ?int $warehouseId): float
    {
        if (!$saleId) return 0;

        return (float) DB::table('magistral_sale_items as item')
            ->join('magistral_sales as sale', 'sale.id', '=', 'item.magistral_sale_id')
            ->where('sale.id', $saleId)
            ->where('item.article_id', $articleId)
            ->whereNotNull('sale.status')
            ->whereNotNull('item.status')
            ->when(Schema::hasColumn('magistral_sales', 'is_quote'), fn($query) => $query->where('sale.is_quote', false))
            ->when($warehouseId, fn($query) => $query->where('item.warehouse_id', $warehouseId))
            ->sum('item.quantity');
    }

    private function nextCode(): string
    {
        $next = 1;
        $latest = MagistralSale::query()->latest('id')->value('code');
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) $next = ((int)$matches[1]) + 1;
        return 'VTA-MAG-' . str_pad((string)$next, 6, '0', STR_PAD_LEFT);
    }

    private function normalizePaymentStatus($value): string
    {
        $allowed = ['pending', 'paid', 'partial', 'cancelled'];
        $normalized = mb_strtolower(trim((string)$value));
        return in_array($normalized, $allowed, true) ? $normalized : 'pending';
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

    private function toBoolean($value): bool
    {
        if (is_bool($value)) return $value;
        if (is_numeric($value)) return (int)$value !== 0;

        $normalized = mb_strtolower(trim((string)$value));
        return in_array($normalized, ['1', 'true', 'si', 'yes', 'y', 'activo', 'activa', 'on'], true);
    }
}
