<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClientDistributionNetwork extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'code',
        'name',
        'commercial_channel',
        'segment',
        'contact_name',
        'contact_phone',
        'contact_email',
        'observations',
        'is_default',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'status' => 'boolean',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function addresses()
    {
        return $this->hasMany(ClientDeliveryAddress::class)->orderBy('id');
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
