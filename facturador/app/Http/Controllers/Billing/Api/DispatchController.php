<?php

namespace App\Http\Controllers\Billing\Api;

use App\CoreFacturalo\Facturalo;
use App\Http\Controllers\Controller;
use App\Models\Billing\Dispatch;
use App\Models\Billing\StateType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DispatchController extends Controller
{
    public function __construct()
    {
        $this->middleware('input.request:dispatch,api', ['only' => ['store']]);
    }

    public function store(Request $request)
    {
        $fact = DB::connection('tenant')->transaction(function () use ($request) {
            $facturalo = new Facturalo();
            $facturalo->save($request->all());
            $facturalo->createXmlUnsigned();
            $facturalo->signXmlUnsigned();
            $facturalo->updateHash();
            $facturalo->updateQr();
            // El PDF no debe bloquear la emision fiscal: si el template falla, se continua
            // y el XML igual se firma y envia a SUNAT (el PDF se puede regenerar despues).
            try {
                $facturalo->createPdf();
            } catch (\Throwable $e) {
                \Log::warning('createPdf guia fallo (no bloqueante): ' . $e->getMessage());
            }
            $facturalo->senderXmlSignedBill();

            return $facturalo;
        });

        /** @var Dispatch $document */
        $document = $fact->getDocument();
        $response = $fact->getResponse();
        $number = trim((string) $document->series) . '-' . trim((string) $document->number);
        $sent = (bool) ($response['sent'] ?? false);

        return [
            'success' => true,
            'data' => [
                'number' => $number,
                'filename' => $document->filename,
                'external_id' => $document->external_id,
                'state_type_id' => $document->state_type_id,
                'state_type_description' => $this->getStateTypeDescription($document->state_type_id),
                'hash' => $document->hash,
                'qr' => $document->qr,
            ],
            'links' => [
                'xml' => route('api.download.external_id', ['model' => 'dispatch', 'type' => 'xml', 'external_id' => $document->external_id]),
                'pdf' => route('api.download.external_id', ['model' => 'dispatch', 'type' => 'pdf', 'external_id' => $document->external_id]),
                'cdr' => $sent ? route('api.download.external_id', ['model' => 'dispatch', 'type' => 'cdr', 'external_id' => $document->external_id]) : '',
            ],
            'response' => $sent ? array_except($response, 'sent') : [],
        ];
    }

    private function getStateTypeDescription($id): ?string
    {
        return optional(StateType::find($id))->description;
    }
}
