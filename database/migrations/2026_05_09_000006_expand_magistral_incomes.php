<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->addColumnIfMissing('magistral_incomes', 'purchase_order_code', fn(Blueprint $table) => $table->string('purchase_order_code', 80)->nullable()->after('code'));
        $this->addColumnIfMissing('magistral_incomes', 'payment_method', fn(Blueprint $table) => $table->string('payment_method', 80)->nullable()->after('supplier_id'));
        $this->addColumnIfMissing('magistral_incomes', 'file_path', fn(Blueprint $table) => $table->string('file_path')->nullable()->after('payment_method'));
        $this->addColumnIfMissing('magistral_incomes', 'origin', fn(Blueprint $table) => $table->string('origin', 120)->nullable()->after('file_path'));
        $this->addColumnIfMissing('magistral_incomes', 'currency', fn(Blueprint $table) => $table->string('currency', 10)->nullable()->after('origin'));
        $this->addColumnIfMissing('magistral_incomes', 'affects_igv', fn(Blueprint $table) => $table->boolean('affects_igv')->default(false)->after('currency'));
        $this->addColumnIfMissing('magistral_incomes', 'guide_series', fn(Blueprint $table) => $table->string('guide_series', 40)->nullable()->after('guide_number'));
        $this->addColumnIfMissing('magistral_incomes', 'guide_sequence', fn(Blueprint $table) => $table->string('guide_sequence', 60)->nullable()->after('guide_series'));
        $this->addColumnIfMissing('magistral_incomes', 'guide_ruc', fn(Blueprint $table) => $table->string('guide_ruc', 20)->nullable()->after('guide_sequence'));
        $this->addColumnIfMissing('magistral_incomes', 'guide_file_path', fn(Blueprint $table) => $table->string('guide_file_path')->nullable()->after('guide_ruc'));
        $this->addColumnIfMissing('magistral_incomes', 'subtotal', fn(Blueprint $table) => $table->decimal('subtotal', 12, 2)->default(0)->after('observations'));
        $this->addColumnIfMissing('magistral_incomes', 'igv', fn(Blueprint $table) => $table->decimal('igv', 12, 2)->default(0)->after('subtotal'));
        $this->addColumnIfMissing('magistral_incomes', 'total', fn(Blueprint $table) => $table->decimal('total', 12, 2)->default(0)->after('igv'));

        if (!Schema::hasTable('magistral_income_items')) {
            Schema::create('magistral_income_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('magistral_income_id')->constrained('magistral_incomes')->cascadeOnDelete();
                $table->foreignId('article_id')->nullable()->constrained('articles')->nullOnDelete();
                $table->string('description')->nullable();
                $table->decimal('quantity', 12, 3)->default(0);
                $table->string('presentation', 120)->nullable();
                $table->date('expiration_date')->nullable();
                $table->string('lot', 80)->nullable();
                $table->decimal('price_without_igv', 12, 2)->default(0);
                $table->decimal('price_with_igv', 12, 2)->default(0);
                $table->decimal('subtotal', 12, 2)->default(0);
                $table->boolean('status')->nullable()->default(true);
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('magistral_income_items');

        foreach ([
            'total',
            'igv',
            'subtotal',
            'guide_file_path',
            'guide_ruc',
            'guide_sequence',
            'guide_series',
            'affects_igv',
            'currency',
            'origin',
            'file_path',
            'payment_method',
            'purchase_order_code',
        ] as $column) {
            if (!Schema::hasColumn('magistral_incomes', $column)) continue;

            Schema::table('magistral_incomes', function (Blueprint $table) use ($column) {
                $table->dropColumn($column);
            });
        }
    }

    private function addColumnIfMissing(string $tableName, string $column, callable $definition): void
    {
        if (Schema::hasColumn($tableName, $column)) return;

        Schema::table($tableName, function (Blueprint $table) use ($definition) {
            $definition($table);
        });
    }
};
