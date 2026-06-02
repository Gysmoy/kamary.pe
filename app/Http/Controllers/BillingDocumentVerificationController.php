<?php

namespace App\Http\Controllers;

use App\Models\BillingDocument;
use App\Services\BillingDocumentVerificationService;
use App\Services\FacturadorPro5Service;

class BillingDocumentVerificationController extends Controller
{
    public function show(BillingDocument $document, string $token, BillingDocumentVerificationService $verification, FacturadorPro5Service $facturador)
    {
        $document->loadMissing('business', 'branch', 'client', 'eventualClient', 'serviceOrder', 'commercialOrder', 'items');

        abort_unless($verification->isVerifiableDocument($document), 404);
        abort_unless($verification->isValidToken($document, $token), 404);

        $file = $facturador->downloadFile($document, 'pdf');

        return response($file['content'], 200, [
            'Content-Type' => $file['content_type'],
            'Content-Disposition' => 'inline; filename="' . $file['filename'] . '"',
            'Cache-Control' => 'public, max-age=0, must-revalidate',
        ]);
    }
}
