<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClientContractAnnex extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_contract_id',
        'file_path',
        'file_name',
        'file_mime',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'status' => 'boolean',
    ];

    public function contract()
    {
        return $this->belongsTo(ClientContract::class, 'client_contract_id');
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
