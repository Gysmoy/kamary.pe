<?php

namespace App\CoreFacturalo\Requests\Api\Validation;

use App\Models\Billing\Establishment;
use Exception;

class DocumentValidation
{
    public static function validation($inputs) {
        $inputs['establishment_id'] = self::resolveEstablishmentId($inputs);

        Functions::validateSeries($inputs);
        
        if (in_array($inputs['document_type_id'], ['07', '08'])) {

            if($inputs['affected_document_external_id']){
                $document = Functions::findAffectedDocumentByExternalId($inputs['affected_document_external_id']);
                $inputs['affected_document_id'] = $document->id;
                $inputs['data_affected_document'] = null;

            }else{
                //validar campos json doc afectado
                $inputs['affected_document_id'] = null;

            }
            
            unset($inputs['affected_document_external_id']);
        }
        
        $inputs['customer_id'] = Functions::person($inputs['customer'], 'customers');
        unset($inputs['customer']);
        
        $inputs['items'] = self::items($inputs['items']);
        
        Functions::DNI($inputs);
        Functions::identityDocumentTypeInvoice($inputs);

        Functions::validateDetraction($inputs);

        Functions::validateDateOfIssue($inputs);
        
        return $inputs;
    }

    private static function resolveEstablishmentId(array $inputs)
    {
        if (auth()->check() && auth()->user()->establishment_id) {
            return auth()->user()->establishment_id;
        }

        if (!empty($inputs['establishment_id'])) {
            return (int)$inputs['establishment_id'];
        }

        $establishment = Establishment::query()->select('id')->orderBy('id')->first();
        if ($establishment) {
            return (int)$establishment->id;
        }

        throw new Exception('No existe establecimiento configurado para emitir comprobantes.');
    }
    
    private static function items($inputs) {
        foreach ($inputs as &$row) {
            $row['item_id'] = Functions::item($row);
            unset($row['internal_id'], $row['description']);
            unset($row['item_type_id'], $row['item_code']);
            unset($row['item_code_gs1'], $row['unit_type_id']);
            unset($row['currency_type_id']);
        }
        
        return $inputs;
    }
}
