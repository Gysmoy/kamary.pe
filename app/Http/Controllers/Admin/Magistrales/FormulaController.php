<?php

namespace App\Http\Controllers\Admin\Magistrales;

use App\Http\Controllers\BasicController;
use App\Http\Controllers\Admin\Magistrales\Concerns\RunsMagistralSaveInTransaction;
use App\Models\Article;
use App\Models\MagistralFormula;
use App\Models\MagistralFormulaHistory;
use App\Models\MagistralFormulaItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;

class FormulaController extends BasicController
{
    use RunsMagistralSaveInTransaction;

    public $model = MagistralFormula::class;
    public $reactView = 'Admin/Magistrales/Formulas';
    public $prefix4filter = 'magistral_formulas';

    private array $parsedItems = [];

    public function setReactViewProperties(Request $request)
    {
        return [
            'moduleTitle' => 'Magistrales - Formulas',
            'requiredPermission' => 'magistrales-formulas',
        ];
    }

    public function setPaginationInstance(string $model)
    {
        return $model::select('magistral_formulas.*')
            ->with([
                'article:id,code,name',
                'items:id,magistral_formula_id,article_id,total_units,code,description,quantity,presentation,total_quantity,unit_price,subtotal,status',
                'items.article:id,code,name,unit_id',
                'items.article.unit:id,name,symbol',
                'lastEditor:id,name,lastname,username,fullname',
                'histories:id,magistral_formula_id,detail,change_reason,edited_by,created_at',
                'histories.editor:id,name,lastname,username,fullname',
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ])
            ->leftJoin('articles as article', 'article.id', '=', 'magistral_formulas.article_id')
            ->leftJoin('users as last_editor', 'last_editor.id', '=', 'magistral_formulas.last_edited_by')
            ->leftJoin('users as creator', 'creator.id', '=', 'magistral_formulas.created_by')
            ->leftJoin('users as updater', 'updater.id', '=', 'magistral_formulas.updated_by');
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $id = $body['id'] ?? null;
        $articleId = $this->toNullableInt($body['article_id'] ?? null);
        if (!$articleId) throw new \Exception('El articulo es obligatorio');
        $this->findMagistralArticle($articleId);

        $exists = MagistralFormula::where('article_id', $articleId)
            ->when($id, fn($query) => $query->where('id', '!=', $id))
            ->exists();
        if ($exists) throw new \Exception('Ya existe una formula magistral para este articulo');

        $this->parsedItems = $this->parseItems(is_array($body['items'] ?? null) ? $body['items'] : []);

        if (!$id) {
            $body['created_by'] = Auth::id();
            $body['status'] = true;
        }

        $body['updated_by'] = Auth::id();
        $body['last_edited_by'] = Auth::id();
        $body['last_edited_at'] = now();
        $body['article_id'] = $articleId;
        $body['detail'] = trim((string)($body['detail'] ?? '')) ?: null;
        foreach ($this->structuredFields() as $field) {
            $body[$field] = trim((string)($body[$field] ?? '')) ?: null;
        }

        unset($body['items']);
        unset($body['change_reason']);
        return $body;
    }

    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        MagistralFormulaItem::where('magistral_formula_id', $jpa->id)->delete();

        foreach ($this->parsedItems as $item) {
            MagistralFormulaItem::create(array_merge($item, [
                'magistral_formula_id' => $jpa->id,
                'status' => true,
            ]));
        }

        $changeReason = trim((string)$request->input('change_reason', ''));
        if ($changeReason === '') {
            $changeReason = $isNew ? 'Creacion de formula' : 'Actualizacion de formula';
        }

        $history = [
            'magistral_formula_id' => $jpa->id,
            'article_id' => $jpa->article_id,
            'detail' => $jpa->detail,
            'change_reason' => $changeReason,
            'edited_by' => Auth::id(),
            'items_snapshot' => $this->parsedItems,
        ];
        foreach ($this->structuredFields() as $field) {
            $history[$field] = $jpa->{$field};
        }

        MagistralFormulaHistory::create($history);

        return $jpa->fresh(['article', 'items.article.unit', 'lastEditor', 'histories.editor', 'creator', 'updater']);
    }

    private function parseItems(array $items): array
    {
        $parsed = [];

        foreach ($items as $index => $item) {
            if (!is_array($item)) continue;

            $articleId = $this->toNullableInt($item['article_id'] ?? null);
            $article = $articleId ? $this->findMagistralArticle($articleId) : null;
            $code = trim((string)($item['code'] ?? ''));
            $description = trim((string)($item['description'] ?? ''));
            $presentation = trim((string)($item['presentation'] ?? ''));

            if ($article) {
                if ($code === '') $code = (string)$article->code;
                if ($description === '') $description = (string)$article->name;
                if ($presentation === '') $presentation = $article->unit?->symbol ?: $article->unit?->name ?: null;
            }

            $totalUnits = $this->toNullableDecimal($item['total_units'] ?? null) ?? 0;
            $quantity = $this->toNullableDecimal($item['quantity'] ?? null) ?? 0;
            $totalQuantity = $this->toNullableDecimal($item['total_quantity'] ?? null);
            $unitPrice = $this->toNullableDecimal($item['unit_price'] ?? null) ?? 0;
            $subtotal = $this->toNullableDecimal($item['subtotal'] ?? null);

            if (!$articleId && $code === '' && $description === '' && $presentation === '' && $totalUnits == 0 && $quantity == 0 && ($totalQuantity ?? 0) == 0 && $unitPrice == 0) {
                continue;
            }

            if ($quantity <= 0) throw new \Exception('La cantidad del insumo ' . ($index + 1) . ' debe ser mayor a 0');
            if ($totalUnits < 0) throw new \Exception('Las unidades totales del insumo ' . ($index + 1) . ' no pueden ser negativas');
            if ($unitPrice < 0) throw new \Exception('El precio del insumo ' . ($index + 1) . ' no puede ser negativo');

            $resolvedTotalQuantity = $totalQuantity ?? (($totalUnits > 0 ? $totalUnits : 1) * $quantity);
            if ($resolvedTotalQuantity < 0) throw new \Exception('La cantidad total del insumo ' . ($index + 1) . ' no puede ser negativa');

            $parsed[] = [
                'article_id' => $articleId,
                'total_units' => $totalUnits,
                'code' => $code ?: null,
                'description' => $description ?: null,
                'quantity' => $quantity,
                'presentation' => $presentation ?: null,
                'total_quantity' => $resolvedTotalQuantity,
                'unit_price' => $unitPrice,
                'subtotal' => $subtotal ?? ($resolvedTotalQuantity * $unitPrice),
            ];
        }

        return $parsed;
    }

    private function findMagistralArticle(int $articleId): Article
    {
        return Article::query()
            ->with('unit:id,name,symbol')
            ->when(Schema::hasColumn('articles', 'module_scope'), fn($query) => $query->where('module_scope', 'magistrales'))
            ->findOrFail($articleId);
    }

    private function structuredFields(): array
    {
        return [
            'special_preparation_conditions',
            'specialized_equipment',
            'preparation_instructions',
            'preparation_method',
            'conservation',
            'stability',
            'usage',
            'others',
        ];
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
}
