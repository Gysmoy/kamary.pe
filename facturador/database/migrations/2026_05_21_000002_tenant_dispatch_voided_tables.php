<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class TenantDispatchVoidedTables extends Migration
{
    public function up()
    {
        if (!Schema::hasTable('dispatch_voided')) {
            Schema::create('dispatch_voided', function (Blueprint $table) {
                $table->increments('id');
                $table->unsignedInteger('user_id')->nullable();
                $table->uuid('external_id');
                $table->char('soap_type_id', 2);
                $table->char('state_type_id', 2);
                $table->string('ubl_version');
                $table->date('date_of_issue');
                $table->date('date_of_reference');
                $table->string('identifier');
                $table->string('filename');
                $table->string('ticket')->nullable();
                $table->boolean('has_ticket')->default(false);
                $table->boolean('has_cdr')->default(false);
                $table->json('soap_shipping_response')->nullable();
                $table->timestamps();

                $table->index(['date_of_issue', 'identifier'], 'dispatch_voided_issue_identifier_idx');
            });
        }

        if (!Schema::hasTable('dispatch_voided_documents')) {
            Schema::create('dispatch_voided_documents', function (Blueprint $table) {
                $table->increments('id');
                $table->unsignedInteger('dispatch_voided_id');
                $table->unsignedInteger('dispatch_id');
                $table->string('description');

                $table->foreign('dispatch_voided_id')->references('id')->on('dispatch_voided')->onDelete('cascade');
                $table->foreign('dispatch_id')->references('id')->on('dispatches');
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('dispatch_voided_documents');
        Schema::dropIfExists('dispatch_voided');
    }
}
