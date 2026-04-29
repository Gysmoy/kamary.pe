<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventualClient extends Model
{
    use HasFactory;

    protected $fillable = [
        'document_type',
        'document_number',
        'business_name',
        'email',
        'phone_prefix',
        'phone',
        'address',
        'contact_name',
        'notes',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'status' => 'boolean',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
