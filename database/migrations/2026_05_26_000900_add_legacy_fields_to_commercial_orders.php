<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('commercial_orders', 'purchase_order')) {
            Schema::table('commercial_orders', function (Blueprint $table) {
                $table->string('purchase_order', 80)->nullable()->after('payment_method');
            });
        }

        if (!Schema::hasColumn('commercial_orders', 'guide_number')) {
            Schema::table('commercial_orders', function (Blueprint $table) {
                $table->string('guide_number', 80)->nullable()->after('purchase_order');
            });
        }

        if (!Schema::hasColumn('commercial_orders', 'referral_guide')) {
            Schema::table('commercial_orders', function (Blueprint $table) {
                $table->string('referral_guide', 80)->nullable()->after('guide_number');
            });
        }

        if (!Schema::hasColumn('commercial_orders', 'doctor_name')) {
            Schema::table('commercial_orders', function (Blueprint $table) {
                $table->string('doctor_name')->nullable()->after('seller_id');
            });
        }
    }

    public function down(): void
    {
        foreach (['doctor_name', 'referral_guide', 'guide_number', 'purchase_order'] as $column) {
            if (Schema::hasColumn('commercial_orders', $column)) {
                Schema::table('commercial_orders', function (Blueprint $table) use ($column) {
                    $table->dropColumn($column);
                });
            }
        }
    }
};
