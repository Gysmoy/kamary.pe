<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $columns = [
            'fiscal_address' => ['after' => 'full_address'],
            'zone_code' => ['after' => 'fiscal_address'],
            'domicile' => ['after' => 'zone_code'],
            'domicile_condition' => ['after' => 'domicile'],
            'interior' => ['after' => 'domicile_condition'],
            'kilometer' => ['after' => 'interior'],
            'block' => ['after' => 'kilometer'],
            'lot' => ['after' => 'block'],
            'street_name' => ['after' => 'lot'],
            'street_type' => ['after' => 'street_name'],
            'address_number' => ['after' => 'street_type'],
            'zone_type' => ['after' => 'address_number'],
            'apartment' => ['after' => 'zone_type'],
            'department' => ['after' => 'apartment'],
            'province' => ['after' => 'department'],
            'district' => ['after' => 'province'],
            'taxpayer_status' => ['after' => 'district'],
            'tax_last_updated_at' => ['after' => 'taxpayer_status'],
        ];

        Schema::table('clients', function (Blueprint $table) use ($columns) {
            foreach ($columns as $column => $options) {
                if (!Schema::hasColumn('clients', $column)) {
                    $table->string($column)->nullable()->after($options['after']);
                }
            }
        });
    }

    public function down(): void
    {
        $columns = [
            'fiscal_address',
            'zone_code',
            'domicile',
            'domicile_condition',
            'interior',
            'kilometer',
            'block',
            'lot',
            'street_name',
            'street_type',
            'address_number',
            'zone_type',
            'apartment',
            'department',
            'province',
            'district',
            'taxpayer_status',
            'tax_last_updated_at',
        ];

        Schema::table('clients', function (Blueprint $table) use ($columns) {
            foreach ($columns as $column) {
                if (Schema::hasColumn('clients', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
