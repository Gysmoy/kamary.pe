<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('clients', 'module_scope')) {
            Schema::table('clients', function (Blueprint $table) {
                $table->string('module_scope', 30)->default('commercial')->after('client_kind');
                $table->index('module_scope', 'clients_module_scope_idx');
            });
        }

        DB::table('clients')
            ->where(function ($query) {
                $query->whereNull('module_scope')->orWhere('module_scope', '');
            })
            ->update(['module_scope' => 'commercial']);

        if (Schema::hasColumn('clients', 'has_storage_service')) {
            DB::table('clients')
                ->where('has_storage_service', true)
                ->update(['module_scope' => 'storage']);
        }

        if (Schema::hasTable('service_orders') && Schema::hasColumn('service_orders', 'order_type')) {
            $serviceClientIds = DB::table('service_orders')
                ->where('order_type', 'service')
                ->whereNotNull('client_id')
                ->distinct()
                ->pluck('client_id')
                ->all();

            if (count($serviceClientIds)) {
                DB::table('clients')
                    ->whereIn('id', $serviceClientIds)
                    ->where(function ($query) {
                        $query->whereNull('has_storage_service')->orWhere('has_storage_service', false);
                    })
                    ->update(['module_scope' => 'services']);
            }
        }

        $this->dropIndexIfExists('clients', 'clients_document_type_document_number_unique', 'unique');
        $this->addUniqueIfMissing('clients', 'clients_document_module_scope_unique', ['document_type', 'document_number', 'module_scope']);
    }

    public function down(): void
    {
        $this->dropIndexIfExists('clients', 'clients_document_module_scope_unique', 'unique');
        $this->addUniqueIfMissing('clients', 'clients_document_type_document_number_unique', ['document_type', 'document_number']);

        if (Schema::hasColumn('clients', 'module_scope')) {
            $this->dropIndexIfExists('clients', 'clients_module_scope_idx');
            Schema::table('clients', function (Blueprint $table) {
                $table->dropColumn('module_scope');
            });
        }
    }

    private function addUniqueIfMissing(string $tableName, string $indexName, array $columns): void
    {
        if ($this->indexExists($tableName, $indexName)) return;

        Schema::table($tableName, function (Blueprint $table) use ($columns, $indexName) {
            $table->unique($columns, $indexName);
        });
    }

    private function dropIndexIfExists(string $tableName, string $indexName, string $type = 'index'): void
    {
        if (!$this->indexExists($tableName, $indexName)) return;

        Schema::table($tableName, function (Blueprint $table) use ($indexName, $type) {
            if ($type === 'unique') {
                $table->dropUnique($indexName);
                return;
            }

            $table->dropIndex($indexName);
        });
    }

    private function indexExists(string $tableName, string $indexName): bool
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            return count(DB::select("SHOW INDEX FROM {$tableName} WHERE Key_name = ?", [$indexName])) > 0;
        }

        if ($driver === 'sqlite') {
            return collect(DB::select("PRAGMA index_list('{$tableName}')"))
                ->contains(fn($index) => ($index->name ?? null) === $indexName);
        }

        return false;
    }
};
