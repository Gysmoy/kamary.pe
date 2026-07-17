<?php

namespace App\Http\Controllers\Billing\Api;

use App\CoreFacturalo\Facturalo;
use App\CoreFacturalo\Services\Gre\GreSender;
use App\Http\Controllers\Controller;
use App\Models\Billing\Company;
use App\Models\Billing\Dispatch;
use App\Models\Billing\StateType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

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

    /**
     * Consulta el ticket GRE 2.0 de una guia enviada previamente (flujo asincrono).
     * Finaliza guias que quedaron "en proceso": guarda el CDR y actualiza el estado.
     */
    public function status(Request $request)
    {
        $externalId = $request->input('external_id');
        $ticket = $request->input('ticket');

        $dispatch = null;
        if ($externalId) {
            $dispatch = Dispatch::where('external_id', $externalId)->first();
        }
        if (!$dispatch && $ticket) {
            $dispatch = Dispatch::where('ticket', $ticket)->first();
        }
        if (!$dispatch) {
            return response()->json(['success' => false, 'message' => 'Guia no encontrada.'], 404);
        }

        $ticket = $ticket ?: $dispatch->ticket;
        if (!$ticket) {
            return response()->json([
                'success' => false,
                'message' => 'La guia no tiene ticket GRE (no fue enviada por GRE 2.0).',
            ], 422);
        }

        try {
            $result = (new GreSender(Company::active()))->consult($ticket);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }

        if (!empty($result['cdr_zip'])) {
            Storage::disk('tenant')->put('cdr' . DIRECTORY_SEPARATOR . 'R-' . $dispatch->filename . '.zip', $result['cdr_zip']);
            $dispatch->has_cdr = true;
        }

        if (!empty($result['accepted'])) {
            $dispatch->state_type_id = '05'; // ACEPTADO
        } elseif (!empty($result['rejected'])) {
            $dispatch->state_type_id = '09'; // RECHAZADO
        }
        // pending: se deja el estado actual (03 enviado) para reintentar la consulta.

        if (Schema::hasColumn('dispatches', 'gre_response')) {
            $dispatch->gre_response = json_encode($result, JSON_UNESCAPED_UNICODE);
        }
        $dispatch->save();

        return [
            'success' => true,
            'data' => [
                'number' => trim((string) $dispatch->series) . '-' . trim((string) $dispatch->number),
                'external_id' => $dispatch->external_id,
                'ticket' => $ticket,
                'state_type_id' => $dispatch->state_type_id,
                'state_type_description' => $this->getStateTypeDescription($dispatch->state_type_id),
                'accepted' => !empty($result['accepted']),
                'pending' => !empty($result['pending']),
                'rejected' => !empty($result['rejected']),
                'code' => $result['code'],
                'description' => $result['description'],
            ],
            'links' => [
                'cdr' => !empty($dispatch->has_cdr)
                    ? route('api.download.external_id', ['model' => 'dispatch', 'type' => 'cdr', 'external_id' => $dispatch->external_id])
                    : '',
            ],
        ];
    }

    private function getStateTypeDescription($id): ?string
    {
        return optional(StateType::find($id))->description;
    }
}
