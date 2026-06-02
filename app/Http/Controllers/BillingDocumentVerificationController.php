<?php

namespace App\Http\Controllers;

use App\Models\BillingDocument;
use App\Services\BillingDocumentVerificationService;

class BillingDocumentVerificationController extends Controller
{
    public function show(BillingDocument $document, string $token, BillingDocumentVerificationService $verification)
    {
        $document->loadMissing('business', 'branch', 'client', 'eventualClient', 'serviceOrder', 'commercialOrder', 'items');

        abort_unless($verification->isStorageDocument($document), 404);
        abort_unless($verification->isValidToken($document, $token), 404);

        return view('billing-documents.verify', [
            'document' => $document,
            'summary' => $verification->summary($document),
        ]);
    }
}
