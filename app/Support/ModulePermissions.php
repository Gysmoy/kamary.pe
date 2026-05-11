<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\UniqueConstraintViolationException;
use Spatie\Permission\PermissionRegistrar;

class ModulePermissions
{
    public static function permissions(): array
    {
        return [
            'users' => 'Usuarios',
            'roles' => 'Roles',
            'businesses' => 'Empresas',

            'articles' => 'Almacen - Articulos',
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
            'orders' => 'Comercial - Pedido',
            'pricing' => 'Comercial - Tarifario',
            'client-distribution' => 'Comercial - Red de Distribucion',

            'storage-inventory' => 'Serv. Almacenamiento - Inventario',
            'storage-clients' => 'Serv. Almacenamiento - Clientes',
            'service-orders' => 'Serv. Almacenamiento - O. Servicio',
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
            'magistrales-incomes' => 'Magistrales - Ingresos',
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

    public static function magistralesModules(): array
    {
        return [
            ['permission' => 'magistrales-dashboard', 'web' => '/admin/magistrales/dashboard', 'api' => null, 'label' => 'Dashboard'],
            ['permission' => 'magistrales-articles', 'web' => '/admin/magistrales/articles', 'api' => '/api/admin/magistrales/articles/paginate', 'label' => 'Articulos'],
            ['permission' => 'magistrales-category', 'web' => '/admin/magistrales-category', 'api' => '/api/admin/magistrales/categories/paginate', 'label' => 'Categoria'],
            ['permission' => 'magistrales-formats', 'web' => '/admin/magistrales-formats', 'api' => '/api/admin/magistrales/formats/paginate', 'label' => 'Formatos'],
            ['permission' => 'magistrales-formulas', 'web' => '/admin/magistrales-formulas', 'api' => '/api/admin/magistrales/formulas/paginate', 'label' => 'Formulas'],
            ['permission' => 'magistrales-incomes', 'web' => '/admin/magistrales-incomes', 'api' => '/api/admin/magistrales/incomes/paginate', 'label' => 'Ingresos'],
            ['permission' => 'magistrales-inventory', 'web' => '/admin/magistrales/inventory', 'api' => '/api/admin/magistrales/inventory/paginate', 'label' => 'Inventario'],
            ['permission' => 'magistrales-kardex', 'web' => '/admin/magistrales/kardex', 'api' => '/api/admin/magistrales/kardex/paginate', 'label' => 'Kardex'],
            ['permission' => 'magistrales-laboratory', 'web' => '/admin/magistrales-laboratory', 'api' => '/api/admin/magistrales/laboratories/paginate', 'label' => 'Laboratorio'],
            ['permission' => 'magistrales-purchase-order', 'web' => '/admin/magistrales/purchase-orders', 'api' => '/api/admin/magistrales/purchase-orders/paginate', 'label' => 'O. Compra'],
            ['permission' => 'magistrales-production-order', 'web' => '/admin/magistrales-production-order', 'api' => '/api/admin/magistrales/production-orders/paginate', 'label' => 'O. Produccion'],
            ['permission' => 'magistrales-supplier', 'web' => '/admin/magistrales/suppliers', 'api' => '/api/admin/magistrales/suppliers/paginate', 'label' => 'Proveedor'],
            ['permission' => 'magistrales-responsible', 'web' => '/admin/magistrales-responsible', 'api' => '/api/admin/magistrales/responsibles/paginate', 'label' => 'Responsable'],
            ['permission' => 'magistrales-outputs', 'web' => '/admin/magistrales-outputs', 'api' => '/api/admin/magistrales/outputs/paginate', 'label' => 'Salidas'],
            ['permission' => 'magistrales-unit', 'web' => '/admin/magistrales-unit', 'api' => '/api/admin/magistrales/units/paginate', 'label' => 'Unidad'],
            ['permission' => 'magistrales-sales', 'web' => '/admin/magistrales-sales', 'api' => '/api/admin/magistrales/sales/paginate', 'label' => 'Ventas'],
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
