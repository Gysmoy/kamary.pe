<?php

namespace App\Http\Controllers\Admin\Magistrales;

use App\Http\Controllers\BasicController;
use App\Http\Controllers\Admin\Magistrales\Concerns\RunsMagistralSaveInTransaction;
use App\Models\Article;
use App\Models\MagistralFormat;
use App\Models\MagistralFormula;
use App\Models\MagistralProductionOrder;
use App\Models\MagistralProductionOrderItem;
use App\Models\MagistralResponsible;
use App\Support\MagistralesWarehouse;
use App\Support\MagistralesStock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ProductionOrderController extends BasicController
{
    use RunsMagistralSaveInTransaction;

    public $model = MagistralProductionOrder::class;
    public $reactView = 'Admin/Magistrales/ProductionOrders';
    public $prefix4filter = 'magistral_production_orders';

    private array $parsedItems = [];

    public function setReactViewProperties(Request $request)
    {
        return [
            'moduleTitle' => 'Magistrales - O. Produccion',
            'requiredPermission' => 'magistrales-production-order',
            'fixedWarehouse' => MagistralesWarehouse::summary(),
        ];
    }

    public function setPaginationInstance(string $model)
    {
        return $model::select('magistral_production_orders.*')
            ->with([
                'responsible:id,document_number,name',
                'destinationWarehouse:id,name',
                'article:id,code,name,unit_id',
                'article.unit:id,name,symbol',
                'format:id,description,quantity',
                'items:id,magistral_production_order_id,article_id,description,expiration_date,quantity,magistral_formula_id,total,status',
                'items.article:id,code,name,unit_id',
                'items.formula:id,article_id',
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ])
            ->leftJoin('magistral_responsibles as responsible', 'responsible.id', '=', 'magistral_production_orders.responsible_id')
            ->leftJoin('warehouses as destination_warehouse', 'destination_warehouse.id', '=', 'magistral_production_orders.destination_warehouse_id')
            ->leftJoin('articles as article', 'article.id', '=', 'magistral_production_orders.article_id')
            ->leftJoin('magistral_formats as format', 'format.id', '=', 'magistral_production_orders.format_id')
            ->leftJoin('users as creator', 'creator.id', '=', 'magistral_production_orders.created_by')
            ->leftJoin('users as updater', 'updater.id', '=', 'magistral_production_orders.updated_by');
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $id = $body['id'] ?? null;
        $code = trim((string)($body['code'] ?? ''));
        if ($code === '') $code = $this->nextCode();

        $exists = MagistralProductionOrder::whereRaw('LOWER(code) = ?', [mb_strtolower($code)])
            ->when($id, fn($query) => $query->where('id', '!=', $id))
            ->exists();
        if ($exists) throw new \Exception('Ya existe una orden de produccion con este codigo');

        $responsibleId = $this->toNullableInt($body['responsible_id'] ?? null);
        $articleId = $this->toNullableInt($body['article_id'] ?? null);
        $warehouse = MagistralesWarehouse::warehouse();
        $warehouseId = (int) $warehouse->id;
        $formatId = $this->toNullableInt($body['format_id'] ?? null);

        if ($responsibleId) MagistralResponsible::findOrFail($responsibleId);
        if ($articleId) $this->findMagistralArticle($articleId);
        if ($formatId) MagistralFormat::findOrFail($formatId);

        $this->parsedItems = $this->parseItems(is_array($request->items) ? $request->items : []);
        if (count($this->parsedItems) === 0) {
            throw new \Exception('Debes agregar al menos un articulo a la orden de produccion');
        }

        $orderStatus = $this->normalizeStatus($body['order_status'] ?? 'pending');
        $productionQuantity = $this->toNullableDecimal($body['quantity'] ?? null) ?? 0;

        if ($orderStatus === 'finished') {
            if (!$articleId) throw new \Exception('El producto terminado es obligatorio para finalizar la orden de produccion');
            if (!$warehouseId) throw new \Exception('El almacen destino es obligatorio para finalizar la orden de produccion');
            if ($productionQuantity <= 0) throw new \Exception('La cantidad producto debe ser mayor a 0 para finalizar la orden de produccion');
            $this->assertStockAvailable($this->parsedItems, $warehouseId, $id ? (int)$id : null);
        }

        if (!$id) {
            $body['created_by'] = Auth::id();
            $body['status'] = true;
        }

        $body['updated_by'] = Auth::id();
        $body['code'] = $code;
        $body['order_status'] = $orderStatus;
        $body['responsible_id'] = $responsibleId;
        $body['destination'] = $warehouse->name;
        $body['destination_warehouse_id'] = $warehouseId;
        $body['article_id'] = $articleId;
        $body['format_id'] = $formatId;
        $body['batch_quantity'] = $this->toNullableDecimal($body['batch_quantity'] ?? null) ?? 0;
        $body['quantity'] = $productionQuantity;
        $body['delivery_date'] = $this->normalizeDate($body['delivery_date'] ?? null);
        $body['registration_date'] = $this->normalizeDate($body['registration_date'] ?? now()->toDateString());
        $body['observations'] = trim((string)($body['observations'] ?? '')) ?: null;

        unset($body['items']);

        foreach (['destination_warehouse_id', 'format_id', 'batch_quantity', 'delivery_date'] as $column) {
            if (!Schema::hasColumn('magistral_production_orders', $column)) unset($body[$column]);
        }

        return $body;
    }

    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        DB::beginTransaction();
        try {
            MagistralProductionOrderItem::where('magistral_production_order_id', $jpa->id)->delete();

            foreach ($this->parsedItems as $item) {
                MagistralProductionOrderItem::create([
                    'magistral_production_order_id' => $jpa->id,
                    'article_id' => $item['article_id'],
                    'description' => $item['description'],
                    'expiration_date' => $item['expiration_date'],
                    'quantity' => $item['quantity'],
                    'magistral_formula_id' => $item['magistral_formula_id'],
                    'total' => $item['total'],
                    'status' => true,
                ]);
            }

            DB::commit();
            return $jpa->fresh(['responsible', 'destinationWarehouse', 'article.unit', 'format', 'items.article', 'items.formula', 'creator', 'updater']);
        } catch (\Throwable $th) {
            DB::rollBack();
            throw $th;
        }
    }

    private function parseItems(array $items): array
    {
        $parsed = [];

        foreach ($items as $index => $item) {
            if (!is_array($item)) continue;

            $articleId = $this->toNullableInt($item['article_id'] ?? null);
            $description = trim((string)($item['description'] ?? ''));
            if ($articleId) {
                $article = $this->findMagistralArticle($articleId);
                if ($description === '') $description = $article->name;
            }

            $formulaId = $this->toNullableInt($item['magistral_formula_id'] ?? null);
            if ($formulaId) MagistralFormula::findOrFail($formulaId);

            $quantity = $this->toNullableDecimal($item['quantity'] ?? null) ?? 0;
            $total = $this->toNullableDecimal($item['total'] ?? null);
            if (!$articleId && $description === '') continue;
            if ($quantity <= 0) throw new \Exception('La cantidad del item ' . ($index + 1) . ' debe ser mayor a 0');
            if ($total !== null && $total <= 0) throw new \Exception('El total del item ' . ($index + 1) . ' debe ser mayor a 0');

            $parsed[] = [
                'article_id' => $articleId,
                'description' => $description,
                'expiration_date' => $this->normalizeDate($item['expiration_date'] ?? null),
                'quantity' => $quantity,
                'magistral_formula_id' => $formulaId,
                'total' => $total ?? $quantity,
            ];
        }

        return $parsed;
    }

    private function assertStockAvailable(array $items, ?int $warehouseId, ?int $productionOrderId): void
    {
        $requested = [];

        foreach ($items as $item) {
            if (!$item['article_id']) {
                throw new \Exception('Todos los insumos deben tener articulo para finalizar la orden de produccion');
            }

            $articleId = (int)$item['article_id'];
            $requested[$articleId] = ($requested[$articleId] ?? 0) + (float)$item['total'];
        }

        foreach ($requested as $articleId => $quantity) {
            $available = MagistralesStock::stock($articleId, $warehouseId)
                + $this->existingProductionConsumption($productionOrderId, $articleId, $warehouseId);

            if ($quantity > ($available + 0.0005)) {
                throw new \Exception("Stock insuficiente para el insumo {$articleId}. Disponible: " . round($available, 3));
            }
        }
    }

    private function existingProductionConsumption(?int $productionOrderId, int $articleId, ?int $warehouseId): float
    {
        if (!$productionOrderId) return 0;

        return (float) DB::table('magistral_production_order_items as item')
            ->join('magistral_production_orders as production', 'production.id', '=', 'item.magistral_production_order_id')
            ->where('production.id', $productionOrderId)
            ->where('item.article_id', $articleId)
            ->where('production.order_status', 'finished')
            ->whereNotNull('production.status')
            ->whereNotNull('item.status')
            ->when($warehouseId && Schema::hasColumn('magistral_production_orders', 'destination_warehouse_id'), fn($query) => $query->where('production.destination_warehouse_id', $warehouseId))
            ->sum(DB::raw('COALESCE(item.total, item.quantity)'));
    }

    private function findMagistralArticle(int $articleId): Article
    {
        return Article::query()
            ->when(Schema::hasColumn('articles', 'module_scope'), fn($query) => $query->where('module_scope', 'magistrales'))
            ->findOrFail($articleId);
    }

    private function nextCode(): string
    {
        $next = 1;
        $latest = MagistralProductionOrder::query()->latest('id')->value('code');
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) $next = ((int)$matches[1]) + 1;
        return 'OP-MAG-' . str_pad((string)$next, 6, '0', STR_PAD_LEFT);
    }

    private function normalizeStatus($value): string
    {
        $allowed = ['pending', 'in_process', 'finished', 'cancelled'];
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
}
