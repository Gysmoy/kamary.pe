<?php

namespace App\Models\Billing;

class DispatchVoidedDocument extends ModelTenant
{
    protected $table = 'dispatch_voided_documents';
    protected $with = ['dispatch'];
    public $timestamps = false;

    protected $fillable = [
        'dispatch_voided_id',
        'dispatch_id',
        'description',
    ];

    public function dispatchVoided()
    {
        return $this->belongsTo(DispatchVoided::class, 'dispatch_voided_id');
    }

    public function dispatch()
    {
        return $this->belongsTo(Dispatch::class);
    }
}
