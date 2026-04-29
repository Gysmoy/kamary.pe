<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('billing_documents', function (Blueprint $table) {
            $table->foreignId('reference_billing_document_id')->nullable()->after('service_order_id')->constrained('billing_documents')->nullOnDelete();
            $table->date('due_date')->nullable()->after('issue_date');
            $table->string('payment_condition', 30)->nullable()->after('currency');
            $table->string('payment_method', 30)->nullable()->after('payment_condition');
            $table->string('customer_email')->nullable()->after('payment_method');
            $table->string('provider_mode', 20)->default('demo')->after('provider_endpoint');
            $table->json('metadata')->nullable()->after('customer_email');
            $table->index(['reference_billing_document_id'], 'billing_documents_reference_idx');
            $table->index(['provider_mode', 'local_status'], 'billing_documents_provider_mode_idx');
        });
    }

    public function down(): void
    {
        Schema::table('billing_documents', function (Blueprint $table) {
            $table->dropIndex('billing_documents_reference_idx');
            $table->dropIndex('billing_documents_provider_mode_idx');
            $table->dropConstrainedForeignId('reference_billing_document_id');
            $table->dropColumn(['due_date', 'payment_condition', 'payment_method', 'customer_email', 'provider_mode', 'metadata']);
        });
    }
};
