<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('take_orders', function (Blueprint $table) {
            $table->id();
            $table->string('code', 40)->unique();
            $table->foreignId('business_id')->constrained('businesses');
            $table->foreignId('business_branch_id')->nullable()->constrained('business_branches')->nullOnDelete();
            $table->foreignId('warehouse_id')->constrained('warehouses');
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->foreignId('eventual_client_id')->nullable()->constrained('eventual_clients')->nullOnDelete();
            $table->foreignId('client_distribution_network_id')->nullable()->constrained('client_distribution_networks')->nullOnDelete();
            $table->foreignId('client_delivery_address_id')->nullable()->constrained('client_delivery_addresses')->nullOnDelete();
            $table->foreignId('seller_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('price_list_id')->nullable()->constrained('price_lists')->nullOnDelete();
            $table->string('document_type', 30)->default('Factura');
            $table->string('currency', 10)->default('PEN');
            $table->string('payment_condition', 20)->default('Contado');
            $table->string('payment_method', 60)->nullable();
            $table->string('commercial_channel', 120)->nullable();
            $table->string('segment', 120)->nullable();
            $table->string('order_status', 30)->default('draft');
            $table->string('payment_status', 30)->default('pending');
            $table->string('dispatch_status', 30)->default('pending');
            $table->string('billing_status', 30)->default('pending');
            $table->date('issue_date');
            $table->date('promised_delivery_at')->nullable();
            $table->unsignedSmallInteger('installments')->default(1);
            $table->date('first_due_date')->nullable();
            $table->string('delivery_address')->nullable();
            $table->string('delivery_reference')->nullable();
            $table->string('ubigeo', 20)->nullable();
            $table->string('dispatch_contact_name')->nullable();
            $table->string('dispatch_contact_phone', 30)->nullable();
            $table->string('purchase_order', 80)->nullable();
            $table->string('referral_guide', 80)->nullable();
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('tax_amount', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            $table->text('observations')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->boolean('status')->nullable()->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['business_id', 'issue_date'], 'take_orders_business_issue_idx');
            $table->index(['client_id', 'eventual_client_id'], 'take_orders_customer_idx');
            $table->index(['order_status', 'payment_status', 'status'], 'take_orders_flow_status_idx');
        });

        Schema::create('take_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('take_order_id')->constrained('take_orders')->cascadeOnDelete();
            $table->foreignId('article_id')->constrained('articles');
            $table->foreignId('presentation_id')->nullable()->constrained('article_presentations')->nullOnDelete();
            $table->foreignId('warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();
            $table->foreignId('price_list_item_id')->nullable()->constrained('price_list_items')->nullOnDelete();
            $table->decimal('stock_available', 12, 3)->default(0);
            $table->decimal('cost_unit', 12, 4)->default(0);
            $table->decimal('price_unit', 12, 4)->default(0);
            $table->decimal('presentation_units', 12, 3)->default(1);
            $table->decimal('quantity', 12, 3)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            $table->string('price_source', 40)->nullable();
            $table->boolean('status')->nullable()->default(true);
            $table->timestamps();

            $table->index(['take_order_id', 'article_id'], 'take_order_items_order_article_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('take_order_items');
        Schema::dropIfExists('take_orders');
    }
};
