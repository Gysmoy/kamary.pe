<?php

use Illuminate\Database\Migrations\Migration;
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

        Schema::table('warehouse_locations', function (Blueprint $table) {
            if (!$this->columnExists('warehouse_locations', 'warehouse_id')) {
                $table->foreignId('warehouse_id')->nullable()->after('id')->constrained('warehouses')->nullOnDelete();
            }

            if (!$this->columnExists('warehouse_locations', 'code')) {
                $table->string('code', 120)->after($this->columnExists('warehouse_locations', 'warehouse_id') ? 'warehouse_id' : 'id')->nullable();
            }

            if (!$this->columnExists('warehouse_locations', 'description')) {
                $table->text('description')->nullable()->after($this->columnExists('warehouse_locations', 'code') ? 'code' : 'id');
            }

            if (!$this->columnExists('warehouse_locations', 'status')) {
                $table->boolean('status')->nullable()->default(true)->after($this->columnExists('warehouse_locations', 'description') ? 'description' : 'id');
            }

            if (!$this->columnExists('warehouse_locations', 'created_by')) {
                $table->foreignId('created_by')->nullable()->after($this->columnExists('warehouse_locations', 'status') ? 'status' : 'id')->constrained('users')->nullOnDelete();
            }

            if (!$this->columnExists('warehouse_locations', 'updated_by')) {
                $table->foreignId('updated_by')->nullable()->after($this->columnExists('warehouse_locations', 'created_by') ? 'created_by' : 'id')->constrained('users')->nullOnDelete();
            }

            if (!$this->columnExists('warehouse_locations', 'created_at') && !$this->columnExists('warehouse_locations', 'updated_at')) {
                $table->timestamps();
            }
        });

        if ($this->columnExists('warehouse_locations', 'code')) {
            DB::table('warehouse_locations')
                ->whereNull('code')
                ->orderBy('id')
                ->get(['id'])
                ->each(function ($row) {
                    DB::table('warehouse_locations')
                        ->where('id', $row->id)
                        ->update(['code' => 'UBI-' . str_pad((string)$row->id, 5, '0', STR_PAD_LEFT)]);
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
            Schema::table('warehouse_locations', function (Blueprint $table) {
                $table->index(['warehouse_id', 'status'], 'warehouse_locations_lookup_idx');
            });
        }
    }

    public function down(): void
    {
        //
    }

    private function columnExists(string $table, string $column): bool
    {
        return DB::table('information_schema.columns')
            ->where('table_schema', DB::raw('DATABASE()'))
            ->where('table_name', $table)
            ->where('column_name', $column)
            ->exists();
    }

    private function indexExists(string $table, string $index): bool
    {
        return DB::table('information_schema.statistics')
            ->where('table_schema', DB::raw('DATABASE()'))
            ->where('table_name', $table)
            ->where('index_name', $index)
            ->exists();
    }
};
