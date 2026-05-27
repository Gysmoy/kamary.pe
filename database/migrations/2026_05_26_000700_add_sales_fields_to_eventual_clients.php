<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\QueryException;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('eventual_clients')) {
            return;
        }

        $this->addColumnIfMissing('short_code', function (Blueprint $table) {
            $table->string('short_code', 40)->nullable()->after('contact_name');
        });

        $this->addColumnIfMissing('contract_due_days', function (Blueprint $table) {
            $after = Schema::hasColumn('eventual_clients', 'short_code') ? 'short_code' : 'contact_name';
            $table->unsignedSmallInteger('contract_due_days')->nullable()->after($after);
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('eventual_clients')) {
            return;
        }

        $columns = [];
        if (Schema::hasColumn('eventual_clients', 'contract_due_days')) {
            $columns[] = 'contract_due_days';
        }
        if (Schema::hasColumn('eventual_clients', 'short_code')) {
            $columns[] = 'short_code';
        }

        if (!$columns) {
            return;
        }

        Schema::table('eventual_clients', function (Blueprint $table) use ($columns) {
            $table->dropColumn($columns);
        });
    }

    private function addColumnIfMissing(string $column, callable $definition): void
    {
        if (Schema::hasColumn('eventual_clients', $column)) {
            return;
        }

        try {
            Schema::table('eventual_clients', function (Blueprint $table) use ($definition) {
                $definition($table);
            });
        } catch (QueryException $exception) {
            if (!$this->isDuplicateColumnException($exception)) {
                throw $exception;
            }
        }
    }

    private function isDuplicateColumnException(QueryException $exception): bool
    {
        return (int)($exception->errorInfo[1] ?? 0) === 1060
            || str_contains($exception->getMessage(), 'Duplicate column');
    }
};
