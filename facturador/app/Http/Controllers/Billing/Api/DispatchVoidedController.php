<?php

namespace App\Http\Controllers\Billing\Api;

use App\CoreFacturalo\Facturalo;
use App\CoreFacturalo\Requests\Inputs\Functions;
use App\Http\Controllers\Controller;
use App\Models\Billing\Company;
use App\Models\Billing\Dispatch;
use App\Models\Billing\DispatchVoided;
use App\Models\Billing\StateType;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class DispatchVoidedController extends Controller
{
    public function store(Request $request)
    {
        $fact = DB::connection('tenant')->transaction(function () use ($request) {
            $records = $this->resolveDispatches($request);
            $company = Company::active();
            $dateOfIssue = Carbon::parse($request->input('date_of_issue') ?: date('Y-m-d'))->format('Y-m-d');
            $dateOfReference = Carbon::parse($request->input('date_of_reference'))->format('Y-m-d');
            $identifier = Functions::identifier($company->soap_type_id, $dateOfIssue, DispatchVoided::class);
            $filename = $company->number . '-' . $identifier;

            $document = DispatchVoided::create([
                'user_id' => auth()->id(),
                'external_id' => (string) ($request->input('external_id') ?: Str::uuid()),
                'soap_type_id' => $company->soap_type_id,
                'state_type_id' => '01',
                'ubl_version' => '2.0',
                'date_of_issue' => $dateOfIssue,
                'date_of_reference' => $dateOfReference,
                'identifier' => $identifier,
                'filename' => $filename,
            ]);

            foreach ($records as $row) {
                $document->documents()->create([
                    'dispatch_id' => $row['dispatch']->id,
                    'description' => $row['description'],
                ]);
            }

            $document = DispatchVoided::find($document->id);
            $facturalo = new Facturalo();
            $facturalo->setType('dispatch_voided');
            $facturalo->setDocument($document);
            $facturalo->createXmlUnsigned();
            $facturalo->signXmlUnsigned();
            $facturalo->senderXmlSignedSummary();

            return $facturalo;
        });

        /** @var DispatchVoided $document */
        $document = $fact->getDocument();

        return [
            'success' => true,
            'data' => [
                'external_id' => $document->external_id,
                'identifier' => $document->identifier,
                'filename' => $document->filename,
                'ticket' => $document->ticket,
                'state_type_id' => $document->state_type_id,
                'state_type_description' => $this->getStateTypeDescription($document->state_type_id),
            ],
            'links' => [
                'xml' => $document->download_external_xml,
                'cdr' => '',
            ],
        ];
    }

    public function status(Request $request)
    {
        if ($request->has('external_id')) {
            $externalId = $request->input('external_id');
            $document = DispatchVoided::where('external_id', $externalId)->first();
            if (!$document) {
                throw new Exception("El codigo externo {$externalId} es invalido, no se encontro baja de guia relacionada");
            }
        } elseif ($request->has('ticket')) {
            $ticket = $request->input('ticket');
            $document = DispatchVoided::where('ticket', $ticket)->first();
            if (!$document) {
                throw new Exception("El ticket {$ticket} es invalido, no se encontro baja de guia relacionada");
            }
        } else {
            throw new Exception('Es requerido el codigo externo o ticket');
        }

        $facturalo = new Facturalo();
        $facturalo->setDocument($document);
        $facturalo->setType('dispatch_voided');
        $facturalo->statusSummary($document->ticket);
        $response = $facturalo->getResponse();
        $document = DispatchVoided::find($document->id);

        return [
            'success' => true,
            'data' => [
                'filename' => $document->filename,
                'external_id' => $document->external_id,
                'identifier' => $document->identifier,
                'ticket' => $document->ticket,
                'state_type_id' => $document->state_type_id,
                'state_type_description' => $this->getStateTypeDescription($document->state_type_id),
            ],
            'links' => [
                'xml' => $document->download_external_xml,
                'cdr' => $document->download_external_cdr,
            ],
            'response' => $response,
        ];
    }

    private function resolveDispatches(Request $request): array
    {
        $documents = $request->input('documents');
        if (!is_array($documents) || count($documents) === 0) {
            throw new Exception('No se enviaron guias para anulacion');
        }

        $dateOfReference = Carbon::parse($request->input('date_of_reference'))->format('Y-m-d');
        $records = [];

        foreach ($documents as $row) {
            $description = trim((string) ($row['description'] ?? ''));
            if ($description === '') {
                throw new Exception('El motivo de anulacion de la guia es obligatorio');
            }

            $query = Dispatch::query();
            if (!empty($row['external_id'])) {
                $query->where('external_id', $row['external_id']);
            } else {
                $series = trim((string) ($row['series'] ?? ''));
                $number = $this->normalizeNumber($row['number'] ?? null);
                if ($series === '' || $number === null) {
                    throw new Exception('La serie y numero de la guia son obligatorios');
                }

                $query->where('series', $series)
                    ->where('number', $number)
                    ->where('date_of_issue', $dateOfReference);

                if (Schema::connection('tenant')->hasColumn('dispatches', 'document_type_id')) {
                    $query->where('document_type_id', $row['document_type_id'] ?? '09');
                }
            }

            $dispatch = $query->first();
            if (!$dispatch) {
                throw new Exception('No se encontro la guia de remision a anular');
            }

            if ((string) $dispatch->state_type_id === '11') {
                throw new Exception("La guia {$dispatch->series}-{$dispatch->number} ya esta anulada");
            }

            $records[] = [
                'dispatch' => $dispatch,
                'description' => $description,
            ];
        }

        return $records;
    }

    private function normalizeNumber($number)
    {
        $number = preg_replace('/\D+/', '', (string) $number);
        $number = ltrim($number, '0');
        return $number === '' ? null : (int) $number;
    }

    private function getStateTypeDescription($id): ?string
    {
        return optional(StateType::find($id))->description;
    }
}
