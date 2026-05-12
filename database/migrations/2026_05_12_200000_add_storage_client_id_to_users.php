<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('users', 'storage_client_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->foreignId('storage_client_id')->nullable()->after('scope')->constrained('clients')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'storage_client_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropConstrainedForeignId('storage_client_id');
            });
        }
    }
};
