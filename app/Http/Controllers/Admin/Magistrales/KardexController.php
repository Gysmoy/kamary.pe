<?php

namespace App\Http\Controllers\Admin\Magistrales;

use App\Http\Classes\dxResponse;
use App\Http\Controllers\BasicController;
use App\Support\MagistralesWarehouse;
use App\Support\MagistralesStock;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use SoDe\Extend\Response;

class KardexController extends BasicController
{
    public $reactView = 'Admin/Kardex';

    public function setReactViewProperties(Request $request)
    {
        return [
            'moduleTitle' => 'Magistrales - Kardex',
            'requiredPermission' => ['magistrales-kardex', 'magistrales-warehouse'],
            'moduleScope' => 'magistrales',
            'fixedWarehouse' => MagistralesWarehouse::summary(),
        ];
    }

    public function paginate(Request $request): HttpResponse|ResponseFactory
    {
        $response = new dxResponse();

        try {
            $articleId = $this->toNullableInt($request->article_id ?? null);
            $warehouseId = $this->toNullableInt($request->warehouse_id ?? null);

            $rows = MagistralesStock::valuationRows($articleId, $warehouseId);

            if ($request->filter) {
                $needle = mb_strtolower(json_encode($request->filter));
                $rows = $rows->filter(function ($row) use ($needle) {
                    return str_contains(mb_strtolower((string)$row['article_code']), trim($needle, '"[]'))
                        || str_contains(mb_strtolower((string)$row['article_name']), trim($needle, '"[]'));
                })->values();
            }

            $sort = is_array($request->sort) ? $request->sort : [];
            if (count($sort) > 0) {
                foreach (array_reverse($sort) as $sorting) {
                    $selector = $sorting['selector'] ?? 'article_name';
                    $desc = (bool)($sorting['desc'] ?? false);
                    $rows = $desc ? $rows->sortByDesc($selector)->values() : $rows->sortBy($selector)->values();
                }
            }

            $totalCount = $rows->count();
            if (!$request->isLoadingAll) {
                $rows = $rows->slice((int)($request->skip ?? 0), (int)($request->take ?? 25))->values();
            }

            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = $rows;
            $response->totalCount = $totalCount;
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function movements(Request $request): HttpResponse|ResponseFactory
    {
        $response = new Response();

        try {
            $articleId = $this->toNullableInt($request->article_id ?? null);
            if (!$articleId) throw new \Exception('El articulo es obligatorio');

            $warehouseId = $this->toNullableInt($request->warehouse_id ?? null) ?: MagistralesWarehouse::id();

            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = MagistralesStock::movementRows($articleId, $warehouseId);
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    private function toNullableInt($value): ?int
    {
        if ($value === null) return null;
        $text = trim((string)$value);
        if ($text === '') return null;
        if (!ctype_digit(ltrim($text, '+'))) throw new \Exception("Valor entero invalido: {$value}");
        return (int)$text;
    }
}
