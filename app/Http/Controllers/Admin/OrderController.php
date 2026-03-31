<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\Article;
use App\Models\ArticlePresentation;
use App\Models\Business;
use App\Models\Client;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use SoDe\Extend\Response;

class OrderController extends BasicController
{
    public $model = Order::class;
    public $reactView = 'Admin/Orders';
    public $prefix4filter = 'orders';

    private array $itemsPayload = [];

    public function setPaginationInstance(string $model)
    {
        return $model::select('orders.*')
            ->with([
                'business:id,name',
                'branch:id,business_id,name',
                'warehouse:id,name',
                'client:id,document_type,document_number,full_name',
                'items:id,order_id,article_id,presentation_id,warehouse_id,stock,price_unit,presentation_units,quantity,total,status',
                'items.article:id,code,name,laboratory_id,active_principle_id,unit_id',
                'items.article.laboratory:id,name',
                'items.article.activePrinciple:id,name',
                'items.article.unit:id,name,symbol',
                'items.article.presentations:id,article_id,name,units,price,status',
                'items.presentation:id,article_id,name,units,price',
                'items.warehouse:id,name',
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ])
            ->join('users as creator', 'creator.id', '=', 'orders.created_by')
            ->join('users as updater', 'updater.id', '=', 'orders.updated_by');
    }

    public function beforeSave(Request $request)
    {
        $body = $request->all();
        $userId = Auth::id();

        $businessId = $body['business_id'] ?? null;
        $branchId = $body['business_branch_id'] ?? null;
        $warehouseId = $body['warehouse_id'] ?? null;
        $clientId = $body['client_id'] ?? null;
        $documentType = trim((string)($body['document_type'] ?? 'Factura'));
        $currency = strtoupper(trim((string)($body['currency'] ?? 'PEN')));
        $discountPercent = $this->toNullableDecimal($body['discount_percent'] ?? 1) ?? 1;

        if (!$businessId) throw new \Exception('La empresa es obligatoria');
        if (!$warehouseId) throw new \Exception('El almacen es obligatorio');
        if (!$clientId) throw new \Exception('El cliente es obligatorio');
        if ($discountPercent < 1 || $discountPercent > 5) throw new \Exception('El descuento debe estar entre 1% y 5%');

        Business::findOrFail($businessId);
        $warehouse = Warehouse::findOrFail($warehouseId);
        Client::findOrFail($clientId);

        $body['business_branch_id'] = ($branchId === '' || is_null($branchId)) ? null : (int)$branchId;
        if (!is_null($warehouse->business_branch_id)) {
            if (is_null($body['business_branch_id'])) {
                $body['business_branch_id'] = (int)$warehouse->business_branch_id;
            } else if ((int)$body['business_branch_id'] !== (int)$warehouse->business_branch_id) {
                throw new \Exception('El almacen seleccionado no pertenece a la sede elegida');
            }
        }

        if ($body['business_branch_id']) {
            $branch = Business::findOrFail($businessId)
                ->branches()
                ->where('id', $body['business_branch_id'])
                ->first();
            if (!$branch) throw new \Exception('La sede no pertenece a la empresa seleccionada');
        }

        $rawItems = $body['items'] ?? [];
        if (is_string($rawItems)) {
            $decoded = json_decode($rawItems, true);
            $rawItems = is_array($decoded) ? $decoded : [];
        }
        if (!is_array($rawItems)) $rawItems = [];
        $this->itemsPayload = $rawItems;
        unset($body['items']);

        if (!isset($body['id']) || !$body['id']) {
            $body['created_by'] = $userId;
            $body['status'] = true;
        }
        $body['updated_by'] = $userId;

        $body['document_type'] = $documentType !== '' ? $documentType : 'Factura';
        $body['currency'] = in_array($currency, ['PEN', 'USD', 'EUR']) ? $currency : 'PEN';
        $body['discount_percent'] = $discountPercent;
        $body['delivery_address'] = trim((string)($body['delivery_address'] ?? '')) ?: null;
        $body['purchase_order'] = trim((string)($body['purchase_order'] ?? '')) ?: null;
        $body['guide_number'] = trim((string)($body['guide_number'] ?? '')) ?: null;
        $body['dispatch_guide'] = trim((string)($body['dispatch_guide'] ?? '')) ?: null;
        $body['ubigeo'] = trim((string)($body['ubigeo'] ?? '')) ?: null;
        $body['map_lat'] = $this->toNullableDecimal($body['map_lat'] ?? null);
        $body['map_lng'] = $this->toNullableDecimal($body['map_lng'] ?? null);

        return $body;
    }

    public function afterSave(Request $request, object $jpa, bool $isNew)
    {
        DB::beginTransaction();
        try {
            OrderItem::where('order_id', $jpa->id)->delete();

            $inserted = 0;
            $subtotal = 0;
            foreach ($this->itemsPayload as $item) {
                if (!is_array($item)) continue;

                $articleId = $item['article_id'] ?? null;
                if (!$articleId) throw new \Exception('Cada linea debe tener articulo');
                $article = Article::with(['presentations:id,article_id,name,units,price,status'])->findOrFail($articleId);

                $presentationId = $item['presentation_id'] ?? null;
                $presentationUnits = $this->toNullableDecimal($item['presentation_units'] ?? null) ?? 1;
                if ($presentationId) {
                    $presentation = ArticlePresentation::where('id', $presentationId)
                        ->where('article_id', $article->id)
                        ->firstOrFail();
                    $presentationUnits = (float)($presentation->units ?? 1);
                }
                if ($presentationUnits <= 0) $presentationUnits = 1;

                $warehouseId = $item['warehouse_id'] ?? $jpa->warehouse_id;
                if (!$warehouseId) throw new \Exception('Cada linea debe tener almacen');
                Warehouse::findOrFail($warehouseId);

                $quantity = $this->toNullableDecimal($item['quantity'] ?? null) ?? 0;
                $priceUnit = $this->toNullableDecimal($item['price_unit'] ?? null) ?? 0;
                if ($quantity <= 0) throw new \Exception('La cantidad por linea debe ser mayor a 0');

                $availableStock = $this->getAvailableStockByWarehouse((int)$articleId, (int)$warehouseId);
                if ($quantity > $availableStock) {
                    throw new \Exception("Stock insuficiente para {$article->name}. Disponible: {$availableStock}");
                }

                $stock = $this->toNullableDecimal($item['stock'] ?? null);
                if (is_null($stock)) $stock = $availableStock;

                $lineTotal = $this->toNullableDecimal($item['total'] ?? null);
                if (is_null($lineTotal) || $lineTotal < 0) $lineTotal = (float)$quantity * (float)$priceUnit;

                OrderItem::create([
                    'order_id' => $jpa->id,
                    'article_id' => $article->id,
                    'presentation_id' => $presentationId ?: null,
                    'warehouse_id' => $warehouseId,
                    'stock' => $stock,
                    'price_unit' => $priceUnit,
                    'presentation_units' => $presentationUnits,
                    'quantity' => $quantity,
                    'total' => $lineTotal,
                    'status' => isset($item['status']) ? (bool)$item['status'] : true,
                ]);

                $subtotal += (float)$lineTotal;
                $inserted++;
            }

            if ($inserted === 0) throw new \Exception('Debes agregar al menos un item');

            $discountPercent = (float)($jpa->discount_percent ?? 1);
            $discountAmount = round($subtotal * ($discountPercent / 100), 2);
            $total = round($subtotal - $discountAmount, 2);

            $jpa->update([
                'subtotal' => round($subtotal, 2),
                'discount_amount' => $discountAmount,
                'total' => max(0, $total),
            ]);

            DB::commit();
        } catch (\Throwable $th) {
            DB::rollBack();
            throw $th;
        }
    }

    public function branches(Request $request, string $businessId): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            $business = Business::findOrFail($businessId);
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

    private function toNullableDecimal($value): ?float
    {
        if ($value === null) return null;
        $text = trim((string)$value);
        if ($text === '') return null;
        if (!is_numeric($text)) throw new \Exception("Valor numerico invalido: {$value}");
        return (float)$text;
    }

    private function getAvailableStockByWarehouse(int $articleId, int $warehouseId): float
    {
        $qtyIn = (float)DB::table('entry_note_items as entry_item')
            ->join('entry_notes as entry_note', 'entry_note.id', '=', 'entry_item.entry_note_id')
            ->where('entry_note.status', 1)
            ->where('entry_item.status', 1)
            ->where('entry_item.article_id', $articleId)
            ->where('entry_item.warehouse_id', $warehouseId)
            ->sum('entry_item.quantity');

        $qtyOut = (float)DB::table('exit_note_items as exit_item')
            ->join('exit_notes as exit_note', 'exit_note.id', '=', 'exit_item.exit_note_id')
            ->where('exit_note.status', 1)
            ->where('exit_item.status', 1)
            ->where('exit_item.article_id', $articleId)
            ->where('exit_item.warehouse_id', $warehouseId)
            ->sum('exit_item.quantity');

        return (float)max(0, $qtyIn - $qtyOut);
    }
}
