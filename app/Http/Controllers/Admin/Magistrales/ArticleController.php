<?php

namespace App\Http\Controllers\Admin\Magistrales;

use App\Http\Controllers\Admin\ArticleController as BaseArticleController;
use App\Models\Article;
use App\Support\MagistralesInputWarehouse;
use App\Support\MagistralesStock;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use SoDe\Extend\Response;

class ArticleController extends BaseArticleController
{
    protected string $moduleScope = 'magistrales';

    public function setPaginationInstance(string $model)
    {
        $query = parent::setPaginationInstance($model);
        $warehouseId = MagistralesInputWarehouse::idOrNull();

        if ($warehouseId && Schema::hasTable('magistral_income_items') && Schema::hasTable('magistral_incomes')) {
            $query->selectRaw(
                '(
                    SELECT COALESCE(SUM(item.quantity * item.price_without_igv) / NULLIF(SUM(item.quantity), 0), 0)
                    FROM magistral_income_items item
                    INNER JOIN magistral_incomes income ON income.id = item.magistral_income_id
                    WHERE item.article_id = articles.id
                      AND income.warehouse_id = ?
                      AND income.status IS NOT NULL
                      AND item.status IS NOT NULL
                ) as magistral_input_cost',
                [$warehouseId]
            );
        } else {
            $query->addSelect(DB::raw('0 as magistral_input_cost'));
        }

        return $query;
    }

    public function setReactViewProperties(Request $request)
    {
        return [
            'moduleScope' => 'magistrales',
            'moduleTitle' => 'Magistrales - Articulos',
            'requiredPermission' => ['magistrales-articles', 'magistrales-products'],
            'inputWarehouse' => MagistralesInputWarehouse::summary(),
        ];
    }

    public function stockByWarehouse(Request $request, string $articleId): HttpResponse|ResponseFactory
    {
        $response = new Response();

        try {
            $article = Article::with([
                'presentations' => function ($query) {
                    $query->where('status', 1)->orderBy('sort_order')->orderBy('id');
                },
            ])
                ->when(Schema::hasColumn('articles', 'module_scope'), fn($query) => $query->where('module_scope', 'magistrales'))
                ->findOrFail($articleId);

            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = [
                'article' => [
                    'id' => $article->id,
                    'code' => $article->code,
                    'name' => $article->name,
                    'presentations' => $article->presentations->map(fn($presentation) => [
                        'id' => $presentation->id,
                        'name' => $presentation->name,
                        'units' => (float)$presentation->units,
                        'price' => (float)$presentation->price,
                    ])->values(),
                ],
                'warehouses' => MagistralesStock::stockByWarehouseRows((int)$article->id),
            ];
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }
}
