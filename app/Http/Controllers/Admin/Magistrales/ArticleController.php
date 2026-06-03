<?php

namespace App\Http\Controllers\Admin\Magistrales;

use App\Http\Controllers\Admin\ArticleController as BaseArticleController;
use App\Models\Article;
use App\Support\MagistralesStock;
use App\Support\MagistralesWarehouse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Schema;
use SoDe\Extend\Response;

class ArticleController extends BaseArticleController
{
    protected string $moduleScope = 'magistrales';

    public function setReactViewProperties(Request $request)
    {
        return [
            'moduleScope' => 'magistrales',
            'moduleTitle' => 'Magistrales - Articulos',
            'requiredPermission' => ['magistrales-articles', 'magistrales-products'],
        ];
    }

    public function catalog(Request $request): HttpResponse|ResponseFactory
    {
        $response = new Response();

        try {
            $warehouseId = MagistralesWarehouse::id();

            $rows = Article::query()
                ->select([
                    'id',
                    'code',
                    'name',
                    'sale_price',
                    'status',
                ])
                ->when(Schema::hasColumn('articles', 'module_scope'), fn($query) => $query->where('module_scope', 'magistrales'))
                ->whereNotNull('status')
                ->orderBy('name')
                ->get()
                ->map(function (Article $article) use ($warehouseId) {
                    $warehouseRows = MagistralesStock::stockByWarehouseRows((int)$article->id)
                        ->map(fn(array $row) => [
                            'id' => (int)$row['id'],
                            'label' => trim(($row['branch_name'] ?: $row['business_name']) . ' - ' . $row['name']),
                            'stock' => round((float)$row['stock'], 3),
                        ])
                        ->values();

                    return [
                        'id' => (int)$article->id,
                        'code' => $article->code,
                        'name' => $article->name,
                        'sale_price' => round((float)($article->sale_price ?? 0), 2),
                        'status' => $article->status,
                        'current_stock' => round(MagistralesStock::stock((int)$article->id, $warehouseId), 3),
                        'warehouse_stock_rows' => $warehouseRows,
                    ];
                })
                ->values();

            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = $rows;
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
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
