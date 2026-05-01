<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\Article;
use App\Models\Client;
use App\Models\ClientDistributionNetwork;
use App\Models\EventualClient;
use App\Models\Laboratory;
use App\Models\PriceList;
use App\Models\PriceListItem;
use App\Models\Warehouse;
use App\Support\BusinessScope;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use SoDe\Extend\Response;

class PriceListController extends BasicController
{
    public $model = PriceList::class;
    public $reactView = 'Admin/PriceLists';
    public $prefix4filter = 'price_lists';

    private array $itemsPayload = [];

    public function setReactViewProperties(Request $request)
    {
        return [
            'requiredPermission' => 'pricing',
        ];
    }

    public function setPaginationInstance(string $model)
    {
        $query = $model::select('price_lists.*')
            ->with([
                'business:id,name',
                'branch:id,business_id,name',
                'warehouse:id,name',
                'client:id,full_name,short_code,document_number',
                'eventualClient:id,business_name,document_number',
                'distributionNetwork:id,client_id,code,name',
                'items:id,price_list_id,article_id,laboratory_id,category,subcategory,fixed_price,margin_percent,minimum_quantity,status',
                'items.article:id,code,name,laboratory_id,unit_id',
                'items.article.laboratory:id,name',
                'items.laboratory:id,name',
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ])
            ->join('users as creator', 'creator.id', '=', 'price_lists.created_by')
            ->join('users as updater', 'updater.id', '=', 'price_lists.updated_by')
            ->join('businesses as business', 'business.id', '=', 'price_lists.business_id');

        $scopeKey = BusinessScope::scopedKeyForRequest(request());
        $query->whereIn('business.business_key', BusinessScope::fixedKeys());
        if ($scopeKey) {
            $query->where('business.business_key', $scopeKey);
        }

        return $query;
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $userId = Auth::id();
        $id = $body['id'] ?? null;

        $businessId = (int)($body['business_id'] ?? 0);
        $branchId = $this->toNullableInt($body['business_branch_id'] ?? null);
        $warehouseId = $this->toNullableInt($body['warehouse_id'] ?? null);
        $clientId = $this->toNullableInt($body['client_id'] ?? null);
        $eventualClientId = $this->toNullableInt($body['eventual_client_id'] ?? null);
        $networkId = $this->toNullableInt($body['client_distribution_network_id'] ?? null);
        $code = trim((string)($body['code'] ?? ''));

        if ($businessId <= 0) throw new \Exception('La empresa es obligatoria');
        $business = BusinessScope::findFixedBusinessForRequest($businessId, $request);

        if ($warehouseId) {
            $warehouse = Warehouse::findOrFail($warehouseId);
            $branchId = BusinessScope::branchIdFromWarehouse($business, $warehouse, $branchId);
        } elseif ($branchId) {
            BusinessScope::requireBranchForBusiness($business, $branchId);
        }

        if ($clientId && $eventualClientId) {
            throw new \Exception('No puedes asociar cliente regular y cliente eventual al mismo tarifario');
        }

        if ($clientId) {
            $client = Client::findOrFail($clientId);
            if ($client->client_kind !== 'regular') throw new \Exception('El cliente asociado debe ser regular');
        }

        if ($eventualClientId) {
            EventualClient::findOrFail($eventualClientId);
        }

        if ($networkId) {
            $network = ClientDistributionNetwork::findOrFail($networkId);
            if ($clientId && (int)$network->client_id !== (int)$clientId) {
                throw new \Exception('La red de distribucion no pertenece al cliente seleccionado');
            }
            if (!$clientId) {
                $clientId = (int)$network->client_id;
            }
        }

        $rawItems = $body['items'] ?? [];
        if (is_string($rawItems)) {
            $decoded = json_decode($rawItems, true);
            $rawItems = is_array($decoded) ? $decoded : [];
        }
        if (!is_array($rawItems)) $rawItems = [];
        $this->itemsPayload = $rawItems;
        unset($body['items']);

        if (!$id) {
            $body['code'] = $code !== '' ? $code : $this->nextCode();
            $body['created_by'] = $userId;
            $body['status'] = true;
        } else {
            $body['code'] = $code !== '' ? $code : PriceList::findOrFail($id)->code;
        }

        $exists = PriceList::where('code', $body['code'])
            ->when($id, fn($query) => $query->where('id', '!=', $id))
            ->exists();
        if ($exists) throw new \Exception('Ya existe un tarifario con este codigo');

        $body['updated_by'] = $userId;
        $body['business_id'] = $businessId;
        $body['business_branch_id'] = $branchId;
        $body['warehouse_id'] = $warehouseId;
        $body['client_id'] = $clientId;
        $body['eventual_client_id'] = $eventualClientId;
        $body['client_distribution_network_id'] = $networkId;
        $body['channel'] = trim((string)($body['channel'] ?? '')) ?: null;
        $body['segment'] = trim((string)($body['segment'] ?? '')) ?: null;
        $body['currency'] = strtoupper(trim((string)($body['currency'] ?? 'PEN')));
        $body['priority'] = $this->toNullableInt($body['priority'] ?? null) ?? 100;
        $body['starts_at'] = $this->normalizeDate($body['starts_at'] ?? null);
        $body['ends_at'] = $this->normalizeDate($body['ends_at'] ?? null);
        $body['observations'] = trim((string)($body['observations'] ?? '')) ?: null;

        if ($body['starts_at'] && $body['ends_at'] && $body['starts_at'] > $body['ends_at']) {
            throw new \Exception('La vigencia final no puede ser menor a la inicial');
        }

        return $body;
    }

    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        DB::beginTransaction();
        try {
            PriceListItem::where('price_list_id', $jpa->id)->delete();

            $inserted = 0;
            foreach ($this->itemsPayload as $item) {
                if (!is_array($item)) continue;

                $articleId = $this->toNullableInt($item['article_id'] ?? null);
                $laboratoryId = $this->toNullableInt($item['laboratory_id'] ?? null);
                $category = trim((string)($item['category'] ?? '')) ?: null;
                $subcategory = trim((string)($item['subcategory'] ?? '')) ?: null;
                $fixedPrice = $this->toNullableDecimal($item['fixed_price'] ?? null);
                $marginPercent = $this->toNullableDecimal($item['margin_percent'] ?? null);
                $minimumQuantity = $this->toNullableDecimal($item['minimum_quantity'] ?? null) ?? 1;
                $status = array_key_exists('status', $item) ? (bool)$item['status'] : true;

                if (!$status) continue;
                if (!$articleId && !$laboratoryId && !$category && !$subcategory) {
                    throw new \Exception('Cada regla debe apuntar al menos a un articulo, laboratorio o categoria');
                }
                if (is_null($fixedPrice) && is_null($marginPercent)) {
                    throw new \Exception('Cada regla debe tener precio fijo o margen');
                }
                if (!is_null($fixedPrice) && !is_null($marginPercent)) {
                    throw new \Exception('Una regla no debe mezclar precio fijo y margen al mismo tiempo');
                }
                if ($minimumQuantity <= 0) {
                    throw new \Exception('La cantidad minima debe ser mayor a cero');
                }

                if ($articleId) Article::findOrFail($articleId);
                if ($laboratoryId) Laboratory::findOrFail($laboratoryId);

                PriceListItem::create([
                    'price_list_id' => $jpa->id,
                    'article_id' => $articleId,
                    'laboratory_id' => $laboratoryId,
                    'category' => $category,
                    'subcategory' => $subcategory,
                    'fixed_price' => $fixedPrice,
                    'margin_percent' => $marginPercent,
                    'minimum_quantity' => $minimumQuantity,
                    'status' => true,
                ]);
                $inserted++;
            }

            if ($inserted === 0) throw new \Exception('Debes agregar al menos una regla de tarifario');

            DB::commit();
            return $jpa->fresh([
                'business',
                'branch',
                'warehouse',
                'client',
                'eventualClient',
                'distributionNetwork',
                'items.article.laboratory',
                'items.laboratory',
                'creator',
                'updater',
            ]);
        } catch (\Throwable $th) {
            DB::rollBack();
            throw $th;
        }
    }

    public function branches(Request $request, string $businessId): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            $business = BusinessScope::findFixedBusinessForRequest($businessId, $request);
            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = $business->branches()->whereNotNull('status')->orderBy('name')->get(['id', 'business_id', 'name', 'status']);
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    private function toNullableDecimal($value): ?float
    {
        if ($value === null) return null;
        $text = trim((string)$value);
        if ($text === '') return null;
        if (!is_numeric($text)) throw new \Exception("Valor numerico invalido: {$value}");
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

    private function nextCode(): string
    {
        $next = 1;
        $latest = PriceList::query()->latest('id')->value('code');
        if ($latest && preg_match('/(\d+)$/', $latest, $matches)) {
            $next = ((int)$matches[1]) + 1;
        }
        return 'TAR-' . str_pad((string)$next, 6, '0', STR_PAD_LEFT);
    }
}
