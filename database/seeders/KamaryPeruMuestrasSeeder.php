<?php

namespace Database\Seeders;

use App\Models\ActivePrinciple;
use App\Models\Article;
use App\Models\ArticlePresentation;
use App\Models\Business;
use App\Models\Laboratory;
use App\Models\Unit;
use App\Models\User;
use App\Support\BusinessScope;
use App\Support\SamplesWarehouse;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Importa el catalogo real del modulo MUESTRAS de Kamary Peru (kamary_peru),
 * exportado del sistema legado (categoria 179 "SOFTYS MUESTRAS"):
 *   - database/data/kamary_peru_muestras.json  (268 productos)
 *
 * Modelo elegido (analogo a Magistrales):
 *   - Los productos se crean con module_scope = 'muestras' -> NO aparecen en el grid
 *     comercial de Articulos (que filtra 'standard' OR NULL); quedan separados.
 *   - Se asignan al almacen fijo del modulo Muestras (App\Support\SamplesWarehouse,
 *     "Almacen Muestras"). ArticleController::pickerEffectiveModuleScope() devuelve
 *     'muestras' cuando el picker apunta a ese almacen, asi el usuario los ve al hacer
 *     Nota de Entrada al Almacen Muestras (para cargar stock real luego).
 *   - SOLO CATALOGO, SIN STOCK: no se crean notas de entrada. El modulo Muestras
 *     (SampleOrderController) los listara cuando tengan stock cargado por el usuario.
 *
 * Deja SOLO estos productos como muestras: hace hard-delete de cualquier articulo
 * module_scope='muestras' de kamary_peru cuyo codigo no este en el dump.
 *
 * NO toca kamary_medicals ni el catalogo comercial (standard) ni magistrales.
 *
 * Ejecutar:  php artisan db:seed --class=KamaryPeruMuestrasSeeder
 * Idempotente y re-ejecutable.
 */
class KamaryPeruMuestrasSeeder extends Seeder
{
    private const DATA_FILE = 'data/kamary_peru_muestras.json';
    private const SCOPE = 'muestras';
    private const LAB_NAME = 'SOFTYS MUESTRAS';
    private const PRINCIPLE_NAME = 'PRODUCTO';
    private const DEFAULT_UNIT = 'UNIDAD';

    private ?int $userId = null;

    public function run(): void
    {
        if (!Schema::hasTable('articles') || !Schema::hasColumn('articles', 'module_scope')) {
            $this->command?->error('Falta la tabla articles o la columna module_scope.');
            return;
        }

        $data = $this->loadJson(self::DATA_FILE);
        $rows = is_array($data['articulos'] ?? null) ? $data['articulos'] : null;
        if ($rows === null) {
            $this->command?->error('No se pudo leer ' . self::DATA_FILE);
            return;
        }

        $plan = $this->buildPlan($rows);
        if (empty($plan['articles'])) {
            $this->command?->warn('El dump de muestras no tiene articulos validos.');
            return;
        }

        $this->userId = User::query()->orderBy('id')->value('id');
        if (!$this->userId) {
            $this->command?->error('No hay usuarios para asignar created_by/updated_by.');
            return;
        }

        [$kept, $removed] = DB::transaction(function () use ($plan) {
            $businessId = Business::query()
                ->where('business_key', BusinessScope::KAMARY_PERU)
                ->whereNotNull('status')
                ->value('id');
            if (!$businessId) {
                throw new \RuntimeException('No existe el business kamary_peru.');
            }

            // Almacen fijo del modulo Muestras (lo crea si falta).
            $warehouse = SamplesWarehouse::warehouse();

            $labId = $this->resolveLaboratory(self::LAB_NAME);
            $principleId = $this->resolveActivePrinciple($labId, self::PRINCIPLE_NAME);
            $unitIds = $this->resolveUnits($plan['units']);
            $defaultUnitId = $unitIds[self::DEFAULT_UNIT] ?? (array_values($unitIds)[0] ?? null);

            $kept = $this->syncArticles(
                $plan['articles'],
                (int) $businessId,
                (int) $warehouse->id,
                $labId,
                $principleId,
                $unitIds,
                $defaultUnitId
            );

            $removed = $this->purgeStragglers($plan['codes'], (int) $businessId);

            return [$kept, $removed];
        });

        $this->command?->info("Muestras Kamary Peru: {$kept} productos asegurados (scope 'muestras'), {$removed} sobrantes eliminados.");
    }

    // ------------------------------------------------------------------
    // PLAN (puro, testeable offline)
    // ------------------------------------------------------------------

    /**
     * @return array{articles: array<int,array{code:string,name:string,unit:string,status:bool}>, units: array<int,string>, codes: array<int,string>}
     */
    public function buildPlan(array $rows): array
    {
        $articles = [];
        $units = [];
        $codes = [];
        $seen = [];

        foreach ($rows as $row) {
            $code = $this->text($row['codigo'] ?? '');
            if ($code === '' || isset($seen[$code])) continue;
            $seen[$code] = true;

            $name = $this->text($row['descripcion'] ?? '') ?: $code;
            $unit = mb_strtoupper($this->text($row['unidad'] ?? '')) ?: self::DEFAULT_UNIT;
            $status = mb_strtolower($this->text($row['estado'] ?? 'activo')) === 'activo';

            $units[$unit] = true;
            $codes[] = $code;
            $articles[] = [
                'code' => $code,
                'name' => mb_substr($name, 0, 255),
                'unit' => $unit,
                'status' => $status,
            ];
        }

        // La unidad por defecto siempre debe existir (algunos articulos podrian caer en fallback).
        $units[self::DEFAULT_UNIT] = true;

        return [
            'articles' => $articles,
            'units' => array_keys($units),
            'codes' => $codes,
        ];
    }

    // ------------------------------------------------------------------
    // PERSISTENCIA
    // ------------------------------------------------------------------

    private function resolveLaboratory(string $name): int
    {
        $existing = Laboratory::query()
            ->whereRaw('LOWER(TRIM(name)) = ?', [mb_strtolower(trim($name))])
            ->first();
        if ($existing) return (int) $existing->id;

        $lab = Laboratory::query()->create([
            'name' => mb_substr($name, 0, 255),
            'code' => $this->uniqueLabCode($name),
            'country' => 'Perú',
            'status' => true,
            'created_by' => $this->userId,
            'updated_by' => $this->userId,
        ]);
        return (int) $lab->id;
    }

    private function resolveActivePrinciple(int $labId, string $name): int
    {
        $ap = ActivePrinciple::query()->updateOrCreate(
            ['laboratory_id' => $labId, 'name' => $name],
            ['status' => true, 'created_by' => $this->userId, 'updated_by' => $this->userId]
        );
        return (int) $ap->id;
    }

    /** @return array<string,int> symbol => id (units.symbol es unique GLOBAL) */
    private function resolveUnits(array $units): array
    {
        $map = [];
        foreach ($units as $label) {
            $unit = Unit::query()->whereRaw('LOWER(TRIM(name)) = ?', [mb_strtolower(trim($label))])->first()
                ?? Unit::query()->whereRaw('LOWER(TRIM(symbol)) = ?', [mb_strtolower(trim($label))])->first();
            if (!$unit) {
                $unit = Unit::query()->create([
                    'module_scope' => 'standard',
                    'name' => ucfirst(mb_strtolower($label, 'UTF-8')),
                    'symbol' => $label,
                    'status' => true,
                    'created_by' => $this->userId,
                    'updated_by' => $this->userId,
                ]);
            }
            $map[$label] = (int) $unit->id;
        }
        return $map;
    }

    private function syncArticles(array $articles, int $businessId, int $warehouseId, int $labId, int $principleId, array $unitIds, ?int $defaultUnitId): int
    {
        $count = 0;
        foreach ($articles as $a) {
            // Clave unica de articles = (module_scope, code).
            $article = Article::query()->firstOrNew([
                'module_scope' => self::SCOPE,
                'code' => $a['code'],
            ]);
            if (!$article->exists) {
                $article->created_by = $this->userId;
            }

            $article->business_id = $businessId;
            $article->name = $a['name'];
            $article->laboratory_id = $labId;               // grid muestras hace INNER JOIN a laboratories
            $article->active_principle_id = $principleId;   // grid muestras hace INNER JOIN a active_principles
            $article->unit_id = $unitIds[$a['unit']] ?? $defaultUnitId;
            $article->warehouse_id = $warehouseId;          // Almacen Muestras (picker cambia a scope muestras)
            $article->units_per_article = 1;
            $article->margin_rule = false;
            $article->igv_rule = false;
            $article->status = $a['status'];
            $article->updated_by = $this->userId;
            $article->save();

            $this->ensureDefaultPresentation((int) $article->id);
            $count++;
        }
        return $count;
    }

    private function ensureDefaultPresentation(int $articleId): void
    {
        if (ArticlePresentation::query()->where('article_id', $articleId)->exists()) return;

        ArticlePresentation::query()->create([
            'article_id' => $articleId,
            'name' => 'Unidad',
            'units' => 1,
            'price' => 0,
            'sort_order' => 0,
            'status' => true,
        ]);
    }

    /** Deja SOLO los codigos del dump como muestras: borra de raiz el resto. */
    private function purgeStragglers(array $keepCodes, int $businessId): int
    {
        $query = Article::query()
            ->where('module_scope', self::SCOPE)
            ->where('business_id', $businessId);
        if (!empty($keepCodes)) {
            $query->whereNotIn('code', $keepCodes);
        }
        $ids = $query->pluck('id')->all();
        if (empty($ids)) return 0;

        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        try {
            ArticlePresentation::query()->whereIn('article_id', $ids)->delete();
            Article::query()->whereIn('id', $ids)->delete();
        } finally {
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        }
        return count($ids);
    }

    // ------------------------------------------------------------------
    // HELPERS
    // ------------------------------------------------------------------

    private function loadJson(string $file): ?array
    {
        $path = database_path($file);
        if (!is_file($path)) return null;
        $data = json_decode(file_get_contents($path), true);
        return is_array($data) ? $data : null;
    }

    private function uniqueLabCode(string $name): string
    {
        $base = preg_replace('/[^A-Z0-9]/', '', strtoupper($this->text($name)));
        $base = mb_substr($base ?: 'LAB', 0, 20);
        $code = $base;
        $i = 1;
        while (Laboratory::query()->where('code', $code)->exists()) {
            $suffix = (string) $i++;
            $code = mb_substr($base, 0, 20 - mb_strlen($suffix)) . $suffix;
        }
        return $code;
    }

    private function text($value): string
    {
        return trim((string) ($value ?? ''));
    }
}
