<?php

namespace App\Models\Billing;

class Dispatch extends ModelTenant
{
    protected $fillable = [
        'user_id',
        'external_id',
        'establishment_id',
        'establishment',
        'soap_type_id',
        'state_type_id',
        'ubl_version',
        'filename',
        'document_type_id',
        'series',
        'number',
        'date_of_issue',
        'time_of_issue',
        'sender_id',
        'receiver_id',
        'customer_id',
        'customer',
        'observations',
        'transport_mode_type_id',
        'transfer_reason_type_id',
        'transfer_reason_description',
        'date_of_shipping',
        'transshipment_indicator',
        'port_code',
        'unit_type_id',
        'total_weight',
        'packages_number',
        'container_number',
        'license_plate',
        'origin',
        'delivery',
        'dispatcher',
        'driver',
        'legends',
        'optional',
        'reference_document_id',
        'reference_quotation_id',
        'reference_order_note_id',
        'reference_order_form_id',
        'reference_sale_note_id',
        'secondary_license_plates',
        'related',
        'order_form_external',
        'data_affected_document',
        'hash',
        'qr',
        'has_xml',
        'has_pdf',
        'has_cdr',
        'ticket',
        'gre_response',
    ];

    protected $casts = [
        'date_of_issue' => 'date',
        'date_of_shipping' => 'date',
        'transshipment_indicator' => 'boolean',
    ];

    public function items()
    {
        return $this->hasMany(DispatchItem::class);
    }

    public function getNumberFullAttribute()
    {
        return $this->series . '-' . $this->number;
    }

    public function getDownloadExternalXmlAttribute()
    {
        return route('api.download.external_id', ['model' => 'dispatch', 'type' => 'xml', 'external_id' => $this->external_id]);
    }

    public function getDownloadExternalPdfAttribute()
    {
        return route('api.download.external_id', ['model' => 'dispatch', 'type' => 'pdf', 'external_id' => $this->external_id]);
    }

    public function getDownloadExternalCdrAttribute()
    {
        return route('api.download.external_id', ['model' => 'dispatch', 'type' => 'cdr', 'external_id' => $this->external_id]);
    }

    public function getEstablishmentAttribute($value)
    {
        return is_null($value) ? null : (object) json_decode($value);
    }

    public function setEstablishmentAttribute($value)
    {
        $this->attributes['establishment'] = is_null($value) ? null : json_encode($value);
    }

    public function getCustomerAttribute($value)
    {
        return is_null($value) ? null : (object) json_decode($value);
    }

    public function setCustomerAttribute($value)
    {
        $this->attributes['customer'] = is_null($value) ? null : json_encode($value);
    }

    public function getOriginAttribute($value)
    {
        return is_null($value) ? null : (object) json_decode($value);
    }

    public function setOriginAttribute($value)
    {
        $this->attributes['origin'] = is_null($value) ? null : json_encode($value);
    }

    public function getDeliveryAttribute($value)
    {
        return is_null($value) ? null : (object) json_decode($value);
    }

    public function setDeliveryAttribute($value)
    {
        $this->attributes['delivery'] = is_null($value) ? null : json_encode($value);
    }

    public function getDispatcherAttribute($value)
    {
        return is_null($value) ? null : (object) json_decode($value);
    }

    public function setDispatcherAttribute($value)
    {
        $this->attributes['dispatcher'] = is_null($value) ? null : json_encode($value);
    }

    public function getDriverAttribute($value)
    {
        return is_null($value) ? null : (object) json_decode($value);
    }

    public function setDriverAttribute($value)
    {
        $this->attributes['driver'] = is_null($value) ? null : json_encode($value);
    }

    public function getLegendsAttribute($value)
    {
        return is_null($value) ? null : (object) json_decode($value);
    }

    public function setLegendsAttribute($value)
    {
        $this->attributes['legends'] = is_null($value) ? null : json_encode($value);
    }

    public function getOptionalAttribute($value)
    {
        return is_null($value) ? null : (object) json_decode($value);
    }

    public function setOptionalAttribute($value)
    {
        $this->attributes['optional'] = is_null($value) ? null : json_encode($value);
    }

    public function getSecondaryLicensePlatesAttribute($value)
    {
        return is_null($value) ? null : (object) json_decode($value);
    }

    public function setSecondaryLicensePlatesAttribute($value)
    {
        $this->attributes['secondary_license_plates'] = is_null($value) ? null : json_encode($value);
    }

    public function getRelatedAttribute($value)
    {
        return is_null($value) ? null : (object) json_decode($value);
    }

    public function setRelatedAttribute($value)
    {
        $this->attributes['related'] = is_null($value) ? null : json_encode($value);
    }

    public function getDataAffectedDocumentAttribute($value)
    {
        return is_null($value) ? null : (object) json_decode($value);
    }

    public function setDataAffectedDocumentAttribute($value)
    {
        $this->attributes['data_affected_document'] = is_null($value) ? null : json_encode($value);
    }
}

