<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    use HasFactory;

    protected $fillable = [
        'document_type',
        'document_number',
        'client_kind',
        'full_name',
        'is_platform',
        'has_storage_service',
        'storage_tariff_enabled',
        'contract_due_days',
        'commercial_channel',
        'segment',
        'email',
        'billing_email',
        'primary_contact',
        'primary_contact_phone',
        'phone',
        'phone_prefix',
        'short_code',
        'ubigeo',
        'full_address',
        'fiscal_address',
        'zone_code',
        'domicile',
        'domicile_condition',
        'interior',
        'kilometer',
        'block',
        'lot',
        'street_name',
        'street_type',
        'address_number',
        'zone_type',
        'apartment',
        'department',
        'province',
        'district',
        'taxpayer_status',
        'tax_last_updated_at',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'status' => 'boolean',
        'is_platform' => 'boolean',
        'has_storage_service' => 'boolean',
        'storage_tariff_enabled' => 'boolean',
        'contract_due_days' => 'integer',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function distributionNetworks()
    {
        return $this->hasMany(ClientDistributionNetwork::class)->orderBy('id');
    }

    public function deliveryAddresses()
    {
        return $this->hasMany(ClientDeliveryAddress::class)->orderBy('id');
    }
}
