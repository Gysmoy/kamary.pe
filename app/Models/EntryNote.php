<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EntryNote extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'business_id',
        'business_branch_id',
        'warehouse_id',
        'supplier_id',
        'client_id',
        'provider_distributor',
        'entry_date',
        'document_type',
        'document_series',
        'document_sequence',
        'document_date',
        'document_file',
        'invoice_type',
        'invoice_series',
        'invoice_sequence',
        'invoice_date',
        'dua_number',
        'transport_agency',
        'driver_name',
        'driver_license',
        'vehicle_plate',
        'currency',
        'observations',
        'guide_series',
        'guide_sequence',
        'guide_ruc',
        'guide_file',
        'status',
        'entry_status',
        'voided_exit_note_id',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'status' => 'boolean',
        'entry_date' => 'date',
        'document_date' => 'date',
        'invoice_date' => 'date',
    ];

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function branch()
    {
        return $this->belongsTo(BusinessBranch::class, 'business_branch_id');
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function items()
    {
        return $this->hasMany(EntryNoteItem::class)->orderBy('id');
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
