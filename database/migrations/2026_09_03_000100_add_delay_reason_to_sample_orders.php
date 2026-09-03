<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sample_orders', function (Blueprint $table) {
            // Motivo por el que la entrega salio despues de la fecha solicitada.
            if (!Schema::hasColumn('sample_orders', 'delay_reason')) {
                $table->string('delay_reason')->nullable()->after('delivered_at');
            }
            if (!Schema::hasColumn('sample_orders', 'delay_reason_notes')) {
                $table->text('delay_reason_notes')->nullable()->after('delay_reason');
            }
        });
    }

    public function down(): void
    {
        $columns = array_values(array_filter(
            ['delay_reason', 'delay_reason_notes'],
            fn ($column) => Schema::hasColumn('sample_orders', $column)
        ));

        if (!$columns) return;

        Schema::table('sample_orders', function (Blueprint $table) use ($columns) {
            $table->dropColumn($columns);
        });
    }
};
