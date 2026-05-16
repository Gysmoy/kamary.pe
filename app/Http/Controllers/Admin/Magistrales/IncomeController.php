<?php

namespace App\Http\Controllers\Admin\Magistrales;

use App\Http\Controllers\BasicController;
use App\Http\Controllers\Admin\Magistrales\Concerns\RunsMagistralSaveInTransaction;
use App\Models\Article;
use App\Models\MagistralIncome;
use App\Models\MagistralIncomeItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class IncomeController extends BasicController
{
    use RunsMagistralSaveInTransaction;

    public $model = MagistralIncome::class;
    public $reactView = 'Admin/Magistrales/Incomes';
    public $prefix4filter = 'magistral_incomes';

    private array $itemsPayload = [];
    private array $parsedItems = [];

    public function setReactViewProperties(Request $request)
    {
        return [
            'moduleTitle' => 'Magistrales - Nota de Entrada',
            'requiredPermission' => 'magistrales-incomes',
        ];
    }

    public function setPaginationInstance(string $model)
    {
        return $model::select('magistral_incomes.*')
            ->with([
                'business:id,name',
                'warehouse:id,name',
                'supplier:id,ruc,business_name',
                'items:id,magistral_income_id,article_id,description,quantity,presentation,expiration_date,lot,price_without_igv,price_with_igv,subtotal,status',
                'items.article:id,code,name',
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ])
            ->leftJoin('businesses as business', 'business.id', '=', 'magistral_incomes.business_id')
            ->leftJoin('warehouses as warehouse', 'warehouse.id', '=', 'magistral_incomes.warehouse_id')
            ->leftJoin('suppliers as supplier', 'supplier.id', '=', 'magistral_incomes.supplier_id')
            ->leftJoin('users as creator', 'creator.id', '=', 'magistral_incomes.created_by')
            ->leftJoin('users as updater', 'updater.id', '=', 'magistral_incomes.updated_by');
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $id = $body['id'] ?? null;
        $code = trim((string)($body['code'] ?? ''));
        if ($code === '') $code = $this->nextCode();

        $exists = MagistralIncome::whereRaw('LOWER(code) = ?', [mb_strtolower($code)])
            ->when($id, fn($query) => $query->where('id', '!=', $id))
            ->exists();
        if ($exists) throw new \Exception('Ya existe un ingreso magistral con este codigo');

        if (!$id) {
            $body['created_by'] = Auth::id();
            $body['status'] = true;
        }

        $body['updated_by'] = Auth::id();
        $body['code'] = $code;
        $body['purchase_order_code'] = trim((string)($body['purchase_order_code'] ?? '')) ?: null;
        $body['document_type'] = trim((string)($body['document_type'] ?? '')) ?: null;
        $body['document_series'] = trim((string)($body['document_series'] ?? '')) ?: null;
        $body['document_sequence'] = trim((string)($body['document_sequence'] ?? '')) ?: null;
        $body['guide_number'] = trim((string)($body['guide_number'] ?? '')) ?: null;
        $body['guide_series'] = trim((string)($body['guide_series'] ?? '')) ?: null;
        $body['guide_sequence'] = trim((string)($body['guide_sequence'] ?? '')) ?: null;
        $body['guide_ruc'] = trim((string)($body['guide_ruc'] ?? '')) ?: null;
        $body['guide_file_path'] = trim((string)($body['guide_file_path'] ?? '')) ?: null;
        $body['business_id'] = $this->toNullableInt($body['business_id'] ?? null);
        $body['warehouse_id'] = $this->toNullableInt($body['warehouse_id'] ?? null);
        $body['supplier_id'] = $this->toNullableInt($body['supplier_id'] ?? null);
        $body['payment_method'] = trim((string)($body['payment_method'] ?? '')) ?: null;
        $body['file_path'] = trim((string)($body['file_path'] ?? '')) ?: null;
        $body['origin'] = trim((string)($body['origin'] ?? '')) ?: null;
        $body['currency'] = trim((string)($body['currency'] ?? '')) ?: null;
        $body['affects_igv'] = $this->toBoolean($body['affects_igv'] ?? false);
        $body['issue_date'] = $this->normalizeDate($body['issue_date'] ?? null);
        $body['observations'] = trim((string)($body['observations'] ?? '')) ?: null;

        $this->itemsPayload = is_array($request->items) ? $request->items : [];
        $this->parsedItems = $this->parseItems($this->itemsPayload);
        if (count($this->parsedItems) === 0) {
            throw new \Exception('Debes agregar al menos un articulo al ingreso');
        }

        $body['subtotal'] = round(array_sum(array_column($this->parsedItems, 'price_without_total')), 2);
        $body['total'] = round(array_sum(array_column($this->parsedItems, 'price_with_total')), 2);
        $body['igv'] = $body['affects_igv'] ? round(max(0, $body['total'] - $body['subtotal']), 2) : 0;

        unset($body['items']);

        foreach ([
            'purchase_order_code',
            'guide_series',
            'guide_sequence',
            'guide_ruc',
            'guide_file_path',
            'payment_method',
            'file_path',
            'origin',
            'currency',
            'affects_igv',
            'subtotal',
            'igv',
            'total',
        ] as $column) {
            if (!Schema::hasColumn('magistral_incomes', $column)) unset($body[$column]);
        }

        return $body;
    }

    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        DB::beginTransaction();
        try {
            MagistralIncomeItem::where('magistral_income_id', $jpa->id)->delete();

            foreach ($this->parsedItems as $item) {
                MagistralIncomeItem::create([
                    'magistral_income_id' => $jpa->id,
                    'article_id' => $item['article_id'],
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'presentation' => $item['presentation'],
                    'expiration_date' => $item['expiration_date'],
                    'lot' => $item['lot'],
                    'price_without_igv' => $item['price_without_igv'],
                    'price_with_igv' => $item['price_with_igv'],
                    'subtotal' => $item['subtotal'],
                    'status' => true,
                ]);
            }

            DB::commit();
            return $jpa->fresh(['business', 'warehouse', 'supplier', 'items.article', 'creator', 'updater']);
        } catch (\Throwable $th) {
            DB::rollBack();
            throw $th;
        }
    }

    private function nextCode(): string
    {
        $next = 1;
        $latest = MagistralIncome::query()->latest('id')->value('code');
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) {
            $next = ((int)$matches[1]) + 1;
        }

        return 'ING-MAG-' . str_pad((string)$next, 6, '0', STR_PAD_LEFT);
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

    private function parseItems(array $items): array
    {
        $parsed = [];

        foreach ($items as $index => $item) {
            if (!is_array($item)) continue;

            $articleId = $this->toNullableInt($item['article_id'] ?? null);
            $description = trim((string)($item['description'] ?? ''));
            if ($articleId) {
                $article = Article::query()
                    ->when(Schema::hasColumn('articles', 'module_scope'), fn($query) => $query->where('module_scope', 'magistrales'))
                    ->findOrFail($articleId);
                if ($description === '') $description = $article->name;
            }

            $quantity = $this->toNullableDecimal($item['quantity'] ?? null) ?? 0;
            $priceWithoutIgv = $this->toNullableDecimal($item['price_without_igv'] ?? null) ?? 0;
            $priceWithIgv = $this->toNullableDecimal($item['price_with_igv'] ?? null) ?? 0;
            $presentation = trim((string)($item['presentation'] ?? '')) ?: null;
            $expirationDate = $this->normalizeDate($item['expiration_date'] ?? null);
            $lot = trim((string)($item['lot'] ?? '')) ?: null;

            if (!$articleId && $description === '') continue;
            if ($quantity <= 0) throw new \Exception('La cantidad del item ' . ($index + 1) . ' debe ser mayor a 0');
            if ($priceWithoutIgv < 0 || $priceWithIgv < 0) throw new \Exception('Los precios del item ' . ($index + 1) . ' no pueden ser negativos');

            $parsed[] = [
                'article_id' => $articleId,
                'description' => $description,
                'quantity' => $quantity,
                'presentation' => $presentation,
                'expiration_date' => $expirationDate,
                'lot' => $lot,
                'price_without_igv' => $priceWithoutIgv,
                'price_with_igv' => $priceWithIgv,
                'price_without_total' => round($quantity * $priceWithoutIgv, 2),
                'price_with_total' => round($quantity * $priceWithIgv, 2),
                'subtotal' => round($quantity * $priceWithIgv, 2),
            ];
        }

        return $parsed;
    }
}
