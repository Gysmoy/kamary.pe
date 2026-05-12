<?php

namespace App\Http\Controllers\Admin\Storage;

use App\Http\Controllers\Admin\ClientController as BaseClientController;
use App\Models\MailingTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class ClientController extends BaseClientController
{
    public function setReactViewProperties(Request $request)
    {
        return array_merge(parent::setReactViewProperties($request), [
            'sectionTitle' => 'Clientes de almacenamiento',
            'requiredPermission' => 'storage-clients',
            'defaultClientKind' => 'regular',
            'initialQuickFilter' => 'all',
            'storageContext' => true,
            'storageNotificationOptions' => $this->notificationOptions(),
        ]);
    }

    public function beforeSave(Request $request)
    {
        $request->merge([
            'client_kind' => 'regular',
            'has_storage_service' => true,
        ]);

        return parent::beforeSave($request);
    }

    private function notificationOptions(): array
    {
        $options = [
            [
                'value' => 'storage_invoice_notification',
                'label' => 'Notificación de Envío de Facturas a los Clientes - Kamary medical',
            ],
            [
                'value' => 'storage_sample_order_registration',
                'label' => 'Notificación de registro de pedidos muestra',
            ],
        ];

        if (!Schema::hasTable('mailing_templates')) {
            return $options;
        }

        $templates = MailingTemplate::query()
            ->where('status', true)
            ->orderBy('name')
            ->get(['id', 'name', 'caption']);

        $labels = collect($options)->pluck('label')->map(fn($label) => strtolower($label))->all();

        foreach ($templates as $template) {
            $label = $template->caption ?: $template->name;
            if (!$label || in_array(strtolower($label), $labels, true)) {
                continue;
            }

            $options[] = [
                'value' => $template->id,
                'label' => $label,
            ];
            $labels[] = strtolower($label);
        }

        return $options;
    }
}
