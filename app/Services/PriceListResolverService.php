<?php

namespace App\Services;

use App\Models\Article;
use App\Models\ArticlePresentation;
use App\Models\PriceList;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class PriceListResolverService
{
    public function matchingPriceListsForContext(array $context): Collection
    {
        return $this->matchingPriceLists($context);
    }

    public function resolve(array $context, Article $article, float $quantity, ?int $presentationId = null): array
    {
        $presentation = $presentationId
            ? ArticlePresentation::where('id', $presentationId)->where('article_id', $article->id)->first()
            : null;
        $fallbackPrice = round((float)($presentation->price ?? $this->fallbackPresentationPrice($article)), 4);
        $baseCost = round((float)$this->latestCost($article->id), 4);

        $priceLists = $this->matchingPriceLists($context);

        foreach ($priceLists as $priceList) {
            $rule = $this->resolveRule($priceList->items, $article, $quantity);
            if (!$rule) continue;

            $price = !is_null($rule->fixed_price)
                ? round((float)$rule->fixed_price, 4)
                : round(($baseCost > 0 ? $baseCost : $fallbackPrice) * (1 + ((float)$rule->margin_percent / 100)), 4);

            return [
                'price_list_id' => $priceList->id,
                'price_list_code' => $priceList->code,
                'price_list_item_id' => $rule->id,
                'price_unit' => $price,
                'base_cost' => $baseCost > 0 ? $baseCost : $fallbackPrice,
                'source' => !is_null($rule->fixed_price) ? 'price-list-fixed' : 'price-list-margin',
            ];
        }

        return [
            'price_list_id' => null,
            'price_list_code' => null,
            'price_list_item_id' => null,
            'price_unit' => $fallbackPrice,
            'base_cost' => $baseCost > 0 ? $baseCost : $fallbackPrice,
            'source' => 'fallback',
        ];
    }

    private function matchingPriceLists(array $context): Collection
    {
        $issueDate = $context['issue_date'] ?? now()->toDateString();
        $businessId = (int)($context['business_id'] ?? 0);
        $branchId = isset($context['business_branch_id']) && $context['business_branch_id'] !== '' ? (int)$context['business_branch_id'] : null;
        $warehouseId = isset($context['warehouse_id']) && $context['warehouse_id'] !== '' ? (int)$context['warehouse_id'] : null;
        $priceListId = $this->nullableInt($context['price_list_id'] ?? null);

        return PriceList::with('items')
            ->where('business_id', $businessId)
            ->where('status', 1)
            ->when($priceListId, fn($query) => $query->where('id', $priceListId))
            ->where(function ($query) use ($branchId) {
                $query->whereNull('business_branch_id');
                if ($branchId) {
                    $query->orWhere('business_branch_id', $branchId);
                }
            })
            ->where(function ($query) use ($warehouseId) {
                $query->whereNull('warehouse_id');
                if ($warehouseId) {
                    $query->orWhere('warehouse_id', $warehouseId);
                }
            })
            ->where(function ($query) use ($issueDate) {
                $query->whereNull('starts_at')->orWhere('starts_at', '<=', $issueDate);
            })
            ->where(function ($query) use ($issueDate) {
                $query->whereNull('ends_at')->orWhere('ends_at', '>=', $issueDate);
            })
            ->get()
            ->map(function ($priceList) use ($context) {
                $priceList->scope_score = $this->scopeScore($priceList, $context);
                return $priceList;
            })
            ->filter(fn($priceList) => $priceList->scope_score >= 0)
            ->sort(function ($a, $b) {
                $scoreCompare = $b->scope_score <=> $a->scope_score;
                if ($scoreCompare !== 0) return $scoreCompare;
                $priorityCompare = ((int)$a->priority) <=> ((int)$b->priority);
                if ($priorityCompare !== 0) return $priorityCompare;
                return $a->id <=> $b->id;
            })
            ->values();
    }

    private function resolveRule(Collection $items, Article $article, float $quantity)
    {
        return $items
            ->filter(function ($item) use ($article, $quantity) {
                if ($item->status === null || $item->status === false) return false;
                if ((float)$item->minimum_quantity > $quantity) return false;
                return $this->ruleScore($item, $article) >= 0;
            })
            ->sort(function ($a, $b) use ($article) {
                $scoreCompare = $this->ruleScore($b, $article) <=> $this->ruleScore($a, $article);
                if ($scoreCompare !== 0) return $scoreCompare;
                $minQtyCompare = round((float)$b->minimum_quantity, 3) <=> round((float)$a->minimum_quantity, 3);
                if ($minQtyCompare !== 0) return $minQtyCompare;
                return $a->id <=> $b->id;
            })
            ->first();
    }

    private function scopeScore(PriceList $priceList, array $context): int
    {
        $clientId = $this->nullableInt($context['client_id'] ?? null);
        $eventualClientId = $this->nullableInt($context['eventual_client_id'] ?? null);
        $networkId = $this->nullableInt($context['client_distribution_network_id'] ?? null);
        $channel = $this->nullableString($context['commercial_channel'] ?? $context['channel'] ?? null);
        $segment = $this->nullableString($context['segment'] ?? null);
        $branchId = $this->nullableInt($context['business_branch_id'] ?? null);
        $warehouseId = $this->nullableInt($context['warehouse_id'] ?? null);

        if ($eventualClientId) {
            if ($priceList->client_id || $priceList->client_distribution_network_id) return -1;
            if ($priceList->eventual_client_id && (int)$priceList->eventual_client_id !== $eventualClientId) return -1;
        } else {
            if ($priceList->eventual_client_id) return -1;
            if ($priceList->client_id && (int)$priceList->client_id !== $clientId) return -1;
            if ($priceList->client_distribution_network_id && (int)$priceList->client_distribution_network_id !== $networkId) return -1;
        }

        if ($priceList->business_branch_id && (int)$priceList->business_branch_id !== $branchId) return -1;
        if ($priceList->warehouse_id && (int)$priceList->warehouse_id !== $warehouseId) return -1;
        if ($priceList->channel && mb_strtolower($priceList->channel) !== mb_strtolower((string)$channel)) return -1;
        if ($priceList->segment && mb_strtolower($priceList->segment) !== mb_strtolower((string)$segment)) return -1;

        $score = 0;
        if ($priceList->business_branch_id) $score += 8;
        if ($priceList->warehouse_id) $score += 16;
        if ($priceList->client_id) $score += 32;
        if ($priceList->eventual_client_id) $score += 32;
        if ($priceList->client_distribution_network_id) $score += 48;
        if ($priceList->channel) $score += 4;
        if ($priceList->segment) $score += 2;

        return $score;
    }

    private function ruleScore($item, Article $article): int
    {
        $score = 0;

        if ($item->article_id) {
            if ((int)$item->article_id !== (int)$article->id) return -1;
            $score += 64;
        }

        if ($item->laboratory_id) {
            if ((int)$item->laboratory_id !== (int)$article->laboratory_id) return -1;
            $score += 32;
        }

        // El proyecto aun no tiene categoria/subcategoria normalizadas en articulos.
        if ($item->category || $item->subcategory) {
            return -1;
        }

        return $score;
    }

    private function latestCost(int $articleId): float
    {
        $receiptCost = DB::table('purchase_receipt_items as item')
            ->join('purchase_receipts as receipt', 'receipt.id', '=', 'item.purchase_receipt_id')
            ->where('item.article_id', $articleId)
            ->where('item.status', 1)
            ->where('receipt.status', 1)
            ->where('receipt.receipt_status', 'confirmed')
            ->orderByDesc('receipt.issue_date')
            ->orderByDesc('item.id')
            ->value('item.cost_unit');

        if (!is_null($receiptCost)) {
            return (float)$receiptCost;
        }

        $entryCost = DB::table('entry_note_items as item')
            ->join('entry_notes as note', 'note.id', '=', 'item.entry_note_id')
            ->where('item.article_id', $articleId)
            ->where('item.status', 1)
            ->where('note.status', 1)
            ->orderByDesc('note.created_at')
            ->orderByDesc('item.id')
            ->value('item.cost_unit');

        return (float)($entryCost ?? 0);
    }

    private function fallbackPresentationPrice(Article $article): float
    {
        return (float)$article->presentations()->value('price');
    }

    private function nullableInt($value): ?int
    {
        if ($value === null || $value === '') return null;
        return (int)$value;
    }

    private function nullableString($value): ?string
    {
        if ($value === null) return null;
        $text = trim((string)$value);
        return $text === '' ? null : $text;
    }
}
