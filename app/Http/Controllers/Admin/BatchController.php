<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\Article;
use App\Models\Batch;
use App\Models\Business;
use App\Support\BusinessScope;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use SoDe\Extend\Response;

class BatchController extends BasicController
{
    public $model = Batch::class;
    public $reactView = 'Admin/Batches';
    public $prefix4filter = 'batches';

    public function setPaginationInstance(string $model)
    {
        $query = $model::select('batches.*')
            ->with([
                'business:id,name',
                'article:id,code,name,laboratory_id,active_principle_id,unit_id',
                'article.laboratory:id,name',
                'article.activePrinciple:id,name',
                'article.unit:id,name,symbol',
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ])
            ->join('businesses as business', 'business.id', '=', 'batches.business_id')
            ->join('articles as article', 'article.id', '=', 'batches.article_id')
            ->join('users as creator', 'creator.id', '=', 'batches.created_by')
            ->join('users as updater', 'updater.id', '=', 'batches.updated_by');

        $scopeKey = BusinessScope::scopedKeyForRequest(request());
        $query->whereIn('business.business_key', BusinessScope::fixedKeys());
        if ($scopeKey) {
            $query->where('business.business_key', $scopeKey);
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

            if (!is_array($rows) || count($rows) === 0) {
                throw new \Exception('No hay registros para importar');
            }

            $articleKey = $mapping['article'] ?? null;
            $lotKey = $mapping['lot'] ?? null;
            if (!$articleKey || !$lotKey) {
                throw new \Exception('Debes mapear los campos articulo y lote');
            }

            $businessKey = $mapping['business'] ?? null;
            $expirationKey = $mapping['expiration_date'] ?? null;
            $statusKey = $mapping['status'] ?? null;

            $created = 0;
            $updated = 0;
            $skipped = 0;
            $errors = [];

            DB::beginTransaction();

            $businesses = Business::whereIn('business_key', BusinessScope::fixedKeys())
                ->whereNotNull('name')
                ->get(['id', 'name', 'business_key']);
            $businessByName = [];
            foreach ($businesses as $business) {
                $normalized = $this->normalizeText($business->name);
                if ($normalized !== '') $businessByName[$normalized] = $business->id;
            }

            $scopeKey = BusinessScope::keyForUrl((string) $request->headers->get('referer', ''));
            $defaultBusiness = $businesses->firstWhere('business_key', $scopeKey)
                ?: $businesses->firstWhere('business_key', BusinessScope::KAMARY_PERU);
            if (!$defaultBusiness) {
                throw new \Exception('No se encontraron las empresas fijas para importar lotes');
            }

            $articles = Article::whereNotNull('status')->get(['id', 'code', 'name']);
            $articleByCode = [];
            $articleByName = [];
            foreach ($articles as $article) {
                $normalizedCode = $this->normalizeText($article->code);
                $normalizedName = $this->normalizeText($article->name);
                if ($normalizedCode !== '') $articleByCode[$normalizedCode] = $article->id;
                if ($normalizedName !== '') $articleByName[$normalizedName] = $article->id;
            }

            $existingBatches = Batch::all(['id', 'business_id', 'article_id', 'lot']);
            $batchByKey = [];
            foreach ($existingBatches as $batch) {
                $key = $this->batchKey($batch->business_id, $batch->article_id, $batch->lot);
                $batchByKey[$key] = $batch->id;
            }

            foreach ($rows as $idx => $row) {
                if (!is_array($row)) {
                    $skipped++;
                    $errors[] = "Fila " . ($idx + 1) . ": formato invalido";
                    continue;
                }

                $articleText = trim((string)($row[$articleKey] ?? ''));
                $lot = trim((string)($row[$lotKey] ?? ''));
                if ($articleText === '' || $lot === '') {
                    $skipped++;
                    $errors[] = "Fila " . ($idx + 1) . ": articulo o lote vacio";
                    continue;
                }

                $businessName = $businessKey ? trim((string)($row[$businessKey] ?? '')) : '';
                $businessId = null;
                if ($businessName === '') {
                    $businessId = $defaultBusiness->id;
                    $businessName = $defaultBusiness->name;
                } else {
                    $normalizedBusinessName = $this->normalizeText($businessName);
                    $businessId = $businessByName[$normalizedBusinessName] ?? null;
                }
                if (!$businessId) {
                    $skipped++;
                    $errors[] = "Fila " . ($idx + 1) . ": empresa no encontrada ({$businessName})";
                    continue;
                }

                $normalizedArticle = $this->normalizeText($articleText);
                $articleId = $articleByCode[$normalizedArticle] ?? null;
                if (!$articleId) $articleId = $articleByName[$normalizedArticle] ?? null;
                if (!$articleId) {
                    $skipped++;
                    $errors[] = "Fila " . ($idx + 1) . ": articulo no encontrado ({$articleText})";
                    continue;
                }

                $expirationDate = null;
                if ($expirationKey && array_key_exists($expirationKey, $row)) {
                    $expirationDate = $this->normalizeDate($row[$expirationKey]);
                }
                if (!$expirationDate) {
                    $expirationDate = now()->addYear()->toDateString();
                }

                $status = true;
                if ($statusKey && array_key_exists($statusKey, $row)) {
                    $status = $this->toBoolean($row[$statusKey]);
                }

                $lookup = $this->batchKey($businessId, $articleId, $lot);
                $batchId = $batchByKey[$lookup] ?? null;

                if ($batchId) {
                    Batch::where('id', $batchId)->update([
                        'expiration_date' => $expirationDate,
                        'status' => $status,
                        'updated_by' => $userId,
                    ]);
                    $updated++;
                } else {
                    $newBatch = Batch::create([
                        'business_id' => $businessId,
                        'article_id' => $articleId,
                        'lot' => $lot,
                        'expiration_date' => $expirationDate,
                        'status' => $status,
                        'created_by' => $userId,
                        'updated_by' => $userId,
                    ]);
                    $batchByKey[$lookup] = $newBatch->id;
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

        $businessId = $body['business_id'] ?? null;
        $articleId = $body['article_id'] ?? null;
        $lot = trim((string)($body['lot'] ?? ''));
        $expirationDate = $this->normalizeDate($body['expiration_date'] ?? null);

        if (!$businessId) throw new \Exception('La empresa es obligatoria');
        if (!$articleId) throw new \Exception('El articulo es obligatorio');
        if ($lot === '') throw new \Exception('El lote es obligatorio');
        if (!$expirationDate) throw new \Exception('La fecha de vencimiento es obligatoria');

        BusinessScope::findFixedBusinessForRequest($businessId, $request);
        Article::findOrFail($articleId);

        $exists = Batch::where('business_id', $businessId)
            ->where('article_id', $articleId)
            ->whereRaw('LOWER(lot) = ?', [mb_strtolower($lot)])
            ->when($id, fn($query) => $query->where('id', '!=', $id))
            ->exists();
        if ($exists) {
            throw new \Exception('Ya existe este lote para la empresa y articulo seleccionados');
        }

        if (!isset($body['id']) || !$body['id']) {
            $body['created_by'] = $userId;
            $body['status'] = true;
        }
        $body['updated_by'] = $userId;
        $body['lot'] = $lot;
        $body['expiration_date'] = $expirationDate;

        return $body;
    }

    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        return $jpa;
    }

    public function boolean(Request $request)
    {
        $response = new Response();
        try {
            $field = $this->allowedBooleanFieldFromRequest($request);
            $data = [];
            $data[$field] = $request->value;
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

    private function normalizeDate($value): ?string
    {
        if ($value === null) return null;
        $text = trim((string)$value);
        if ($text === '') return null;
        $timestamp = strtotime($text);
        if ($timestamp === false) {
            throw new \Exception("Fecha invalida: {$value}");
        }
        return date('Y-m-d', $timestamp);
    }

    private function normalizeText($value): string
    {
        return mb_strtolower(trim((string)$value));
    }

    private function batchKey(int|string $businessId, int|string $articleId, string $lot): string
    {
        return $businessId . ':' . $articleId . ':' . $this->normalizeText($lot);
    }

    private function toBoolean($value): bool
    {
        if (is_bool($value)) return $value;
        if (is_numeric($value)) return (int)$value !== 0;

        $normalized = mb_strtolower(trim((string)$value));
        return in_array($normalized, ['1', 'true', 'si', 'sí', 'yes', 'y', 'activo', 'activa', 'on'], true);
    }
}
