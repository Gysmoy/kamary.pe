<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PriceList extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'business_id',
        'business_branch_id',
        'warehouse_id',
        'client_id',
        'eventual_client_id',
        'client_distribution_network_id',
        'channel',
        'segment',
        'currency',
        'priority',
        'starts_at',
        'ends_at',
        'observations',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'priority' => 'integer',
        'starts_at' => 'date',
        'ends_at' => 'date',
        'status' => 'boolean',
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

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function eventualClient()
    {
        return $this->belongsTo(EventualClient::class);
    }

    public function distributionNetwork()
    {
        return $this->belongsTo(ClientDistributionNetwork::class, 'client_distribution_network_id');
    }

    public function items()
    {
        return $this->hasMany(PriceListItem::class)->orderBy('id');
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
