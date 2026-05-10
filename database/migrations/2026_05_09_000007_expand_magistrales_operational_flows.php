<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('magistral_inventory_counts')) {
            Schema::create('magistral_inventory_counts', function (Blueprint $table) {
                $table->id();
                $table->string('code', 40)->unique();
                $table->foreignId('business_branch_id')->nullable()->constrained('business_branches')->nullOnDelete();
                $table->foreignId('warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();
                $table->date('count_date')->nullable();
                $table->text('observations')->nullable();
                $table->boolean('status')->nullable()->default(true)->index();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('magistral_inventory_count_items')) {
            Schema::create('magistral_inventory_count_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('magistral_inventory_count_id')->constrained('magistral_inventory_counts', 'id', 'mag_inv_count_items_count_fk')->cascadeOnDelete();
                $table->foreignId('article_id')->nullable()->constrained('articles')->nullOnDelete();
                $table->string('lot')->nullable();
                $table->date('expiration_date')->nullable();
                $table->decimal('system_stock', 14, 3)->default(0);
                $table->decimal('real_stock', 14, 3)->default(0);
                $table->decimal('difference', 14, 3)->default(0);
                $table->boolean('status')->nullable()->default(true)->index();
                $table->timestamps();
            });
        }

        Schema::table('magistral_production_orders', function (Blueprint $table) {
            if (!Schema::hasColumn('magistral_production_orders', 'delivery_date')) {
                $table->date('delivery_date')->nullable()->after('quantity');
            }
            if (!Schema::hasColumn('magistral_production_orders', 'destination_warehouse_id')) {
                $table->foreignId('destination_warehouse_id')->nullable()->after('destination')->constrained('warehouses')->nullOnDelete();
            }
            if (!Schema::hasColumn('magistral_production_orders', 'format_id')) {
                $table->foreignId('format_id')->nullable()->after('article_id')->constrained('magistral_formats')->nullOnDelete();
            }
            if (!Schema::hasColumn('magistral_production_orders', 'batch_quantity')) {
                $table->decimal('batch_quantity', 12, 3)->default(0)->after('format_id');
            }
        });

        if (!Schema::hasTable('magistral_production_order_items')) {
            Schema::create('magistral_production_order_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('magistral_production_order_id')->constrained('magistral_production_orders', 'id', 'mag_prod_order_items_order_fk')->cascadeOnDelete();
                $table->foreignId('article_id')->nullable()->constrained('articles')->nullOnDelete();
                $table->string('description')->nullable();
                $table->date('expiration_date')->nullable();
                $table->decimal('quantity', 14, 3)->default(0);
                $table->foreignId('magistral_formula_id')->nullable()->constrained('magistral_formulas', 'id', 'mag_prod_order_items_formula_fk')->nullOnDelete();
                $table->decimal('total', 14, 3)->default(0);
                $table->boolean('status')->nullable()->default(true)->index();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('magistral_output_items')) {
            Schema::create('magistral_output_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('magistral_output_id')->constrained('magistral_outputs', 'id', 'mag_output_items_output_fk')->cascadeOnDelete();
                $table->foreignId('article_id')->nullable()->constrained('articles')->nullOnDelete();
                $table->string('code')->nullable();
                $table->string('name')->nullable();
                $table->string('lot')->nullable();
                $table->date('expiration_date')->nullable();
                $table->decimal('stock', 14, 3)->default(0);
                $table->string('unit_label', 40)->nullable();
                $table->decimal('quantity', 14, 3)->default(0);
                $table->decimal('total', 14, 3)->default(0);
                $table->boolean('status')->nullable()->default(true)->index();
                $table->timestamps();
            });
        }

        Schema::table('magistral_sales', function (Blueprint $table) {
            if (!Schema::hasColumn('magistral_sales', 'doctor')) {
                $table->string('doctor')->nullable()->after('patient');
            }
            if (!Schema::hasColumn('magistral_sales', 'discount_policy')) {
                $table->string('discount_policy')->nullable()->after('doctor');
            }
            if (!Schema::hasColumn('magistral_sales', 'sale_type')) {
                $table->string('sale_type', 40)->nullable()->after('discount_policy');
            }
            if (!Schema::hasColumn('magistral_sales', 'allergy')) {
                $table->boolean('allergy')->default(false)->after('sale_type');
            }
            if (!Schema::hasColumn('magistral_sales', 'intolerance')) {
                $table->boolean('intolerance')->default(false)->after('allergy');
            }
            if (!Schema::hasColumn('magistral_sales', 'taxable_amount')) {
                $table->decimal('taxable_amount', 12, 2)->default(0)->after('intolerance');
            }
            if (!Schema::hasColumn('magistral_sales', 'unaffected_amount')) {
                $table->decimal('unaffected_amount', 12, 2)->default(0)->after('taxable_amount');
            }
            if (!Schema::hasColumn('magistral_sales', 'discount_total')) {
                $table->decimal('discount_total', 12, 2)->default(0)->after('unaffected_amount');
            }
            if (!Schema::hasColumn('magistral_sales', 'subtotal')) {
                $table->decimal('subtotal', 12, 2)->default(0)->after('discount_total');
            }
            if (!Schema::hasColumn('magistral_sales', 'igv')) {
                $table->decimal('igv', 12, 2)->default(0)->after('subtotal');
            }
            if (!Schema::hasColumn('magistral_sales', 'is_quote')) {
                $table->boolean('is_quote')->default(false)->after('igv');
            }
        });

        if (!Schema::hasTable('magistral_sale_items')) {
            Schema::create('magistral_sale_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('magistral_sale_id')->constrained('magistral_sales', 'id', 'mag_sale_items_sale_fk')->cascadeOnDelete();
                $table->foreignId('article_id')->nullable()->constrained('articles')->nullOnDelete();
                $table->foreignId('warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();
                $table->string('description')->nullable();
                $table->decimal('stock', 14, 3)->default(0);
                $table->decimal('quantity', 14, 3)->default(0);
                $table->decimal('unit_price', 12, 2)->default(0);
                $table->decimal('discount', 12, 2)->default(0);
                $table->decimal('subtotal', 12, 2)->default(0);
                $table->boolean('status')->nullable()->default(true)->index();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('magistral_sale_items');

        Schema::table('magistral_sales', function (Blueprint $table) {
            foreach ([
                'doctor',
                'discount_policy',
                'sale_type',
                'allergy',
                'intolerance',
                'taxable_amount',
                'unaffected_amount',
                'discount_total',
                'subtotal',
                'igv',
                'is_quote',
            ] as $column) {
                if (Schema::hasColumn('magistral_sales', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::dropIfExists('magistral_output_items');
        Schema::dropIfExists('magistral_production_order_items');

        Schema::table('magistral_production_orders', function (Blueprint $table) {
            if (Schema::hasColumn('magistral_production_orders', 'destination_warehouse_id')) {
                $table->dropConstrainedForeignId('destination_warehouse_id');
            }
            if (Schema::hasColumn('magistral_production_orders', 'format_id')) {
                $table->dropConstrainedForeignId('format_id');
            }
            foreach (['delivery_date', 'batch_quantity'] as $column) {
                if (Schema::hasColumn('magistral_production_orders', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::dropIfExists('magistral_inventory_count_items');
        Schema::dropIfExists('magistral_inventory_counts');
    }
};
