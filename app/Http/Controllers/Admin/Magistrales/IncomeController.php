<?php

namespace App\Http\Controllers\Admin\Magistrales;

use App\Http\Controllers\BasicController;
use App\Http\Controllers\Admin\Magistrales\Concerns\RunsMagistralSaveInTransaction;
use App\Models\Article;
use App\Models\EntryNote;
use App\Models\EntryNoteItem;
use App\Support\MagistralesWarehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use SoDe\Extend\Response;

/**
 * Magistrales - Nota de Entrada.
 *
 * Guarda/lee directamente sobre el ledger general (entry_notes / entry_note_items), en el
 * almacen fijo de Magistrales, en vez de las tablas viejas magistral_incomes/magistral_income_items
 * (ya retiradas). Los registros se identifican por el prefijo de codigo 'ING-MAG-' para no
 * mezclarse con otras notas de entrada generales ni con las de produccion (OPP-MAG-) que
 * tambien caen en el mismo almacen.
 *
 * El shape que expone `setPaginationInstance` se mantiene igual al que consumia el front
 * (resources/js/Admin/Magistrales/Incomes.jsx), incluyendo campos derivados (no persistidos
 * en entry_notes/entry_note_items) como item.description, item.price_with_igv, item.subtotal
 * y note.subtotal/igv/total.
 */
class IncomeController extends BasicController
{
    use RunsMagistralSaveInTransaction;

    private const CODE_PREFIX = 'ING-MAG-';

    public $model = EntryNote::class;
    public $reactView = 'Admin/Magistrales/Incomes';
    public $prefix4filter = 'entry_notes';

    private array $parsedItems = [];

    public function setReactViewProperties(Request $request)
    {
        return [
            'moduleTitle' => 'Magistrales - Nota de Entrada',
            'requiredPermission' => ['magistrales-incomes', 'magistrales-procurement'],
            'fixedWarehouse' => MagistralesWarehouse::summary(),
        ];
    }

    public function setPaginationInstance(string $model)
    {
        return $model::select('entry_notes.*')
            ->selectRaw("(select coalesce(round(sum(sub.quantity * sub.cost_unit), 2), 0) from entry_note_items sub where sub.entry_note_id = entry_notes.id and sub.status = 1) as subtotal")
            ->selectRaw('0 as igv')
            ->selectRaw("(select coalesce(round(sum(sub.quantity * sub.cost_unit), 2), 0) from entry_note_items sub where sub.entry_note_id = entry_notes.id and sub.status = 1) as total")
            ->where('entry_notes.warehouse_id', MagistralesWarehouse::id())
            ->where('entry_notes.code', 'like', self::CODE_PREFIX . '%')
            ->with([
                'business:id,name',
                'warehouse:id,name',
                'supplier:id,ruc,business_name',
                'items' => function ($query) {
                    $query->select('entry_note_items.*')
                        ->selectRaw('(select a.name from articles a where a.id = entry_note_items.article_id) as description')
                        ->selectRaw('entry_note_items.cost_unit as price_without_igv')
                        ->selectRaw('entry_note_items.cost_unit as price_with_igv')
                        ->selectRaw('round(entry_note_items.quantity * entry_note_items.cost_unit, 2) as subtotal')
                        ->orderBy('entry_note_items.id');
                },
                'items.article:id,code,name',
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ])
            ->leftJoin('businesses as business', 'business.id', '=', 'entry_notes.business_id')
            ->leftJoin('warehouses as warehouse', 'warehouse.id', '=', 'entry_notes.warehouse_id')
            ->leftJoin('suppliers as supplier', 'supplier.id', '=', 'entry_notes.supplier_id')
            ->leftJoin('users as creator', 'creator.id', '=', 'entry_notes.created_by')
            ->leftJoin('users as updater', 'updater.id', '=', 'entry_notes.updated_by');
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $id = $body['id'] ?? null;
        $code = trim((string)($body['code'] ?? ''));
        if ($code === '') $code = $this->nextCode();

        $exists = EntryNote::whereRaw('LOWER(code) = ?', [mb_strtolower($code)])
            ->when($id, fn($query) => $query->where('id', '!=', $id))
            ->exists();
        if ($exists) throw new \Exception('Ya existe un ingreso magistral con este codigo');

        $businessId = MagistralesWarehouse::summary()['business_id'] ?? null;
        if (!$businessId) {
            throw new \Exception('No se encontro la configuracion fija de Kamary Peru para Magistrales');
        }
        $warehouse = MagistralesWarehouse::warehouse();

        $this->parsedItems = $this->parseItems(is_array($request->items) ? $request->items : []);
        if (count($this->parsedItems) === 0) {
            throw new \Exception('Debes agregar al menos un articulo al ingreso');
        }

        $mapped = [
            'code' => $code,
            'business_id' => $businessId,
            'business_branch_id' => $warehouse->business_branch_id,
            'warehouse_id' => (int) $warehouse->id,
            'supplier_id' => $this->toNullableInt($body['supplier_id'] ?? null),
            'document_type' => trim((string)($body['document_type'] ?? '')) ?: null,
            'document_series' => trim((string)($body['document_series'] ?? '')) ?: null,
            'document_sequence' => trim((string)($body['document_sequence'] ?? '')) ?: null,
            'document_file' => trim((string)($body['file_path'] ?? '')) ?: null,
            'currency' => trim((string)($body['currency'] ?? '')) ?: 'PEN',
            'observations' => trim((string)($body['observations'] ?? '')) ?: null,
            'guide_series' => trim((string)($body['guide_series'] ?? '')) ?: null,
            'guide_sequence' => trim((string)($body['guide_sequence'] ?? '')) ?: null,
            'guide_ruc' => trim((string)($body['guide_ruc'] ?? '')) ?: null,
            'guide_file' => trim((string)($body['guide_file_path'] ?? '')) ?: null,
            'entry_date' => $this->normalizeDate($body['issue_date'] ?? null),
            'entry_status' => 'approved',
            'updated_by' => Auth::id(),
        ];

        if ($id) $mapped['id'] = $id;
        if (!$id) {
            $mapped['created_by'] = Auth::id();
            $mapped['status'] = true;
        }

        return $mapped;
    }

    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        DB::beginTransaction();
        try {
            if (!$jpa->code) {
                $jpa->code = $this->nextCode();
                $jpa->save();
            }

            EntryNoteItem::where('entry_note_id', $jpa->id)->delete();

            $warehouseId = (int) $jpa->warehouse_id;
            foreach ($this->parsedItems as $item) {
                EntryNoteItem::create([
                    'entry_note_id' => $jpa->id,
                    'article_id' => $item['article_id'],
                    'warehouse_id' => $warehouseId,
                    'lot' => $item['lot'],
                    'batch_code' => $item['lot'],
                    'expiration_date' => $item['expiration_date'],
                    'quantity' => $item['quantity'],
                    'requested_quantity' => $item['quantity'],
                    'received_quantity' => $item['quantity'],
                    'cost_unit' => $item['cost_unit'],
                    'total' => round($item['quantity'] * $item['cost_unit'], 2),
                    'stock' => 0,
                    'status' => true,
                ]);
            }

            DB::commit();

            return $jpa->fresh(['business', 'warehouse', 'supplier', 'items.article', 'creator', 'updater']);
        } catch (\Throwable $th) {
            DB::rollBack();
            throw $th;
        }
    }

    public function delete(Request $request, string $id)
    {
        $response = new Response();
        try {
            $updated = EntryNote::where('id', $id)
                ->where('code', 'like', self::CODE_PREFIX . '%')
                ->update([
                    'status' => null,
                    'entry_status' => 'cancelled',
                    'updated_by' => Auth::id(),
                ]);
            if (!$updated) throw new \Exception('No se ha eliminado ningun registro');

            $response->status = 200;
            $response->message = 'Operacion correcta';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    private function nextCode(): string
    {
        // entry_notes mezcla varias familias de codigo (ING-MAG-, OPP-MAG-, notas generales)
        // en la misma tabla, asi que el id mas alto no necesariamente tiene el numero de
        // codigo mas alto: se calcula el maximo real sobre el sufijo numerico de todos los
        // codigos con este prefijo en vez de asumir el orden de insercion.
        $max = (int) EntryNote::where('code', 'like', self::CODE_PREFIX . '%')
            ->selectRaw('MAX(CAST(SUBSTRING(code, ?) AS UNSIGNED)) as max_num', [strlen(self::CODE_PREFIX) + 1])
            ->value('max_num');

        return self::CODE_PREFIX . str_pad((string)($max + 1), 6, '0', STR_PAD_LEFT);
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

    private function toNullableInt($value): ?int
    {
        if ($value === null) return null;
        $text = trim((string)$value);
        if ($text === '') return null;
        if (!ctype_digit(ltrim($text, '+'))) throw new \Exception("Valor entero invalido: {$value}");
        return (int)$text;
    }

    private function toNullableDecimal($value): ?float
    {
        if ($value === null) return null;
        $text = trim((string)$value);
        if ($text === '') return null;
        if (!is_numeric($text)) throw new \Exception("Valor numerico invalido: {$value}");
        return (float)$text;
    }

    private function parseItems(array $items): array
    {
        $parsed = [];

        foreach ($items as $index => $item) {
            if (!is_array($item)) continue;

            $articleId = $this->toNullableInt($item['article_id'] ?? null);
            if (!$articleId) {
                throw new \Exception('Debes seleccionar un articulo para el item ' . ($index + 1));
            }

            Article::query()
                ->when(Schema::hasColumn('articles', 'module_scope'), fn($query) => $query->where('module_scope', 'magistrales'))
                ->findOrFail($articleId);

            $quantity = $this->toNullableDecimal($item['quantity'] ?? null) ?? 0;
            $priceWithoutIgv = $this->toNullableDecimal($item['price_without_igv'] ?? null) ?? 0;
            $expirationDate = $this->normalizeDate($item['expiration_date'] ?? null);
            $lot = trim((string)($item['lot'] ?? '')) ?: null;

            if ($quantity <= 0) throw new \Exception('La cantidad del item ' . ($index + 1) . ' debe ser mayor a 0');
            if ($priceWithoutIgv < 0) throw new \Exception('El precio del item ' . ($index + 1) . ' no puede ser negativo');

            $parsed[] = [
                'article_id' => $articleId,
                'quantity' => $quantity,
                'cost_unit' => $priceWithoutIgv,
                'lot' => $lot,
                'expiration_date' => $expirationDate,
            ];
        }

        return $parsed;
    }
}
