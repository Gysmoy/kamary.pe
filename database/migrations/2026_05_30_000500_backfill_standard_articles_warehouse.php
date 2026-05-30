<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (
            !Schema::hasTable('articles')
            || !Schema::hasTable('warehouses')
            || !Schema::hasTable('business_branches')
            || !Schema::hasTable('businesses')
            || !$this->columnExists('articles', 'warehouse_id')
        ) {
            return;
        }

        $warehouse = DB::table('warehouses')
            ->join('business_branches as branch', 'branch.id', '=', 'warehouses.business_branch_id')
            ->join('businesses as business', 'business.id', '=', 'branch.business_id')
            ->where('business.business_key', 'kamary_peru')
            ->whereNotNull('business.status')
            ->whereNotNull('branch.status')
            ->whereNotNull('warehouses.status')
            ->orderBy('warehouses.id')
            ->first(['warehouses.id', 'business.id as business_id']);

        if (!$warehouse) {
            return;
        }

        DB::table('articles')
            ->whereNull('warehouse_id')
            ->when($this->columnExists('articles', 'module_scope'), function ($query) {
                $query->where(function ($scope) {
                    $scope->where('module_scope', 'standard')
                        ->orWhereNull('module_scope');
                });
            })
            ->when($this->columnExists('articles', 'client_id'), fn($query) => $query->whereNull('client_id'))
            ->when($this->columnExists('articles', 'status'), fn($query) => $query->whereNotNull('status'))
            ->update(['warehouse_id' => $warehouse->id]);

        if ($this->columnExists('articles', 'business_id')) {
            DB::table('articles')
                ->whereNull('business_id')
                ->where('warehouse_id', $warehouse->id)
                ->when($this->columnExists('articles', 'module_scope'), function ($query) {
                    $query->where(function ($scope) {
                        $scope->where('module_scope', 'standard')
                            ->orWhereNull('module_scope');
                    });
                })
                ->update(['business_id' => $warehouse->business_id]);
        }
    }

    public function down(): void
    {
        //
    }

    private function columnExists(string $table, string $column): bool
    {
        return DB::table('information_schema.columns')
            ->where('table_schema', DB::getDatabaseName())
            ->where('table_name', $table)
            ->where('column_name', $column)
            ->exists();
    }
};
