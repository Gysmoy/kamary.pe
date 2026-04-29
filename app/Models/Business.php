<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Business extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'tax_number',
        'trade_name',
        'soap_send_id',
        'soap_type_id',
        'soap_username',
        'soap_password',
        'soap_url',
        'detraction_account',
        'certificate_due',
        'operation_amazonia',
        'send_document_to_pse',
        'url_signature_pse',
        'url_send_cdr_pse',
        'client_id_pse',
        'integrated_query_client_id',
        'integrated_query_client_secret',
        'fiscal_logo_path',
        'fiscal_certificate_path',
        'fiscal_certificate_password',
        'facturador_company_id',
        'facturador_sync_status',
        'facturador_sync_message',
        'facturador_last_sync_at',
        'facturador_logo_synced_at',
        'facturador_certificate_synced_at',
        'description',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'status' => 'boolean',
        'certificate_due' => 'date',
        'operation_amazonia' => 'boolean',
        'send_document_to_pse' => 'boolean',
        'facturador_last_sync_at' => 'datetime',
        'facturador_logo_synced_at' => 'datetime',
        'facturador_certificate_synced_at' => 'datetime',
    ];

    protected $hidden = [
        'fiscal_certificate_password',
    ];

    public function branches()
    {
        return $this->hasMany(BusinessBranch::class)->orderBy('name');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
