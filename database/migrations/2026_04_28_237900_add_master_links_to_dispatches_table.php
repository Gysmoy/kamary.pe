<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dispatches', function (Blueprint $table) {
            $table->foreignId('driver_id')->nullable()->after('shift')->constrained('drivers')->nullOnDelete();
            $table->foreignId('vehicle_id')->nullable()->after('copilot_name')->constrained('vehicles')->nullOnDelete();
            $table->foreignId('zone_id')->nullable()->after('vehicle_plate')->constrained('zones')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('dispatches', function (Blueprint $table) {
            $table->dropConstrainedForeignId('driver_id');
            $table->dropConstrainedForeignId('vehicle_id');
            $table->dropConstrainedForeignId('zone_id');
        });
    }
};
