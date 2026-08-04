<?php

namespace App\Http\Controllers\Admin\Storage;

use App\Http\Controllers\Admin\ArticleController as BaseArticleController;
use App\Models\Warehouse;
use App\Support\BusinessScope;
use App\Support\StorageScope;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use SoDe\Extend\Response;

class ProductController extends BaseArticleController
{
    protected string $moduleScope = 'storage';

    public function setReactViewProperties(Request $request)
    {
        return [
            'moduleTitle' => 'Serv. Almacenamiento - Creacion del producto',
            'requiredPermission' => 'storage-products',
            'moduleScope' => $this->moduleScope,
        ];
    }

    /**
     * Alta masiva del catalogo de un cliente desde un archivo del usuario.
     *
     * No se reutiliza el import de articulos estandar porque aquel no asigna `client_id`, y en
     * almacenamiento cada producto pertenece a un cliente: sin ese dato el producto no aparece en
     * su inventario ni se puede recibir en una nota de entrada.
     */
    public function import(Request $request): HttpResponse|ResponseFactory
    {
        $response = new Response();

        try {
            $rows = $request->input('rows');
            $mapping = $request->input('mapping') ?? [];
            if (!is_array($rows) || count($rows) === 0) throw new \Exception('No hay registros para importar');

            $codeKey = trim((string)($mapping['code'] ?? ''));
            $nameKey = trim((string)($mapping['name'] ?? ''));
            if ($nameKey === '') throw new \Exception('Debes mapear al menos la columna del nombre del producto');
            $unitKey = trim((string)($mapping['unit'] ?? ''));

            // El listado de clientes de esta pantalla prefija el id ("client-36"), asi que se
            // acepta cualquiera de las dos formas.
            $clientId = (int) preg_replace('/\D+/', '', (string)$request->input('client_id'));
            if (!$clientId) throw new \Exception('Selecciona el cliente dueno de los productos');
            $client = StorageScope::assertClient($clientId);

            $units = \App\Models\Unit::whereNotNull('status')->get(['id', 'name', 'symbol']);
            $unitByKey = [];
            foreach ($units as $unit) {
                foreach ([$unit->name, $unit->symbol] as $candidate) {
                    $key = $this->normalizeProductText($candidate);
                    if ($key !== '' && !isset($unitByKey[$key])) $unitByKey[$key] = $unit->id;
                }
            }
            $defaultUnitId = $units->first()?->id;

            // Codigos ya usados: articles.code es unico GLOBAL, no por cliente ni por modulo.
            $usedCodes = \App\Models\Article::pluck('code')->filter()->map(fn($c) => strtoupper(trim($c)))->flip();

            $parsed = [];
            $errors = [];
            $seen = [];
            foreach ($rows as $index => $row) {
                $line = $index + 2;
                if (!is_array($row)) continue;

                $name = trim((string)($row[$nameKey] ?? ''));
                $code = $codeKey !== '' ? strtoupper(trim((string)($row[$codeKey] ?? ''))) : '';
                if ($name === '' && $code === '') continue;
                if ($name === '') { $errors[] = "Fila {$line}: falta el nombre del producto"; continue; }

                if ($code !== '') {
                    if (isset($seen[$code])) { $errors[] = "Fila {$line}: el codigo \"{$code}\" esta repetido en el archivo"; continue; }
                    if ($usedCodes->has($code)) { $errors[] = "Fila {$line}: el codigo \"{$code}\" ya existe en el sistema"; continue; }
                    $seen[$code] = true;
                }

                $unitId = $defaultUnitId;
                if ($unitKey !== '') {
                    $unitRaw = trim((string)($row[$unitKey] ?? ''));
                    if ($unitRaw !== '') {
                        $found = $unitByKey[$this->normalizeProductText($unitRaw)] ?? null;
                        if (!$found) { $errors[] = "Fila {$line}: la unidad de medida \"{$unitRaw}\" no existe"; continue; }
                        $unitId = $found;
                    }
                }
                if (!$unitId) { $errors[] = "Fila {$line}: no hay unidades de medida creadas en el sistema"; continue; }

                $parsed[] = ['code' => $code, 'name' => $name, 'unit_id' => $unitId];
            }

            if (count($errors) > 0) {
                throw new \Exception('El archivo tiene errores y no se importo nada:' . PHP_EOL . implode(PHP_EOL, array_slice($errors, 0, 10))
                    . (count($errors) > 10 ? PHP_EOL . '... y ' . (count($errors) - 10) . ' error(es) mas' : ''));
            }
            if (count($parsed) === 0) throw new \Exception('El archivo no tiene filas con datos para importar');

            DB::beginTransaction();
            $created = 0;
            $correlative = (int)(\App\Models\Article::where('code', 'like', 'STG-IMP-%')->count());
            foreach ($parsed as $item) {
                $code = $item['code'];
                if ($code === '') {
                    // Sin codigo en el archivo se genera uno libre y estable.
                    do { $correlative++; $code = 'STG-IMP-' . str_pad((string)$correlative, 6, '0', STR_PAD_LEFT); }
                    while ($usedCodes->has($code));
                    $usedCodes[$code] = true;
                }
                \App\Models\Article::create([
                    'module_scope' => 'storage',
                    'code' => $code,
                    'name' => $item['name'],
                    'unit_id' => $item['unit_id'],
                    'client_id' => $clientId,
                    'status' => true,
                    'created_by' => \Illuminate\Support\Facades\Auth::id(),
                    'updated_by' => \Illuminate\Support\Facades\Auth::id(),
                ]);
                $created++;
            }
            DB::commit();

            $response->status = 200;
            $response->message = "Se crearon {$created} producto(s) para " . ($client->full_name ?? 'el cliente') . '.';
            $response->data = ['created' => $created];
        } catch (\Throwable $th) {
            if (DB::transactionLevel() > 0) DB::rollBack();
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    private function normalizeProductText($value): string
    {
        $text = trim((string)$value);
        if ($text === '') return '';
        $text = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text) ?: $text;
        return preg_replace('/[^a-z0-9]/', '', strtolower($text)) ?? '';
    }

    public function stockByWarehouse(Request $request, string $articleId): HttpResponse|ResponseFactory
    {
        $response = new Response();

        try {
            $article = StorageScope::articleQuery()->with([
                'presentations' => function ($query) {
                    $query->where('status', 1)->orderBy('sort_order')->orderBy('id');
                }
            ])->findOrFail($articleId);
            $clientId = (int)($article->client_id ?? 0);
            if (!$clientId) throw new \Exception('El producto de almacenamiento no tiene cliente asignado');
            StorageScope::assertClient($clientId);

            $incomingTotals = DB::table('entry_note_items as entry_item')
                ->join('entry_notes as entry_note', 'entry_note.id', '=', 'entry_item.entry_note_id')
                ->join('businesses as business', 'business.id', '=', 'entry_note.business_id')
                ->where('entry_note.status', 1)
                ->where('entry_note.entry_status', 'approved')
                ->where('entry_item.status', 1)
                ->where('business.business_key', BusinessScope::KAMARY_MEDICALS)
                ->where('entry_item.article_id', $article->id)
                ->when($clientId, fn($query) => $query->where('entry_note.client_id', $clientId))
                ->selectRaw('
                    COALESCE(entry_item.warehouse_id, entry_note.warehouse_id) as warehouse_id,
                    COALESCE(SUM(entry_item.quantity), 0) as qty_in
                ')
                ->groupByRaw('COALESCE(entry_item.warehouse_id, entry_note.warehouse_id)');

            $outgoingTotals = DB::table('exit_note_items as exit_item')
                ->join('exit_notes as exit_note', 'exit_note.id', '=', 'exit_item.exit_note_id')
                ->join('businesses as business', 'business.id', '=', 'exit_note.business_id')
                ->where('exit_note.status', 1)
                ->where('exit_item.status', 1)
                ->where('business.business_key', BusinessScope::KAMARY_MEDICALS)
                ->where('exit_item.article_id', $article->id)
                ->when($clientId, fn($query) => $query->where('exit_note.client_id', $clientId))
                ->when(Schema::hasColumn('exit_notes', 'exit_status'), fn($query) => $query->where('exit_note.exit_status', 'approved'))
                ->selectRaw('
                    COALESCE(exit_item.warehouse_id, exit_note.warehouse_id) as warehouse_id,
                    COALESCE(SUM(exit_item.quantity), 0) as qty_out
                ')
                ->groupByRaw('COALESCE(exit_item.warehouse_id, exit_note.warehouse_id)');

            $warehouses = Warehouse::query()
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
                ->leftJoinSub($incomingTotals, 'entry_qty', function ($join) {
                    $join->on('entry_qty.warehouse_id', '=', 'warehouses.id');
                })
                ->leftJoinSub($outgoingTotals, 'exit_qty', function ($join) {
                    $join->on('exit_qty.warehouse_id', '=', 'warehouses.id');
                })
                ->leftJoin('business_branches as branch', 'branch.id', '=', 'warehouses.business_branch_id')
                ->leftJoin('businesses as business', 'business.id', '=', 'branch.business_id')
                ->whereNotNull('warehouses.status')
                ->where('business.business_key', BusinessScope::KAMARY_MEDICALS)
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
                'warehouses' => $warehouses,
            ];
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }
}
