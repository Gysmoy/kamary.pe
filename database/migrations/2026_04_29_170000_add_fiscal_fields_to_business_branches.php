<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('business_branches', function (Blueprint $table) {
            $table->string('establishment_code', 10)->nullable()->after('name');
            $table->string('ubigeo', 6)->nullable()->after('establishment_code');
            $table->string('address')->nullable()->after('ubigeo');
            $table->string('email')->nullable()->after('address');
            $table->string('telephone', 30)->nullable()->after('email');

            $table->index(['business_id', 'establishment_code'], 'business_branches_establishment_code_idx');
            $table->index(['ubigeo'], 'business_branches_ubigeo_idx');
        });
    }

    public function down(): void
    {
        Schema::table('business_branches', function (Blueprint $table) {
            $table->dropIndex('business_branches_establishment_code_idx');
            $table->dropIndex('business_branches_ubigeo_idx');
            $table->dropColumn([
                'establishment_code',
                'ubigeo',
                'address',
                'email',
                'telephone',
            ]);
        });
    }
};
