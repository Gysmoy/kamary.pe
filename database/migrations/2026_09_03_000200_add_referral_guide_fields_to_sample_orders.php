<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Datos de la guia de remision del pedido de muestra. Van planos sobre sample_orders,
     * igual que en entry_notes, porque el PDF los lee directo del pedido.
     */
    private const COLUMNS = [
        'guide_issue_date',
        'guide_transfer_date',
        'transfer_reason',
        'transfer_mode',
        'origin_address',
        'carrier_name',
        'carrier_document',
        'driver_id',
        'driver_name',
        'driver_document_type',
        'driver_document_number',
        'driver_license_number',
        'vehicle_id',
        'vehicle_plate',
        'package_count',
    ];

    public function up(): void
    {
        Schema::table('sample_orders', function (Blueprint $table) {
            if (!Schema::hasColumn('sample_orders', 'guide_issue_date')) $table->date('guide_issue_date')->nullable()->after('referral_guide');
            if (!Schema::hasColumn('sample_orders', 'guide_transfer_date')) $table->date('guide_transfer_date')->nullable()->after('guide_issue_date');
            if (!Schema::hasColumn('sample_orders', 'transfer_reason')) $table->string('transfer_reason')->nullable()->after('guide_transfer_date');
            if (!Schema::hasColumn('sample_orders', 'transfer_mode')) $table->string('transfer_mode')->nullable()->after('transfer_reason');
            if (!Schema::hasColumn('sample_orders', 'origin_address')) $table->string('origin_address', 500)->nullable()->after('transfer_mode');
            if (!Schema::hasColumn('sample_orders', 'carrier_name')) $table->string('carrier_name')->nullable()->after('origin_address');
            if (!Schema::hasColumn('sample_orders', 'carrier_document')) $table->string('carrier_document', 20)->nullable()->after('carrier_name');
            if (!Schema::hasColumn('sample_orders', 'driver_id')) $table->unsignedBigInteger('driver_id')->nullable()->after('carrier_document');
            if (!Schema::hasColumn('sample_orders', 'driver_name')) $table->string('driver_name')->nullable()->after('driver_id');
            if (!Schema::hasColumn('sample_orders', 'driver_document_type')) $table->string('driver_document_type', 20)->nullable()->after('driver_name');
            if (!Schema::hasColumn('sample_orders', 'driver_document_number')) $table->string('driver_document_number', 20)->nullable()->after('driver_document_type');
            if (!Schema::hasColumn('sample_orders', 'driver_license_number')) $table->string('driver_license_number', 30)->nullable()->after('driver_document_number');
            if (!Schema::hasColumn('sample_orders', 'vehicle_id')) $table->unsignedBigInteger('vehicle_id')->nullable()->after('driver_license_number');
            if (!Schema::hasColumn('sample_orders', 'vehicle_plate')) $table->string('vehicle_plate', 20)->nullable()->after('vehicle_id');
            if (!Schema::hasColumn('sample_orders', 'package_count')) $table->unsignedInteger('package_count')->nullable()->after('vehicle_plate');
        });
    }

    public function down(): void
    {
        $columns = array_values(array_filter(
            self::COLUMNS,
            fn ($column) => Schema::hasColumn('sample_orders', $column)
        ));

        if (!$columns) return;

        Schema::table('sample_orders', function (Blueprint $table) use ($columns) {
            $table->dropColumn($columns);
        });
    }
};
