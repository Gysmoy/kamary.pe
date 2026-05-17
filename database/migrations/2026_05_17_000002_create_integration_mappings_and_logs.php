<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('integration_mappings', function (Blueprint $table) {
            $table->id();
            $table->string('provider', 40);
            $table->string('entity_type', 60);
            $table->string('external_id', 120);
            $table->string('internal_type', 80);
            $table->unsignedBigInteger('internal_id');
            $table->json('metadata')->nullable();
            $table->boolean('status')->nullable()->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['provider', 'entity_type', 'external_id', 'internal_type'], 'integration_mappings_unique');
            $table->index(['provider', 'entity_type', 'status'], 'integration_mappings_provider_entity_idx');
        });

        Schema::create('integration_logs', function (Blueprint $table) {
            $table->id();
            $table->string('provider', 40);
            $table->string('direction', 20);
            $table->string('event_type', 80);
            $table->string('external_id', 120)->nullable();
            $table->string('status', 40)->default('received');
            $table->unsignedSmallInteger('http_status')->nullable();
            $table->json('request_payload')->nullable();
            $table->json('response_payload')->nullable();
            $table->text('message')->nullable();
            $table->unsignedSmallInteger('attempts')->default(0);
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->index(['provider', 'event_type', 'status'], 'integration_logs_provider_event_idx');
            $table->index(['external_id', 'provider'], 'integration_logs_external_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('integration_logs');
        Schema::dropIfExists('integration_mappings');
    }
};
