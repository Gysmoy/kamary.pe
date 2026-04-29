<?php

namespace App\Http\Resources\Billing;

use App\Models\Billing\EmailSendLog;
use App\Models\Billing\Configuration;
use Carbon\Carbon;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Support\Facades\Schema;

class DocumentCollection extends ResourceCollection
{
    /**
     * Transform the resource collection into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return mixed
     */
    public function toArray($request) {
        $shippingTimeDays = 4;
        $restrictReceiptDate = true;

        if (
            Schema::hasColumn('configurations', 'shipping_time_days') &&
            Schema::hasColumn('configurations', 'restrict_receipt_date')
        ) {
            try {
                $configuration = Configuration::query()
                    ->select(['shipping_time_days', 'restrict_receipt_date'])
                    ->first();

                if ($configuration) {
                    $shippingTimeDays = (int) $configuration->shipping_time_days > 0
                        ? (int) $configuration->shipping_time_days
                        : 4;
                    $restrictReceiptDate = (bool) $configuration->restrict_receipt_date;
                }
            } catch (\Throwable $e) {
                $shippingTimeDays = 4;
                $restrictReceiptDate = true;
            }
        }

        return $this->collection->transform(function(\App\Models\Billing\Document $row, $key) use ($shippingTimeDays, $restrictReceiptDate) {
            $has_xml = true;
            $has_pdf = true;
            $has_cdr = false;
            $btn_note = false;
            $btn_guide = true; // Boton para generar guia
            $btn_resend = false;
            $btn_voided = false;
            $btn_consult_cdr = false;
            $btn_delete_doc_type_03 = false;
            $btn_constancy_detraction = false;

            $affected_document = null;

            if ($row->group_id === '01') {
                if ($row->state_type_id === '01') {
                    $btn_resend = true;
                }

                if ($row->state_type_id === '05') {
                    $has_cdr = true;
                    $btn_note = true;
                    $btn_resend = false;
                    $btn_voided = true;
                    // SUNAT CDR query is not available for demo SOAP.
                    $btn_consult_cdr = ((string) $row->soap_type_id !== '01');
                }

                if(in_array($row->document_type_id, ['07', '08'])) {
                    $btn_note = false;
                }
            }
            if ($row->group_id === '02') {
                if ($row->state_type_id === '01' && $row->document_type_id === '03') {
                    // Boletas registradas tambien deben poder enviarse a SUNAT.
                    $btn_resend = true;
                }

                if ($row->state_type_id === '05') {
                    $btn_note = true;
                    $btn_voided = true;
                }

                if (in_array($row->document_type_id, ['07', '08'])) {
                    $btn_note = false;
                }

                if($row->document_type_id === '03' && config('tenant.delete_document_type_03')){

                    if ($row->state_type_id === '01' && $row->doesntHave('summary_document')) {
                        $btn_delete_doc_type_03 = true;
                    }

                }

            }
            $btn_guide = $btn_note;
            if($btn_guide === false && ($row->state_type_id === '01')){
                // #750
                $btn_guide = true;
            }

            if (in_array($row->document_type_id, ['01', '03'])) {
                $btn_constancy_detraction = ($row->detraction) ? true:false;
            }

            // $btn_recreate_document = config('tenant.recreate_document');
            $btn_recreate_document = auth()->user()->recreate_documents;

            $btn_change_to_registered_status = false;
            if($row->state_type_id === '01') {
                $btn_change_to_registered_status = config('tenant.change_to_registered_status');
            }

            $total_payment = $row->payments->sum('payment');
            $balance = number_format($row->total - $total_payment,2, ".", "");

            $message_regularize_shipping = null;

            if($row->regularize_shipping) {
                $message_regularize_shipping = "Por regularizar: {$row->response_regularize_shipping->code} - {$row->response_regularize_shipping->description}";
            }
            $nvs = $row->getNvCollection();

            $order_note = $row->getOrderNoteCollection();
            // Regresa si se hn enviado correos
            $email_send_it = false;
            $email_send_it_array = [];
            $send_it = collect();

            if (class_exists(EmailSendLog::class)) {
                try {
                    $send_it = EmailSendLog::Document()->FindRelationId($row->id)->get();
                } catch (\Throwable $e) {
                    $send_it = collect();
                }
            }

            if(count($send_it)> 0){
                /** @var EmailSendLog $log*/
                foreach($send_it as $log){
                    $email_send_it_array[] = [
                        'email'=>$log->email,
                        'send_it'=>$log->sendit,
                        'send_date'=>$log->created_at->format('Y-m-d H:i'),
                    ];
                    if($email_send_it == false){
                        $email_send_it = $log->sendit;
                    }
                }
            }

            $editableByDate = true;
            if ($restrictReceiptDate) {
                $dateDocument = Carbon::parse($row->date_of_issue);
                $differenceDays = $shippingTimeDays - $dateDocument->diffInDays(Carbon::now());
                $editableByDate = $differenceDays > 0;
            }

            $isEditable = (bool) $row->is_editable && $editableByDate;
            $editBlockedReason = null;

            if (!$isEditable) {
                if (!$editableByDate && $restrictReceiptDate) {
                    $editBlockedReason = "No editable: supera {$shippingTimeDays} día(s) desde la fecha de emisión.";
                } else {
                    $editBlockedReason = 'No editable por configuración interna.';
                }
            }

            return [

                'id' => $row->id,
                'group_id' => $row->group_id,
                'soap_type_id' => $row->soap_type_id,
                'soap_type_description' => $row->soap_type->description,
                'date_of_issue' => $row->date_of_issue->format('Y-m-d'),
                'date_of_due' => (in_array($row->document_type_id, ['01', '03'])) ? $row->invoice->date_of_due->format('Y-m-d') : null,
                'number' => $row->number_full,
                'customer_name' => $row->customer->name,
                'customer_number' => $row->customer->number,
                'customer_telephone' => $row->customer->telephone,
                'currency_type_id' => $row->currency_type_id,
                'total_exportation' => $row->total_exportation,
                'total_free' => $row->total_free,
                'total_unaffected' => $row->total_unaffected,
                'total_exonerated' => $row->total_exonerated,
                'total_taxed' => $row->total_taxed,
                'total_igv' => $row->total_igv,
                'total' => $row->total,
                'state_type_id' => $row->state_type_id,
                'state_type_description' => $row->state_type->description,
                'document_type_description' => $row->document_type->description,
                'document_type_id' => $row->document_type->id,
                'has_xml' => $has_xml,
                'has_pdf' => $has_pdf,
                'has_cdr' => $has_cdr,
                'download_xml' => $row->download_external_xml,
                'download_pdf' => $row->download_external_pdf,
                'download_cdr' => $row->download_external_cdr,
                'btn_voided' => $btn_voided,
                'btn_note' => $btn_note,
                'btn_guide' => $btn_guide,
//                'btn_ticket' => $btn_ticket,
                'btn_resend' => $btn_resend,
                'btn_consult_cdr' => $btn_consult_cdr,
                'btn_constancy_detraction' => $btn_constancy_detraction,
                'btn_recreate_document' => $btn_recreate_document,
                'btn_change_to_registered_status' => $btn_change_to_registered_status,
                'btn_delete_doc_type_03' => $btn_delete_doc_type_03,
                'send_server' => (bool) $row->send_server,
//                'voided' => $voided,
                'affected_document' => $affected_document,
//                'has_xml_voided' => $has_xml_voided,
//                'has_cdr_voided' => $has_cdr_voided,
//                'download_xml_voided' => $download_xml_voided,
//                'download_cdr_voided' => $download_cdr_voided,
                'shipping_status' => json_decode($row->shipping_status) ,
                'sunat_shipping_status' => json_decode($row->sunat_shipping_status) ,
                'query_status' => json_decode($row->query_status) ,
                'created_at' => $row->created_at->format('Y-m-d H:i:s'),
                'updated_at' => $row->updated_at->format('Y-m-d H:i:s'),
                'user_name' => ($row->user) ? $row->user->name : '',
                'user_email' => ($row->user) ? $row->user->email : '',
                'user_id' => $row->user_id,
                'email_send_it' => $email_send_it,
                'email_send_it_array' => $email_send_it_array,
                'external_id' => $row->external_id,

                'notes' => (in_array($row->document_type_id, ['01', '03'])) ? $row->affected_documents->transform(function($row) {
                    return [
                        'id' => $row->id,
                        'document_id' => $row->document_id,
                        'note_type_description' => ($row->note_type == 'credit') ? 'NC':'ND',
                        'description' => $row->document->number_full,
                    ];
                }) : null,
                'sales_note' => $nvs,
                'order_note' =>$order_note,
                'balance' => $balance,
                'guides' => !empty($row->guides)?(array)$row->guides:null,
                'message_regularize_shipping' => $message_regularize_shipping,
                'regularize_shipping' => (bool) $row->regularize_shipping,
                'purchase_order' => $row->purchase_order,
                'is_editable' => $isEditable,
                'edit_blocked_reason' => $editBlockedReason,
                'dispatches' => $this->getDispatches($row),
                'soap_type' => $row->soap_type,
                'plate_numbers' => $row->getPlateNumbers(),
                'total_charge' => $row->total_charge,
            ];

        });
    }


    private function getDispatches($row){

        if (!Schema::hasTable('dispatches')) {
            return [];
        }

        $dispatches = [];

        if(in_array($row->document_type_id, ['01', '03'])) {

            $dispatches = $row->reference_guides->transform(function($row) {
                return [
                    'description' => $row->number_full,
                ];
            });

            if($row->dispatch){
                $dispatches = $dispatches->push([
                    'description' => $row->dispatch->number_full,
                ]);
            }

        }

        return $dispatches;

    }

}

