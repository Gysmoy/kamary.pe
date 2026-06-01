<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const KAMARY_PERU = 'kamary_peru';
    private const KAMARY_MEDICALS = 'kamary_medicals';
    private const USER_SCOPE_PERU = 'kamary-peru';
    private const USER_SCOPE_MEDICALS = 'kamary-medicals';
    private const MAGISTRALES_BRANCH = 'Principal Magistrales';
    private const MAGISTRALES_WAREHOUSE = 'Almacen Magistrales Principal';

    public function up(): void
    {
        if (!Schema::hasTable('businesses') || !Schema::hasColumn('businesses', 'business_key')) {
            return;
        }

        DB::transaction(function () {
            $peruId = $this->ensureBusiness(
                self::KAMARY_PERU,
                'Kamary Peru',
                'Empresa general y operativa de Kamary Peru.'
            );
            $medicalsId = $this->ensureBusiness(
                self::KAMARY_MEDICALS,
                'Kamary Medicals',
                'Empresa para servicios de almacenamiento.'
            );

            $magistralesBranchId = $this->ensureMagistralesPeruBranch($peruId);
            $sourceBranchIds = $this->magistralesMedicalBranchIds($medicalsId);
            $warehouseIds = !empty($sourceBranchIds) ? $this->magistralesWarehouseIds($sourceBranchIds) : [];

            if ($magistralesBranchId && !empty($warehouseIds) && $this->columnExists('warehouses', 'business_branch_id')) {
                DB::table('warehouses')
                    ->whereIn('id', $warehouseIds)
                    ->update($this->withUpdatedAt('warehouses', [
                        'business_branch_id' => $magistralesBranchId,
                    ]));
            }

            if ($magistralesBranchId && !empty($sourceBranchIds)) {
                $this->moveBusinessBranchReferences($sourceBranchIds, $magistralesBranchId);
                $this->deactivateSourceBranches($sourceBranchIds);
            }

            $this->moveMagistralesBusinessReferences($medicalsId, $peruId);
            $this->backfillUserScopes();
        });
    }

    public function down(): void
    {
        //
    }

    private function ensureBusiness(string $key, string $name, string $description): int
    {
        $business = DB::table('businesses')->where('business_key', $key)->first();

        if (!$business) {
            $business = DB::table('businesses')
                ->whereRaw('LOWER(name) = ?', [mb_strtolower($name)])
                ->first();
        }

        $payload = [
            'business_key' => $key,
            'name' => $name,
            'trade_name' => $name,
            'description' => $description,
            'status' => true,
        ];

        if ($business) {
            DB::table('businesses')->where('id', $business->id)->update($this->withUpdatedAt('businesses', $payload));
            return (int) $business->id;
        }

        return (int) DB::table('businesses')->insertGetId($this->withTimestamps('businesses', $payload));
    }

    private function ensureMagistralesPeruBranch(int $businessId): ?int
    {
        if (!Schema::hasTable('business_branches')) {
            return null;
        }

        $branch = DB::table('business_branches')
            ->where('business_id', $businessId)
            ->where('name', self::MAGISTRALES_BRANCH)
            ->first();

        $payload = [
            'business_id' => $businessId,
            'name' => self::MAGISTRALES_BRANCH,
            'establishment_code' => '0000',
            'ubigeo' => '150101',
            'address' => 'Calle Leoncio Prado 830, Urb. La Vina, San Luis, Lima',
            'email' => 'magistrales@kamary.pe',
            'telephone' => '014856320',
            'series_factura' => 'FM01',
            'series_boleta' => 'BM01',
            'series_nota_credito' => 'FCM1',
            'facturador_sync_status' => 'pending',
            'facturador_sync_message' => 'Sede base del modulo Magistrales.',
            'status' => true,
        ];

        if ($branch) {
            DB::table('business_branches')->where('id', $branch->id)->update($this->withUpdatedAt('business_branches', $payload));
            return (int) $branch->id;
        }

        return (int) DB::table('business_branches')->insertGetId($this->withTimestamps('business_branches', $payload));
    }

    private function magistralesMedicalBranchIds(int $medicalsId): array
    {
        if (!Schema::hasTable('business_branches')) {
            return [];
        }

        $warehouseBranchIds = collect();
        if ($this->columnExists('warehouses', 'business_branch_id')) {
            $warehouseBranchIds = DB::table('warehouses')
                ->whereNotNull('business_branch_id')
                ->where(function ($query) {
                    $query
                        ->whereRaw('LOWER(name) LIKE ?', ['%magistral%'])
                        ->orWhereRaw("LOWER(COALESCE(description, '')) LIKE ?", ['%magistral%']);
                })
                ->pluck('business_branch_id');
        }

        return DB::table('business_branches')
            ->where('business_id', $medicalsId)
            ->where(function ($query) use ($warehouseBranchIds) {
                $query->whereRaw('LOWER(name) LIKE ?', ['%magistral%']);
                if ($warehouseBranchIds->isNotEmpty()) {
                    $query->orWhereIn('id', $warehouseBranchIds->all());
                }
            })
            ->pluck('id')
            ->map(fn($id) => (int) $id)
            ->all();
    }

    private function magistralesWarehouseIds(array $branchIds): array
    {
        if (!Schema::hasTable('warehouses')) {
            return [];
        }

        return DB::table('warehouses')
            ->when(!empty($branchIds) && $this->columnExists('warehouses', 'business_branch_id'), function ($query) use ($branchIds) {
                $query->whereIn('business_branch_id', $branchIds);
            })
            ->where(function ($query) {
                $query
                    ->where('name', self::MAGISTRALES_WAREHOUSE)
                    ->orWhereRaw('LOWER(name) LIKE ?', ['%magistral%'])
                    ->orWhereRaw("LOWER(COALESCE(description, '')) LIKE ?", ['%magistral%']);
            })
            ->pluck('id')
            ->map(fn($id) => (int) $id)
            ->all();
    }

    private function moveBusinessBranchReferences(array $sourceBranchIds, int $targetBranchId): void
    {
        $this->updateBranchByModuleScope('purchase_orders', $sourceBranchIds, $targetBranchId, 'magistrales');

        if (Schema::hasTable('magistral_inventory_counts') && $this->columnExists('magistral_inventory_counts', 'business_branch_id')) {
            DB::table('magistral_inventory_counts')
                ->whereIn('business_branch_id', $sourceBranchIds)
                ->update($this->withUpdatedAt('magistral_inventory_counts', [
                    'business_branch_id' => $targetBranchId,
                ]));
        }

        if (Schema::hasTable('accounts_payable') && $this->columnExists('accounts_payable', 'business_branch_id')) {
            $purchaseOrderIds = $this->magistralesPurchaseOrderIds();
            if (!empty($purchaseOrderIds)) {
                DB::table('accounts_payable')
                    ->whereIn('business_branch_id', $sourceBranchIds)
                    ->where('source_type', 'purchase_order')
                    ->whereIn('source_id', $purchaseOrderIds)
                    ->update($this->withUpdatedAt('accounts_payable', [
                        'business_branch_id' => $targetBranchId,
                    ]));
            }
        }
    }

    private function moveMagistralesBusinessReferences(int $fromBusinessId, int $toBusinessId): void
    {
        $this->updateBusinessByModuleScope('articles', $fromBusinessId, $toBusinessId, 'magistrales');
        $this->updateBusinessByModuleScope('purchase_orders', $fromBusinessId, $toBusinessId, 'magistrales');

        foreach (['magistral_incomes', 'magistral_sales'] as $table) {
            if (Schema::hasTable($table) && $this->columnExists($table, 'business_id')) {
                DB::table($table)
                    ->where('business_id', $fromBusinessId)
                    ->update($this->withUpdatedAt($table, [
                        'business_id' => $toBusinessId,
                    ]));
            }
        }

        if (Schema::hasTable('accounts_payable') && $this->columnExists('accounts_payable', 'business_id')) {
            $purchaseOrderIds = $this->magistralesPurchaseOrderIds();
            if (!empty($purchaseOrderIds)) {
                DB::table('accounts_payable')
                    ->where('business_id', $fromBusinessId)
                    ->where('source_type', 'purchase_order')
                    ->whereIn('source_id', $purchaseOrderIds)
                    ->update($this->withUpdatedAt('accounts_payable', [
                        'business_id' => $toBusinessId,
                    ]));
            }
        }
    }

    private function updateBusinessByModuleScope(string $table, int $fromBusinessId, int $toBusinessId, string $moduleScope): void
    {
        if (!Schema::hasTable($table) || !$this->columnExists($table, 'business_id')) {
            return;
        }

        DB::table($table)
            ->where('business_id', $fromBusinessId)
            ->when($this->columnExists($table, 'module_scope'), fn($query) => $query->where('module_scope', $moduleScope))
            ->update($this->withUpdatedAt($table, [
                'business_id' => $toBusinessId,
            ]));
    }

    private function updateBranchByModuleScope(string $table, array $sourceBranchIds, int $targetBranchId, string $moduleScope): void
    {
        if (!Schema::hasTable($table) || !$this->columnExists($table, 'business_branch_id')) {
            return;
        }

        DB::table($table)
            ->whereIn('business_branch_id', $sourceBranchIds)
            ->when($this->columnExists($table, 'module_scope'), fn($query) => $query->where('module_scope', $moduleScope))
            ->update($this->withUpdatedAt($table, [
                'business_branch_id' => $targetBranchId,
            ]));
    }

    private function magistralesPurchaseOrderIds(): array
    {
        if (!Schema::hasTable('purchase_orders')) {
            return [];
        }

        return DB::table('purchase_orders')
            ->when($this->columnExists('purchase_orders', 'module_scope'), fn($query) => $query->where('module_scope', 'magistrales'))
            ->pluck('id')
            ->map(fn($id) => (int) $id)
            ->all();
    }

    private function deactivateSourceBranches(array $sourceBranchIds): void
    {
        if (!Schema::hasTable('business_branches')) {
            return;
        }

        $usedBranchIds = collect();
        if ($this->columnExists('warehouses', 'business_branch_id')) {
            $usedBranchIds = DB::table('warehouses')
                ->whereIn('business_branch_id', $sourceBranchIds)
                ->pluck('business_branch_id');
        }

        $idsToDeactivate = collect($sourceBranchIds)
            ->diff($usedBranchIds)
            ->values()
            ->all();

        if (empty($idsToDeactivate)) {
            return;
        }

        DB::table('business_branches')
            ->whereIn('id', $idsToDeactivate)
            ->update($this->withUpdatedAt('business_branches', [
                'status' => null,
            ]));
    }

    private function backfillUserScopes(): void
    {
        if (!Schema::hasTable('users') || !Schema::hasColumn('users', 'scope')) {
            return;
        }

        $columns = ['id', 'scope'];
        if (Schema::hasColumn('users', 'storage_client_id')) {
            $columns[] = 'storage_client_id';
        }

        DB::table('users')
            ->orderBy('id')
            ->get($columns)
            ->each(function ($user) {
                $currentScope = $this->normalizeScopeValue($user->scope ?? null);
                if (!empty($currentScope)) {
                    return;
                }

                $scope = $this->scopeFromPermissions((int) $user->id);
                if (empty($scope)) {
                    $scope = !empty($user->storage_client_id ?? null)
                        ? [self::USER_SCOPE_MEDICALS]
                        : [self::USER_SCOPE_PERU];
                }

                DB::table('users')
                    ->where('id', $user->id)
                    ->update($this->withUpdatedAt('users', [
                        'scope' => json_encode(array_values(array_unique($scope))),
                    ]));
            });
    }

    private function scopeFromPermissions(int $userId): array
    {
        if (
            !Schema::hasTable('permissions')
            || !Schema::hasTable('model_has_permissions')
            || !Schema::hasTable('model_has_roles')
            || !Schema::hasTable('role_has_permissions')
        ) {
            return [];
        }

        $modelType = 'App\\Models\\User';

        $directPermissions = DB::table('permissions')
            ->join('model_has_permissions', 'model_has_permissions.permission_id', '=', 'permissions.id')
            ->where('model_has_permissions.model_type', $modelType)
            ->where('model_has_permissions.model_id', $userId)
            ->pluck('permissions.name');

        $rolePermissions = DB::table('permissions')
            ->join('role_has_permissions', 'role_has_permissions.permission_id', '=', 'permissions.id')
            ->join('model_has_roles', 'model_has_roles.role_id', '=', 'role_has_permissions.role_id')
            ->where('model_has_roles.model_type', $modelType)
            ->where('model_has_roles.model_id', $userId)
            ->pluck('permissions.name');

        return $directPermissions
            ->merge($rolePermissions)
            ->unique()
            ->map(fn($permission) => str_starts_with((string) $permission, 'storage-') ? self::USER_SCOPE_MEDICALS : self::USER_SCOPE_PERU)
            ->unique()
            ->values()
            ->all();
    }

    private function normalizeScopeValue($scope): array
    {
        if (is_string($scope)) {
            $decoded = json_decode($scope, true);
            $scope = is_array($decoded) ? $decoded : [$scope];
        }

        if (!is_array($scope)) {
            return [];
        }

        return collect($scope)
            ->map(fn($value) => mb_strtolower(trim((string) $value)))
            ->filter(fn($value) => in_array($value, [self::USER_SCOPE_PERU, self::USER_SCOPE_MEDICALS], true))
            ->unique()
            ->values()
            ->all();
    }

    private function withTimestamps(string $table, array $payload): array
    {
        $now = now();
        if ($this->columnExists($table, 'created_at') && !array_key_exists('created_at', $payload)) {
            $payload['created_at'] = $now;
        }
        if ($this->columnExists($table, 'updated_at') && !array_key_exists('updated_at', $payload)) {
            $payload['updated_at'] = $now;
        }

        return $this->onlyExistingColumns($table, $payload);
    }

    private function withUpdatedAt(string $table, array $payload): array
    {
        if ($this->columnExists($table, 'updated_at')) {
            $payload['updated_at'] = now();
        }

        return $this->onlyExistingColumns($table, $payload);
    }

    private function onlyExistingColumns(string $table, array $payload): array
    {
        return collect($payload)
            ->filter(fn($value, $column) => $this->columnExists($table, (string) $column))
            ->all();
    }

    private function columnExists(string $table, string $column): bool
    {
        return Schema::hasTable($table) && Schema::hasColumn($table, $column);
    }
};
