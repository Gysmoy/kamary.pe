<?php

namespace App\Http\Controllers\Admin\Magistrales;

use App\Http\Controllers\BasicController;
use App\Http\Controllers\Admin\Magistrales\Concerns\RunsMagistralSaveInTransaction;
use App\Models\Article;
use App\Models\MagistralInventoryCount;
use App\Models\MagistralInventoryCountItem;
use App\Support\MagistralesWarehouse;
use App\Support\MagistralesStock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use SoDe\Extend\Response;

class InventoryController extends BasicController
{
    use RunsMagistralSaveInTransaction;

    public $model = MagistralInventoryCount::class;
    public $reactView = 'Admin/Magistrales/Inventory';
    public $prefix4filter = 'magistral_inventory_counts';

    private array $parsedItems = [];

    public function setReactViewProperties(Request $request)
    {
        return [
            'moduleTitle' => 'Magistrales - Inventario',
            'requiredPermission' => ['magistrales-inventory', 'magistrales-warehouse'],
            'fixedWarehouse' => MagistralesWarehouse::summary(),
        ];
    }

    public function setPaginationInstance(string $model)
    {
        return $model::select('magistral_inventory_counts.*')
            ->with([
                'branch:id,name,business_id',
                'warehouse:id,name,business_branch_id',
                'items:id,magistral_inventory_count_id,article_id,lot,expiration_date,system_stock,real_stock,difference,status',
                'items.article:id,code,name,sub_category,unit_id',
                'items.article.unit:id,name,symbol',
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ])
            ->leftJoin('business_branches as branch', 'branch.id', '=', 'magistral_inventory_counts.business_branch_id')
            ->leftJoin('warehouses as warehouse', 'warehouse.id', '=', 'magistral_inventory_counts.warehouse_id')
            ->leftJoin('users as creator', 'creator.id', '=', 'magistral_inventory_counts.created_by')
            ->leftJoin('users as updater', 'updater.id', '=', 'magistral_inventory_counts.updated_by');
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $id = $body['id'] ?? null;
        $code = trim((string)($body['code'] ?? ''));
        if ($code === '') $code = $this->nextCode();

        $exists = MagistralInventoryCount::whereRaw('LOWER(code) = ?', [mb_strtolower($code)])
            ->when($id, fn($query) => $query->where('id', '!=', $id))
            ->exists();
        if ($exists) throw new \Exception('Ya existe un inventario magistral con este codigo');

        $warehouse = MagistralesWarehouse::warehouse();
        $warehouseId = (int) $warehouse->id;
        $branchId = $warehouse->business_branch_id ? (int) $warehouse->business_branch_id : null;

        $this->parsedItems = $this->parseItems(is_array($request->items) ? $request->items : [], $warehouseId);
        if (count($this->parsedItems) === 0) {
            throw new \Exception('Debes agregar al menos un articulo al inventario');
        }

        if (!$id) {
            $body['created_by'] = Auth::id();
            $body['status'] = true;
        }

        $body['updated_by'] = Auth::id();
        $body['code'] = $code;
        $body['business_branch_id'] = $branchId;
        $body['warehouse_id'] = $warehouseId;
        $body['count_date'] = $this->normalizeDate($body['count_date'] ?? now()->toDateString());
        $body['observations'] = trim((string)($body['observations'] ?? '')) ?: null;

        unset($body['items']);

        return $body;
    }

    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        DB::beginTransaction();
        try {
            MagistralInventoryCountItem::where('magistral_inventory_count_id', $jpa->id)->delete();

            foreach ($this->parsedItems as $item) {
                MagistralInventoryCountItem::create([
                    'magistral_inventory_count_id' => $jpa->id,
                    'article_id' => $item['article_id'],
                    'lot' => $item['lot'],
                    'expiration_date' => $item['expiration_date'],
                    'system_stock' => $item['system_stock'],
                    'real_stock' => $item['real_stock'],
                    'difference' => $item['difference'],
                    'status' => true,
                ]);
            }

            DB::commit();
            return $jpa->fresh(['branch', 'warehouse', 'items.article.unit', 'creator', 'updater']);
        } catch (\Throwable $th) {
            DB::rollBack();
            throw $th;
        }
    }

    public function stock(Request $request)
    {
        $response = new Response();

        try {
            $articleId = $this->toNullableInt($request->input('article_id'));
            if (!$articleId) throw new \Exception('El articulo es obligatorio');

            Article::query()
                ->when(Schema::hasColumn('articles', 'module_scope'), fn($query) => $query->where('module_scope', 'magistrales'))
                ->findOrFail($articleId);

            $warehouseId = MagistralesWarehouse::id();

            $lot = trim((string)($request->input('lot') ?? '')) ?: null;
            $expirationDate = $this->normalizeDate($request->input('expiration_date'));

            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = [
                'stock' => MagistralesStock::stock($articleId, $warehouseId, $lot, $expirationDate),
            ];
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    private function parseItems(array $items, ?int $warehouseId): array
    {
        $parsed = [];

        foreach ($items as $index => $item) {
            if (!is_array($item)) continue;

            $articleId = $this->toNullableInt($item['article_id'] ?? null);
            if (!$articleId) continue;

            Article::query()
                ->when(Schema::hasColumn('articles', 'module_scope'), fn($query) => $query->where('module_scope', 'magistrales'))
                ->findOrFail($articleId);

            $lot = trim((string)($item['lot'] ?? '')) ?: null;
            $expirationDate = $this->normalizeDate($item['expiration_date'] ?? null);
            $systemStock = MagistralesStock::stock($articleId, $warehouseId, $lot, $expirationDate);
            $realStock = $this->toNullableDecimal($item['real_stock'] ?? null) ?? 0;

            if ($realStock < 0) throw new \Exception('El stock real del item ' . ($index + 1) . ' no puede ser negativo');

            $parsed[] = [
                'article_id' => $articleId,
                'lot' => $lot,
                'expiration_date' => $expirationDate,
                'system_stock' => $systemStock,
                'real_stock' => $realStock,
                'difference' => round($realStock - $systemStock, 3),
            ];
        }

        return $parsed;
    }

    private function nextCode(): string
    {
        $next = 1;
        $latest = MagistralInventoryCount::query()->latest('id')->value('code');
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) $next = ((int)$matches[1]) + 1;
        return 'INV-MAG-' . str_pad((string)$next, 6, '0', STR_PAD_LEFT);
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
