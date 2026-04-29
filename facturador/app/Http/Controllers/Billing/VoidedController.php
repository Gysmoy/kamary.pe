<?php

namespace App\Http\Controllers\Billing;

use App\CoreFacturalo\Facturalo;
use App\CoreFacturalo\Helpers\Storage\StorageDocument;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\VoidedRequest;
use App\Http\Resources\Billing\VoidedCollection;
use App\Models\Billing\Configuration;
use App\Models\Billing\Document;
use App\Models\Billing\Voided;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class VoidedController extends Controller
{
    use StorageDocument;

    public function __construct()
    {
        $this->middleware('input.request:voided,web', ['only' => ['store']]);
    }

    public function index()
    {
        return view('tenant.voided.index');
    }

    public function columns()
    {
        return [
            'date_of_issue' => 'Fecha de emision',
        ];
    }

    public function records(Request $request)
    {
        $allowedColumns = ['date_of_issue', 'date_of_reference', 'identifier', 'ticket'];
        $column = in_array($request->column, $allowedColumns, true) ? $request->column : 'date_of_issue';
        $value = trim((string) $request->value);
        $itemsPerPage = (int) config('tenant.items_per_page', 20);

        $voided = DB::connection('tenant')
            ->table('voided')
            ->select(DB::raw("id, external_id, date_of_reference, date_of_issue, ticket, identifier, state_type_id, 'voided' AS 'type'"));

        $summaries = DB::connection('tenant')
            ->table('summaries')
            ->select(DB::raw("id, external_id, date_of_reference, date_of_issue, ticket, identifier, state_type_id, 'summaries' AS 'type'"))
            ->where('summary_status_type_id', '3');

        if ($value !== '') {
            $voided->where($column, 'like', "%{$value}%");
            $summaries->where($column, 'like', "%{$value}%");
        }

        $records = $voided->unionAll($summaries);

        $paginated = DB::connection('tenant')
            ->query()
            ->fromSub($records, 'voided_records')
            ->orderBy('date_of_issue', 'DESC')
            ->orderBy('id', 'DESC')
            ->paginate($itemsPerPage);

        return new VoidedCollection($paginated);
    }

    public function store(VoidedRequest $request)
    {
        $validate = $this->validateVoided($request);
        if (!$validate['success']) {
            return $validate;
        }

        $fact = DB::connection('tenant')->transaction(function () use ($request) {
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
            'message' => "La anulacion {$document->identifier} fue creada correctamente",
        ];
    }

    /**
     * Validaciones previas.
     *
     * @param VoidedRequest $request
     * @return array
     */
    public function validateVoided($request)
    {
        $restrictVoidedSend = false;
        $shippingTimeDaysVoided = 0;

        // Lite compatibility: some schemas do not include these fields.
        if (
            Schema::connection('tenant')->hasColumn('configurations', 'restrict_voided_send') &&
            Schema::connection('tenant')->hasColumn('configurations', 'shipping_time_days_voided')
        ) {
            try {
                $configuration = Configuration::query()
                    ->select('restrict_voided_send', 'shipping_time_days_voided')
                    ->first();

                if ($configuration) {
                    $restrictVoidedSend = (bool) $configuration->restrict_voided_send;
                    $shippingTimeDaysVoided = max(0, (int) $configuration->shipping_time_days_voided);
                }
            } catch (\Throwable $e) {
                $restrictVoidedSend = false;
                $shippingTimeDaysVoided = 0;
            }
        }

        $voidedDateOfIssue = Carbon::parse($request->date_of_issue);

        if ($restrictVoidedSend) {
            foreach ($request->documents as $row) {
                $document = Document::whereFilterWithOutRelations()
                    ->select('date_of_issue')
                    ->findOrFail($row['document_id']);

                $differenceDays = $shippingTimeDaysVoided - $document->getDiffInDaysDateOfIssue($voidedDateOfIssue);

                if ($differenceDays < 0) {
                    return [
                        'success' => false,
                        'message' => "El documento excede los {$shippingTimeDaysVoided} dias validos para ser anulado.",
                    ];
                }
            }
        }

        return [
            'success' => true,
            'message' => null,
        ];
    }

    public function status($voided_id)
    {
        $document = Voided::find($voided_id);

        $fact = DB::connection('tenant')->transaction(function () use ($document) {
            $facturalo = new Facturalo();
            $facturalo->setDocument($document);
            $facturalo->setType('voided');
            $facturalo->statusSummary($document->ticket);
            return $facturalo;
        });

        $response = $fact->getResponse();

        return [
            'success' => true,
            'message' => $response['description'],
        ];
    }

    public function status_masive()
    {
        $records = Voided::where('state_type_id', '03')->get();

        DB::connection('tenant')->transaction(function () use ($records) {
            foreach ($records as $document) {
                $facturalo = new Facturalo();
                $facturalo->setDocument($document);
                $facturalo->setType('voided');
                $facturalo->statusSummary($document->ticket);
            }
        });

        return [
            'success' => true,
            'message' => 'Consulta masiva ejecutada.',
        ];
    }

    public function destroy($voided_id)
    {
        $document = Voided::find($voided_id);

        foreach ($document->documents as $doc) {
            $doc->document->update([
                'state_type_id' => '05',
            ]);
        }

        $document->delete();

        return [
            'success' => true,
            'message' => 'Anulacion eliminada con exito',
        ];
    }
}
