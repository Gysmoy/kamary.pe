<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class TenantAddPseAndCertificateFieldsToCompanies extends Migration
{
    /**
     * Columnas que SetupController@store escribe pero el esquema original no tenia.
     */
    private $columns = [
        'certificate_due',
        'send_document_to_pse',
        'url_signature_pse',
        'url_send_cdr_pse',
        'client_id_pse',
        'integrated_query_client_id',
        'integrated_query_client_secret',
    ];

    public function up()
    {
        Schema::table('companies', function (Blueprint $table) {
            if (!Schema::hasColumn('companies', 'certificate_due')) {
                $table->date('certificate_due')->nullable()->after('certificate');
            }
            if (!Schema::hasColumn('companies', 'send_document_to_pse')) {
                $table->boolean('send_document_to_pse')->default(false)->after('certificate_due');
            }
            if (!Schema::hasColumn('companies', 'url_signature_pse')) {
                $table->string('url_signature_pse')->nullable()->after('send_document_to_pse');
            }
            if (!Schema::hasColumn('companies', 'url_send_cdr_pse')) {
                $table->string('url_send_cdr_pse')->nullable()->after('url_signature_pse');
            }
            if (!Schema::hasColumn('companies', 'client_id_pse')) {
                $table->string('client_id_pse')->nullable()->after('url_send_cdr_pse');
            }
            if (!Schema::hasColumn('companies', 'integrated_query_client_id')) {
                $table->string('integrated_query_client_id')->nullable()->after('client_id_pse');
            }
            if (!Schema::hasColumn('companies', 'integrated_query_client_secret')) {
                $table->string('integrated_query_client_secret')->nullable()->after('integrated_query_client_id');
            }
        });
    }

    public function down()
    {
        Schema::table('companies', function (Blueprint $table) {
            foreach ($this->columns as $column) {
                if (Schema::hasColumn('companies', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
}
