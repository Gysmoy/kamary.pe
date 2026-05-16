<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('articles', 'magistral_status')) {
            Schema::table('articles', function (Blueprint $table) {
                $table->string('magistral_status', 30)->nullable()->after('status');
            });
        }

        DB::table('articles')
            ->where('module_scope', 'magistrales')
            ->whereNull('magistral_status')
            ->where(function ($query) {
                $query->where('status', false)->orWhere('status', 0);
            })
            ->update(['magistral_status' => 'de_baja']);

        DB::table('articles')
            ->where('module_scope', 'magistrales')
            ->whereNull('magistral_status')
            ->update(['magistral_status' => 'vigente']);
    }

    public function down(): void
    {
        if (!Schema::hasColumn('articles', 'magistral_status')) return;

        Schema::table('articles', function (Blueprint $table) {
            $table->dropColumn('magistral_status');
        });
    }
};
