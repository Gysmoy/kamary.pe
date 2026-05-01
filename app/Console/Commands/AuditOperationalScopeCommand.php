<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AuditOperationalScopeCommand extends Command
{
    protected $signature = 'kamary:audit-operational-scope {--fix : Completa business_branch_id desde warehouse_id cuando sea seguro}';

    protected $description = 'Audita la consistencia empresa -> sede -> almacen en documentos operativos y facturacion.';

    private array $warehouseScopedTables = [
        'entry_notes' => 'Notas de ingreso',
        'exit_notes' => 'Notas de salida',
        'orders' => 'Pedidos antiguos',
        'purchase_orders' => 'Ordenes de compra',
        'purchase_receipts' => 'Ingresos por compra',
        'commercial_orders' => 'Pedidos comerciales',
        'dispatches' => 'Despachos',
        'activities' => 'Actividades',
        'price_lists' => 'Tarifarios',
        'accounts_payable' => 'Cuentas por pagar',
        'accounts_receivable' => 'Cuentas por cobrar',
        'billing_documents' => 'Comprobantes',
    ];

    public function handle(): int
    {
        $fix = (bool) $this->option('fix');
        $remainingIssues = 0;
        $fixedRows = 0;

        $this->info('Auditando relacion empresa -> sede -> almacen...');

        $remainingIssues += $this->auditWarehouses();

        foreach ($this->warehouseScopedTables as $table => $label) {
            if (!$this->canAuditWarehouseScopedTable($table)) {
                continue;
            }

            $result = $this->auditWarehouseScopedTable($table, $label, $fix);
            $remainingIssues += $result['remaining'];
            $fixedRows += $result['fixed'];
        }

        $remainingIssues += $this->auditBranchOnlyTable('service_orders', 'Ordenes de servicio');

        if ($fixedRows > 0) {
            $this->info("Filas corregidas automaticamente: {$fixedRows}");
        }

        if ($remainingIssues > 0) {
            $this->warn("Auditoria terminada con {$remainingIssues} problema(s) pendiente(s).");
            return self::FAILURE;
        }

        $this->info('Auditoria terminada sin problemas pendientes.');
        return self::SUCCESS;
    }

    private function auditWarehouses(): int
    {
        if (!Schema::hasTable('warehouses') || !Schema::hasColumn('warehouses', 'business_branch_id')) {
            return 0;
        }

        $missingBranch = DB::table('warehouses')->whereNull('business_branch_id')->count();
        if ($missingBranch > 0) {
            $this->warn("Almacenes sin sede: {$missingBranch}. Deben asignarse manualmente.");
        }

        if (!Schema::hasTable('business_branches') || !Schema::hasTable('businesses')) {
            return (int) $missingBranch;
        }

        $outsideFixedBusinesses = DB::table('warehouses as warehouse')
            ->join('business_branches as branch', 'branch.id', '=', 'warehouse.business_branch_id')
            ->leftJoin('businesses as business', 'business.id', '=', 'branch.business_id')
            ->whereNotNull('warehouse.business_branch_id')
            ->where(function ($query) {
                $query->whereNull('business.id')
                    ->orWhereNotIn('business.business_key', ['kamary_peru', 'kamary_medicals'])
                    ->orWhereNull('business.status');
            })
            ->count();

        if ($outsideFixedBusinesses > 0) {
            $this->warn("Almacenes vinculados a empresas no permitidas o inactivas: {$outsideFixedBusinesses}.");
        }

        return (int) ($missingBranch + $outsideFixedBusinesses);
    }

    private function auditWarehouseScopedTable(string $table, string $label, bool $fix): array
    {
        $remaining = 0;
        $fixed = 0;

        $missingBranchWithKnownWarehouse = $this->missingBranchWithKnownWarehouse($table);
        $count = (clone $missingBranchWithKnownWarehouse)->count();
        if ($count > 0) {
            if ($fix) {
                $fixed = $this->fixMissingBranchFromWarehouse($table, $missingBranchWithKnownWarehouse);
                $this->info("{$label}: {$fixed} fila(s) completadas desde el almacen.");
            } else {
                $remaining += $count;
                $this->warn("{$label}: {$count} fila(s) sin sede, corregibles con --fix.");
            }
        }

        $missingWarehouseBranch = DB::table("{$table} as source")
            ->join('warehouses as warehouse', 'warehouse.id', '=', 'source.warehouse_id')
            ->whereNotNull('source.warehouse_id')
            ->whereNull('warehouse.business_branch_id')
            ->count();
        if ($missingWarehouseBranch > 0) {
            $remaining += $missingWarehouseBranch;
            $this->warn("{$label}: {$missingWarehouseBranch} fila(s) usan almacenes sin sede.");
        }

        $branchMismatch = DB::table("{$table} as source")
            ->join('warehouses as warehouse', 'warehouse.id', '=', 'source.warehouse_id')
            ->whereNotNull('source.business_branch_id')
            ->whereNotNull('warehouse.business_branch_id')
            ->whereColumn('source.business_branch_id', '!=', 'warehouse.business_branch_id')
            ->count();
        if ($branchMismatch > 0) {
            $remaining += $branchMismatch;
            $this->warn("{$label}: {$branchMismatch} fila(s) tienen sede distinta a la sede del almacen.");
        }

        if (Schema::hasColumn($table, 'business_id')) {
            $businessMismatch = DB::table("{$table} as source")
                ->join('business_branches as branch', 'branch.id', '=', 'source.business_branch_id')
                ->whereNotNull('source.business_id')
                ->whereNotNull('source.business_branch_id')
                ->whereColumn('source.business_id', '!=', 'branch.business_id')
                ->count();

            if ($businessMismatch > 0) {
                $remaining += $businessMismatch;
                $this->warn("{$label}: {$businessMismatch} fila(s) tienen empresa distinta a la empresa de la sede.");
            }
        }

        return ['remaining' => $remaining, 'fixed' => $fixed];
    }

    private function auditBranchOnlyTable(string $table, string $label): int
    {
        if (!Schema::hasTable($table) || !Schema::hasColumn($table, 'business_branch_id')) {
            return 0;
        }

        $remaining = 0;
        $missingBranch = DB::table($table)->whereNull('business_branch_id')->count();
        if ($missingBranch > 0) {
            $remaining += $missingBranch;
            $this->warn("{$label}: {$missingBranch} fila(s) sin sede. Deben corregirse manualmente.");
        }

        if (Schema::hasColumn($table, 'business_id')) {
            $businessMismatch = DB::table("{$table} as source")
                ->join('business_branches as branch', 'branch.id', '=', 'source.business_branch_id')
                ->whereNotNull('source.business_id')
                ->whereNotNull('source.business_branch_id')
                ->whereColumn('source.business_id', '!=', 'branch.business_id')
                ->count();

            if ($businessMismatch > 0) {
                $remaining += $businessMismatch;
                $this->warn("{$label}: {$businessMismatch} fila(s) tienen empresa distinta a la empresa de la sede.");
            }
        }

        return $remaining;
    }

    private function canAuditWarehouseScopedTable(string $table): bool
    {
        return Schema::hasTable($table)
            && Schema::hasColumn($table, 'id')
            && Schema::hasColumn($table, 'business_branch_id')
            && Schema::hasColumn($table, 'warehouse_id')
            && Schema::hasTable('warehouses')
            && Schema::hasColumn('warehouses', 'business_branch_id');
    }

    private function missingBranchWithKnownWarehouse(string $table): Builder
    {
        return DB::table("{$table} as source")
            ->join('warehouses as warehouse', 'warehouse.id', '=', 'source.warehouse_id')
            ->whereNull('source.business_branch_id')
            ->whereNotNull('source.warehouse_id')
            ->whereNotNull('warehouse.business_branch_id')
            ->select('source.id', 'warehouse.business_branch_id');
    }

    private function fixMissingBranchFromWarehouse(string $table, Builder $query): int
    {
        $fixed = 0;
        foreach ($query->orderBy('source.id')->get() as $row) {
            DB::table($table)
                ->where('id', $row->id)
                ->update(['business_branch_id' => $row->business_branch_id]);
            $fixed++;
        }

        return $fixed;
    }
}
