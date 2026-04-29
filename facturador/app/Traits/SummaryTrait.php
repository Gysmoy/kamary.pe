<?php

namespace App\Traits;

use App\CoreFacturalo\Facturalo;
use App\Models\Billing\Summary;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;
use DB;

trait SummaryTrait
{
    public function save($request) {
        $fact = DB::connection('tenant')->transaction(function () use($request) {
            $facturalo = new Facturalo();
            $facturalo->save($request->all());
            $facturalo->createXmlUnsigned();
            $facturalo->signXmlUnsigned();
            $facturalo->senderXmlSignedSummary();

            return $facturalo;
        });

        $document = $fact->getDocument();
        
        return [
            'success' => true,
            'message' => "El resumen {$document->identifier} fue creado correctamente",
        ];
    }
    
    public function query($id) {
        $document = Summary::find($id);
        
        $fact = DB::connection('tenant')->transaction(function () use($document) {
            $facturalo = new Facturalo();
            $facturalo->setDocument($document);
            $facturalo->setType('summary');
            $facturalo->statusSummary($document->ticket);
            return $facturalo;
        });
        
        $response = $fact->getResponse();
        
        return [
            'success' => ($response['status_code'] === 99) ? false : true,
            'message' => $response['description'],
        ];
    }


    public function getCustomErrorMessage($message, $exception) {

        $this->setCustomErrorLog($exception);

        return [
            'success' => false,
            'message' => $message
        ];

    }

    public function setCustomErrorLog($exception)
    {
        Log::error("Code: {$exception->getCode()} - Line: {$exception->getLine()} - Message: {$exception->getMessage()} - File: {$exception->getFile()}");
    }

    public function updateUnknownErrorStatus($id, $exception) {
        $this->updateSummaryByExistingColumns(Summary::findOrFail($id), [
            'unknown_error_status_response' => true,
            'error_manually_regularized' => [
                'message' => $exception->getMessage(),
            ],
        ]);

    }

    protected function updateSummaryByExistingColumns(Summary $summary, array $payload): void
    {
        $columns = array_keys($payload);
        $safePayload = [];

        foreach ($columns as $column) {
            if (Schema::connection('tenant')->hasColumn('summaries', $column)) {
                $safePayload[$column] = $payload[$column];
            }
        }

        if (!empty($safePayload)) {
            $summary->update($safePayload);
        }
    }


}
