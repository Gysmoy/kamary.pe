<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class TenantCompleteDispatchesApiTables extends Migration
{
    public function up()
    {
        if (!Schema::hasTable('dispatches')) {
            Schema::create('dispatches', function (Blueprint $table) {
                $table->increments('id');
                $table->unsignedInteger('user_id')->nullable();
                $table->uuid('external_id')->nullable();
                $table->unsignedInteger('establishment_id')->nullable();
                $table->json('establishment')->nullable();
                $table->char('soap_type_id', 2)->nullable();
                $table->char('state_type_id', 2)->default('01');
                $table->string('ubl_version')->default('2.0');
                $table->string('filename')->nullable();
                $table->char('document_type_id', 2)->default('09');
                $table->string('series', 4);
                $table->unsignedInteger('number');
                $table->date('date_of_issue');
                $table->time('time_of_issue')->nullable();
                $table->unsignedInteger('customer_id')->nullable();
                $table->json('customer')->nullable();
                $table->text('observations')->nullable();
                $table->char('transport_mode_type_id', 2)->nullable();
                $table->char('transfer_reason_type_id', 2)->nullable();
                $table->string('transfer_reason_description')->nullable();
                $table->date('date_of_shipping')->nullable();
                $table->boolean('transshipment_indicator')->default(false);
                $table->string('port_code')->nullable();
                $table->string('unit_type_id', 4)->default('KGM');
                $table->decimal('total_weight', 12, 3)->default(0);
                $table->unsignedInteger('packages_number')->nullable();
                $table->string('container_number')->nullable();
                $table->string('license_plate', 20)->nullable();
                $table->json('origin')->nullable();
                $table->json('delivery')->nullable();
                $table->json('dispatcher')->nullable();
                $table->json('driver')->nullable();
                $table->json('legends')->nullable();
                $table->json('optional')->nullable();
                $table->unsignedInteger('reference_document_id')->nullable();
                $table->unsignedInteger('reference_quotation_id')->nullable();
                $table->unsignedInteger('reference_order_note_id')->nullable();
                $table->unsignedInteger('reference_order_form_id')->nullable();
                $table->unsignedInteger('reference_sale_note_id')->nullable();
                $table->json('secondary_license_plates')->nullable();
                $table->json('related')->nullable();
                $table->string('order_form_external')->nullable();
                $table->json('data_affected_document')->nullable();
                $table->string('hash')->nullable();
                $table->text('qr')->nullable();
                $table->boolean('has_xml')->default(false);
                $table->boolean('has_pdf')->default(false);
                $table->boolean('has_cdr')->default(false);
                $table->timestamps();

                $table->index(['series', 'number', 'date_of_issue'], 'dispatches_number_date_idx');
            });
        } else {
            $this->ensureDispatchesColumns();
        }

        if (!Schema::hasTable('dispatch_items')) {
            Schema::create('dispatch_items', function (Blueprint $table) {
                $table->increments('id');
                $table->unsignedInteger('dispatch_id');
                $table->unsignedInteger('item_id')->nullable();
                $table->json('item')->nullable();
                $table->decimal('quantity', 12, 4)->default(0);
                $table->string('name_product_pdf')->nullable();

                $table->foreign('dispatch_id')->references('id')->on('dispatches')->onDelete('cascade');
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('dispatch_items');
    }

    private function ensureDispatchesColumns()
    {
        $columns = [
            'establishment' => ['json', null],
            'document_type_id' => ['char', 2],
            'customer_id' => ['unsignedInteger', null],
            'customer' => ['json', null],
            'observations' => ['text', null],
            'transport_mode_type_id' => ['char', 2],
            'transfer_reason_type_id' => ['char', 2],
            'transfer_reason_description' => ['string', null],
            'date_of_shipping' => ['date', null],
            'transshipment_indicator' => ['boolean', null],
            'port_code' => ['string', null],
            'unit_type_id' => ['string', 4],
            'total_weight' => ['decimal', [12, 3]],
            'packages_number' => ['unsignedInteger', null],
            'container_number' => ['string', null],
            'license_plate' => ['string', 20],
            'origin' => ['json', null],
            'delivery' => ['json', null],
            'dispatcher' => ['json', null],
            'driver' => ['json', null],
            'legends' => ['json', null],
            'optional' => ['json', null],
            'reference_document_id' => ['unsignedInteger', null],
            'reference_quotation_id' => ['unsignedInteger', null],
            'reference_order_note_id' => ['unsignedInteger', null],
            'reference_order_form_id' => ['unsignedInteger', null],
            'reference_sale_note_id' => ['unsignedInteger', null],
            'secondary_license_plates' => ['json', null],
            'related' => ['json', null],
            'order_form_external' => ['string', null],
            'data_affected_document' => ['json', null],
            'hash' => ['string', null],
            'qr' => ['text', null],
            'has_xml' => ['boolean', null],
            'has_pdf' => ['boolean', null],
            'has_cdr' => ['boolean', null],
        ];

        foreach ($columns as $name => $definition) {
            if (Schema::hasColumn('dispatches', $name)) {
                continue;
            }

            Schema::table('dispatches', function (Blueprint $table) use ($name, $definition) {
                [$type, $size] = $definition;
                if ($type === 'char') {
                    $table->char($name, $size)->nullable();
                } elseif ($type === 'string') {
                    $column = $size ? $table->string($name, $size) : $table->string($name);
                    $column->nullable();
                } elseif ($type === 'decimal') {
                    $table->decimal($name, $size[0], $size[1])->default(0);
                } elseif ($type === 'unsignedInteger') {
                    $table->unsignedInteger($name)->nullable();
                } elseif ($type === 'boolean') {
                    $table->boolean($name)->default(false);
                } else {
                    $table->{$type}($name)->nullable();
                }
            });
        }
    }
}
