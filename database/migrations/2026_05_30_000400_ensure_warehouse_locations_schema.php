<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\QueryException;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('warehouse_locations')) {
            Schema::create('warehouse_locations', function (Blueprint $table) {
                $table->id();
                $table->foreignId('warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();
                $table->string('code', 120);
                $table->text('description')->nullable();
                $table->boolean('status')->nullable()->default(true)->index();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->index(['warehouse_id', 'status'], 'warehouse_locations_lookup_idx');
            });

            return;
        }

        $this->addColumnIfMissing('warehouse_locations', 'warehouse_id', function (Blueprint $table) {
            $table->foreignId('warehouse_id')->nullable()->after('id')->constrained('warehouses')->nullOnDelete();
        });

        $this->addColumnIfMissing('warehouse_locations', 'code', function (Blueprint $table) {
            $table->string('code', 120)->nullable()->after($this->columnExists('warehouse_locations', 'warehouse_id') ? 'warehouse_id' : 'id');
        });

        $this->addColumnIfMissing('warehouse_locations', 'description', function (Blueprint $table) {
            $table->text('description')->nullable()->after($this->columnExists('warehouse_locations', 'code') ? 'code' : 'id');
        });

        $this->addColumnIfMissing('warehouse_locations', 'status', function (Blueprint $table) {
            $table->boolean('status')->nullable()->default(true)->after($this->columnExists('warehouse_locations', 'description') ? 'description' : 'id');
        });

        $this->addColumnIfMissing('warehouse_locations', 'created_by', function (Blueprint $table) {
            $table->foreignId('created_by')->nullable()->after($this->columnExists('warehouse_locations', 'status') ? 'status' : 'id')->constrained('users')->nullOnDelete();
        });

        $this->addColumnIfMissing('warehouse_locations', 'updated_by', function (Blueprint $table) {
            $table->foreignId('updated_by')->nullable()->after($this->columnExists('warehouse_locations', 'created_by') ? 'created_by' : 'id')->constrained('users')->nullOnDelete();
        });

        $this->addColumnIfMissing('warehouse_locations', 'created_at', function (Blueprint $table) {
            $table->timestamp('created_at')->nullable();
        });

        $this->addColumnIfMissing('warehouse_locations', 'updated_at', function (Blueprint $table) {
            $table->timestamp('updated_at')->nullable();
        });

        if ($this->columnExists('warehouse_locations', 'code')) {
            DB::table('warehouse_locations')
                ->whereNull('code')
                ->orderBy('id')
                ->get(['id'])
                ->each(function ($row) {
                    DB::table('warehouse_locations')
                        ->where('id', $row->id)
                        ->update(['code' => 'UBI-' . str_pad((string) $row->id, 5, '0', STR_PAD_LEFT)]);
                });
        }

        if ($this->columnExists('warehouse_locations', 'status')) {
            DB::table('warehouse_locations')->whereNull('status')->update(['status' => true]);
        }

        if (
            $this->columnExists('warehouse_locations', 'warehouse_id')
            && $this->columnExists('warehouse_locations', 'status')
            && !$this->indexExists('warehouse_locations', 'warehouse_locations_lookup_idx')
        ) {
            $this->runSchemaChange(function () {
                Schema::table('warehouse_locations', function (Blueprint $table) {
                    $table->index(['warehouse_id', 'status'], 'warehouse_locations_lookup_idx');
                });
            });
        }
    }

    public function down(): void
    {
        //
    }

    private function addColumnIfMissing(string $tableName, string $column, callable $callback): void
    {
        if ($this->columnExists($tableName, $column)) {
            return;
        }

        $this->runSchemaChange(function () use ($tableName, $callback) {
            Schema::table($tableName, $callback);
        });
    }

    private function runSchemaChange(callable $callback): void
    {
        try {
            $callback();
        } catch (QueryException $exception) {
            $message = $exception->getMessage();

            if (
                str_contains($message, 'Duplicate column name')
                || str_contains($message, 'Duplicate key name')
                || str_contains($message, 'already exists')
            ) {
                return;
            }

            throw $exception;
        }
    }

    private function columnExists(string $table, string $column): bool
    {
        return DB::table('information_schema.columns')
            ->where('table_schema', DB::getDatabaseName())
            ->where('table_name', $table)
            ->where('column_name', $column)
            ->exists();
    }

    private function indexExists(string $table, string $index): bool
    {
        return DB::table('information_schema.statistics')
            ->where('table_schema', DB::getDatabaseName())
            ->where('table_name', $table)
            ->where('index_name', $index)
            ->exists();
    }
};
