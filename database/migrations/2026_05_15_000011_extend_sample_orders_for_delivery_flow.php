<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sample_orders', function (Blueprint $table) {
            if (!Schema::hasColumn('sample_orders', 'client_id')) $table->unsignedBigInteger('client_id')->nullable()->after('client_name');
            if (!Schema::hasColumn('sample_orders', 'supervisor_id')) $table->unsignedBigInteger('supervisor_id')->nullable()->after('supervisor_name');
            if (!Schema::hasColumn('sample_orders', 'request_reason')) $table->string('request_reason')->nullable()->after('supervisor_id');
            if (!Schema::hasColumn('sample_orders', 'sales_channel')) $table->string('sales_channel')->nullable()->after('channel');
            if (!Schema::hasColumn('sample_orders', 'sales_subchannel')) $table->string('sales_subchannel')->nullable()->after('sales_channel');
            if (!Schema::hasColumn('sample_orders', 'business_line')) $table->string('business_line')->nullable()->after('sales_subchannel');
            if (!Schema::hasColumn('sample_orders', 'business_subline')) $table->string('business_subline')->nullable()->after('business_line');
            if (!Schema::hasColumn('sample_orders', 'ubigeo')) $table->string('ubigeo')->nullable()->after('business_subline');
            if (!Schema::hasColumn('sample_orders', 'delivery_address')) $table->string('delivery_address')->nullable()->after('ubigeo');
            if (!Schema::hasColumn('sample_orders', 'delivery_reference')) $table->string('delivery_reference')->nullable()->after('delivery_address');
            if (!Schema::hasColumn('sample_orders', 'service_type')) $table->string('service_type')->nullable()->after('delivery_reference');
            if (!Schema::hasColumn('sample_orders', 'contact_document')) $table->string('contact_document')->nullable()->after('document_number');
            if (!Schema::hasColumn('sample_orders', 'contact_name')) $table->string('contact_name')->nullable()->after('contact_document');
            if (!Schema::hasColumn('sample_orders', 'contact_phone')) $table->string('contact_phone')->nullable()->after('contact_name');
            if (!Schema::hasColumn('sample_orders', 'map_lat')) $table->decimal('map_lat', 12, 8)->nullable()->after('contact_phone');
            if (!Schema::hasColumn('sample_orders', 'map_lng')) $table->decimal('map_lng', 12, 8)->nullable()->after('map_lat');
            if (!Schema::hasColumn('sample_orders', 'evidence_url')) $table->string('evidence_url')->nullable()->after('observations');
            if (!Schema::hasColumn('sample_orders', 'evidence_notes')) $table->text('evidence_notes')->nullable()->after('evidence_url');
            if (!Schema::hasColumn('sample_orders', 'items')) $table->json('items')->nullable()->after('evidence_notes');
        });
    }

    public function down(): void
    {
        $columns = [
            'client_id',
            'supervisor_id',
            'request_reason',
            'sales_channel',
            'sales_subchannel',
            'business_line',
            'business_subline',
            'ubigeo',
            'delivery_address',
            'delivery_reference',
            'service_type',
            'contact_document',
            'contact_name',
            'contact_phone',
            'map_lat',
            'map_lng',
            'evidence_url',
            'evidence_notes',
            'items',
        ];

        $existing = array_values(array_filter($columns, fn ($column) => Schema::hasColumn('sample_orders', $column)));
        if (!$existing) return;

        Schema::table('sample_orders', function (Blueprint $table) use ($existing) {
            $table->dropColumn($existing);
        });
    }
};
