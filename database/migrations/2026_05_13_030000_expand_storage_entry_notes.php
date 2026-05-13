<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('entry_notes', function (Blueprint $table) {
            if (!Schema::hasColumn('entry_notes', 'code')) {
                $table->string('code')->nullable()->unique()->after('id');
            }
            if (!Schema::hasColumn('entry_notes', 'client_id')) {
                $table->foreignId('client_id')->nullable()->after('supplier_id')->constrained('clients')->nullOnDelete();
            }
            if (!Schema::hasColumn('entry_notes', 'provider_distributor')) {
                $table->string('provider_distributor')->nullable()->after('client_id');
            }
            if (!Schema::hasColumn('entry_notes', 'entry_date')) {
                $table->date('entry_date')->nullable()->after('provider_distributor');
            }
            if (!Schema::hasColumn('entry_notes', 'document_date')) {
                $table->date('document_date')->nullable()->after('document_sequence');
            }
            if (!Schema::hasColumn('entry_notes', 'invoice_type')) {
                $table->string('invoice_type')->nullable()->after('document_file');
            }
            if (!Schema::hasColumn('entry_notes', 'invoice_series')) {
                $table->string('invoice_series')->nullable()->after('invoice_type');
            }
            if (!Schema::hasColumn('entry_notes', 'invoice_sequence')) {
                $table->string('invoice_sequence')->nullable()->after('invoice_series');
            }
            if (!Schema::hasColumn('entry_notes', 'invoice_date')) {
                $table->date('invoice_date')->nullable()->after('invoice_sequence');
            }
            if (!Schema::hasColumn('entry_notes', 'dua_number')) {
                $table->string('dua_number')->nullable()->after('invoice_date');
            }
            if (!Schema::hasColumn('entry_notes', 'transport_agency')) {
                $table->string('transport_agency')->nullable()->after('dua_number');
            }
            if (!Schema::hasColumn('entry_notes', 'driver_name')) {
                $table->string('driver_name')->nullable()->after('transport_agency');
            }
            if (!Schema::hasColumn('entry_notes', 'driver_license')) {
                $table->string('driver_license')->nullable()->after('driver_name');
            }
            if (!Schema::hasColumn('entry_notes', 'vehicle_plate')) {
                $table->string('vehicle_plate')->nullable()->after('driver_license');
            }
            if (!Schema::hasColumn('entry_notes', 'entry_status')) {
                $table->string('entry_status', 20)->default('pending')->after('status');
            }
        });

        DB::statement("UPDATE entry_notes SET code = CONCAT('NE', LPAD(id, 5, '0')) WHERE code IS NULL OR code = ''");
        DB::table('entry_notes')->whereNull('entry_status')->update(['entry_status' => 'approved']);
        DB::table('entry_notes')->where('entry_status', 'pending')->update(['entry_status' => 'approved']);

        Schema::table('entry_note_items', function (Blueprint $table) {
            if (!Schema::hasColumn('entry_note_items', 'expiration_date')) {
                $table->date('expiration_date')->nullable()->after('lot');
            }
            if (!Schema::hasColumn('entry_note_items', 'storage_condition')) {
                $table->string('storage_condition')->nullable()->after('expiration_date');
            }
            if (!Schema::hasColumn('entry_note_items', 'manufacturer_id')) {
                $table->foreignId('manufacturer_id')->nullable()->after('storage_condition')->constrained('laboratories')->nullOnDelete();
            }
            if (!Schema::hasColumn('entry_note_items', 'requested_quantity')) {
                $table->decimal('requested_quantity', 12, 3)->default(0)->after('location');
            }
            if (!Schema::hasColumn('entry_note_items', 'received_quantity')) {
                $table->decimal('received_quantity', 12, 3)->default(0)->after('requested_quantity');
            }
        });

        DB::statement('UPDATE entry_note_items SET requested_quantity = quantity WHERE requested_quantity IS NULL OR requested_quantity = 0');
        DB::statement('UPDATE entry_note_items SET received_quantity = quantity WHERE received_quantity IS NULL OR received_quantity = 0');
    }

    public function down(): void
    {
        Schema::table('entry_note_items', function (Blueprint $table) {
            if (Schema::hasColumn('entry_note_items', 'manufacturer_id')) {
                $table->dropConstrainedForeignId('manufacturer_id');
            }
            foreach (['received_quantity', 'requested_quantity', 'storage_condition', 'expiration_date'] as $column) {
                if (Schema::hasColumn('entry_note_items', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::table('entry_notes', function (Blueprint $table) {
            if (Schema::hasColumn('entry_notes', 'client_id')) {
                $table->dropConstrainedForeignId('client_id');
            }
            foreach ([
                'entry_status',
                'vehicle_plate',
                'driver_license',
                'driver_name',
                'transport_agency',
                'dua_number',
                'invoice_date',
                'invoice_sequence',
                'invoice_series',
                'invoice_type',
                'document_date',
                'entry_date',
                'provider_distributor',
                'code',
            ] as $column) {
                if (Schema::hasColumn('entry_notes', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
