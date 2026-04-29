<?php

namespace App\Traits;

use App\Models\Billing\Catalogs\DocumentType;
use App\Models\Billing\Establishment;

/**
 * 
 */
trait ReportTrait
{
    /**
     * Get type doc
     * @param  string $documentType
     * @return int
     */
    public function getTypeDoc($documentType) {
        foreach (DocumentType::all() as $item) {
            if (mb_strtoupper($item->description) == $documentType) return $item->id;
        }
        
        return null;
    }

    public function getEstablishmentId($establishment) {
        foreach (Establishment::all() as $item) {
            if (mb_strtoupper($item->description) == $establishment) return $item->id;
        }
        
        return null;
    }
}
