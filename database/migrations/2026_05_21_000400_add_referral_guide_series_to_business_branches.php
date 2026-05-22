<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('business_branches', function (Blueprint $table) {
            $table->string('series_guia', 10)->nullable()->after('series_nota_credito');
        });
    }

    public function down(): void
    {
        Schema::table('business_branches', function (Blueprint $table) {
            $table->dropColumn('series_guia');
        });
    }
};
