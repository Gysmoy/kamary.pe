<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('sales_channels')) {
            Schema::create('sales_channels', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('name');
                $table->boolean('status')->nullable()->default(true);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('sales_subchannels')) {
            Schema::create('sales_subchannels', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('sales_channel_id')->nullable()->index();
                $table->string('name');
                $table->boolean('status')->nullable()->default(true);
                $table->timestamps();
            });
        }

        Schema::table('sample_orders', function (Blueprint $table) {
            if (!Schema::hasColumn('sample_orders', 'sales_channel_id')) $table->uuid('sales_channel_id')->nullable()->after('sales_channel');
            if (!Schema::hasColumn('sample_orders', 'sales_subchannel_id')) $table->uuid('sales_subchannel_id')->nullable()->after('sales_subchannel');
        });

        // Sembramos los canales que estaban hardcodeados para emparejar pedidos existentes por nombre.
        $seed = ['B2B', 'DIRECTOS', 'E COMERCE', 'RETAIL', 'TRADICIONAL', 'TRADE', 'MKT', 'COMMERCIAL EXCELLENCE'];
        foreach ($seed as $name) {
            if (!DB::table('sales_channels')->where('name', $name)->exists()) {
                DB::table('sales_channels')->insert([
                    'id' => (string) Str::uuid(),
                    'name' => $name,
                    'status' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('sample_orders', function (Blueprint $table) {
            if (Schema::hasColumn('sample_orders', 'sales_channel_id')) $table->dropColumn('sales_channel_id');
            if (Schema::hasColumn('sample_orders', 'sales_subchannel_id')) $table->dropColumn('sales_subchannel_id');
        });
        Schema::dropIfExists('sales_subchannels');
        Schema::dropIfExists('sales_channels');
    }
};
