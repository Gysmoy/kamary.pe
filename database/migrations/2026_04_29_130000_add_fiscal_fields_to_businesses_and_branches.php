<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->string('tax_number', 20)->nullable()->after('name');
            $table->string('trade_name')->nullable()->after('tax_number');
            $table->string('soap_send_id', 2)->nullable()->after('trade_name');
            $table->string('soap_type_id', 2)->nullable()->after('soap_send_id');
            $table->string('soap_username')->nullable()->after('soap_type_id');
            $table->string('soap_password')->nullable()->after('soap_username');
            $table->string('soap_url')->nullable()->after('soap_password');
            $table->string('detraction_account')->nullable()->after('soap_url');
            $table->date('certificate_due')->nullable()->after('detraction_account');
            $table->boolean('operation_amazonia')->default(false)->after('certificate_due');
            $table->boolean('send_document_to_pse')->default(false)->after('operation_amazonia');
            $table->string('url_signature_pse')->nullable()->after('send_document_to_pse');
            $table->string('url_send_cdr_pse')->nullable()->after('url_signature_pse');
            $table->string('client_id_pse')->nullable()->after('url_send_cdr_pse');
            $table->string('integrated_query_client_id')->nullable()->after('client_id_pse');
            $table->string('integrated_query_client_secret')->nullable()->after('integrated_query_client_id');
            $table->string('fiscal_logo_path')->nullable()->after('integrated_query_client_secret');
            $table->string('fiscal_certificate_path')->nullable()->after('fiscal_logo_path');
            $table->text('fiscal_certificate_password')->nullable()->after('fiscal_certificate_path');
            $table->unsignedBigInteger('facturador_company_id')->nullable()->after('fiscal_certificate_password');
            $table->string('facturador_sync_status', 30)->nullable()->after('facturador_company_id');
            $table->text('facturador_sync_message')->nullable()->after('facturador_sync_status');
            $table->timestamp('facturador_last_sync_at')->nullable()->after('facturador_sync_message');
            $table->timestamp('facturador_logo_synced_at')->nullable()->after('facturador_last_sync_at');
            $table->timestamp('facturador_certificate_synced_at')->nullable()->after('facturador_logo_synced_at');

            $table->index(['tax_number'], 'businesses_tax_number_idx');
            $table->index(['facturador_sync_status'], 'businesses_facturador_sync_idx');
        });

        Schema::table('business_branches', function (Blueprint $table) {
            $table->string('series_factura', 10)->nullable()->after('name');
            $table->string('series_boleta', 10)->nullable()->after('series_factura');
            $table->string('series_nota_credito', 10)->nullable()->after('series_boleta');
        });
    }

    public function down(): void
    {
        Schema::table('business_branches', function (Blueprint $table) {
            $table->dropColumn(['series_factura', 'series_boleta', 'series_nota_credito']);
        });

        Schema::table('businesses', function (Blueprint $table) {
            $table->dropIndex('businesses_tax_number_idx');
            $table->dropIndex('businesses_facturador_sync_idx');
            $table->dropColumn([
                'tax_number',
                'trade_name',
                'soap_send_id',
                'soap_type_id',
                'soap_username',
                'soap_password',
                'soap_url',
                'detraction_account',
                'certificate_due',
                'operation_amazonia',
                'send_document_to_pse',
                'url_signature_pse',
                'url_send_cdr_pse',
                'client_id_pse',
                'integrated_query_client_id',
                'integrated_query_client_secret',
                'fiscal_logo_path',
                'fiscal_certificate_path',
                'fiscal_certificate_password',
                'facturador_company_id',
                'facturador_sync_status',
                'facturador_sync_message',
                'facturador_last_sync_at',
                'facturador_logo_synced_at',
                'facturador_certificate_synced_at',
            ]);
        });
    }
};
