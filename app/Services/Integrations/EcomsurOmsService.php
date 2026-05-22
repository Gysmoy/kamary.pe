<?php

namespace App\Services\Integrations;

use App\Models\Article;
use App\Models\Client;
use App\Models\CommercialOrder;
use App\Models\CommercialOrderItem;
use App\Models\EventualClient;
use App\Models\IntegrationLog;
use App\Models\IntegrationMapping;
use App\Models\Warehouse;
use App\Services\StockService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class EcomsurOmsService
{
    public function receiveLogisticOrders(array $payload): array
    {
        $provider = $this->provider();
        $log = IntegrationLog::create([
            'provider' => $provider,
            'direction' => 'inbound',
            'event_type' => 'logistic_order',
            'external_id' => $this->asText($payload['IdCuenta'] ?? null),
            'status' => 'received',
            'request_payload' => $payload,
        ]);

        try {
            $this->assertRequired($payload, ['IdAlmacen', 'IdBodega', 'IdCuenta', 'UsuarioReg', 'pedidos']);
            if (!is_array($payload['pedidos'])) throw new \InvalidArgumentException('pedidos debe ser un arreglo');

            $results = [];
            foreach ($payload['pedidos'] as $pedido) {
                if (!is_array($pedido)) {
                    $results[] = ['status' => 'error', 'message' => 'Pedido invalido'];
                    continue;
                }

                try {
                    $results[] = DB::transaction(fn() => $this->upsertOrder($payload, $pedido));
                } catch (\Throwable $th) {
                    $results[] = [
                        'external_order_id' => $this->asText($pedido['NroPedido'] ?? null),
                        'status' => 'error',
                        'message' => $th->getMessage(),
                    ];
                }
            }

            $hasErrors = collect($results)->contains(fn($row) => ($row['status'] ?? '') === 'error');
            $log->update([
                'status' => $hasErrors ? 'partial_error' : 'processed',
                'response_payload' => ['results' => $results],
                'message' => $hasErrors ? 'Uno o mas pedidos no pudieron procesarse' : 'Pedidos procesados',
                'processed_at' => now(),
            ]);

            return [
                'success' => !$hasErrors,
                'results' => $results,
            ];
        } catch (\Throwable $th) {
            $log->update([
                'status' => 'error',
                'message' => $th->getMessage(),
                'processed_at' => now(),
            ]);
            throw $th;
        }
    }

    public function stock(array $payload): array
    {
        $provider = $this->provider();
        $log = IntegrationLog::create([
            'provider' => $provider,
            'direction' => 'inbound',
            'event_type' => 'stock_query',
            'external_id' => $this->asText($payload['Sku'] ?? null),
            'status' => 'received',
            'request_payload' => $payload,
        ]);

        try {
            $this->assertRequired($payload, ['IdAlmacen', 'IdBodega', 'IdCuenta']);
            $warehouse = $this->resolveWarehouse($payload);
            $sku = trim((string)($payload['Sku'] ?? '%%'));

            $query = Article::query()
                ->whereNotNull('status')
                ->when($sku !== '' && $sku !== '%%', function ($articles) use ($sku) {
                    $needle = mb_strtolower($sku);
                    $articles->where(function ($inner) use ($needle) {
                        $inner->whereRaw('LOWER(code) LIKE ?', ['%' . $needle . '%'])
                            ->orWhereRaw('LOWER(name) LIKE ?', ['%' . $needle . '%']);
                    });
                })
                ->orderBy('code');

            $rows = $query->limit($sku === '%%' ? 500 : 50)
                ->get(['id', 'code', 'name'])
                ->map(function (Article $article) use ($warehouse) {
                    return [
                        'Sku' => $article->code,
                        'Descripcion' => $article->name,
                        'Stock' => app(StockService::class)->getAvailableStockByWarehouse((int)$article->id, (int)$warehouse->id),
                    ];
                })
                ->values()
                ->all();

            $response = [
                'IdAlmacen' => $this->asText($payload['IdAlmacen'] ?? null),
                'IdBodega' => $this->asText($payload['IdBodega'] ?? null),
                'IdCuenta' => $this->asText($payload['IdCuenta'] ?? null),
                'items' => $rows,
            ];

            $log->update([
                'status' => 'processed',
                'response_payload' => $response,
                'processed_at' => now(),
            ]);

            return $response;
        } catch (\Throwable $th) {
            $log->update([
                'status' => 'error',
                'message' => $th->getMessage(),
                'processed_at' => now(),
            ]);
            throw $th;
        }
    }

    private function upsertOrder(array $header, array $pedido): array
    {
        $this->assertRequired($pedido, ['NroPedido', 'SubServicio', 'TipoPago', 'Consignatario', 'Direccion', 'Distrito', 'FechaDespacho', 'EmailCliente', 'Items']);
        if (!is_array($pedido['Items']) || count($pedido['Items']) === 0) {
            throw new \InvalidArgumentException('Items debe tener al menos un producto');
        }

        $warehouse = $this->resolveWarehouse($header);
        [$businessId, $branchId] = $this->resolveBusinessAndBranch($warehouse);
        [$clientId, $eventualClientId] = $this->resolveCustomer($header, $pedido);
        $externalOrderId = $this->asText($pedido['NroPedido']);
        $documentType = $this->documentType($pedido['TipDocFac'] ?? null);
        $issueDate = now()->toDateString();
        $promisedDate = $this->date($pedido['FechaDespacho'] ?? null);
        $items = $this->normalizeItems($pedido['Items'], $warehouse);
        $discount = $this->decimal($pedido['Descuento'] ?? 0);
        $shipping = $this->decimal($pedido['ImpEnvio'] ?? 0);
        $grossTotal = max(0, round(array_sum(array_column($items, 'total')) - $discount + $shipping, 2));
        $totals = $this->deriveFinancialTotals($grossTotal, $documentType);

        $order = CommercialOrder::query()
            ->where('external_source', $this->externalSource())
            ->where('external_order_id', $externalOrderId)
            ->first();

        $isNew = !$order;
        $order = $order ?: new CommercialOrder();

        if ($isNew) {
            $order->code = $this->nextExternalCode($externalOrderId);
            $order->created_by = $this->systemUserId();
            $order->status = true;
        }

        $order->fill([
            'external_source' => $this->externalSource(),
            'external_order_id' => $externalOrderId,
            'external_checkout_id' => $this->asNullableText($pedido['CheckoutId'] ?? $pedido['_id'] ?? null),
            'external_delivery_order_id' => $this->asNullableText($pedido['DeliveryOrderId'] ?? null),
            'external_channel' => $this->asNullableText($pedido['Canal'] ?? $pedido['Channel'] ?? 'Multivende/VTEX'),
            'external_ecommerce' => $this->asNullableText($pedido['Ecommerce'] ?? null),
            'external_subservice' => $this->asNullableText($pedido['SubServicio'] ?? null),
            'external_payment_type' => $this->asNullableText($pedido['TipoPago'] ?? null),
            'external_store_id' => $this->asNullableText($header['IdAlmacen'] ?? null),
            'external_warehouse_id' => $this->asNullableText($header['IdBodega'] ?? null),
            'external_account_id' => $this->asNullableText($header['IdCuenta'] ?? null),
            'external_sync_status' => 'received',
            'external_last_synced_at' => now(),
            'external_payload' => ['header' => $header, 'pedido' => $pedido],
            'business_id' => $businessId,
            'business_branch_id' => $branchId,
            'warehouse_id' => $warehouse->id,
            'client_id' => $clientId,
            'eventual_client_id' => $eventualClientId,
            'document_type' => $documentType,
            'currency' => 'PEN',
            'payment_condition' => $this->paymentCondition($pedido['TipoPago'] ?? null),
            'payment_method' => $this->asNullableText($pedido['TipoPago'] ?? null),
            'commercial_channel' => $this->asNullableText($pedido['Ecommerce'] ?? $pedido['Canal'] ?? 'Multivende'),
            'segment' => $this->asNullableText($pedido['SubServicio'] ?? null),
            'order_status' => 'pending',
            'payment_status' => $this->paymentStatus($pedido['TipoPago'] ?? null),
            'dispatch_status' => 'pending',
            'billing_status' => 'pending',
            'issue_date' => $issueDate,
            'promised_delivery_at' => $promisedDate,
            'installments' => 1,
            'first_due_date' => null,
            'delivery_address' => $this->asNullableText($pedido['Direccion'] ?? null),
            'delivery_reference' => $this->asNullableText($pedido['LugarDespacho'] ?? null),
            'ubigeo' => $this->asNullableText($pedido['Ubigeo'] ?? $pedido['Distrito'] ?? null),
            'dispatch_contact_name' => $this->asNullableText($pedido['Consignatario'] ?? null),
            'dispatch_contact_phone' => $this->asNullableText($pedido['TlfCliente'] ?? null),
            'subtotal' => $totals['subtotal'],
            'tax_amount' => $totals['tax_amount'],
            'total' => $totals['total'],
            'paid_amount' => $this->paymentStatus($pedido['TipoPago'] ?? null) === 'paid' ? $totals['total'] : 0,
            'balance_amount' => $this->paymentStatus($pedido['TipoPago'] ?? null) === 'paid' ? 0 : $totals['total'],
            'observations' => $this->buildObservation($header, $pedido),
            'approved_at' => null,
            'updated_by' => $this->systemUserId(),
        ]);
        $order->save();

        CommercialOrderItem::where('commercial_order_id', $order->id)->delete();
        foreach ($items as $item) {
            CommercialOrderItem::create([
                'commercial_order_id' => $order->id,
                'article_id' => $item['article']->id,
                'presentation_id' => null,
                'warehouse_id' => $warehouse->id,
                'price_list_item_id' => null,
                'external_item_number' => $item['external_item_number'],
                'external_sku' => $item['external_sku'],
                'external_payload' => $item['payload'],
                'stock_available' => $item['stock_available'],
                'cost_unit' => (float)($item['article']->cost_price ?? 0),
                'price_unit' => $item['price_unit'],
                'presentation_units' => 1,
                'quantity' => $item['quantity'],
                'total' => $item['total'],
                'price_source' => 'external',
                'status' => true,
            ]);
        }

        return [
            'external_order_id' => $externalOrderId,
            'commercial_order_id' => $order->id,
            'commercial_order_code' => $order->code,
            'status' => $isNew ? 'created' : 'updated',
        ];
    }

    private function normalizeItems(array $items, Warehouse $warehouse): array
    {
        $rows = [];
        foreach ($items as $item) {
            if (!is_array($item)) continue;
            $this->assertRequired($item, ['NroItem', 'Sku', 'Descripcion', 'Cantidad']);

            $sku = $this->asText($item['Sku']);
            $article = Article::whereRaw('LOWER(code) = ?', [mb_strtolower($sku)])->first();
            if (!$article) {
                $article = $this->createArticleFromSku($sku, $this->asText($item['Descripcion']), $item);
            }

            $quantity = $this->decimal($item['Cantidad'] ?? 0);
            if ($quantity <= 0) throw new \InvalidArgumentException("Cantidad invalida para SKU {$sku}");
            $price = $this->decimal($item['Precio'] ?? 0);
            $discount = $this->decimal($item['Descuento'] ?? 0);
            $total = max(0, round(($quantity * $price) - $discount, 2));

            $rows[] = [
                'article' => $article,
                'external_item_number' => (int)$this->decimal($item['NroItem'] ?? 0),
                'external_sku' => $sku,
                'quantity' => $quantity,
                'price_unit' => $price,
                'total' => $total,
                'stock_available' => app(StockService::class)->getAvailableStockByWarehouse((int)$article->id, (int)$warehouse->id),
                'payload' => $item,
            ];
        }

        if (empty($rows)) throw new \InvalidArgumentException('Items no tiene productos validos');
        return $rows;
    }

    private function createArticleFromSku(string $sku, string $description, array $payload): Article
    {
        if (!filter_var(config('integrations.ecomsur.auto_create_articles'), FILTER_VALIDATE_BOOLEAN)) {
            throw new \InvalidArgumentException("SKU {$sku} no existe en articulos Kamary");
        }

        $laboratoryId = (int) config('integrations.ecomsur.default_laboratory_id');
        $unitId = (int) config('integrations.ecomsur.default_unit_id');
        if ($laboratoryId <= 0 || $unitId <= 0) {
            throw new \InvalidArgumentException("Para crear SKU {$sku} automaticamente configura ECOMSUR_DEFAULT_LABORATORY_ID y ECOMSUR_DEFAULT_UNIT_ID");
        }

        return Article::create([
            'code' => $sku,
            'module_scope' => 'standard',
            'name' => $description ?: $sku,
            'laboratory_id' => $laboratoryId,
            'unit_id' => $unitId,
            'status' => true,
            'margin_rule' => false,
            'igv_rule' => false,
            'units_per_article' => 1,
            'cost_price' => 0,
            'sale_price' => $this->decimal($payload['Precio'] ?? 0),
            'notes' => 'Creado automaticamente desde integracion Ecomsur/Multivende',
            'created_by' => $this->systemUserId(),
            'updated_by' => $this->systemUserId(),
        ]);
    }

    private function resolveWarehouse(array $payload): Warehouse
    {
        $idAlmacen = $this->asText($payload['IdAlmacen'] ?? null);
        $idBodega = $this->asText($payload['IdBodega'] ?? null);

        $mappedId = $this->mappedInternalId('warehouse', "{$idAlmacen}|{$idBodega}", Warehouse::class)
            ?: $this->mappedInternalId('warehouse', $idBodega, Warehouse::class)
            ?: $this->mappedInternalId('warehouse', $idAlmacen, Warehouse::class)
            ?: (int) config('integrations.ecomsur.default_warehouse_id');

        $warehouse = $mappedId ? Warehouse::with('branch.business')->find($mappedId) : null;
        if (!$warehouse) {
            throw new \InvalidArgumentException('No se pudo mapear IdAlmacen/IdBodega a un almacen Kamary');
        }

        return $warehouse;
    }

    private function resolveBusinessAndBranch(Warehouse $warehouse): array
    {
        $branchId = $warehouse->business_branch_id ?: (int) config('integrations.ecomsur.default_branch_id');
        $businessId = $warehouse->branch?->business_id ?: (int) config('integrations.ecomsur.default_business_id');

        if (!$businessId) throw new \InvalidArgumentException('ECOMSUR_DEFAULT_BUSINESS_ID no configurado y el almacen no tiene empresa');

        return [$businessId, $branchId ?: null];
    }

    private function resolveCustomer(array $header, array $pedido): array
    {
        $account = $this->asText($header['IdCuenta'] ?? null);
        $clientId = $this->mappedInternalId('account', $account, Client::class)
            ?: (int) config('integrations.ecomsur.default_client_id');

        if ($clientId && Client::find($clientId)) {
            return [$clientId, null];
        }

        $doc = $this->asNullableText($pedido['DocCliente'] ?? null);
        if ($doc) {
            $client = Client::where('document_number', $doc)
                ->where('client_kind', 'regular')
                ->whereNotNull('status')
                ->first();
            if ($client) return [$client->id, null];
        }

        $eventual = $this->firstOrCreateEventualClient($pedido);
        return [null, $eventual->id];
    }

    private function firstOrCreateEventualClient(array $pedido): EventualClient
    {
        $documentNumber = $this->asNullableText($pedido['DocCliente'] ?? null)
            ?: substr('OMS' . sha1($this->asText($pedido['NroPedido'] ?? Str::uuid())), 0, 20);
        $documentType = strlen(preg_replace('/\D+/', '', $documentNumber)) === 11 ? 'RUC' : 'DNI';

        $eventual = EventualClient::firstOrNew([
            'document_type' => $documentType,
            'document_number' => $documentNumber,
        ]);

        if (!$eventual->exists) {
            $eventual->created_by = $this->systemUserId();
            $eventual->status = true;
        }

        $eventual->fill([
            'business_name' => $this->asText($pedido['Consignatario'] ?? $documentNumber),
            'email' => $this->asNullableText($pedido['EmailCliente'] ?? null),
            'phone' => $this->asNullableText($pedido['TlfCliente'] ?? null),
            'address' => $this->asNullableText($pedido['Direccion'] ?? null),
            'contact_name' => $this->asNullableText($pedido['Consignatario'] ?? null),
            'notes' => 'Cliente eventual creado/actualizado desde integracion Ecomsur/Multivende',
            'updated_by' => $this->systemUserId(),
        ]);
        $eventual->save();

        return $eventual;
    }

    private function mappedInternalId(string $entityType, string $externalId, string $internalType): ?int
    {
        $externalId = trim($externalId);
        if ($externalId === '') return null;

        $id = IntegrationMapping::where('provider', $this->provider())
            ->where('entity_type', $entityType)
            ->where('external_id', $externalId)
            ->where('internal_type', $internalType)
            ->where('status', true)
            ->value('internal_id');

        return $id ? (int)$id : null;
    }

    private function nextExternalCode(string $externalOrderId): string
    {
        $base = preg_replace('/[^A-Za-z0-9\-_]/', '', $externalOrderId);
        $base = $base !== '' ? $base : substr(sha1($externalOrderId), 0, 12);
        $candidate = substr('MV-' . $base, 0, 40);
        if (!CommercialOrder::where('code', $candidate)->exists()) return $candidate;

        return substr('MV-' . $base . '-' . substr(sha1($externalOrderId . microtime(true)), 0, 8), 0, 40);
    }

    private function buildObservation(array $header, array $pedido): string
    {
        return trim(implode("\n", array_filter([
            'Pedido externo: ' . $this->asText($pedido['NroPedido'] ?? ''),
            'Cuenta OMS: ' . $this->asText($header['IdCuenta'] ?? ''),
            'Almacen/Bodega OMS: ' . $this->asText($header['IdAlmacen'] ?? '') . ' / ' . $this->asText($header['IdBodega'] ?? ''),
            $this->asNullableText($pedido['LugarDespacho'] ?? null) ? 'Referencia: ' . $this->asText($pedido['LugarDespacho']) : null,
        ])));
    }

    private function assertRequired(array $payload, array $fields): void
    {
        foreach ($fields as $field) {
            if (!array_key_exists($field, $payload) || $payload[$field] === null || $payload[$field] === '') {
                throw new \InvalidArgumentException("Campo obligatorio faltante: {$field}");
            }
        }
    }

    private function documentType($value): string
    {
        return match (trim((string)$value)) {
            '01' => 'Factura',
            '03' => 'Boleta',
            default => 'Boleta',
        };
    }

    private function deriveFinancialTotals(float $grossAmount, string $documentType): array
    {
        $grossAmount = round(max(0, $grossAmount), 2);
        if (!in_array($documentType, ['Factura', 'Boleta'], true)) {
            return [
                'subtotal' => $grossAmount,
                'tax_amount' => 0,
                'total' => $grossAmount,
            ];
        }

        $subtotal = round($grossAmount / 1.18, 2);

        return [
            'subtotal' => $subtotal,
            'tax_amount' => round($grossAmount - $subtotal, 2),
            'total' => $grossAmount,
        ];
    }

    private function paymentCondition($value): string
    {
        return mb_strtoupper(trim((string)$value)) === 'PREPAGADO' ? 'Contado' : 'Credito';
    }

    private function paymentStatus($value): string
    {
        return mb_strtoupper(trim((string)$value)) === 'PREPAGADO' ? 'paid' : 'pending';
    }

    private function date($value): ?string
    {
        $text = trim((string)($value ?? ''));
        if ($text === '') return null;
        $timestamp = strtotime($text);
        if ($timestamp === false) throw new \InvalidArgumentException("Fecha invalida: {$value}");
        return date('Y-m-d', $timestamp);
    }

    private function decimal($value): float
    {
        if ($value === null || $value === '') return 0;
        if (!is_numeric($value)) throw new \InvalidArgumentException("Valor numerico invalido: {$value}");
        return (float)$value;
    }

    private function asText($value): string
    {
        return trim((string)($value ?? ''));
    }

    private function asNullableText($value): ?string
    {
        $text = $this->asText($value);
        return $text === '' ? null : $text;
    }

    private function provider(): string
    {
        return trim((string) config('integrations.ecomsur.provider')) ?: 'ecomsur_oms';
    }

    private function externalSource(): string
    {
        return trim((string) config('integrations.ecomsur.external_source')) ?: $this->provider();
    }

    private function systemUserId(): int
    {
        return max(1, (int) config('integrations.ecomsur.system_user_id', 1));
    }
}
