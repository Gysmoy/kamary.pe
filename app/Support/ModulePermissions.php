<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\UniqueConstraintViolationException;
use Spatie\Permission\Exceptions\PermissionDoesNotExist;
use Spatie\Permission\PermissionRegistrar;

class ModulePermissions
{
    public static function permissions(): array
    {
        return [
            'dashboard' => 'Dashboard',

            'users' => 'Usuarios',
            'roles' => 'Roles',
            'businesses' => 'Empresas',
            'generals' => 'Sistemas - Datos generales',

            'articles' => 'Almacen - Articulos',
            'warehouses' => 'Almacen - Almacenes',
            'inventory' => 'Almacen - Inventario',
            'kardex' => 'Almacen - Kardex',
            'laboratories' => 'Almacen - Laboratorios',
            'batches' => 'Almacen - Lotes',
            'entry-note' => 'Almacen - Nota de Entrada',
            'exit-note' => 'Almacen - Nota de Salida',
            'suppliers' => 'Almacen - Proveedores',
            'units-of-measure' => 'Almacen - Unidades',

            'purchase-orders' => 'Administracion - Ordenes de Compra',
            'purchase-receipts' => 'Administracion - Recepcion de Compra',
            'accounts-payable' => 'Administracion - Cuentas por Pagar',
            'expenses' => 'Administracion - Gasto',
            'daily-summary' => 'Administracion - Resumen Diario',

            'clients' => 'Comercial - Cliente',
            'eventual-clients' => 'Comercial - Clientes Eventual',
            'accounts-receivable' => 'Comercial - Cuenta por Cobrar',
            'take-orders' => 'Comercial - Toma pedido',
            'orders' => 'Comercial - Pedido',
            'pricing' => 'Comercial - Tarifario',
            'client-distribution' => 'Comercial - Red de Distribucion',

            'storage-inventory' => 'Serv. Almacenamiento - Inventario',
            'storage-clients' => 'Serv. Almacenamiento - Clientes',
            'storage-service-orders' => 'Serv. Almacenamiento - O. Servicio',
            'storage-units' => 'Serv. Almacenamiento - Und. de Medida',
            'storage-products' => 'Serv. Almacenamiento - Creacion del Producto',
            'storage-entry-note' => 'Serv. Almacenamiento - Nota de Entrada',
            'storage-exit-note' => 'Serv. Almacenamiento - Nota de Salida',
            'storage-kardex' => 'Serv. Almacenamiento - Kardex',
            'storage-general-service' => 'Serv. Almacenamiento - Servicio General',
            'storage-billing-control' => 'Serv. Almacenamiento - Control de Facturacion',
            'storage-general-service-orders' => 'Serv. Almacenamiento - O. Servicio General',

            'activity' => 'Despacho - Actividad',
            'driver' => 'Despacho - Conductor',
            'dispatch' => 'Despacho - Despacho',
            'vehicle-zone' => 'Despacho - Vehiculo / Zona',

            'services-client' => 'Servicios - Cliente',
            'services-billing' => 'Servicios - Facturacion',
            'services-service-order' => 'Servicios - Orden de Servicio',
            'services-services' => 'Servicios - Servicios',

            'sample-orders' => 'Muestras - Pedido',

            'magistrales-dashboard' => 'Magistrales - Dashboard',
            'magistrales-products' => 'Magistrales - Productos',
            'magistrales-procurement' => 'Magistrales - Proveedores y Compras',
            'magistrales-warehouse' => 'Magistrales - Almacen',
            'magistrales-billing' => 'Magistrales - Facturacion',
            'magistrales-articles' => 'Magistrales - Articulos',
            'magistrales-category' => 'Magistrales - Categoria',
            'magistrales-formats' => 'Magistrales - Formatos',
            'magistrales-formulas' => 'Magistrales - Formulas',
            'magistrales-incomes' => 'Magistrales - Nota de Entrada',
            'magistrales-inventory' => 'Magistrales - Inventario',
            'magistrales-kardex' => 'Magistrales - Kardex',
            'magistrales-laboratory' => 'Magistrales - Laboratorio',
            'magistrales-purchase-order' => 'Magistrales - O. Compra',
            'magistrales-production-order' => 'Magistrales - O. Produccion',
            'magistrales-supplier' => 'Magistrales - Proveedor',
            'magistrales-responsible' => 'Magistrales - Responsable',
            'magistrales-outputs' => 'Magistrales - Salidas',
            'magistrales-unit' => 'Magistrales - Unidad',
            'magistrales-sales' => 'Magistrales - Ventas',
        ];
    }

    public static function assignablePermissions(): array
    {
        return array_diff_key(self::permissions(), array_flip(self::hiddenAssignablePermissions()));
    }

    public static function hiddenAssignablePermissions(): array
    {
        return [
            'magistrales-products',
            'magistrales-procurement',
            'magistrales-warehouse',
            'magistrales-billing',
            'magistrales-category',
            'magistrales-incomes',
            'magistrales-inventory',
            'magistrales-kardex',
            'magistrales-laboratory',
            'magistrales-supplier',
            'magistrales-responsible',
            'magistrales-outputs',
            'magistrales-unit',
            'magistrales-sales',
        ];
    }

    public static function webModules(): array
    {
        return [
            ['permission' => 'dashboard', 'web' => '/admin/home', 'label' => 'Dashboard'],

            ['permission' => 'businesses', 'web' => '/admin/businesses', 'label' => 'Empresas'],
            ['permission' => 'users', 'web' => '/admin/users', 'label' => 'Usuarios'],
            ['permission' => 'roles', 'web' => '/admin/roles', 'label' => 'Roles y permisos'],
            ['permission' => 'generals', 'web' => '/admin/generals', 'label' => 'Datos generales'],

            ['permission' => 'articles', 'web' => '/admin/articles', 'label' => 'Articulos'],
            ['permission' => 'warehouses', 'web' => '/admin/warehouses', 'label' => 'Almacenes'],
            ['permission' => 'inventory', 'web' => '/admin/inventory', 'label' => 'Inventario'],
            ['permission' => 'kardex', 'web' => '/admin/kardex', 'label' => 'Kardex'],
            ['permission' => 'laboratories', 'web' => '/admin/laboratories', 'label' => 'Laboratorios'],
            ['permission' => 'batches', 'web' => '/admin/batches', 'label' => 'Lotes'],
            ['permission' => 'entry-note', 'web' => '/admin/entry-note', 'label' => 'Nota de Entrada'],
            ['permission' => 'exit-note', 'web' => '/admin/exit-note', 'label' => 'Nota de Salida'],
            ['permission' => 'suppliers', 'web' => '/admin/suppliers', 'label' => 'Proveedores'],
            ['permission' => 'units-of-measure', 'web' => '/admin/units', 'label' => 'Und. de medida'],

            ['permission' => 'purchase-orders', 'web' => '/admin/purchase-orders', 'label' => 'O. Compra'],
            ['permission' => 'purchase-receipts', 'web' => '/admin/purchase-receipts', 'label' => 'Recepcion de compra'],
            ['permission' => 'accounts-payable', 'web' => '/admin/accounts-payable', 'label' => 'Cuentas por pagar'],
            ['permission' => 'expenses', 'web' => '/admin/expenses', 'label' => 'Gasto'],
            ['permission' => 'daily-summary', 'web' => '/admin/daily-summary', 'label' => 'Resumen diario'],

            ['permission' => 'clients', 'web' => '/admin/clients', 'label' => 'Cliente'],
            ['permission' => 'eventual-clients', 'web' => '/admin/eventual-clients', 'label' => 'Clientes Eventual'],
            ['permission' => 'client-distribution', 'web' => '/admin/client-distribution', 'label' => 'Red de distribucion'],
            ['permission' => 'accounts-receivable', 'web' => '/admin/accounts-receivable', 'label' => 'Cuenta por Cobrar'],
            ['permission' => 'take-orders', 'web' => '/admin/comercial/tomapedido', 'label' => 'Toma pedido'],
            ['permission' => 'orders', 'web' => '/admin/commercial-orders', 'label' => 'Pedido'],
            ['permission' => 'pricing', 'web' => '/admin/pricing', 'label' => 'Tarifario'],

            ['permission' => 'storage-inventory', 'web' => '/admin/storage-inventory', 'label' => 'Inventario almacenamiento'],
            ['permission' => 'storage-clients', 'web' => '/admin/storage-clients', 'label' => 'Clientes almacenamiento'],
            ['permission' => 'storage-service-orders', 'web' => '/admin/storage-service-orders', 'label' => 'O. Servicio almacenamiento'],
            ['permission' => 'storage-units', 'web' => '/admin/storage-units', 'label' => 'Und. de medida almacenamiento'],
            ['permission' => 'storage-products', 'web' => '/admin/storage-products', 'label' => 'Creacion del producto'],
            ['permission' => 'storage-entry-note', 'web' => '/admin/storage-entry-note', 'label' => 'Nota de entrada almacenamiento'],
            ['permission' => 'storage-exit-note', 'web' => '/admin/storage-exit-note', 'label' => 'Nota de salida almacenamiento'],
            ['permission' => 'storage-kardex', 'web' => '/admin/storage-kardex', 'label' => 'Kardex almacenamiento'],
            ['permission' => 'storage-general-service', 'web' => '/admin/storage-general-service', 'label' => 'Servicio General'],
            ['permission' => 'storage-billing-control', 'web' => '/admin/storage-billing-control', 'label' => 'Control de Facturacion'],
            ['permission' => 'storage-general-service-orders', 'web' => '/admin/storage-general-service-orders', 'label' => 'O. Servicio General'],

            ['permission' => 'activity', 'web' => '/admin/activity', 'label' => 'Actividad'],
            ['permission' => 'driver', 'web' => '/admin/driver', 'label' => 'Conductor'],
            ['permission' => 'dispatch', 'web' => '/admin/driver-routes', 'label' => 'Ruta conductor'],
            ['permission' => 'dispatch', 'web' => '/admin/picking', 'label' => 'Preparacion'],
            ['permission' => 'dispatch', 'web' => '/admin/dispatch', 'label' => 'Despacho'],
            ['permission' => 'vehicle-zone', 'web' => '/admin/vehicle-zone', 'label' => 'Vehiculo / Zona'],

            ['permission' => 'services-client', 'web' => '/admin/services-client', 'label' => 'Cliente servicios'],
            ['permission' => 'services-billing', 'web' => '/admin/services-billing', 'label' => 'Facturacion servicios'],
            ['permission' => 'services-service-order', 'web' => '/admin/services-service-order', 'label' => 'Orden de servicio'],
            ['permission' => 'services-services', 'web' => '/admin/services-services', 'label' => 'Servicios'],

            ['permission' => 'sample-orders', 'web' => '/admin/sample-orders', 'label' => 'Pedido muestras'],

            ...self::magistralesModules(),
        ];
    }

    public static function userCan(?User $user, string $permission): bool
    {
        if (!$user) {
            return false;
        }

        if (self::isSuperUser($user)) {
            return true;
        }

        try {
            return $user->can($permission);
        } catch (PermissionDoesNotExist $exception) {
            return false;
        }
    }

    public static function isSuperUser(?User $user): bool
    {
        if (!$user) {
            return false;
        }

        $superRoles = ['admin', 'root', 'administrador', 'super admin', 'superadmin'];

        try {
            if ($user->hasAnyRole(['Admin', 'Root', 'Administrador', 'Super Admin', 'SuperAdmin'])) {
                return true;
            }
        } catch (\Throwable $exception) {
            //
        }

        try {
            $roleNames = $user->relationLoaded('roles')
                ? $user->roles->pluck('name')
                : $user->getRoleNames();

            return $roleNames
                ->map(fn($role) => mb_strtolower(trim((string)$role)))
                ->contains(fn($role) => in_array($role, $superRoles, true));
        } catch (\Throwable $exception) {
            return false;
        }
    }

    public static function homePathForUser(?User $user): string
    {
        if (!$user) {
            return '/login';
        }

        foreach (self::webModules() as $module) {
            if (self::userCan($user, $module['permission'])) {
                return $module['web'];
            }
        }

        return '/admin/account';
    }

    public static function magistralesModules(): array
    {
        return [
            ['permission' => 'magistrales-dashboard', 'web' => '/admin/magistrales/dashboard', 'api' => null, 'label' => 'Dashboard'],
            ['permission' => 'magistrales-articles', 'web' => '/admin/magistrales/articles', 'api' => '/api/admin/magistrales/articles/paginate', 'label' => 'Articulos'],
            ['permission' => 'magistrales-formats', 'web' => '/admin/magistrales-formats', 'api' => '/api/admin/magistrales/formats/paginate', 'label' => 'Formatos'],
            ['permission' => 'magistrales-formulas', 'web' => '/admin/magistrales-formulas', 'api' => '/api/admin/magistrales/formulas/paginate', 'label' => 'Formulas'],
            ['permission' => 'magistrales-purchase-order', 'web' => '/admin/magistrales/purchase-orders', 'api' => '/api/admin/magistrales/purchase-orders/paginate', 'label' => 'O. Compra'],
            ['permission' => 'magistrales-production-order', 'web' => '/admin/magistrales-production-order', 'api' => '/api/admin/magistrales/production-orders/paginate', 'label' => 'O. Produccion'],
        ];
    }

    public static function sync(): void
    {
        if (!Schema::hasTable('permissions') || !Schema::hasTable('roles')) {
            return;
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $hasBeautyName = Schema::hasColumn('permissions', 'beauty_name');
        $now = now();

        foreach (self::permissions() as $name => $beautyName) {
            $permission = DB::table('permissions')
                ->where('name', $name)
                ->where('guard_name', 'web')
                ->first();

            $payload = [
                'guard_name' => 'web',
                'updated_at' => $now,
            ];

            if ($hasBeautyName) {
                $payload['beauty_name'] = $beautyName;
            }

            if ($permission) {
                DB::table('permissions')->where('id', $permission->id)->update($payload);
                continue;
            }

            DB::table('permissions')->insert(array_merge($payload, [
                'name' => $name,
                'created_at' => $now,
            ]));
        }

        $permissionIds = DB::table('permissions')
            ->whereIn('name', array_keys(self::permissions()))
            ->where('guard_name', 'web')
            ->pluck('id');

        $roleIds = collect(['Admin', 'Root'])
            ->map(fn(string $name) => self::ensureRole($name))
            ->filter()
            ->values();

        foreach ($roleIds as $roleId) {
            foreach ($permissionIds as $permissionId) {
                $exists = DB::table('role_has_permissions')
                    ->where('role_id', $roleId)
                    ->where('permission_id', $permissionId)
                    ->exists();

                if (!$exists) {
                    DB::table('role_has_permissions')->insert([
                        'role_id' => $roleId,
                        'permission_id' => $permissionId,
                    ]);
                }
            }
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    private static function ensureRole(string $name): ?int
    {
        $roleId = DB::table('roles')
            ->where('name', $name)
            ->where('guard_name', 'web')
            ->value('id');

        if ($roleId) {
            return (int)$roleId;
        }

        try {
            return (int)DB::table('roles')->insertGetId([
                'name' => $name,
                'guard_name' => 'web',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (UniqueConstraintViolationException $exception) {
            return (int)DB::table('roles')
                ->where('name', $name)
                ->where('guard_name', 'web')
                ->value('id');
        }
    }
}
