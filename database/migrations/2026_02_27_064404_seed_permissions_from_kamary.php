<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('permissions', function (Blueprint $table) {
            $table->string('beauty_name')->nullable()->after('name');
        });

        // Insert mass permissions for menu items
        $permissions = [
            // Almacén
            ['name' => 'articles', 'beauty_name' => 'Artículos'],
            ['name' => 'inventory', 'beauty_name' => 'Inventario'],
            ['name' => 'kardex', 'beauty_name' => 'Kardex'],
            ['name' => 'laboratories', 'beauty_name' => 'Laboratorios'],
            ['name' => 'batches', 'beauty_name' => 'Lotes'],
            ['name' => 'entry-note', 'beauty_name' => 'Nota de Entrada'],
            ['name' => 'exit-note', 'beauty_name' => 'Nota de Salida'],
            ['name' => 'suppliers', 'beauty_name' => 'Proveedores'],
            ['name' => 'units-of-measure', 'beauty_name' => 'Und. de medida'],

            // Administración
            ['name' => 'accounts-payable', 'beauty_name' => 'Cuentas por pagar'],
            ['name' => 'expenses', 'beauty_name' => 'Gasto'],
            ['name' => 'daily-summary', 'beauty_name' => 'Resumen diario'],

            // Comercial
            ['name' => 'clients', 'beauty_name' => 'Clientes'],
            ['name' => 'eventual-clients', 'beauty_name' => 'Clientes Eventual'],
            ['name' => 'accounts-receivable', 'beauty_name' => 'Cuenta por Cobrar'],
            ['name' => 'orders', 'beauty_name' => 'Pedido'],
            ['name' => 'pricing', 'beauty_name' => 'Tarifario'],

            // Serv. Almacen...
            ['name' => 'storage-inventory', 'beauty_name' => 'Almacenamiento - Inventario'],
            ['name' => 'storage-clients', 'beauty_name' => 'Almacenamiento - Clientes'],
            ['name' => 'storage-units', 'beauty_name' => 'Almacenamiento - Und. de medida'],
            ['name' => 'storage-products', 'beauty_name' => 'Almacenamiento - Creación del produ...'],
            ['name' => 'storage-entry-note', 'beauty_name' => 'Almacenamiento - Nota de entrada'],
            ['name' => 'storage-exit-note', 'beauty_name' => 'Almacenamiento - Nota de salida'],
            ['name' => 'storage-kardex', 'beauty_name' => 'Almacenamiento - Kardex'],
            ['name' => 'storage-general-service', 'beauty_name' => 'Almacenamiento - Servicio General'],
            ['name' => 'storage-billing-control', 'beauty_name' => 'Almacenamiento - Control de Factura...'],
            ['name' => 'storage-general-service-orders', 'beauty_name' => 'Almacenamiento - O. Servicio General'],

            // Despacho
            ['name' => 'activity', 'beauty_name' => 'Actividad'],
            ['name' => 'driver', 'beauty_name' => 'Conductor'],
            ['name' => 'dispatch', 'beauty_name' => 'Despacho'],
            ['name' => 'vehicle-zone', 'beauty_name' => 'Vehículo / Zona'],

            // Servicios
            ['name' => 'services-client', 'beauty_name' => 'Servicios - Cliente'],
            ['name' => 'services-billing', 'beauty_name' => 'Servicios - Facturación'],
            ['name' => 'services-service-order', 'beauty_name' => 'Servicios - Orden de servicio'],
            ['name' => 'services-services', 'beauty_name' => 'Servicios - Servicios'],

            // Muestras
            ['name' => 'sample-orders', 'beauty_name' => 'Pedido'],

            // Magistrales
            ['name' => 'magistrales-articles', 'beauty_name' => 'Magistrales - Artículos'],
            ['name' => 'magistrales-category', 'beauty_name' => 'Magistrales - Categoría'],
            ['name' => 'magistrales-formats', 'beauty_name' => 'Magistrales - Formatos'],
            ['name' => 'magistrales-formulas', 'beauty_name' => 'Magistrales - Fórmulas'],
            ['name' => 'magistrales-incomes', 'beauty_name' => 'Magistrales - Ingresos'],
            ['name' => 'magistrales-inventory', 'beauty_name' => 'Magistrales - Inventario'],
            ['name' => 'magistrales-kardex', 'beauty_name' => 'Magistrales - Kardex'],
            ['name' => 'magistrales-laboratory', 'beauty_name' => 'Magistrales - Laboratorio'],
            ['name' => 'magistrales-purchase-order', 'beauty_name' => 'Magistrales - O. Compra'],
            ['name' => 'magistrales-production-order', 'beauty_name' => 'Magistrales - O. Producción'],
            ['name' => 'magistrales-supplier', 'beauty_name' => 'Magistrales - Proveedor'],
            ['name' => 'magistrales-responsible', 'beauty_name' => 'Magistrales - Responsable'],
            ['name' => 'magistrales-outputs', 'beauty_name' => 'Magistrales - Salidas'],
            ['name' => 'magistrales-unit', 'beauty_name' => 'Magistrales - Unidad'],
            ['name' => 'magistrales-sales', 'beauty_name' => 'Magistrales - Ventas'],
            ['name' => 'users', 'beauty_name' => 'Usuarios'],
            ['name' => 'roles', 'beauty_name' => 'Roles'],
        ];

        DB::table('permissions')->insert(array_map(function ($perm) {
            return [
                'name' => $perm['name'],
                'beauty_name' => $perm['beauty_name'],
                'guard_name' => 'web',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }, $permissions));

        // Assign all permissions to the admin role
        $adminRoleId = DB::table('roles')->where('name', 'admin')->value('id');
        if ($adminRoleId) {
            $permissionIds = DB::table('permissions')->pluck('id');
            $rolePermissions = $permissionIds->map(fn($id) => [
                'permission_id' => $id,
                'role_id' => $adminRoleId,
            ])->toArray();
            DB::table('role_has_permissions')->insert($rolePermissions);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('permissions', function (Blueprint $table) {
            $table->dropColumn(['beauty_name']);
        });
    }
};
