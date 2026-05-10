<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->dropIndexIfExists('articles', 'articles_code_unique', 'unique');
        $this->addUniqueIfMissing('articles', 'articles_module_scope_code_unique', ['module_scope', 'code']);

        $this->addColumnIfMissing('articles', 'composition', fn(Blueprint $table) => $table->text('composition')->nullable()->after('name'));
        $this->addColumnIfMissing('articles', 'sub_category', fn(Blueprint $table) => $table->string('sub_category', 120)->nullable()->after('magistral_category_id'));
        $this->addColumnIfMissing('articles', 'health_registration', fn(Blueprint $table) => $table->string('health_registration', 120)->nullable()->after('magistral_format_id'));
        $this->addColumnIfMissing('articles', 'stock_min', fn(Blueprint $table) => $table->decimal('stock_min', 12, 3)->nullable()->after('default_expiration_date'));
        $this->addColumnIfMissing('articles', 'stock_max', fn(Blueprint $table) => $table->decimal('stock_max', 12, 3)->nullable()->after('stock_min'));
        $this->addColumnIfMissing('articles', 'currency', fn(Blueprint $table) => $table->string('currency', 10)->nullable()->after('stock_max'));
        $this->addColumnIfMissing('articles', 'stock_has_expiration', fn(Blueprint $table) => $table->boolean('stock_has_expiration')->default(false)->after('currency'));
        $this->addColumnIfMissing('articles', 'stock_has_lot', fn(Blueprint $table) => $table->boolean('stock_has_lot')->default(false)->after('stock_has_expiration'));
        $this->addColumnIfMissing('articles', 'cost_price', fn(Blueprint $table) => $table->decimal('cost_price', 12, 2)->nullable()->after('stock_has_lot'));
        $this->addColumnIfMissing('articles', 'sale_price', fn(Blueprint $table) => $table->decimal('sale_price', 12, 2)->nullable()->after('cost_price'));
        $this->addColumnIfMissing('articles', 'equivalence_exchange_rate', fn(Blueprint $table) => $table->decimal('equivalence_exchange_rate', 12, 4)->nullable()->after('sale_price'));
        $this->addColumnIfMissing('articles', 'equivalence_quantity', fn(Blueprint $table) => $table->decimal('equivalence_quantity', 12, 3)->nullable()->after('equivalence_exchange_rate'));

        if (!Schema::hasColumn('articles', 'equivalence_unit_id')) {
            Schema::table('articles', function (Blueprint $table) {
                $table->foreignId('equivalence_unit_id')->nullable()->after('equivalence_quantity')->constrained('units')->nullOnDelete();
            });
        }

        $this->addColumnIfMissing('articles', 'sale_price_national', fn(Blueprint $table) => $table->decimal('sale_price_national', 12, 2)->nullable()->after('equivalence_unit_id'));
        $this->addColumnIfMissing('articles', 'purchase_price_national', fn(Blueprint $table) => $table->decimal('purchase_price_national', 12, 2)->nullable()->after('sale_price_national'));
        $this->addColumnIfMissing('articles', 'purchase_price_foreign', fn(Blueprint $table) => $table->decimal('purchase_price_foreign', 12, 2)->nullable()->after('purchase_price_national'));
    }

    public function down(): void
    {
        foreach ([
            'purchase_price_foreign',
            'purchase_price_national',
            'sale_price_national',
            'equivalence_unit_id',
            'equivalence_quantity',
            'equivalence_exchange_rate',
            'sale_price',
            'cost_price',
            'stock_has_lot',
            'stock_has_expiration',
            'currency',
            'stock_max',
            'stock_min',
            'health_registration',
            'sub_category',
            'composition',
        ] as $column) {
            if (!Schema::hasColumn('articles', $column)) continue;

            Schema::table('articles', function (Blueprint $table) use ($column) {
                if ($column === 'equivalence_unit_id') {
                    $table->dropConstrainedForeignId($column);
                    return;
                }

                $table->dropColumn($column);
            });
        }

        $this->dropIndexIfExists('articles', 'articles_module_scope_code_unique', 'unique');

        $hasDuplicateCodes = DB::table('articles')
            ->select('code')
            ->groupBy('code')
            ->havingRaw('COUNT(*) > 1')
            ->exists();

        if (!$hasDuplicateCodes) {
            $this->addUniqueIfMissing('articles', 'articles_code_unique', ['code']);
        }
    }

    private function addColumnIfMissing(string $tableName, string $column, callable $definition): void
    {
        if (Schema::hasColumn($tableName, $column)) return;

        Schema::table($tableName, function (Blueprint $table) use ($definition) {
            $definition($table);
        });
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
