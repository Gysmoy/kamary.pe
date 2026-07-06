<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Laboratory;
use App\Models\Unit;
use App\Models\Warehouse;
use App\Support\BusinessScope;
use Database\Seeders\MagistralesProductionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MagistralesProductionSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_magistrales_production_seeder_creates_operational_scope(): void
    {
        $this->seed(MagistralesProductionSeeder::class);

        $business = Business::where('business_key', BusinessScope::KAMARY_PERU)->first();
        $this->assertNotNull($business);
        $this->assertSame('Kamary Peru', $business->name);

        $branch = $business->branches()->where('name', 'Principal Magistrales')->first();
        $this->assertNotNull($branch);
        $this->assertSame('150101', $branch->ubigeo);
        $this->assertSame('FM01', $branch->series_factura);
        $this->assertSame('BM01', $branch->series_boleta);

        $warehouse = Warehouse::where('business_branch_id', $branch->id)
            ->where('name', 'Almacen Magistrales Principal')
            ->first();
        $this->assertNotNull($warehouse);
        $this->assertTrue((bool) $warehouse->status);
    }

    public function test_magistrales_production_seeder_preserves_catalog_data_and_is_idempotent(): void
    {
        Unit::create([
            'module_scope' => 'standard',
            'name' => 'Temporal',
            'symbol' => 'TMP',
            'status' => true,
        ]);
        Laboratory::create([
            'code' => 'TEMP-LAB',
            'name' => 'Temporal',
            'country' => 'Perú',
            'status' => true,
        ]);

        $this->seed(MagistralesProductionSeeder::class);
        $firstCounts = $this->scopeCounts();

        $this->assertDatabaseHas('units', [
            'module_scope' => 'standard',
            'symbol' => 'TMP',
        ]);
        $this->assertDatabaseHas('laboratories', [
            'code' => 'TEMP-LAB',
        ]);
        foreach (['MAG-UND', 'MAG-G', 'MAG-ML'] as $symbol) {
            $this->assertDatabaseHas('units', [
                'module_scope' => 'standard',
                'symbol' => $symbol,
            ]);
        }

        $this->seed(MagistralesProductionSeeder::class);

        $this->assertSame($firstCounts, $this->scopeCounts());
    }

    private function scopeCounts(): array
    {
        $business = Business::where('business_key', BusinessScope::KAMARY_PERU)->firstOrFail();

        return [
            'businesses' => Business::where('business_key', BusinessScope::KAMARY_PERU)->count(),
            'branches' => $business->branches()->where('name', 'Principal Magistrales')->count(),
            'warehouses' => Warehouse::whereIn('business_branch_id', $business->branches()->pluck('id'))
                ->where('name', 'Almacen Magistrales Principal')
                ->count(),
            'units' => Unit::where('module_scope', 'standard')->count(),
            'laboratories' => Laboratory::count(),
        ];
    }
}
