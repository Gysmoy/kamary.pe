<?php

namespace App\Http\Controllers\Admin\Storage;

use App\Http\Controllers\Admin\EntryNoteController as BaseEntryNoteController;
use App\Models\Article;
use App\Models\EntryNote;
use App\Models\EntryNoteItem;
use App\Models\Warehouse;
use App\Support\BusinessScope;
use App\Support\StorageScope;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use SoDe\Extend\Response;

class EntryNoteController extends BaseEntryNoteController
{
    public function setReactViewProperties(Request $request)
    {
        return [
            'moduleTitle' => 'Serv. Almacenamiento - Nota de entrada',
            'requiredPermission' => 'storage-entry-note',
        ];
    }

    /**
     * Carga masiva de stock: convierte un archivo del usuario en una nota de entrada aprobada.
     *
     * Se sigue el mismo patron que el resto de importaciones del sistema (lotes, articulos): el
     * usuario sube su propio archivo y mapea sus columnas, en vez de obligarlo a una plantilla.
     *
     * El stock entra por una nota de entrada a proposito: es el unico camino que deja movimiento
     * en kardex y que el modulo de inventario puede auditar despues.
     */
    public function import(Request $request): HttpResponse|ResponseFactory
    {
        $response = new Response();

        try {
            $rows = $request->input('rows');
            $mapping = $request->input('mapping') ?? [];

            if (!is_array($rows) || count($rows) === 0) {
                throw new \Exception('No hay registros para importar');
            }

            $articleKey = trim((string)($mapping['article'] ?? ''));
            $quantityKey = trim((string)($mapping['quantity'] ?? ''));
            if ($articleKey === '' || $quantityKey === '') {
                throw new \Exception('Debes mapear al menos las columnas de articulo y cantidad');
            }
            $lotKey = trim((string)($mapping['lot'] ?? ''));
            $expirationKey = trim((string)($mapping['expiration_date'] ?? ''));
            $locationKey = trim((string)($mapping['location'] ?? ''));
            $costKey = trim((string)($mapping['cost_unit'] ?? ''));

            $clientId = $this->importInt($request->input('client_id'));
            if (!$clientId) throw new \Exception('Selecciona el cliente dueno de la mercaderia');
            $client = StorageScope::assertClient($clientId);

            $warehouseId = $this->importInt($request->input('warehouse_id'));
            if (!$warehouseId) throw new \Exception('Selecciona el almacen donde ingresa la mercaderia');
            $warehouse = Warehouse::with('branch.business')->findOrFail($warehouseId);
            $business = $warehouse->branch?->business;
            if (!$business || $business->business_key !== BusinessScope::KAMARY_MEDICALS) {
                throw new \Exception('El almacen seleccionado no pertenece al servicio de almacenamiento');
            }

            // Catalogo del cliente indexado por codigo y por nombre: el archivo puede traer
            // cualquiera de los dos y no tiene por que respetar mayusculas ni acentos.
            $articles = Article::query()
                ->whereNotNull('status')
                ->where('client_id', $clientId)
                ->get(['id', 'code', 'name']);
            $byCode = [];
            $byName = [];
            foreach ($articles as $article) {
                $code = $this->normalizeImportText($article->code);
                $name = $this->normalizeImportText($article->name);
                if ($code !== '') $byCode[$code] = $article->id;
                if ($name !== '') $byName[$name] = $article->id;
            }
            if (count($byCode) === 0 && count($byName) === 0) {
                throw new \Exception('Este cliente no tiene productos creados. Registralos en "Creacion del producto" antes de cargar stock.');
            }

            // Primera pasada: validar todo el archivo antes de escribir nada, para no dejar una
            // nota a medias si una fila esta mal.
            $parsed = [];
            $errors = [];
            foreach ($rows as $index => $row) {
                $line = $index + 2; // +1 por indice base 0 y +1 por la fila de cabecera
                if (!is_array($row)) continue;

                $articleRaw = trim((string)($row[$articleKey] ?? ''));
                $quantityRaw = trim((string)($row[$quantityKey] ?? ''));
                if ($articleRaw === '' && $quantityRaw === '') continue; // fila vacia

                if ($articleRaw === '') { $errors[] = "Fila {$line}: falta el articulo"; continue; }

                $needle = $this->normalizeImportText($articleRaw);
                $articleId = $byCode[$needle] ?? $byName[$needle] ?? null;
                if (!$articleId) { $errors[] = "Fila {$line}: el articulo \"{$articleRaw}\" no existe para este cliente"; continue; }

                $quantity = $this->importDecimal($quantityRaw);
                if ($quantity === null || $quantity <= 0) { $errors[] = "Fila {$line}: la cantidad debe ser mayor a 0"; continue; }

                $expiration = null;
                if ($expirationKey !== '') {
                    $expirationRaw = trim((string)($row[$expirationKey] ?? ''));
                    if ($expirationRaw !== '') {
                        $expiration = $this->normalizeImportDate($expirationRaw);
                        if (!$expiration) { $errors[] = "Fila {$line}: la fecha de vencimiento \"{$expirationRaw}\" no es valida"; continue; }
                    }
                }

                $cost = 0.0;
                if ($costKey !== '') $cost = (float)($this->importDecimal(trim((string)($row[$costKey] ?? ""))) ?? 0);

                $parsed[] = [
                    'article_id' => $articleId,
                    'lot' => $lotKey !== '' ? trim((string)($row[$lotKey] ?? '')) : '',
                    'expiration_date' => $expiration,
                    'location' => $locationKey !== '' ? trim((string)($row[$locationKey] ?? '')) : '',
                    'quantity' => (float)$quantity,
                    'cost_unit' => $cost,
                ];
            }

            if (count($errors) > 0) {
                throw new \Exception('El archivo tiene errores y no se importo nada:' . PHP_EOL . implode(PHP_EOL, array_slice($errors, 0, 10))
                    . (count($errors) > 10 ? PHP_EOL . '... y ' . (count($errors) - 10) . ' error(es) mas' : ''));
            }
            if (count($parsed) === 0) throw new \Exception('El archivo no tiene filas con datos para importar');

            DB::beginTransaction();

            $entryNote = EntryNote::create([
                'business_id' => $business->id,
                'business_branch_id' => $warehouse->business_branch_id,
                'warehouse_id' => $warehouse->id,
                'client_id' => $clientId,
                'entry_date' => now()->toDateString(),
                'document_type' => 'Guia Remision',
                'document_date' => now()->toDateString(),
                'currency' => 'PEN',
                'observations' => 'Carga masiva de stock desde archivo.',
                'status' => true,
                'entry_status' => 'approved',
                'created_by' => Auth::id(),
                'updated_by' => Auth::id(),
            ]);
            $entryNote->code = 'NE-CM-' . str_pad((string)$entryNote->id, 5, '0', STR_PAD_LEFT);
            $entryNote->save();

            foreach ($parsed as $item) {
                EntryNoteItem::create([
                    'entry_note_id' => $entryNote->id,
                    'article_id' => $item['article_id'],
                    'warehouse_id' => $warehouse->id,
                    'lot' => $item['lot'] ?: null,
                    'batch_code' => $item['lot'] ?: null,
                    'expiration_date' => $item['expiration_date'],
                    'location' => $item['location'] ?: null,
                    'quantity' => $item['quantity'],
                    'received_quantity' => $item['quantity'],
                    'cost_unit' => $item['cost_unit'],
                    'total' => round($item['quantity'] * $item['cost_unit'], 2),
                    'status' => true,
                ]);
            }

            DB::commit();

            $response->status = 200;
            $response->message = "Se cargo el stock en la nota de entrada {$entryNote->code}: " . count($parsed) . ' linea(s).';
            $response->data = [
                'entry_note_id' => $entryNote->id,
                'entry_note_code' => $entryNote->code,
                'imported' => count($parsed),
                'client_name' => $client->full_name ?? null,
            ];
        } catch (\Throwable $th) {
            if (DB::transactionLevel() > 0) DB::rollBack();
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    // La clase base declara estos helpers como private, asi que aqui se definen aparte.
    private function importInt($value): ?int
    {
        $text = trim((string)$value);
        return $text === '' || !is_numeric($text) ? null : (int)$text;
    }

    private function importDecimal($value): ?float
    {
        $text = str_replace(',', '.', trim((string)$value));
        return $text === '' || !is_numeric($text) ? null : (float)$text;
    }

    private function normalizeImportText($value): string
    {
        $text = trim((string)$value);
        if ($text === '') return '';
        $text = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text) ?: $text;
        $text = strtolower($text);
        return preg_replace('/[^a-z0-9]/', '', $text) ?? '';
    }

    /** Acepta 2027-05-31, 31/05/2027, 31-05-2027 y el numero de serie de fecha de Excel. */
    private function normalizeImportDate(string $value): ?string
    {
        $text = trim($value);
        if ($text === '') return null;

        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $text)) return $text;

        if (preg_match('/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/', $text, $m)) {
            $day = (int)$m[1]; $month = (int)$m[2]; $year = (int)$m[3];
            if (checkdate($month, $day, $year)) return sprintf('%04d-%02d-%02d', $year, $month, $day);
            return null;
        }

        if (preg_match('/^\d{5}$/', $text)) {
            // Serie de fecha de Excel: dias desde 1899-12-30.
            return date('Y-m-d', strtotime('1899-12-30 +' . (int)$text . ' days'));
        }

        $timestamp = strtotime($text);
        return $timestamp ? date('Y-m-d', $timestamp) : null;
    }
}
