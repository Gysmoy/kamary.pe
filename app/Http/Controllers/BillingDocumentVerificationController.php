<?php

namespace App\Http\Controllers;

use App\Models\BillingDocument;
use App\Services\BillingDocumentVerificationService;
use App\Services\FacturadorPro5Service;

class BillingDocumentVerificationController extends Controller
{
    public function show(BillingDocument $document, string $token, BillingDocumentVerificationService $verification, FacturadorPro5Service $facturador)
    {
        return $this->serve($document, $token, 'pdf', $verification, $facturador, true);
    }

    public function file(BillingDocument $document, string $token, string $type, BillingDocumentVerificationService $verification, FacturadorPro5Service $facturador)
    {
        $type = strtolower(trim($type));
        abort_unless(in_array($type, ['pdf', 'xml', 'cdr'], true), 404);

        return $this->serve($document, $token, $type, $verification, $facturador, $type === 'pdf');
    }

    private function serve(BillingDocument $document, string $token, string $type, BillingDocumentVerificationService $verification, FacturadorPro5Service $facturador, bool $inline)
    {
        $document->loadMissing('business', 'branch', 'client', 'eventualClient', 'serviceOrder', 'commercialOrder', 'items');

        abort_unless($verification->isVerifiableDocument($document), 404);
        abort_unless($verification->isValidToken($document, $token), 404);

        $file = $facturador->downloadFile($document, $type);

        $disposition = ($inline ? 'inline' : 'attachment') . '; filename="' . $file['filename'] . '"';

        return response($file['content'], 200, [
            'Content-Type' => $file['content_type'],
            'Content-Disposition' => $disposition,
            'Cache-Control' => 'public, max-age=0, must-revalidate',
        ]);
    }
}
