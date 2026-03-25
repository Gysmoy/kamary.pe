<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\ActivePrinciple;
use App\Models\Article;
use App\Models\ArticlePresentation;
use App\Models\Laboratory;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use SoDe\Extend\Response;

class ArticleController extends BasicController
{
    public $model = Article::class;
    public $reactView = 'Admin/Articles';
    public $prefix4filter = 'articles';

    private array $presentationsPayload = [];

    public function setPaginationInstance(string $model)
    {
        return $model::select('articles.*')
            ->with([
                'laboratory:id,name,code',
                'activePrinciple:id,laboratory_id,name',
                'unit:id,name,symbol',
                'presentations:id,article_id,name,units,price,sort_order,status',
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ])
            ->join('users as creator', 'creator.id', '=', 'articles.created_by')
            ->join('users as updater', 'updater.id', '=', 'articles.updated_by');
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $userId = Auth::id();
        $id = $body['id'] ?? null;

        $code = trim((string)($body['code'] ?? ''));
        $name = trim((string)($body['name'] ?? ''));
        $laboratoryId = $body['laboratory_id'] ?? null;
        $activePrincipleId = $body['active_principle_id'] ?? null;
        $unitId = $body['unit_id'] ?? null;

        if ($code === '') throw new \Exception('El codigo de articulo es obligatorio');
        if ($name === '') throw new \Exception('El nombre del articulo es obligatorio');
        if (!$laboratoryId) throw new \Exception('El laboratorio es obligatorio');
        if (!$activePrincipleId) throw new \Exception('El principio activo es obligatorio');
        if (!$unitId) throw new \Exception('La unidad de medida es obligatoria');

        $existsCode = Article::whereRaw('LOWER(code) = ?', [mb_strtolower($code)])
            ->when($id, fn($query) => $query->where('id', '!=', $id))
            ->exists();
        if ($existsCode) throw new \Exception('El codigo de articulo ya existe');

        Laboratory::findOrFail($laboratoryId);
        Unit::findOrFail($unitId);

        $principle = ActivePrinciple::findOrFail($activePrincipleId);
        if ((int)$principle->laboratory_id !== (int)$laboratoryId) {
            throw new \Exception('El principio activo no pertenece al laboratorio seleccionado');
        }

        if (!isset($body['id']) || !$body['id']) {
            $body['created_by'] = $userId;
            $body['status'] = true;
        }
        $body['updated_by'] = $userId;

        $body['code'] = $code;
        $body['name'] = $name;
        $body['notes'] = isset($body['notes']) ? trim((string)$body['notes']) : null;
        $body['margin_rule'] = $this->toBoolean($body['margin_rule'] ?? false);
        $body['igv_rule'] = $this->toBoolean($body['igv_rule'] ?? false);
        $body['units_per_article'] = (int)($body['units_per_article'] ?? 1);
        if ($body['units_per_article'] <= 0) {
            throw new \Exception('Unidades por articulo debe ser mayor a 0');
        }

        $body['volume'] = $this->toNullableDecimal($body['volume'] ?? null);
        $body['unit_weight'] = $this->toNullableDecimal($body['unit_weight'] ?? null);
        if (!is_null($body['volume']) && $body['volume'] <= 0) {
            throw new \Exception('El volumen debe ser mayor a 0');
        }
        if (!is_null($body['unit_weight']) && $body['unit_weight'] <= 0) {
            throw new \Exception('El peso unitario debe ser mayor a 0');
        }

        $this->presentationsPayload = is_array($request->presentations) ? $request->presentations : [];
        unset($body['presentations']);

        return $body;
    }

    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        DB::beginTransaction();
        try {
            ArticlePresentation::where('article_id', $jpa->id)->delete();

            $inserted = 0;
            foreach ($this->presentationsPayload as $index => $presentation) {
                if (!is_array($presentation)) continue;

                $name = trim((string)($presentation['name'] ?? ''));
                $units = $this->toNullableDecimal($presentation['units'] ?? null);
                $price = $this->toNullableDecimal($presentation['price'] ?? null);

                if ($name === '' && is_null($units) && is_null($price)) continue;
                if ($name === '') throw new \Exception('Cada presentacion debe tener nombre');
                if (is_null($units) || $units <= 0) throw new \Exception("La presentacion {$name} debe tener unidades mayores a 0");
                if (is_null($price) || $price < 0) throw new \Exception("La presentacion {$name} debe tener un precio valido");

                ArticlePresentation::create([
                    'article_id' => $jpa->id,
                    'name' => $name,
                    'units' => $units,
                    'price' => $price,
                    'sort_order' => $index,
                    'status' => true,
                ]);
                $inserted++;
            }

            if ($inserted === 0) {
                throw new \Exception('Debes agregar al menos una presentacion por articulo');
            }

            DB::commit();
        } catch (\Throwable $th) {
            DB::rollBack();
            throw $th;
        }
    }

    public function boolean(Request $request)
    {
        $response = new Response();
        try {
            $data = [];
            $data[$request->field] = $request->value;
            $data['updated_by'] = Auth::id();

            $this->model::where($this->identifier, $request->id)->update($data);

            $response->status = 200;
            $response->message = 'Operacion correcta';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function status(Request $request)
    {
        $response = new Response();
        try {
            $this->model::where($this->identifier, $request->id)->update([
                'status' => $request->status ? 0 : 1,
                'updated_by' => Auth::id(),
            ]);

            $response->status = 200;
            $response->message = 'Operacion correcta';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function principles(Request $request, string $laboratoryId): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = ActivePrinciple::where('laboratory_id', $laboratoryId)
                ->whereNotNull('status')
                ->orderBy('name')
                ->get(['id', 'laboratory_id', 'name', 'status']);
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    private function toBoolean($value): bool
    {
        if (is_bool($value)) return $value;
        if (is_numeric($value)) return (int)$value !== 0;

        $normalized = mb_strtolower(trim((string)$value));
        return in_array($normalized, ['1', 'true', 'si', 'sÃ­', 'yes', 'y', 'activo', 'activa', 'on'], true);
    }

    private function toNullableDecimal($value): ?float
    {
        if ($value === null) return null;
        $text = trim((string)$value);
        if ($text === '') return null;
        if (!is_numeric($text)) {
            throw new \Exception("Valor numerico invalido: {$value}");
        }
        return (float)$text;
    }
}
