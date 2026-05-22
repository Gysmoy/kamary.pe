<?php

namespace App\Models\Billing;

class DispatchVoided extends ModelTenant
{
    protected $table = 'dispatch_voided';
    protected $with = ['user', 'soap_type', 'state_type', 'documents'];

    protected $fillable = [
        'user_id',
        'external_id',
        'soap_type_id',
        'state_type_id',
        'ubl_version',
        'date_of_issue',
        'date_of_reference',
        'identifier',
        'filename',
        'ticket',
        'has_ticket',
        'has_cdr',
        'soap_shipping_response',
    ];

    protected $casts = [
        'date_of_issue' => 'date',
        'date_of_reference' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function soap_type()
    {
        return $this->belongsTo(SoapType::class);
    }

    public function state_type()
    {
        return $this->belongsTo(StateType::class);
    }

    public function documents()
    {
        return $this->hasMany(DispatchVoidedDocument::class, 'dispatch_voided_id');
    }

    public function getDownloadExternalXmlAttribute()
    {
        return route('api.download.external_id', ['model' => 'dispatchVoided', 'type' => 'xml', 'external_id' => $this->external_id]);
    }

    public function getDownloadExternalCdrAttribute()
    {
        return route('api.download.external_id', ['model' => 'dispatchVoided', 'type' => 'cdr', 'external_id' => $this->external_id]);
    }

    public function getSoapShippingResponseAttribute($value)
    {
        return is_null($value) ? null : (object) json_decode($value);
    }

    public function setSoapShippingResponseAttribute($value)
    {
        $this->attributes['soap_shipping_response'] = is_null($value) ? null : json_encode($value);
    }
}
