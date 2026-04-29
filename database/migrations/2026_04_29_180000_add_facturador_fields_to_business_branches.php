<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('business_branches', function (Blueprint $table) {
            $table->unsignedInteger('facturador_establishment_id')->nullable()->after('telephone');
            $table->string('facturador_sync_status', 20)->nullable()->after('facturador_establishment_id');
            $table->text('facturador_sync_message')->nullable()->after('facturador_sync_status');
            $table->timestamp('facturador_last_sync_at')->nullable()->after('facturador_sync_message');

            $table->index(['facturador_establishment_id'], 'business_branches_facturador_establishment_idx');
            $table->index(['facturador_sync_status'], 'business_branches_facturador_sync_status_idx');
        });
    }

    public function down(): void
    {
        Schema::table('business_branches', function (Blueprint $table) {
            $table->dropIndex('business_branches_facturador_establishment_idx');
            $table->dropIndex('business_branches_facturador_sync_status_idx');
            $table->dropColumn([
                'facturador_establishment_id',
                'facturador_sync_status',
                'facturador_sync_message',
                'facturador_last_sync_at',
            ]);
        });
    }
};
