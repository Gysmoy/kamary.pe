<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Detraccion y retencion en el pedido comercial. Se guarda el porcentaje y el monto ya calculados,
 * no solo el tipo: si manana SUNAT cambia una tasa, los pedidos viejos tienen que seguir mostrando
 * lo que se acordo cuando se emitieron.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('commercial_orders')) return;

        Schema::table('commercial_orders', function (Blueprint $table) {
            if (!Schema::hasColumn('commercial_orders', 'detraction_enabled')) {
                $table->boolean('detraction_enabled')->default(false)->after('total');
            }
            if (!Schema::hasColumn('commercial_orders', 'detraction_type_id')) {
                $table->foreignId('detraction_type_id')->nullable()->after('detraction_enabled')
                    ->constrained('detraction_types')->nullOnDelete();
            }
            if (!Schema::hasColumn('commercial_orders', 'detraction_code')) {
                $table->string('detraction_code', 10)->nullable()->after('detraction_type_id');
            }
            if (!Schema::hasColumn('commercial_orders', 'detraction_percent')) {
                $table->decimal('detraction_percent', 6, 2)->default(0)->after('detraction_code');
            }
            if (!Schema::hasColumn('commercial_orders', 'detraction_amount')) {
                $table->decimal('detraction_amount', 14, 2)->default(0)->after('detraction_percent');
            }
            if (!Schema::hasColumn('commercial_orders', 'retention_enabled')) {
                $table->boolean('retention_enabled')->default(false)->after('detraction_amount');
            }
            if (!Schema::hasColumn('commercial_orders', 'retention_percent')) {
                $table->decimal('retention_percent', 6, 2)->default(0)->after('retention_enabled');
            }
            if (!Schema::hasColumn('commercial_orders', 'retention_amount')) {
                $table->decimal('retention_amount', 14, 2)->default(0)->after('retention_percent');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('commercial_orders')) return;

        Schema::table('commercial_orders', function (Blueprint $table) {
            if (Schema::hasColumn('commercial_orders', 'detraction_type_id')) {
                $table->dropForeign(['detraction_type_id']);
            }
            foreach ([
                'detraction_enabled',
                'detraction_type_id',
                'detraction_code',
                'detraction_percent',
                'detraction_amount',
                'retention_enabled',
                'retention_percent',
                'retention_amount',
            ] as $column) {
                if (Schema::hasColumn('commercial_orders', $column)) $table->dropColumn($column);
            }
        });
    }
};
