<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exit_notes', function (Blueprint $table) {
            if (!Schema::hasColumn('exit_notes', 'external_source')) {
                $table->string('external_source', 60)->nullable()->after('exit_status');
            }
            if (!Schema::hasColumn('exit_notes', 'external_reference')) {
                $table->string('external_reference', 120)->nullable()->after('external_source');
            }
            if (!Schema::hasColumn('exit_notes', 'external_payload')) {
                $table->json('external_payload')->nullable()->after('external_reference');
            }
            if (!Schema::hasColumn('exit_notes', 'storage_api_token_id')) {
                $table->foreignId('storage_api_token_id')->nullable()->after('external_payload')->constrained('storage_api_tokens')->nullOnDelete();
            }
        });

        Schema::table('exit_notes', function (Blueprint $table) {
            $table->unique(['client_id', 'external_source', 'external_reference'], 'exit_notes_client_external_reference_unique');
        });
    }

    public function down(): void
    {
        Schema::table('exit_notes', function (Blueprint $table) {
            $table->dropUnique('exit_notes_client_external_reference_unique');
        });

        Schema::table('exit_notes', function (Blueprint $table) {
            if (Schema::hasColumn('exit_notes', 'storage_api_token_id')) {
                $table->dropConstrainedForeignId('storage_api_token_id');
            }
            foreach (['external_payload', 'external_reference', 'external_source'] as $column) {
                if (Schema::hasColumn('exit_notes', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
