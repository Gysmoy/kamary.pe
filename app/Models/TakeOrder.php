<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TakeOrder extends Model
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
        'client_delivery_address_id',
        'seller_id',
        'price_list_id',
        'document_type',
        'currency',
        'payment_condition',
        'payment_method',
        'commercial_channel',
        'segment',
        'order_status',
        'payment_status',
        'dispatch_status',
        'billing_status',
        'issue_date',
        'promised_delivery_at',
        'installments',
        'first_due_date',
        'delivery_address',
        'delivery_reference',
        'ubigeo',
        'dispatch_contact_name',
        'dispatch_contact_phone',
        'purchase_order',
        'referral_guide',
        'subtotal',
        'tax_amount',
        'total',
        'observations',
        'approved_at',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'promised_delivery_at' => 'date',
        'first_due_date' => 'date',
        'approved_at' => 'datetime',
        'installments' => 'integer',
        'subtotal' => 'float',
        'tax_amount' => 'float',
        'total' => 'float',
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

    public function deliveryAddress()
    {
        return $this->belongsTo(ClientDeliveryAddress::class, 'client_delivery_address_id');
    }

    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function priceList()
    {
        return $this->belongsTo(PriceList::class);
    }

    public function items()
    {
        return $this->hasMany(TakeOrderItem::class)->orderBy('id');
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
