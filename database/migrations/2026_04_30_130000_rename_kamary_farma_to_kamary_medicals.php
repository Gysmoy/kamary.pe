<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('businesses', 'business_key')) {
            return;
        }

        $this->renameBusinessKey('kamary_farma', 'kamary_medicals', 'Kamary Medicals', 'Empresa para operaciones magistrales.');
        $this->renameUserScope('kamary-farma', 'kamary-medicals');
        $this->renameUserEmailDomains([
            '@kamaryfarma.com' => '@kamarymedicals.com',
            '@kamatyfarma.com' => '@kamarymedicals.com',
        ]);
    }

    public function down(): void
    {
        if (!Schema::hasColumn('businesses', 'business_key')) {
            return;
        }

        $this->renameBusinessKey('kamary_medicals', 'kamary_farma', 'Kamary Farma', 'Empresa para operaciones magistrales.');
        $this->renameUserScope('kamary-medicals', 'kamary-farma');
        $this->renameUserEmailDomains([
            '@kamarymedicals.com' => '@kamaryfarma.com',
        ]);
    }

    private function renameBusinessKey(string $fromKey, string $toKey, string $toName, string $description): void
    {
        $from = DB::table('businesses')->where('business_key', $fromKey)->first();
        $to = DB::table('businesses')->where('business_key', $toKey)->first();
        $now = now();

        if ($from && $to && (int) $from->id !== (int) $to->id) {
            $this->moveBusinessRelations((int) $to->id, (int) $from->id);
            DB::table('businesses')->where('id', $to->id)->update([
                'business_key' => null,
                'status' => null,
                'updated_at' => $now,
            ]);
        }

        $target = $from ?: $to;

        if ($target) {
            DB::table('businesses')->where('id', $target->id)->update([
                'business_key' => $toKey,
                'name' => $toName,
                'description' => $target->description ?: $description,
                'status' => true,
                'updated_at' => $now,
            ]);
            return;
        }

        DB::table('businesses')->insert([
            'business_key' => $toKey,
            'name' => $toName,
            'description' => $description,
            'status' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    private function moveBusinessRelations(int $fromId, int $toId): void
    {
        $database = DB::getDatabaseName();
        $columns = DB::select(
            'SELECT TABLE_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND COLUMN_NAME = ?',
            [$database, 'business_id']
        );

        foreach ($columns as $column) {
            $table = $column->TABLE_NAME ?? $column->table_name ?? null;
            if (!$table || $table === 'businesses') {
                continue;
            }

            DB::table($table)->where('business_id', $fromId)->update(['business_id' => $toId]);
        }
    }

    private function renameUserScope(string $from, string $to): void
    {
        if (!Schema::hasColumn('users', 'scope')) {
            return;
        }

        DB::table('users')
            ->where('scope', 'like', "%{$from}%")
            ->update([
                'scope' => DB::raw("REPLACE(scope, '{$from}', '{$to}')"),
            ]);
    }

    private function renameUserEmailDomains(array $replacements): void
    {
        if (!Schema::hasColumn('users', 'email')) {
            return;
        }

        foreach ($replacements as $from => $to) {
            DB::table('users')
                ->where('email', 'like', "%{$from}")
                ->update([
                    'email' => DB::raw("REPLACE(email, '{$from}', '{$to}')"),
                ]);
        }
    }
};
