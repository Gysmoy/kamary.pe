<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('users')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'is_driver')) {
                $table->boolean('is_driver')->default(false)->after(Schema::hasColumn('users', 'storage_client_id') ? 'storage_client_id' : 'phone');
            }

            if (!Schema::hasColumn('users', 'driver_id')) {
                $table->foreignId('driver_id')->nullable()->after('is_driver')->constrained('drivers')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('users')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'driver_id')) {
                $table->dropConstrainedForeignId('driver_id');
            }

            if (Schema::hasColumn('users', 'is_driver')) {
                $table->dropColumn('is_driver');
            }
        });
    }
};
