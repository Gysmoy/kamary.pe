<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class TenantAddDataToPaymentMethodTypes extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (!Schema::hasColumn('payment_method_types', 'number_days') || !Schema::hasColumn('payment_method_types', 'charge')) {
            Schema::table('payment_method_types', function (Blueprint $table) {
                if (!Schema::hasColumn('payment_method_types', 'number_days')) {
                    $table->unsignedInteger('number_days')->nullable()->after('has_card');
                }

                if (!Schema::hasColumn('payment_method_types', 'charge')) {
                    $table->decimal('charge', 12, 2)->nullable()->after('number_days');
                }
            });
        }

        $hasNumberDays = Schema::hasColumn('payment_method_types', 'number_days');
        $hasCharge = Schema::hasColumn('payment_method_types', 'charge');

        $rows = [
            ['id' => '08', 'description' => 'A 30 dias', 'has_card' => false, 'number_days' => 30, 'charge' => null],
            ['id' => '09', 'description' => 'Credito', 'has_card' => true, 'number_days' => null, 'charge' => null],
            ['id' => '10', 'description' => 'Contado', 'has_card' => false, 'number_days' => null, 'charge' => null],
        ];

        foreach ($rows as $row) {
            $payload = [
                'description' => $row['description'],
                'has_card' => $row['has_card'],
            ];

            if ($hasNumberDays) {
                $payload['number_days'] = $row['number_days'];
            }

            if ($hasCharge) {
                $payload['charge'] = $row['charge'];
            }

            DB::table('payment_method_types')->updateOrInsert(['id' => $row['id']], $payload);
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        DB::table('payment_method_types')->whereIn('id', ['08', '09', '10'])->delete();
    }
}
