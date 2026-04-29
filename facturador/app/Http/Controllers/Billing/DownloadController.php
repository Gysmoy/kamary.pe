<?php

namespace App\Http\Controllers\Billing;

use App\CoreFacturalo\Facturalo;
use App\CoreFacturalo\Helpers\Storage\StorageDocument;
use App\Http\Controllers\Controller;
use Exception;

class DownloadController extends Controller
{
    use StorageDocument;

    public function downloadExternal($model, $type, $external_id, $format = null)
    {
        $model = "App\\Models\\Billing\\" . ucfirst($model);
        $document = $model::where('external_id', $external_id)->first();

        if (!$document) {
            abort(404, "El codigo {$external_id} es invalido, no se encontro documento relacionado");
        }

        if ($format != null) {
            $this->reloadPDF($document, 'invoice', $format);
        }

        return $this->download($type, $document);
    }

    public function download($type, $document)
    {
        switch ($type) {
            case 'pdf':
                $folder = 'pdf';
                break;
            case 'xml':
                $folder = 'signed';
                break;
            case 'cdr':
                $folder = 'cdr';
                break;
            case 'quotation':
                $folder = 'quotation';
                break;
            case 'sale_note':
                $folder = 'sale_note';
                break;
            default:
                throw new Exception('Tipo de archivo a descargar es invalido');
        }

        return $this->downloadStorage($document->filename, $folder);
    }

    public function toPrint($model, $external_id, $format = 'a4')
    {
        $document_type = $model;
        $model = "App\\Models\\Billing\\" . ucfirst($model);

        $document = $model::where('external_id', $external_id)->first();

        if (!$document) {
            abort(404, "El codigo {$external_id} es invalido, no se encontro documento relacionado");
        }

        if ($document_type == 'quotation') {
            // Quotation has dedicated PDF renderer.
            $quotation = new QuotationController();
            return $quotation->toPrint($external_id, $format);
        } elseif ($document_type == 'salenote') {
            $saleNote = new SaleNoteController();
            return $saleNote->toPrint($external_id, $format);
        }

        $type = 'invoice';
        if ($document_type == 'dispatch') {
            $type = 'dispatch';
        }

        $this->reloadPDF($document, $type, $format);

        $temp = tempnam(sys_get_temp_dir(), 'pdf');
        file_put_contents($temp, $this->getStorage($document->filename, 'pdf'));

        return response()->file($temp);
    }

    public function toTicket($model, $external_id, $format = null)
    {
        $model = "App\\Models\\Billing\\" . ucfirst($model);
        $document = $model::where('id', $external_id)->first();

        if (!$document) {
            abort(404, "El codigo {$external_id} es invalido, no se encontro documento relacionado");
        }

        if ($format != null) {
            return $this->reloadTicket($document, 'invoice', $format);
        }
    }

    private function reloadTicket($document, $type, $format)
    {
        return (new Facturalo())->createPdf($document, $type, $format, 'html');
    }

    private function reloadPDF($document, $type, $format)
    {
        (new Facturalo())->createPdf($document, $type, $format);
    }
}
