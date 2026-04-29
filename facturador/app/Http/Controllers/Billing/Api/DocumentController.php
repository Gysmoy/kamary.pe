<?php
namespace App\Http\Controllers\Billing\Api;

use App\CoreFacturalo\Facturalo;
use App\CoreFacturalo\Helpers\Storage\StorageDocument;
use App\Http\Controllers\Controller;
use App\Models\Billing\Document;
use App\Models\Billing\StateType;
use Exception;
use Facades\App\Http\Controllers\Billing\DocumentController as DocumentControllerSend;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DocumentController extends Controller
{
    use StorageDocument;

    public function __construct()
    {
        $this->middleware('input.request:document,api', ['only' => ['store', 'storeServer']]);
    }

    public function store(Request $request)
    {
        // dd($request->all());
        $fact = DB::connection('tenant')->transaction(function () use ($request) {
            $facturalo = new Facturalo();
            $facturalo->save($request->all());
            $facturalo->createXmlUnsigned();
            $facturalo->signXmlUnsigned();
            $facturalo->updateHash();
            $facturalo->updateQr();
            $facturalo->createPdf();
            $facturalo->sendEmail();
            $facturalo->senderXmlSignedBill();

            return $facturalo;
        });

        $document = $fact->getDocument();
        $response = $fact->getResponse();

        return [
            'success' => true,
            'data' => [
                'number' => $document->number_full,
                'filename' => $document->filename,
                'external_id' => $document->external_id,
                'state_type_id' => $document->state_type_id,
                'state_type_description' => $this->getStateTypeDescription($document->state_type_id),
                'number_to_letter' => $document->number_to_letter,
                'hash' => $document->hash,
                'qr' => $document->qr,
            ],
            'links' => [
                'xml' => $document->download_external_xml,
                'pdf' => $document->download_external_pdf,
                'cdr' => ($response['sent']) ? $document->download_external_cdr : '',
            ],
            'response' => ($response['sent']) ? array_except($response, 'sent') : [],
        ];
    }

    public function send(Request $request)
    {
        if ($request->has('external_id')) {
            $external_id = $request->input('external_id');
            $document = Document::where('external_id', $external_id)->first();
            if (!$document) {
                throw new Exception("El documento con cÃ³digo externo {$external_id}, no se encuentra registrado.");
            }
            if ($document->group_id !== '01') {
                throw new Exception("El tipo de documento {$document->document_type_id} es invÃ¡lido, no es posible enviar.");
            }
            $fact = new Facturalo();
            $fact->setDocument($document);
            $fact->loadXmlSigned();
            $fact->onlySenderXmlSignedBill();
            $response = $fact->getResponse();
            return [
                'success' => true,
                'data' => [
                    'number' => $document->number_full,
                    'filename' => $document->filename,
                    'external_id' => $document->external_id,
                    'state_type_id' => $document->state_type_id,
                    'state_type_description' => $this->getStateTypeDescription($document->state_type_id),
                ],
                'links' => [
                    'cdr' => $document->download_external_cdr,
                ],
                'response' => array_except($response, 'sent'),
            ];
        }
    }

    public function storeServer(Request $request)
    {
        $fact = DB::connection('tenant')->transaction(function () use ($request) {
            $facturalo = new Facturalo();
            $facturalo->save($request->all());

            return $facturalo;
        });

        $document = $fact->getDocument();
        $data_json = $document->data_json;

        // $zipFly = new ZipFly();

        $this->uploadStorage($document->filename, base64_decode($data_json->file_xml_signed), 'signed');
        $this->uploadStorage($document->filename, base64_decode($data_json->file_pdf), 'pdf');

        $document->external_id = $data_json->external_id;
        $document->hash = $data_json->hash;
        $document->qr = $data_json->qr;
        $document->save();

        // Send SUNAT
        if ($document->group_id === '01') {
            if ($data_json->query) {
                DocumentControllerSend::send($document->id);
            }

        }

        return [
            'success' => true,
        ];
    }

    public function documentCheckServer($external_id)
    {
        $document = Document::where('external_id', $external_id)->first();

        if ($document->state_type_id === '05' && $document->group_id === '01') {
            $file_cdr = base64_encode($this->getStorage($document->filename, 'cdr'));
        } else {
            $file_cdr = null;
        }

        return [
            'success' => true,
            'state_type_id' => $document->state_type_id,
            'file_cdr' => $file_cdr,
        ];
    }

    private function getStateTypeDescription($id)
    {
        return StateType::find($id)->description;
    }

    public function lists($startDate = null, $endDate = null)
    {
        $query = DB::connection('tenant')
            ->table('documents as d')
            ->leftJoin('state_types as st', 'st.id', '=', 'd.state_type_id')
            ->select(
                'd.id',
                'd.external_id',
                'd.document_type_id',
                'd.series',
                'd.number',
                'd.date_of_issue',
                'd.total',
                'd.state_type_id',
                'st.description as state_type_description',
                'd.filename'
            )
            ->orderBy('d.date_of_issue', 'desc')
            ->orderBy('d.id', 'desc');

        if (!empty($startDate) && !empty($endDate)) {
            $query->whereBetween('d.date_of_issue', [$startDate, $endDate]);
        } else {
            $query->limit(50);
        }

        $records = $query->get()->map(function ($row) {
            $filename = $row->filename;
            $hasFilename = !empty($filename);

            return [
                'id' => (int)$row->id,
                'external_id' => $row->external_id,
                'number' => "{$row->series}-{$row->number}",
                'document_type_id' => $row->document_type_id,
                'date_of_issue' => $row->date_of_issue,
                'total' => (float)$row->total,
                'state_type_id' => $row->state_type_id,
                'state_type_description' => $row->state_type_description,
                'links' => [
                    'pdf' => $hasFilename ? route('api.download.external_id', ['model' => 'document', 'type' => 'pdf', 'external_id' => $row->external_id]) : null,
                    'xml' => $hasFilename ? route('api.download.external_id', ['model' => 'document', 'type' => 'xml', 'external_id' => $row->external_id]) : null,
                    'cdr' => $hasFilename ? route('api.download.external_id', ['model' => 'document', 'type' => 'cdr', 'external_id' => $row->external_id]) : null,
                ],
            ];
        })->values();

        return [
            'success' => true,
            'data' => $records,
        ];
    }

    public function updatestatus(Request $request)
    {
        $record = Document::whereExternal_id($request->externail_id)->first();
        $record->state_type_id = $request->state_type_id;
        $record->save();

        return [
            'success' => true,
        ];
    }

}

