<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class TenantAddSendOnlineToDocuments extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up() {
        if (!Schema::hasColumn('documents', 'send_server')) {
            Schema::table('documents', function (Blueprint $table) {
                $table->boolean('send_server')->default(false)->after('has_cdr');
            });
        }

        $afterColumn = 'send_server';

        Schema::table('documents', function (Blueprint $table) use ($afterColumn) {
            if (!Schema::hasColumn('documents', 'shipping_status')) {
                $shippingStatus = $table->json('shipping_status')->nullable();
                if ($afterColumn) {
                    $shippingStatus->after($afterColumn);
                }
            }

            if (!Schema::hasColumn('documents', 'sunat_shipping_status')) {
                $sunatShippingStatus = $table->json('sunat_shipping_status')->nullable();
                if (Schema::hasColumn('documents', 'shipping_status')) {
                    $sunatShippingStatus->after('shipping_status');
                }
            }

            if (!Schema::hasColumn('documents', 'query_status')) {
                $queryStatus = $table->json('query_status')->nullable();
                if (Schema::hasColumn('documents', 'sunat_shipping_status')) {
                    $queryStatus->after('sunat_shipping_status');
                }
            }
        });
    }
    
    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down() {
        Schema::table('documents', function (Blueprint $table) {
            if (Schema::hasColumn('documents', 'send_server')) {
                $table->dropColumn('send_server');
            }
            if (Schema::hasColumn('documents', 'shipping_status')) {
                $table->dropColumn('shipping_status');
            }
            if (Schema::hasColumn('documents', 'sunat_shipping_status')) {
                $table->dropColumn('sunat_shipping_status');
            }
            if (Schema::hasColumn('documents', 'query_status')) {
                $table->dropColumn('query_status');
            }
        });
    }
}
