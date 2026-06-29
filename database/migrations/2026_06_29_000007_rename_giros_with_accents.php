<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('giros')) return;
        DB::table('giros')->where('name', 'REPOSICION')->update(['name' => 'REPOSICIÓN']);
        DB::table('giros')->where('name', 'INSTITUCION')->update(['name' => 'INSTITUCIÓN']);
    }

    public function down(): void
    {
        if (!Schema::hasTable('giros')) return;
        DB::table('giros')->where('name', 'REPOSICIÓN')->update(['name' => 'REPOSICION']);
        DB::table('giros')->where('name', 'INSTITUCIÓN')->update(['name' => 'INSTITUCION']);
    }
};
