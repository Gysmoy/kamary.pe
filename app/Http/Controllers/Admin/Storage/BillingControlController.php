<?php

namespace App\Http\Controllers\Admin\Storage;

use App\Http\Controllers\Admin\BillingDocumentController as BaseBillingDocumentController;
use App\Models\ServiceOrder;
use App\Support\StorageScope;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class BillingControlController extends BaseBillingDocumentController
{
    private array $storageOrderTypes = ['storage_service', 'storage_general'];

    public function setReactViewProperties(Request $request)
    {
        return [
            'moduleTitle' => 'Serv. Almacenamiento - Control de Facturacion',
            'requiredPermission' => 'storage-billing-control',
            'billingMode' => 'storage',
        ];
    }

    public function setPaginationInstance(string $model)
    {
        $query = parent::setPaginationInstance($model);

        $query
            ->where('billing_documents.source_type', 'service_order')
            ->whereHas('serviceOrder', function ($serviceOrder) {
                if (Schema::hasColumn('service_orders', 'order_type')) {
                    $serviceOrder->whereIn('service_orders.order_type', $this->storageOrderTypes);
                }
            });

        return $query;
    }

    public function beforeSave(Request $request)
    {
        if ($request->filled('commercial_order_id')) {
            throw new \Exception('Control de facturacion de almacenamiento solo acepta ordenes de servicio.');
        }

        $body = parent::beforeSave($request);
        if (($body['source_type'] ?? null) !== 'service_order') {
            throw new \Exception('Debes seleccionar una orden de servicio de almacenamiento.');
        }

        $order = ServiceOrder::findOrFail($body['source_id']);
        if (Schema::hasColumn('service_orders', 'order_type') && !in_array($order->order_type, $this->storageOrderTypes, true)) {
            throw new \Exception('La orden seleccionada no pertenece a almacenamiento.');
        }
        StorageScope::assertClient((int)$order->client_id);

        return $body;
    }
}
