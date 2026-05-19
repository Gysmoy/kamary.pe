<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('magistral_outputs', function (Blueprint $table) {
            if (!Schema::hasColumn('magistral_outputs', 'destination_warehouse_id')) {
                $table->foreignId('destination_warehouse_id')
                    ->nullable()
                    ->after('origin_warehouse_id')
                    ->constrained('warehouses')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('magistral_outputs', function (Blueprint $table) {
            if (Schema::hasColumn('magistral_outputs', 'destination_warehouse_id')) {
                $table->dropConstrainedForeignId('destination_warehouse_id');
            }
        });
    }
};
