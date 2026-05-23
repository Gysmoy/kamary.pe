<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CommercialOrder extends Model
{
    use HasFactory;

    protected $table = 'commercial_orders';

    protected $fillable = [
        'code',
        'external_source',
        'external_order_id',
        'external_checkout_id',
        'external_delivery_order_id',
        'external_channel',
        'external_ecommerce',
        'external_subservice',
        'external_payment_type',
        'external_store_id',
        'external_warehouse_id',
        'external_account_id',
        'external_sync_status',
        'external_last_synced_at',
        'external_payload',
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
        'map_lat',
        'map_lng',
        'dispatch_contact_name',
        'dispatch_contact_phone',
        'subtotal',
        'tax_amount',
        'total',
        'paid_amount',
        'balance_amount',
        'observations',
        'approved_at',
        'billed_at',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'promised_delivery_at' => 'date',
        'first_due_date' => 'date',
        'approved_at' => 'datetime',
        'billed_at' => 'datetime',
        'external_last_synced_at' => 'datetime',
        'external_payload' => 'array',
        'installments' => 'integer',
        'map_lat' => 'float',
        'map_lng' => 'float',
        'subtotal' => 'float',
        'tax_amount' => 'float',
        'total' => 'float',
        'paid_amount' => 'float',
        'balance_amount' => 'float',
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
        return $this->hasMany(CommercialOrderItem::class)->orderBy('id');
    }

    public function accountsReceivable()
    {
        return $this->hasOne(AccountsReceivable::class, 'source_id')->where('source_type', 'commercial_order');
    }

    public function dispatchAssignments()
    {
        return $this->hasMany(DispatchAssignment::class)->orderBy('id');
    }

    public function referralGuides()
    {
        return $this->hasMany(ReferralGuide::class)->orderByDesc('id');
    }

    public function billingDocuments()
    {
        return $this->hasMany(BillingDocument::class)->orderByDesc('id');
    }

    public function deliveryEvidences()
    {
        return $this->hasMany(DeliveryEvidence::class)->orderByDesc('delivered_at')->orderByDesc('id');
    }

    public function trackingEvents()
    {
        return $this->hasMany(CommercialOrderTrackingEvent::class)->orderBy('happened_at')->orderBy('id');
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
