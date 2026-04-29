<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('billing_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('billing_document_id')->constrained('billing_documents')->cascadeOnDelete();
            $table->string('event_type', 40);
            $table->string('local_status', 30)->nullable();
            $table->string('external_status', 30)->nullable();
            $table->longText('request_payload')->nullable();
            $table->longText('response_payload')->nullable();
            $table->text('message')->nullable();
            $table->boolean('status')->nullable()->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['billing_document_id', 'event_type'], 'billing_events_doc_event_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('billing_events');
    }
};
