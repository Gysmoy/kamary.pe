<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->string('business_key', 40)->nullable()->after('id');
            $table->unique('business_key', 'businesses_business_key_unique');
        });

        $this->ensureFixedBusiness('kamary_peru', 'Kamary Peru', 'Empresa general y comercial de Kamary.');
        $this->ensureFixedBusiness('kamary_medicals', 'Kamary Medicals', 'Empresa para operaciones magistrales.');
    }

    public function down(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->dropUnique('businesses_business_key_unique');
            $table->dropColumn('business_key');
        });
    }

    private function ensureFixedBusiness(string $key, string $name, string $description): void
    {
        $now = now();
        $existing = DB::table('businesses')->where('business_key', $key)->first();

        if (!$existing) {
            $existing = DB::table('businesses')
                ->whereRaw('LOWER(name) = ?', [strtolower($name)])
                ->first();
        }

        if ($existing) {
            DB::table('businesses')
                ->where('id', $existing->id)
                ->update([
                    'business_key' => $key,
                    'name' => $existing->name ?: $name,
                    'description' => $existing->description ?: $description,
                    'status' => true,
                    'updated_at' => $now,
                ]);
            return;
        }

        DB::table('businesses')->insert([
            'business_key' => $key,
            'name' => $name,
            'description' => $description,
            'status' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }
};
