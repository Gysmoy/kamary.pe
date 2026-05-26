<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\ActivePrinciple;
use App\Models\Article;
use App\Models\ArticlePresentation;
use App\Models\Laboratory;
use App\Models\MagistralCategory;
use App\Models\MagistralLaboratory;
use App\Models\MagistralSubcategory;
use App\Models\StorageProductLot;
use App\Models\Unit;
use App\Models\Warehouse;
use App\Services\StockService;
use App\Support\BusinessScope;
use App\Support\StorageScope;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use SoDe\Extend\Response;

class ArticleController extends BasicController
{
    public $model = Article::class;
    public $reactView = 'Admin/Articles';
    public $prefix4filter = 'articles';
    protected string $moduleScope = 'standard';

    private array $presentationsPayload = [];
    private array $storageLotsPayload = [];

    public function setPaginationInstance(string $model)
    {
        $hasBusinessColumn = Schema::hasColumn('articles', 'business_id');
        $with = [
            'laboratory:id,name,code',
            'magistralLaboratory:id,description,code',
            'activePrinciple:id,laboratory_id,name',
            'client:id,full_name,document_number',
            'unit:id,name,symbol',
            'equivalenceUnit:id,name,symbol',
            'magistralCategory:id,code,description',
            'presentations:id,article_id,name,units,price,purchase_price_national,purchase_price_foreign,sort_order,status',
            'storageLots:id,article_id,lot,expiration_date,storage_condition,manufacturer_id,status',
            'storageLots.manufacturer:id,name,code',
            'creator:id,name,lastname,username,fullname',
            'updater:id,name,lastname,username,fullname',
        ];
        if ($hasBusinessColumn) {
            $with[] = 'business:id,business_key,name,trade_name,status';
        }

        $query = $model::select('articles.*')
            ->distinct()
            ->with($with)
            ->join('units as unit', 'unit.id', '=', 'articles.unit_id')
            ->leftJoin('clients as client', 'client.id', '=', 'articles.client_id')
            ->join('users as creator', 'creator.id', '=', 'articles.created_by')
            ->join('users as updater', 'updater.id', '=', 'articles.updated_by');

        if ($hasBusinessColumn) {
            $query->leftJoin('businesses as business', 'business.id', '=', 'articles.business_id');
        }

        if ($this->moduleScope === 'magistrales') {
            $query
                ->leftJoin('active_principles as active_principle', 'active_principle.id', '=', 'articles.active_principle_id')
                ->leftJoin('magistral_laboratories as magistral_laboratory', 'magistral_laboratory.id', '=', 'articles.magistral_laboratory_id');
        } else {
            $query
                ->join('active_principles as active_principle', 'active_principle.id', '=', 'articles.active_principle_id')
                ->join('laboratories as laboratory', 'laboratory.id', '=', 'articles.laboratory_id');
        }

        if (Schema::hasColumn('articles', 'module_scope')) {
            $query->where(function ($scope) {
                $scope->where('articles.module_scope', $this->moduleScope);
                if ($this->moduleScope === 'standard') {
                    $scope->orWhereNull('articles.module_scope');
                }
            });
        }
        if ($this->moduleScope === 'storage') {
            $query->whereHas('client', fn($client) => StorageScope::applyClientScope($client, 'clients'));
        }

        return $query;
    }

    public function import(Request $request): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            $rows = $request->rows;
            $mapping = $request->mapping ?? [];
            $userId = Auth::id();
            $hasArticleModuleScope = Schema::hasColumn('articles', 'module_scope');
            $hasArticleBusiness = Schema::hasColumn('articles', 'business_id');
            $defaultBusinessId = $hasArticleBusiness ? $this->defaultBusinessIdForScope() : null;
            $hasMagistralStatus = Schema::hasColumn('articles', 'magistral_status');

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

            $existingArticles = Article::whereNotNull('code')
                ->when($hasArticleModuleScope, fn($query) => $query->where('module_scope', $this->moduleScope))
                ->get(['id', 'code']);
            $articleByCode = [];
            foreach ($existingArticles as $item) {
                $normalizedCode = $this->normalizeText($item->code);
                if ($normalizedCode !== '') $articleByCode[$normalizedCode] = $item->id;
            }

            $existingLabs = $this->moduleScope === 'magistrales'
                ? MagistralLaboratory::query()
                    ->whereNotNull('description')
                    ->get(['id', 'description as name', 'code'])
                : Laboratory::query()
                    ->whereNotNull('name')
                    ->get(['id', 'name', 'code']);
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

            $existingPrinciples = $this->moduleScope === 'magistrales'
                ? collect()
                : ActivePrinciple::all(['id', 'laboratory_id', 'name']);
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
                $magistralStatus = 'vigente';
                if ($statusKey && array_key_exists($statusKey, $row)) {
                    if ($this->moduleScope === 'magistrales') {
                        $magistralStatus = $this->normalizeMagistralStatus($row[$statusKey]);
                        $status = $magistralStatus !== 'de_baja';
                    } else {
                        $status = $this->toBoolean($row[$statusKey]);
                    }
                }

                $normalizedLabName = $this->normalizeText($laboratoryName);
                $laboratoryId = $labByName[$normalizedLabName] ?? null;
                if (!$laboratoryId) {
                    $newLabCode = $this->generateLaboratoryCode($laboratoryName, $labCodeTaken);
                    $newLab = $this->moduleScope === 'magistrales'
                        ? MagistralLaboratory::create([
                            'description' => $laboratoryName,
                            'code' => $newLabCode,
                            'status' => true,
                            'created_by' => $userId,
                            'updated_by' => $userId,
                        ])
                        : Laboratory::create([
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

                $activePrincipleId = null;
                if ($this->moduleScope !== 'magistrales') {
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
                    $updateData = [
                        'code' => $code,
                        'name' => $name,
                        'unit_id' => $unitId,
                        'status' => $status,
                        'updated_by' => $userId,
                    ];
                    if ($this->moduleScope === 'magistrales') {
                        $updateData['magistral_laboratory_id'] = $laboratoryId;
                        $updateData['laboratory_id'] = null;
                        $updateData['active_principle_id'] = null;
                    } else {
                        $updateData['laboratory_id'] = $laboratoryId;
                        $updateData['active_principle_id'] = $activePrincipleId;
                    }
                    if ($hasArticleModuleScope) $updateData['module_scope'] = $this->moduleScope;
                    if ($hasArticleBusiness) $updateData['business_id'] = $defaultBusinessId;
                    if ($hasMagistralStatus && $this->moduleScope === 'magistrales') {
                        $updateData['magistral_status'] = $magistralStatus;
                    }

                    Article::where('id', $articleId)->update($updateData);
                    $this->ensureDefaultPresentation($articleId);
                    $updated++;
                } else {
                    $createData = [
                        'code' => $code,
                        'name' => $name,
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
                    ];
                    if ($hasArticleModuleScope) $createData['module_scope'] = $this->moduleScope;
                    if ($hasArticleBusiness) $createData['business_id'] = $defaultBusinessId;
                    if ($hasMagistralStatus && $this->moduleScope === 'magistrales') {
                        $createData['magistral_status'] = $magistralStatus;
                    }
                    if ($this->moduleScope === 'magistrales') {
                        $createData['magistral_laboratory_id'] = $laboratoryId;
                        $createData['laboratory_id'] = null;
                        $createData['active_principle_id'] = null;
                    } else {
                        $createData['laboratory_id'] = $laboratoryId;
                        $createData['active_principle_id'] = $activePrincipleId;
                    }

                    $newArticle = Article::create($createData);
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
        $magistralLaboratoryId = $this->moduleScope === 'magistrales'
            ? $this->toNullableInt($body['magistral_laboratory_id'] ?? $body['laboratory_id'] ?? null)
            : null;
        $activePrincipleId = $body['active_principle_id'] ?? null;
        $unitId = $this->toNullableInt($body['unit_id'] ?? null);
        $businessId = $this->toNullableInt($body['business_id'] ?? null);
        $magistralCategoryId = $this->toNullableInt($body['magistral_category_id'] ?? null);
        $requestedSubCategory = trim((string)($body['sub_category'] ?? ''));
        $magistralPresentation = $this->canonicalMagistralPresentation($body['magistral_presentation'] ?? null);
        $equivalenceUnitId = $this->toNullableInt($body['equivalence_unit_id'] ?? null);

        $this->presentationsPayload = is_array($request->presentations) ? $request->presentations : [];
        $this->storageLotsPayload = [];

        if ($this->moduleScope === 'storage') {
            $clientId = $this->toNullableInt($body['client_id'] ?? null);
            if (!$clientId) throw new \Exception('El cliente es obligatorio');
            StorageScope::assertClient($clientId);
            $articleId = $this->toNullableInt($id);
            if ($articleId) {
                $currentArticle = StorageScope::assertArticle($articleId);
                if ((int)($currentArticle->client_id ?? 0) !== $clientId) {
                    throw new \Exception('No se puede cambiar el cliente de un producto de almacenamiento');
                }
            }
            $body['client_id'] = $clientId;

            $this->storageLotsPayload = $this->normalizeStorageLotsPayload($request->storage_lots ?? []);
            if (count($this->storageLotsPayload) === 0) {
                throw new \Exception('Debes agregar al menos un lote / serie');
            }

            $firstManufacturerId = collect($this->storageLotsPayload)
                ->pluck('manufacturer_id')
                ->filter()
                ->first();
            if (!$laboratoryId && $firstManufacturerId) {
                $laboratoryId = $firstManufacturerId;
            }
            if (!$laboratoryId) {
                $laboratoryId = $this->ensureDefaultStorageLaboratory()->id;
            }
            if (!$activePrincipleId) {
                $activePrincipleId = $this->ensureDefaultActivePrinciple((int)$laboratoryId);
            }
            if ($code === '') {
                $code = $this->nextStorageArticleCode($id);
            }
        } else {
            unset($body['client_id'], $body['storage_lots']);
        }

        if ($this->moduleScope === 'magistrales') {
            $body['article_type'] = $this->normalizeMagistralArticleType($body['article_type'] ?? null);
            if ($code === '') {
                $code = $this->nextMagistralArticleCode($body['article_type'] ?? null, $id);
            }
            $body['magistral_status'] = $this->normalizeMagistralStatus($body['magistral_status'] ?? $body['status'] ?? null);
            $body['status'] = $body['magistral_status'] !== 'de_baja';
            $unitId = $unitId ?: $this->resolveMagistralUnitFromPresentations();
            $laboratoryId = null;
            $activePrincipleId = null;
            if (!empty($body['magistral_presentation']) && !$magistralPresentation) {
                throw new \Exception('La presentacion seleccionada no es valida');
            }
        } else {
            unset($body['magistral_status']);
        }

        if ($this->moduleScope === 'standard' && $code === '') {
            $code = $this->nextStandardArticleCode($id);
        }

        if ($code === '') throw new \Exception('El codigo de articulo es obligatorio');
        if ($name === '') throw new \Exception('El nombre del articulo es obligatorio');
        if ($this->moduleScope === 'magistrales') {
            if (!$magistralLaboratoryId) throw new \Exception('El laboratorio magistral es obligatorio');
        } else {
            if (!$laboratoryId) throw new \Exception('El laboratorio es obligatorio');
            if (!$activePrincipleId) throw new \Exception('El principio activo es obligatorio');
        }
        if (!$unitId) throw new \Exception('La unidad de medida es obligatoria');

        $existsCode = Article::whereRaw('LOWER(code) = ?', [mb_strtolower($code)])
            ->when(Schema::hasColumn('articles', 'module_scope'), function ($query) {
                $query->where(function ($scope) {
                    $scope->where('module_scope', $this->moduleScope);
                    if ($this->moduleScope === 'standard') {
                        $scope->orWhereNull('module_scope');
                    }
                });
            })
            ->when($id, fn($query) => $query->where('id', '!=', $id))
            ->exists();
        if ($existsCode) throw new \Exception('El codigo de articulo ya existe');

        if ($this->moduleScope === 'magistrales') {
            MagistralLaboratory::findOrFail($magistralLaboratoryId);
        } else {
            Laboratory::findOrFail($laboratoryId);
        }
        $unit = Unit::findOrFail($unitId);
        if (
            $this->moduleScope === 'storage'
            && Schema::hasColumn('units', 'module_scope')
            && (string)($unit->module_scope ?? '') !== 'storage'
        ) {
            throw new \Exception('La unidad de medida no pertenece al modulo de almacenamiento');
        }
        $resolvedBusinessId = $businessId ?: $this->defaultBusinessIdForScope();
        if ($resolvedBusinessId) {
            BusinessScope::findFixedBusiness($resolvedBusinessId);
        }
        if ($equivalenceUnitId) Unit::findOrFail($equivalenceUnitId);
        if ($magistralCategoryId) {
            MagistralCategory::whereIn('description', MagistralCategory::ALLOWED_DESCRIPTIONS)
                ->findOrFail($magistralCategoryId);
        }
        if ($this->moduleScope === 'magistrales' && $requestedSubCategory !== '') {
            if (!$magistralCategoryId) {
                throw new \Exception('La categoria es obligatoria para seleccionar subcategoria');
            }

            $validSubcategory = MagistralSubcategory::where('magistral_category_id', $magistralCategoryId)
                ->whereNotNull('status')
                ->whereRaw('LOWER(TRIM(description)) = ?', [mb_strtolower($requestedSubCategory)])
                ->exists();
            if (!$validSubcategory) {
                throw new \Exception('La subcategoria no pertenece a la categoria seleccionada');
            }
        }

        if ($this->moduleScope !== 'magistrales') {
            $principle = ActivePrinciple::findOrFail($activePrincipleId);
            if ((int)$principle->laboratory_id !== (int)$laboratoryId) {
                throw new \Exception('El principio activo no pertenece al laboratorio seleccionado');
            }
        }

        if (!isset($body['id']) || !$body['id']) {
            $body['created_by'] = $userId;
            $body['status'] = array_key_exists('status', $body)
                ? $this->toBoolean($body['status'])
                : true;
        } elseif (array_key_exists('status', $body)) {
            $body['status'] = $this->toBoolean($body['status']);
        }
        $body['updated_by'] = $userId;

        $body['code'] = $code;
        $body['module_scope'] = $this->moduleScope;
        $body['business_id'] = $resolvedBusinessId;
        $body['name'] = $name;
        $body['unit_id'] = $unitId;
        $body['composition'] = trim((string)($body['composition'] ?? '')) ?: null;
        $body['article_type'] = trim((string)($body['article_type'] ?? '')) ?: null;
        $body['administration_route'] = trim((string)($body['administration_route'] ?? '')) ?: null;
        $body['magistral_category_id'] = $magistralCategoryId;
        $body['sub_category'] = $requestedSubCategory ?: null;
        $body['magistral_presentation'] = $magistralPresentation;
        $body['magistral_format_id'] = null;
        $body['health_registration'] = trim((string)($body['health_registration'] ?? '')) ?: null;
        $body['default_lot'] = trim((string)($body['default_lot'] ?? '')) ?: null;
        $body['default_expiration_date'] = $this->normalizeDate($body['default_expiration_date'] ?? null);
        $body['notes'] = isset($body['notes']) ? trim((string)$body['notes']) : null;
        $body['margin_rule'] = $this->toBoolean($body['margin_rule'] ?? false);
        $body['igv_rule'] = $this->toBoolean($body['igv_rule'] ?? false);
        $body['stock_has_expiration'] = $this->toBoolean($body['stock_has_expiration'] ?? false);
        $body['stock_has_lot'] = $this->toBoolean($body['stock_has_lot'] ?? false);
        $body['units_per_article'] = (int)($body['units_per_article'] ?? 1);
        if ($body['units_per_article'] <= 0) {
            throw new \Exception('Unidades por articulo debe ser mayor a 0');
        }

        $body['volume'] = $this->toNullableDecimal($body['volume'] ?? null);
        $body['unit_weight'] = $this->toNullableDecimal($body['unit_weight'] ?? null);
        $body['stock_min'] = $this->toNullableDecimal($body['stock_min'] ?? null);
        $body['stock_max'] = $this->toNullableDecimal($body['stock_max'] ?? null);
        $body['currency'] = trim((string)($body['currency'] ?? '')) ?: null;
        $body['cost_price'] = $this->toNullableDecimal($body['cost_price'] ?? null);
        $body['sale_price'] = $this->toNullableDecimal($body['sale_price'] ?? null);
        $body['equivalence_exchange_rate'] = $this->toNullableDecimal($body['equivalence_exchange_rate'] ?? null);
        $body['equivalence_quantity'] = $this->toNullableDecimal($body['equivalence_quantity'] ?? null);
        $body['equivalence_unit_id'] = $equivalenceUnitId;
        $body['sale_price_national'] = $this->toNullableDecimal($body['sale_price_national'] ?? null);
        $body['purchase_price_national'] = $this->toNullableDecimal($body['purchase_price_national'] ?? null);
        $body['purchase_price_foreign'] = $this->toNullableDecimal($body['purchase_price_foreign'] ?? null);
        if (!is_null($body['volume']) && $body['volume'] <= 0) {
            throw new \Exception('El volumen debe ser mayor a 0');
        }
        if (!is_null($body['unit_weight']) && $body['unit_weight'] <= 0) {
            throw new \Exception('El peso unitario debe ser mayor a 0');
        }
        if (!is_null($body['stock_min']) && $body['stock_min'] < 0) {
            throw new \Exception('El stock minimo no puede ser negativo');
        }
        if (!is_null($body['stock_max']) && $body['stock_max'] < 0) {
            throw new \Exception('El stock maximo no puede ser negativo');
        }
        if (!is_null($body['stock_min']) && !is_null($body['stock_max']) && $body['stock_min'] > $body['stock_max']) {
            throw new \Exception('El stock minimo no puede ser mayor al stock maximo');
        }
        foreach ([
            'cost_price' => 'El precio costo no puede ser negativo',
            'sale_price' => 'El precio venta no puede ser negativo',
            'equivalence_exchange_rate' => 'El tipo de cambio no puede ser negativo',
            'equivalence_quantity' => 'La cantidad equivalente no puede ser negativa',
            'sale_price_national' => 'El precio venta nacional no puede ser negativo',
            'purchase_price_national' => 'El precio compra nacional no puede ser negativo',
            'purchase_price_foreign' => 'El precio compra extranjero no puede ser negativo',
        ] as $field => $message) {
            if (!is_null($body[$field]) && $body[$field] < 0) {
                throw new \Exception($message);
            }
        }

        if ($this->moduleScope === 'magistrales') {
            $body['magistral_laboratory_id'] = $magistralLaboratoryId;
            $body['laboratory_id'] = null;
            $body['active_principle_id'] = null;
        } else {
            $body['laboratory_id'] = $laboratoryId;
            $body['active_principle_id'] = $activePrincipleId;
        }
        unset($body['presentations'], $body['storage_lots']);

        foreach ([
            'module_scope',
            'business_id',
            'client_id',
            'magistral_status',
            'composition',
            'article_type',
            'administration_route',
            'magistral_category_id',
            'sub_category',
            'magistral_presentation',
            'magistral_format_id',
            'magistral_laboratory_id',
            'health_registration',
            'default_lot',
            'default_expiration_date',
            'stock_min',
            'stock_max',
            'currency',
            'stock_has_expiration',
            'stock_has_lot',
            'cost_price',
            'sale_price',
            'equivalence_exchange_rate',
            'equivalence_quantity',
            'equivalence_unit_id',
            'sale_price_national',
            'purchase_price_national',
            'purchase_price_foreign',
        ] as $column) {
            if (!Schema::hasColumn('articles', $column)) unset($body[$column]);
        }

        return $body;
    }

    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        DB::beginTransaction();
        try {
            ArticlePresentation::where('article_id', $jpa->id)->delete();

            if ($this->moduleScope === 'storage') {
                $this->ensureDefaultPresentation($jpa->id);

                StorageProductLot::where('article_id', $jpa->id)->delete();
                foreach ($this->storageLotsPayload as $lot) {
                    StorageProductLot::create([
                        'article_id' => $jpa->id,
                        'lot' => $lot['lot'],
                        'expiration_date' => $lot['expiration_date'],
                        'storage_condition' => $lot['storage_condition'],
                        'manufacturer_id' => $lot['manufacturer_id'],
                        'status' => $lot['status'],
                        'created_by' => Auth::id(),
                        'updated_by' => Auth::id(),
                    ]);
                }

                DB::commit();
                return;
            }

            $inserted = 0;
            foreach ($this->presentationsPayload as $index => $presentation) {
                if (!is_array($presentation)) continue;

                $name = trim((string)($presentation['name'] ?? ''));
                $units = $this->toNullableDecimal($presentation['units'] ?? null);
                $price = $this->toNullableDecimal($presentation['price'] ?? null) ?? 0;
                $purchasePriceNational = $this->toNullableDecimal($presentation['purchase_price_national'] ?? null) ?? 0;
                $purchasePriceForeign = $this->toNullableDecimal($presentation['purchase_price_foreign'] ?? null) ?? 0;

                if ($name === '' && is_null($units) && is_null($price)) continue;
                if ($name === '') throw new \Exception('Cada presentacion debe tener nombre');
                if (is_null($units) || $units <= 0) throw new \Exception("La presentacion {$name} debe tener unidades mayores a 0");
                if (is_null($price) || $price < 0) throw new \Exception("La presentacion {$name} debe tener un precio valido");

                $presentationData = [
                    'article_id' => $jpa->id,
                    'name' => $name,
                    'units' => $units,
                    'price' => $price,
                    'sort_order' => $index,
                    'status' => true,
                ];
                if (Schema::hasColumn('article_presentations', 'purchase_price_national')) {
                    $presentationData['purchase_price_national'] = $purchasePriceNational;
                }
                if (Schema::hasColumn('article_presentations', 'purchase_price_foreign')) {
                    $presentationData['purchase_price_foreign'] = $purchasePriceForeign;
                }

                ArticlePresentation::create($presentationData);
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

            $query = $this->scopedArticleMutationQuery($request->id);
            if (!$query->exists()) throw new \Exception('Articulo no encontrado en este modulo');
            $query->update($data);

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
            $query = $this->scopedArticleMutationQuery($request->id);
            if (!$query->exists()) throw new \Exception('Articulo no encontrado en este modulo');
            $query->update([
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

    public function delete(Request $request, string $id)
    {
        $response = new Response();
        try {
            $query = $this->scopedArticleMutationQuery($id);
            if (!$query->exists()) throw new \Exception('Articulo no encontrado en este modulo');
            $query->update([
                'status' => null,
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

    private function scopedArticleMutationQuery($id)
    {
        return $this->model::query()
            ->where($this->identifier, $id)
            ->when(Schema::hasColumn('articles', 'module_scope'), function ($query) {
                $query->where(function ($scope) {
                    $scope->where('module_scope', $this->moduleScope);
                    if ($this->moduleScope === 'standard') {
                        $scope->orWhereNull('module_scope');
                    }
                });
            })
            ->when($this->moduleScope === 'storage', function ($query) {
                $query->whereHas('client', fn($client) => StorageScope::applyClientScope($client, 'clients'));
            });
    }

    public function principles(Request $request, string $laboratoryId): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            if ($this->moduleScope === 'magistrales') {
                $response->status = 200;
                $response->message = 'Operacion correcta';
                $response->data = [];
                return response($response->toArray(), $response->status);
            }

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
                ->when(Schema::hasColumn('exit_notes', 'exit_status'), fn($query) => $query->where('exit_note.exit_status', 'approved'))
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

    private function normalizeMagistralStatus($value): string
    {
        if (is_bool($value)) return $value ? 'vigente' : 'de_baja';
        if (is_numeric($value)) return (int)$value === 0 ? 'de_baja' : 'vigente';

        $normalized = str_replace([' ', '-'], '_', mb_strtolower(trim((string)$value)));
        if (in_array($normalized, ['activo', 'activa', 'si', 'yes', 'true', 'on'], true)) return 'vigente';
        if (in_array($normalized, ['anulado', 'anulada', 'inactivo', 'inactiva', 'baja', 'no', 'false', 'off'], true)) return 'de_baja';
        $allowed = ['vigente', 'vencido', 'de_baja', 'agotado'];

        return in_array($normalized, $allowed, true) ? $normalized : 'vigente';
    }

    private function normalizeMagistralArticleType($value): string
    {
        $rawValue = trim((string)$value);
        $normalized = mb_strtolower($rawValue);

        if ($normalized === '') return '';
        if (str_contains($normalized, 'insumo')) return 'INSUMOS';
        if (str_contains($normalized, 'envase')) return 'ENVASES';
        if (str_contains($normalized, 'producto')) return 'PRODUCTO TERMINADO';

        return mb_strtoupper($rawValue);
    }

    private function canonicalMagistralPresentation($value): ?string
    {
        $normalized = $this->normalizeText($value);
        if ($normalized === '') return null;

        foreach (Article::MAGISTRAL_PRESENTATION_OPTIONS as $presentation) {
            if ($this->normalizeText($presentation) === $normalized) {
                return $presentation;
            }
        }

        return null;
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

    private function toNullableInt($value): ?int
    {
        if ($value === null) return null;
        $text = trim((string)$value);
        if ($text === '') return null;
        if (!ctype_digit(ltrim($text, '+'))) throw new \Exception("Valor entero invalido: {$value}");
        return (int)$text;
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

    private function normalizeStorageLotsPayload($lots): array
    {
        if (!is_array($lots)) return [];

        $normalized = [];
        foreach ($lots as $lotRow) {
            if (!is_array($lotRow)) continue;

            $lot = trim((string)($lotRow['lot'] ?? ''));
            $expirationDate = $this->normalizeDate($lotRow['expiration_date'] ?? null);
            $storageCondition = trim((string)($lotRow['storage_condition'] ?? '')) ?: null;
            $manufacturerId = $this->toNullableInt($lotRow['manufacturer_id'] ?? null);
            $status = array_key_exists('status', $lotRow)
                ? $this->toBoolean($lotRow['status'])
                : true;

            if (
                $lot === '' &&
                is_null($expirationDate) &&
                is_null($storageCondition) &&
                is_null($manufacturerId)
            ) {
                continue;
            }

            if ($lot === '') throw new \Exception('Cada lote / serie debe tener codigo');
            if ($manufacturerId) Laboratory::findOrFail($manufacturerId);

            $normalized[] = [
                'lot' => $lot,
                'expiration_date' => $expirationDate,
                'storage_condition' => $storageCondition,
                'manufacturer_id' => $manufacturerId,
                'status' => $status,
            ];
        }

        return $normalized;
    }

    private function ensureDefaultStorageLaboratory(): Laboratory
    {
        $userId = Auth::id();
        return Laboratory::firstOrCreate(
            ['code' => 'FABRICANTE-GENERAL'],
            [
                'name' => 'FABRICANTE GENERAL',
                'status' => true,
                'created_by' => $userId,
                'updated_by' => $userId,
            ]
        );
    }

    private function ensureDefaultActivePrinciple(int $laboratoryId): int
    {
        $userId = Auth::id();
        $principle = ActivePrinciple::firstOrCreate(
            [
                'laboratory_id' => $laboratoryId,
                'name' => 'GENERAL',
            ],
            [
                'status' => true,
                'created_by' => $userId,
                'updated_by' => $userId,
            ]
        );

        return (int)$principle->id;
    }

    private function resolveMagistralUnitFromPresentations(): int
    {
        foreach ($this->presentationsPayload as $presentation) {
            if (!is_array($presentation)) continue;

            $label = trim((string)($presentation['name'] ?? ''));
            if ($label !== '') {
                return $this->findOrCreateMagistralUnit($label);
            }
        }

        return $this->ensureDefaultMagistralUnit();
    }

    private function findOrCreateMagistralUnit(string $label): int
    {
        $normalized = $this->normalizeText($label);
        $matcher = function ($query) use ($normalized) {
            $query->whereRaw('LOWER(TRIM(symbol)) = ?', [$normalized])
                ->orWhereRaw('LOWER(TRIM(name)) = ?', [$normalized]);
        };

        if (Schema::hasColumn('units', 'module_scope')) {
            $unit = Unit::where('module_scope', 'magistrales')
                ->where($matcher)
                ->first();
            if ($unit) return (int)$unit->id;

            $unit = Unit::where(function ($scope) {
                    $scope->where('module_scope', 'standard')
                        ->orWhereNull('module_scope');
                })
                ->where($matcher)
                ->first();
            if ($unit) return (int)$unit->id;
        } else {
            $unit = Unit::where($matcher)->first();
            if ($unit) return (int)$unit->id;
        }

        $userId = Auth::id();
        $data = [
            'name' => $label,
            'symbol' => mb_strtoupper($label),
            'status' => true,
            'created_by' => $userId,
            'updated_by' => $userId,
        ];
        if (Schema::hasColumn('units', 'module_scope')) {
            $data['module_scope'] = 'magistrales';
        }

        return (int)Unit::create($data)->id;
    }

    private function ensureDefaultMagistralUnit(): int
    {
        $userId = Auth::id();
        $data = [
            'name' => 'Unidad Magistral',
            'status' => true,
            'created_by' => $userId,
            'updated_by' => $userId,
        ];
        if (Schema::hasColumn('units', 'module_scope')) {
            $data['module_scope'] = 'magistrales';
        }

        $unit = Unit::firstOrCreate(['symbol' => 'MAG-GEN'], $data);

        return (int)$unit->id;
    }

    private function defaultBusinessIdForScope(): ?int
    {
        $scopeKey = in_array($this->moduleScope, ['magistrales', 'storage'], true)
            ? BusinessScope::KAMARY_MEDICALS
            : BusinessScope::KAMARY_PERU;

        return BusinessScope::businessForKey($scopeKey)?->id;
    }

    private function nextMagistralArticleCode($articleType = null, $currentId = null): string
    {
        $type = $this->normalizeText($articleType);
        $prefix = 'MAG';
        if (str_contains($type, 'insumo')) {
            $prefix = 'INS';
        } elseif (str_contains($type, 'envase')) {
            $prefix = 'ENV';
        }

        $codes = Article::query()
            ->where('module_scope', $this->moduleScope)
            ->where('code', 'like', "{$prefix}-%")
            ->pluck('code');

        $next = 1;
        foreach ($codes as $existingCode) {
            if (preg_match('/^' . preg_quote($prefix, '/') . '-(\d+)$/i', (string)$existingCode, $matches)) {
                $next = max($next, ((int)$matches[1]) + 1);
            }
        }

        do {
            $code = "{$prefix}-{$next}";
            $exists = Article::whereRaw('LOWER(code) = ?', [mb_strtolower($code)])
                ->where('module_scope', $this->moduleScope)
                ->when($currentId, fn($query) => $query->where('id', '!=', $currentId))
                ->exists();
            $next++;
        } while ($exists);

        return $code;
    }

    private function nextStorageArticleCode($currentId = null): string
    {
        $lastId = (int)Article::query()
            ->when(Schema::hasColumn('articles', 'module_scope'), function ($query) {
                $query->where('module_scope', $this->moduleScope);
            })
            ->max('id');
        $next = max(1, $lastId + 1);

        do {
            $code = 'ART-' . str_pad((string)$next, 6, '0', STR_PAD_LEFT);
            $exists = Article::whereRaw('LOWER(code) = ?', [mb_strtolower($code)])
                ->when(Schema::hasColumn('articles', 'module_scope'), function ($query) {
                    $query->where('module_scope', $this->moduleScope);
                })
                ->when($currentId, fn($query) => $query->where('id', '!=', $currentId))
                ->exists();
            $next++;
        } while ($exists);

        return $code;
    }

    private function nextStandardArticleCode($currentId = null): string
    {
        $lastId = (int)Article::query()
            ->when(Schema::hasColumn('articles', 'module_scope'), function ($query) {
                $query->where(function ($scope) {
                    $scope->where('module_scope', $this->moduleScope)
                        ->orWhereNull('module_scope');
                });
            })
            ->max('id');
        $next = max(1, $lastId + 1);

        do {
            $code = 'ART-' . str_pad((string)$next, 6, '0', STR_PAD_LEFT);
            $exists = Article::whereRaw('LOWER(code) = ?', [mb_strtolower($code)])
                ->when(Schema::hasColumn('articles', 'module_scope'), function ($query) {
                    $query->where(function ($scope) {
                        $scope->where('module_scope', $this->moduleScope)
                            ->orWhereNull('module_scope');
                    });
                })
                ->when($currentId, fn($query) => $query->where('id', '!=', $currentId))
                ->exists();
            $next++;
        } while ($exists);

        return $code;
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
