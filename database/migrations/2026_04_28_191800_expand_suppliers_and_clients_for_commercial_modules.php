<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            $table->string('trade_name')->nullable()->after('business_name');
            $table->string('contact_name')->nullable()->after('mobile');
            $table->string('contact_position')->nullable()->after('contact_name');
            $table->string('contact_phone', 30)->nullable()->after('contact_position');
            $table->string('contact_email')->nullable()->after('contact_phone');
            $table->unsignedInteger('payment_term_days')->nullable()->after('payment_system');
        });

        Schema::table('clients', function (Blueprint $table) {
            $table->string('client_kind', 20)->default('regular')->after('document_number');
            $table->boolean('is_platform')->default(false)->after('full_name');
            $table->boolean('has_storage_service')->default(false)->after('is_platform');
            $table->unsignedInteger('contract_due_days')->nullable()->after('has_storage_service');
            $table->string('commercial_channel')->nullable()->after('contract_due_days');
            $table->string('segment')->nullable()->after('commercial_channel');
            $table->string('billing_email')->nullable()->after('email');
            $table->string('primary_contact')->nullable()->after('billing_email');
            $table->string('primary_contact_phone', 30)->nullable()->after('primary_contact');
            $table->string('ubigeo', 12)->nullable()->after('short_code');

            $table->index('client_kind');
            $table->index('is_platform');
            $table->index('has_storage_service');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropIndex(['client_kind']);
            $table->dropIndex(['is_platform']);
            $table->dropIndex(['has_storage_service']);

            $table->dropColumn([
                'client_kind',
                'is_platform',
                'has_storage_service',
                'contract_due_days',
                'commercial_channel',
                'segment',
                'billing_email',
                'primary_contact',
                'primary_contact_phone',
                'ubigeo',
            ]);
        });

        Schema::table('suppliers', function (Blueprint $table) {
            $table->dropColumn([
                'trade_name',
                'contact_name',
                'contact_position',
                'contact_phone',
                'contact_email',
                'payment_term_days',
            ]);
        });
    }
};
