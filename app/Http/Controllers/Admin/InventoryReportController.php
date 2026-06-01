<?php

namespace App\Http\Controllers\Admin;

use App\Models\Article;
use App\Services\StockService;
use App\Support\BusinessScope;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InventoryReportController extends ReportController
{
    public $model = Article::class;
    public $reactView = 'Admin/InventoryReport';
    public $ignoreStatusFilter = true;

    public function setReactViewProperties(Request $request)
    {
        return ['requiredPermission' => 'inventory'];
    }

    public function setPaginationInstance(string $model)
    {
        $stockService = app(StockService::class);
        $entryMovements = $stockService->incomingKardexMovementsQuery();

        $exitMovements = DB::table('exit_note_items as movement_item')
            ->join('exit_notes as movement_note', 'movement_note.id', '=', 'movement_item.exit_note_id')
            ->join('articles as article', 'article.id', '=', 'movement_item.article_id')
            ->leftJoin('laboratories as laboratory', 'laboratory.id', '=', 'article.laboratory_id')
            ->leftJoin('active_principles as active_principle', 'active_principle.id', '=', 'article.active_principle_id')
            ->leftJoin('units as unit', 'unit.id', '=', 'article.unit_id')
            ->leftJoin('warehouses as warehouse', function ($join) {
                $join->on('warehouse.id', '=', DB::raw('COALESCE(movement_item.warehouse_id, movement_note.warehouse_id)'));
            })
            ->leftJoin('businesses as business', 'business.id', '=', 'movement_note.business_id')
            ->leftJoin('business_branches as branch', 'branch.id', '=', 'movement_note.business_branch_id')
            ->where('movement_note.status', 1)
            ->where('movement_item.status', 1)
            ->selectRaw("
                CONCAT('exit-', movement_item.id) as id,
                movement_note.id as note_id,
                movement_note.created_at as movement_date,
                'Salida' as movement_type,
                movement_note.business_id as business_id,
                COALESCE(business.name, '') as business_name,
                movement_note.business_branch_id as business_branch_id,
                COALESCE(branch.name, '') as branch_name,
                COALESCE(movement_item.warehouse_id, movement_note.warehouse_id) as warehouse_id,
                article.id as article_id,
                COALESCE(article.code, '') as article_code,
                COALESCE(article.name, '') as article_name,
                article.laboratory_id as laboratory_id,
                COALESCE(laboratory.name, '') as laboratory_name,
                COALESCE(active_principle.name, '') as principle_name,
                COALESCE(unit.symbol, unit.name, '') as unit_label,
                COALESCE(warehouse.name, '') as warehouse_name,
                COALESCE(movement_item.batch_code, '') as batch_code,
                COALESCE(movement_item.location, '') as location,
                '' as destination_location,
                0 as quantity_in,
                movement_item.quantity as quantity_out,
                movement_item.total as total
            ");

        $movements = DB::query()
            ->fromSub($entryMovements->unionAll($exitMovements), 'inventory_movements')
            ->selectRaw("
                CONCAT(
                    COALESCE(business_id, 0), '-', COALESCE(business_branch_id, 0), '-', article_id, '-',
                    COALESCE(warehouse_id, 0), '-', COALESCE(batch_code, ''), '-', COALESCE(location, '')
                ) as id,
                business_id,
                business_name,
                business_branch_id,
                branch_name,
                warehouse_id,
                article_id,
                article_code,
                article_name,
                laboratory_id,
                laboratory_name,
                principle_name,
                unit_label,
                warehouse_name,
                batch_code,
                location,
                ROUND(SUM(quantity_in), 3) as qty_in,
                ROUND(SUM(quantity_out), 3) as qty_out,
                ROUND(SUM(quantity_in) - SUM(quantity_out), 3) as stock,
                ROUND(
                    CASE
                        WHEN SUM(quantity_in) > 0 THEN SUM(CASE WHEN quantity_in > 0 THEN total ELSE 0 END) / SUM(quantity_in)
                        ELSE 0
                    END,
                    2
                ) as reference_cost_unit,
                ROUND(
                    (SUM(quantity_in) - SUM(quantity_out)) *
                    CASE
                        WHEN SUM(quantity_in) > 0 THEN SUM(CASE WHEN quantity_in > 0 THEN total ELSE 0 END) / SUM(quantity_in)
                        ELSE 0
                    END,
                    2
                ) as total_value,
                CASE
                    WHEN (SUM(quantity_in) - SUM(quantity_out)) > 0 THEN 'Con stock'
                    ELSE 'Sin stock'
                END as stock_state
            ")
            ->groupBy([
                'business_id',
                'business_name',
                'business_branch_id',
                'branch_name',
                'warehouse_id',
                'article_id',
                'article_code',
                'article_name',
                'laboratory_id',
                'laboratory_name',
                'principle_name',
                'unit_label',
                'warehouse_name',
                'batch_code',
                'location',
            ]);

        $kamaryBusiness = BusinessScope::businessForKey(BusinessScope::KAMARY_PERU);
        $warehouseIds = $this->toNullableIntList(request('warehouse_ids'));
        $warehouseId = $this->toNullableInt(request('warehouse_id'));
        if ($warehouseId) $warehouseIds[] = $warehouseId;
        $warehouseIds = array_values(array_unique($warehouseIds));
        $laboratoryId = trim((string) request('laboratory_id', ''));
        $articleId = trim((string) request('article_id', ''));

        if ($kamaryBusiness) {
            $movements->where('business_id', $kamaryBusiness->id);
        } else {
            $movements->whereRaw('1 = 0');
        }
        if (count($warehouseIds) > 0) $movements->whereIn('warehouse_id', $warehouseIds);
        if ($laboratoryId !== '') $movements->where('laboratory_id', $laboratoryId);
        if ($articleId !== '') $movements->where('article_id', $articleId);

        return $movements;
    }

    private function toNullableInt($value): ?int
    {
        if ($value === null) return null;
        $text = trim((string)$value);
        if ($text === '') return null;
        if (!ctype_digit(ltrim($text, '+'))) throw new \Exception("Valor entero invalido: {$value}");
        return (int)$text;
    }

    private function toNullableIntList($value): array
    {
        if ($value === null) return [];

        $parts = is_array($value)
            ? $value
            : preg_split('/[,\s]+/', trim((string)$value), -1, PREG_SPLIT_NO_EMPTY);

        $ids = [];
        foreach ($parts ?: [] as $part) {
            $id = $this->toNullableInt($part);
            if ($id) $ids[] = $id;
        }

        return array_values(array_unique($ids));
    }
}
