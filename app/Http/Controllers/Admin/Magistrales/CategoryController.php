<?php

namespace App\Http\Controllers\Admin\Magistrales;

use App\Http\Controllers\BasicController;
use App\Models\Article;
use App\Models\MagistralCategory;
use App\Models\MagistralSubcategory;
use App\Support\MagistralesWarehouse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use SoDe\Extend\Response;
 
class CategoryController extends BasicController
{
    public $model = MagistralCategory::class;
    public $reactView = 'Admin/Magistrales/Categories';
    public $prefix4filter = 'magistral_categories';

    public function setReactViewProperties(Request $request)
    {
        return [
            'moduleTitle' => 'Magistrales - Categoria',
            'requiredPermission' => 'magistrales-category',
            'fixedWarehouse' => MagistralesWarehouse::summary(),
        ];
    }

    public function setPaginationInstance(string $model)
    {
        return $model::select('magistral_categories.*')
            ->with([
                'warehouse:id,name',
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ])
            ->leftJoin('warehouses as warehouse', 'warehouse.id', '=', 'magistral_categories.warehouse_id')
            ->leftJoin('users as creator', 'creator.id', '=', 'magistral_categories.created_by')
            ->leftJoin('users as updater', 'updater.id', '=', 'magistral_categories.updated_by')
            ->whereIn('magistral_categories.description', MagistralCategory::ALLOWED_DESCRIPTIONS);
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $id = $body['id'] ?? null;
        $code = trim((string)($body['code'] ?? ''));
        $description = trim((string)($body['description'] ?? ''));

        if ($code === '') throw new \Exception('El codigo es obligatorio');
        if ($description === '') throw new \Exception('La descripcion es obligatoria');
        $description = $this->canonicalAllowedDescription($description);
        if (!$description) {
            throw new \Exception('Solo se permiten estas categorias: ' . implode(', ', MagistralCategory::ALLOWED_DESCRIPTIONS));
        }

        $exists = MagistralCategory::whereRaw('LOWER(code) = ?', [mb_strtolower($code)])
            ->when($id, fn($query) => $query->where('id', '!=', $id))
            ->exists();
        if ($exists) throw new \Exception('Ya existe una categoria magistral con este codigo');

        if (!$id) {
            $body['created_by'] = Auth::id();
            $body['status'] = array_key_exists('status', $body)
                ? $this->toBoolean($body['status'])
                : true;
        } elseif (array_key_exists('status', $body)) {
            $body['status'] = $this->toBoolean($body['status']);
        }

        $body['updated_by'] = Auth::id();
        $body['code'] = $code;
        $body['description'] = $description;
        $body['warehouse_id'] = MagistralesWarehouse::id();
        $body['sale_material'] = $this->toBoolean($body['sale_material'] ?? false);

        return $body;
    }

    public function subcategories(Request $request, string $categoryId): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            MagistralCategory::findOrFail($categoryId);

            $articleCountsQuery = Article::where('magistral_category_id', $categoryId)
                ->whereNotNull('sub_category')
                ->where('sub_category', '!=', '');

            if (Schema::hasColumn('articles', 'module_scope')) {
                $articleCountsQuery->where('module_scope', 'magistrales');
            }

            $articleCounts = $articleCountsQuery
                ->selectRaw('LOWER(TRIM(sub_category)) as subcategory_key, COUNT(*) as total')
                ->groupBy('subcategory_key')
                ->pluck('total', 'subcategory_key');

            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = MagistralSubcategory::where('magistral_category_id', $categoryId)
                ->whereNotNull('status')
                ->orderBy('description')
                ->get()
                ->map(function (MagistralSubcategory $subcategory) use ($articleCounts) {
                    $key = mb_strtolower(trim($subcategory->description));
                    return [
                        'id' => $subcategory->id,
                        'magistral_category_id' => $subcategory->magistral_category_id,
                        'description' => $subcategory->description,
                        'articles_count' => (int)($articleCounts[$key] ?? 0),
                        'status' => $subcategory->status,
                    ];
                })
                ->values();
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function saveSubcategory(Request $request, string $categoryId): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            MagistralCategory::findOrFail($categoryId);

            $id = $request->id;
            $description = trim((string)($request->description ?? ''));
            if ($description === '') throw new \Exception('La descripcion es obligatoria');

            $exists = MagistralSubcategory::where('magistral_category_id', $categoryId)
                ->whereRaw('LOWER(description) = ?', [mb_strtolower($description)])
                ->when($id, fn($query) => $query->where('id', '!=', $id))
                ->exists();
            if ($exists) throw new \Exception('Ya existe una subcategoria con esta descripcion');

            $data = [
                'magistral_category_id' => $categoryId,
                'description' => $description,
                'status' => $this->toBoolean($request->status ?? true),
                'updated_by' => Auth::id(),
            ];

            $subcategory = $id
                ? MagistralSubcategory::where('magistral_category_id', $categoryId)->where('id', $id)->first()
                : null;
            if (!$subcategory) {
                $data['created_by'] = Auth::id();
                $subcategory = MagistralSubcategory::create($data);
            } else {
                $subcategory->update($data);
            }

            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = $subcategory;
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function statusSubcategory(Request $request, string $categoryId): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            $subcategory = MagistralSubcategory::where('magistral_category_id', $categoryId)
                ->where('id', $request->id)
                ->firstOrFail();

            $subcategory->update([
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

    public function deleteSubcategory(Request $request, string $categoryId, string $id): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            $updated = MagistralSubcategory::where('magistral_category_id', $categoryId)
                ->where('id', $id)
                ->delete();
            if (!$updated) throw new \Exception('No se encontro la subcategoria');

            $response->status = 200;
            $response->message = 'Operacion correcta';
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

    private function toBoolean($value): bool
    {
        if (is_bool($value)) return $value;
        if (is_numeric($value)) return (int)$value !== 0;
        return in_array(mb_strtolower(trim((string)$value)), ['1', 'true', 'si', 'yes', 'on'], true);
    }

    private function canonicalAllowedDescription(string $description): ?string
    {
        $normalized = mb_strtolower(trim($description));

        foreach (MagistralCategory::ALLOWED_DESCRIPTIONS as $allowed) {
            if (mb_strtolower($allowed) === $normalized) {
                return $allowed;
            }
        }

        return null;
    }
}
