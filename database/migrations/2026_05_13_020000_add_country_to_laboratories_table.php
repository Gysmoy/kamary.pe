<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('laboratories', function (Blueprint $table) {
            if (!Schema::hasColumn('laboratories', 'country')) {
                $table->string('country')->nullable()->default('Perú')->after('code');
            }
        });

        DB::table('laboratories')->whereNull('country')->update(['country' => 'Perú']);
    }

    public function down(): void
    {
        Schema::table('laboratories', function (Blueprint $table) {
            if (Schema::hasColumn('laboratories', 'country')) {
                $table->dropColumn('country');
            }
        });
    }
};
