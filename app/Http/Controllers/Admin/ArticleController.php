<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\ActivePrinciple;
use App\Models\Article;
use App\Models\ArticlePresentation;
use App\Models\Laboratory;
use App\Models\Unit;
use App\Models\Warehouse;
use App\Services\StockService;
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
            ->distinct()
            ->with([
                'laboratory:id,name,code',
                'activePrinciple:id,laboratory_id,name',
                'unit:id,name,symbol',
                'presentations:id,article_id,name,units,price,sort_order,status',
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ])
            ->join('units as unit', 'unit.id', '=', 'articles.unit_id')
            ->join('active_principles as active_principle', 'active_principle.id', '=', 'articles.active_principle_id')
            ->join('laboratories as laboratory', 'laboratory.id', '=', 'articles.laboratory_id')
            ->join('users as creator', 'creator.id', '=', 'articles.created_by')
            ->join('users as updater', 'updater.id', '=', 'articles.updated_by');
    }

    public function import(Request $request): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            $rows = $request->rows;
            $mapping = $request->mapping ?? [];
            $userId = Auth::id();

            if (!is_array($rows) || count($rows) === 0) {
                throw new \Exception('No hay registros para importar');
            }

            $codeKey = $mapping['code'] ?? null;
            if (!$codeKey) {
                throw new \Exception('Debes mapear el campo codigo');
            }

            $nameKey = $mapping['name'] ?? null;
            $laboratoryKey = $mapping['laboratory'] ?? null;
            $principleKey = $mapping['active_principle'] ?? null;
            $unitKey = $mapping['unit'] ?? null;
            $statusKey = $mapping['status'] ?? null;

            $created = 0;
            $updated = 0;
            $skipped = 0;
            $errors = [];

            DB::beginTransaction();

            $existingArticles = Article::whereNotNull('code')->get(['id', 'code']);
            $articleByCode = [];
            foreach ($existingArticles as $item) {
                $normalizedCode = $this->normalizeText($item->code);
                if ($normalizedCode !== '') $articleByCode[$normalizedCode] = $item->id;
            }

            $existingLabs = Laboratory::whereNotNull('name')->get(['id', 'name', 'code']);
            $labByName = [];
            $labCodeTaken = [];
            foreach ($existingLabs as $lab) {
                $normalizedName = $this->normalizeText($lab->name);
                $normalizedCode = $this->normalizeText($lab->code);
                if ($normalizedName !== '') $labByName[$normalizedName] = $lab->id;
                if ($normalizedCode !== '') $labCodeTaken[$normalizedCode] = true;
            }

            $existingUnits = Unit::all(['id', 'name', 'symbol']);
            $unitByName = [];
            $unitBySymbol = [];
            foreach ($existingUnits as $unit) {
                $normalizedName = $this->normalizeText($unit->name);
                $normalizedSymbol = $this->normalizeText($unit->symbol);
                if ($normalizedName !== '') $unitByName[$normalizedName] = $unit->id;
                if ($normalizedSymbol !== '') $unitBySymbol[$normalizedSymbol] = $unit->id;
            }

            $existingPrinciples = ActivePrinciple::all(['id', 'laboratory_id', 'name']);
            $principleByLabAndName = [];
            foreach ($existingPrinciples as $principle) {
                $normalizedName = $this->normalizeText($principle->name);
                if ($normalizedName === '') continue;
                $key = $principle->laboratory_id . ':' . $normalizedName;
                $principleByLabAndName[$key] = $principle->id;
            }

            foreach ($rows as $idx => $row) {
                if (!is_array($row)) {
                    $skipped++;
                    $errors[] = "Fila " . ($idx + 1) . ": formato invalido";
                    continue;
                }

                $code = trim((string)($row[$codeKey] ?? ''));
                if ($code === '') {
                    $skipped++;
                    $errors[] = "Fila " . ($idx + 1) . ": codigo vacio";
                    continue;
                }

                $name = $nameKey ? trim((string)($row[$nameKey] ?? '')) : '';
                if ($name === '') $name = $code;

                $laboratoryName = $laboratoryKey ? trim((string)($row[$laboratoryKey] ?? '')) : '';
                if ($laboratoryName === '') $laboratoryName = 'LABORATORIO GENERAL';

                $principleName = $principleKey ? trim((string)($row[$principleKey] ?? '')) : '';
                if ($principleName === '') $principleName = 'PRINCIPIO GENERAL';

                $unitName = $unitKey ? trim((string)($row[$unitKey] ?? '')) : '';
                if ($unitName === '') $unitName = 'UNIDAD';

                $status = true;
                if ($statusKey && array_key_exists($statusKey, $row)) {
                    $status = $this->toBoolean($row[$statusKey]);
                }

                $normalizedLabName = $this->normalizeText($laboratoryName);
                $laboratoryId = $labByName[$normalizedLabName] ?? null;
                if (!$laboratoryId) {
                    $newLabCode = $this->generateLaboratoryCode($laboratoryName, $labCodeTaken);
                    $newLab = Laboratory::create([
                        'name' => $laboratoryName,
                        'code' => $newLabCode,
                        'status' => true,
                        'created_by' => $userId,
                        'updated_by' => $userId,
                    ]);
                    $laboratoryId = $newLab->id;
                    $labByName[$normalizedLabName] = $laboratoryId;
                    $labCodeTaken[$this->normalizeText($newLabCode)] = true;
                }

                $normalizedPrincipleName = $this->normalizeText($principleName);
                $principleLookup = $laboratoryId . ':' . $normalizedPrincipleName;
                $activePrincipleId = $principleByLabAndName[$principleLookup] ?? null;
                if (!$activePrincipleId) {
                    $newPrinciple = ActivePrinciple::create([
                        'laboratory_id' => $laboratoryId,
                        'name' => $principleName,
                        'status' => true,
                        'created_by' => $userId,
                        'updated_by' => $userId,
                    ]);
                    $activePrincipleId = $newPrinciple->id;
                    $principleByLabAndName[$principleLookup] = $activePrincipleId;
                }

                $normalizedUnitName = $this->normalizeText($unitName);
                $unitId = $unitByName[$normalizedUnitName] ?? null;
                if (!$unitId) {
                    $unitId = $unitBySymbol[$normalizedUnitName] ?? null;
                }
                if (!$unitId) {
                    $newUnit = Unit::create([
                        'name' => $unitName,
                        'symbol' => $unitName,
                        'status' => true,
                        'created_by' => $userId,
                        'updated_by' => $userId,
                    ]);
                    $unitId = $newUnit->id;
                    $unitByName[$normalizedUnitName] = $unitId;
                    $unitBySymbol[$normalizedUnitName] = $unitId;
                } else {
                    $unitByName[$normalizedUnitName] = $unitId;
                }

                $normalizedCode = $this->normalizeText($code);
                $articleId = $articleByCode[$normalizedCode] ?? null;

                if ($articleId) {
                    Article::where('id', $articleId)->update([
                        'code' => $code,
                        'name' => $name,
                        'laboratory_id' => $laboratoryId,
                        'active_principle_id' => $activePrincipleId,
                        'unit_id' => $unitId,
                        'status' => $status,
                        'updated_by' => $userId,
                    ]);
                    $this->ensureDefaultPresentation($articleId);
                    $updated++;
                } else {
                    $newArticle = Article::create([
                        'code' => $code,
                        'name' => $name,
                        'laboratory_id' => $laboratoryId,
                        'active_principle_id' => $activePrincipleId,
                        'unit_id' => $unitId,
                        'volume' => null,
                        'status' => $status,
                        'margin_rule' => false,
                        'igv_rule' => false,
                        'units_per_article' => 1,
                        'unit_weight' => null,
                        'notes' => null,
                        'created_by' => $userId,
                        'updated_by' => $userId,
                    ]);
                    $articleByCode[$normalizedCode] = $newArticle->id;
                    $this->ensureDefaultPresentation($newArticle->id);
                    $created++;
                }
            }

            DB::commit();

            $response->status = 200;
            $response->message = 'Importacion masiva completada';
            $response->data = [
                'created' => $created,
                'updated' => $updated,
                'skipped' => $skipped,
                'errors' => $errors,
            ];
        } catch (\Throwable $th) {
            DB::rollBack();
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
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

    public function stockByWarehouse(Request $request, string $articleId): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            $article = Article::with([
                'presentations' => function ($query) {
                    $query->where('status', 1)->orderBy('sort_order')->orderBy('id');
                }
            ])->findOrFail($articleId);

            $entrySubquery = app(StockService::class)->incomingWarehouseTotalsForArticleSubquery((int)$article->id);

            $exitSubquery = DB::table('exit_note_items as exit_item')
                ->join('exit_notes as exit_note', 'exit_note.id', '=', 'exit_item.exit_note_id')
                ->where('exit_note.status', 1)
                ->where('exit_item.status', 1)
                ->where('exit_item.article_id', $article->id)
                ->groupBy('exit_item.warehouse_id')
                ->selectRaw('exit_item.warehouse_id, COALESCE(SUM(exit_item.quantity), 0) as qty_out');

            $stockByWarehouse = Warehouse::query()
                ->selectRaw('
                    warehouses.id,
                    warehouses.name,
                    warehouses.business_branch_id,
                    warehouses.status,
                    COALESCE(branch.name, "") as branch_name,
                    COALESCE(business.name, "") as business_name,
                    COALESCE(entry_qty.qty_in, 0) as qty_in,
                    COALESCE(exit_qty.qty_out, 0) as qty_out,
                    (COALESCE(entry_qty.qty_in, 0) - COALESCE(exit_qty.qty_out, 0)) as stock
                ')
                ->leftJoinSub($entrySubquery, 'entry_qty', function ($join) {
                    $join->on('entry_qty.warehouse_id', '=', 'warehouses.id');
                })
                ->leftJoinSub($exitSubquery, 'exit_qty', function ($join) {
                    $join->on('exit_qty.warehouse_id', '=', 'warehouses.id');
                })
                ->leftJoin('business_branches as branch', 'branch.id', '=', 'warehouses.business_branch_id')
                ->leftJoin('businesses as business', 'business.id', '=', 'branch.business_id')
                ->whereNotNull('warehouses.status')
                ->orderBy('business_name')
                ->orderBy('branch_name')
                ->orderBy('warehouses.name')
                ->get();

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
                'warehouses' => $stockByWarehouse,
            ];
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
        return in_array($normalized, ['1', 'true', 'si', 'yes', 'y', 'activo', 'activa', 'on'], true);
    }

    private function normalizeText($value): string
    {
        return mb_strtolower(trim((string)$value));
    }

    private function generateLaboratoryCode(string $name, array $takenCodes): string
    {
        $base = preg_replace('/[^A-Za-z0-9]/', '', strtoupper(trim($name)));
        if ($base === '') $base = 'LAB';
        $base = substr($base, 0, 24);

        $candidate = $base;
        $i = 1;
        while (isset($takenCodes[$this->normalizeText($candidate)])) {
            $suffix = (string)$i;
            $allowed = 24 - strlen($suffix);
            if ($allowed <= 0) $allowed = 1;
            $candidate = substr($base, 0, $allowed) . $suffix;
            $i++;
        }

        return $candidate;
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

    private function ensureDefaultPresentation(int $articleId): void
    {
        $hasPresentation = ArticlePresentation::where('article_id', $articleId)->exists();
        if ($hasPresentation) return;

        ArticlePresentation::create([
            'article_id' => $articleId,
            'name' => 'Unidad',
            'units' => 1,
            'price' => 0,
            'sort_order' => 0,
            'status' => true,
        ]);
    }
}
