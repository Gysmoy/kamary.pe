<?php

namespace Database\Seeders;

use App\Http\Controllers\Admin\ActivityController;
use App\Models\BillingDocument;
use App\Models\CommercialOrder;
use App\Models\Dispatch;
use App\Models\Driver;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\Zone;
use App\Services\BillingDocumentService;
use Illuminate\Database\Seeder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DemoOperationalPhase3Seeder extends Seeder
{
    public function run(): void
    {
        $user = User::query()->orderBy('id')->first();
        if (!$user) throw new \RuntimeException('No existe un usuario para sembrar demos');

        Auth::shouldUse('web');
        Auth::setUser($user);

        $demoBusinessIds = DB::table('businesses')->where('name', 'like', 'DEMO OPERATIVO %')->pluck('id');
        if ($demoBusinessIds->isEmpty()) {
            throw new \RuntimeException('Primero ejecuta DemoOperationalModulesSeeder y DemoOperationalPhase2Seeder');
        }

        DB::beginTransaction();
        try {
            $this->cleanup($demoBusinessIds);
            $drivers = $this->seedDrivers($demoBusinessIds, $user->id);
            $zones = $this->seedZones($demoBusinessIds, $user->id);
            $vehicles = $this->seedVehicles($demoBusinessIds, $zones, $user->id);
            $this->assignDispatches($demoBusinessIds, $drivers, $vehicles, $zones, $user->id);
            $this->seedActivities($demoBusinessIds);
            $this->seedBillingSimulation($demoBusinessIds);
            DB::commit();
        } catch (\Throwable $th) {
            DB::rollBack();
            throw $th;
        }

        $this->command?->info('Datos demo fase 3 cargados correctamente');
        $this->command?->line('drivers_demo....................... ' . Driver::query()->where('code', 'like', 'DRV-DEMO-%')->count());
        $this->command?->line('zones_demo......................... ' . Zone::query()->where('code', 'like', 'ZON-DEMO-%')->count());
        $this->command?->line('vehicles_demo...................... ' . Vehicle::query()->where('code', 'like', 'VEH-DEMO-%')->count());
        $this->command?->line('activities_demo.................... ' . DB::table('activities')->whereIn('business_id', $demoBusinessIds)->count());
    }

    private function cleanup($demoBusinessIds): void
    {
        $activityIds = DB::table('activities')->whereIn('business_id', $demoBusinessIds)->pluck('id');
        DB::table('activity_logs')->whereIn('activity_id', $activityIds)->delete();
        DB::table('activity_items')->whereIn('activity_id', $activityIds)->delete();
        DB::table('activities')->whereIn('id', $activityIds)->delete();

        DB::table('dispatches')->whereIn('business_id', $demoBusinessIds)->update([
            'driver_id' => null,
            'vehicle_id' => null,
            'zone_id' => null,
            'driver_name' => null,
            'vehicle_label' => null,
            'vehicle_plate' => null,
            'zone' => null,
        ]);

        DB::table('vehicles')->where('code', 'like', 'VEH-DEMO-%')->delete();
        DB::table('drivers')->where('code', 'like', 'DRV-DEMO-%')->delete();
        DB::table('zones')->where('code', 'like', 'ZON-DEMO-%')->delete();

        $noteCreditIds = DB::table('billing_documents')
            ->whereIn('business_id', $demoBusinessIds)
            ->where(function ($query) {
                $query->whereNotNull('reference_billing_document_id')
                    ->orWhere('document_type', 'Nota de credito');
            })
            ->pluck('id');
        DB::table('billing_events')->whereIn('billing_document_id', $noteCreditIds)->delete();
        DB::table('billing_document_items')->whereIn('billing_document_id', $noteCreditIds)->delete();
        DB::table('billing_documents')->whereIn('id', $noteCreditIds)->delete();

        $baseDocumentIds = DB::table('billing_documents')->whereIn('business_id', $demoBusinessIds)->pluck('id');
        DB::table('billing_events')->whereIn('billing_document_id', $baseDocumentIds)->delete();
        DB::table('billing_documents')->whereIn('id', $baseDocumentIds)->update([
            'local_status' => 'pending',
            'external_status' => 'draft',
            'external_id' => null,
            'external_reference' => null,
            'response_payload' => null,
            'error_message' => null,
            'sent_at' => null,
            'accepted_at' => null,
            'cancelled_at' => null,
        ]);
    }

    private function seedDrivers($demoBusinessIds, int $userId): array
    {
        $drivers = [];
        foreach ($demoBusinessIds->values() as $index => $businessId) {
            for ($i = 1; $i <= 5; $i++) {
                $sequence = ($index * 5) + $i;
                $drivers[] = Driver::create([
                    'business_id' => $businessId,
                    'code' => 'DRV-DEMO-' . str_pad((string) $sequence, 3, '0', STR_PAD_LEFT),
                    'full_name' => 'Conductor Demo ' . $sequence,
                    'document_type' => 'DNI',
                    'document_number' => str_pad((string) (70000000 + $sequence), 8, '0', STR_PAD_LEFT),
                    'license_number' => 'LIC-DEMO-' . str_pad((string) $sequence, 4, '0', STR_PAD_LEFT),
                    'phone' => '900000' . str_pad((string) $sequence, 3, '0', STR_PAD_LEFT),
                    'email' => 'driver.demo.' . $sequence . '@kamary.test',
                    'observations' => 'Conductor demo',
                    'status' => true,
                    'created_by' => $userId,
                    'updated_by' => $userId,
                ]);
            }
        }
        return $drivers;
    }

    private function seedZones($demoBusinessIds, int $userId): array
    {
        $zoneNames = ['Lima Centro', 'Lima Norte', 'Lima Sur', 'Callao', 'Ate', 'Surco', 'San Isidro', 'Miraflores', 'La Molina', 'Independencia'];
        $zones = [];
        foreach ($zoneNames as $index => $name) {
            $businessId = $demoBusinessIds[$index % $demoBusinessIds->count()];
            $zones[] = Zone::create([
                'business_id' => $businessId,
                'code' => 'ZON-DEMO-' . str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT),
                'name' => $name,
                'ubigeo' => '1501' . str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT),
                'department' => 'Lima',
                'province' => $index === 3 ? 'Callao' : 'Lima',
                'district' => $name,
                'reference' => 'Zona demo de reparto',
                'observations' => 'Zona de prueba',
                'status' => true,
                'created_by' => $userId,
                'updated_by' => $userId,
            ]);
        }
        return $zones;
    }

    private function seedVehicles($demoBusinessIds, array $zones, int $userId): array
    {
        $types = ['Furgon', 'Moto', 'Camioneta', 'Van', 'Camion'];
        $vehicles = [];
        for ($i = 1; $i <= 10; $i++) {
            $vehicles[] = Vehicle::create([
                'business_id' => $demoBusinessIds[($i - 1) % $demoBusinessIds->count()],
                'zone_id' => $zones[($i - 1) % count($zones)]->id,
                'code' => 'VEH-DEMO-' . str_pad((string) $i, 3, '0', STR_PAD_LEFT),
                'plate' => 'DE' . str_pad((string) $i, 4, '0', STR_PAD_LEFT),
                'label' => 'Unidad Demo ' . $i,
                'brand' => 'Toyota',
                'model' => 'Demo ' . $i,
                'color' => $i % 2 === 0 ? 'Blanco' : 'Azul',
                'vehicle_type' => $types[($i - 1) % count($types)],
                'capacity' => 10 + $i,
                'gross_weight' => 500 + ($i * 15),
                'observations' => 'Vehiculo demo',
                'status' => true,
                'created_by' => $userId,
                'updated_by' => $userId,
            ]);
        }
        return $vehicles;
    }

    private function assignDispatches($demoBusinessIds, array $drivers, array $vehicles, array $zones, int $userId): void
    {
        $dispatches = Dispatch::query()->whereIn('business_id', $demoBusinessIds)->orderBy('id')->get()->values();
        foreach ($dispatches as $index => $dispatch) {
            $driver = $drivers[$index % count($drivers)];
            $vehicle = $vehicles[$index % count($vehicles)];
            $zone = $zones[$index % count($zones)];
            $dispatch->update([
                'driver_id' => $driver->id,
                'driver_name' => $driver->full_name,
                'vehicle_id' => $vehicle->id,
                'vehicle_label' => $vehicle->label,
                'vehicle_plate' => $vehicle->plate,
                'zone_id' => $zone->id,
                'zone' => $zone->name,
                'updated_by' => $userId,
            ]);
        }
    }

    private function seedActivities($demoBusinessIds): void
    {
        $controller = app(ActivityController::class);
        $orders = CommercialOrder::query()->whereIn('business_id', $demoBusinessIds)->with(['client', 'eventualClient', 'items.article'])->orderBy('id')->take(10)->get()->values();
        $dispatches = Dispatch::query()->whereIn('business_id', $demoBusinessIds)->orderBy('id')->take(6)->get()->values();

        foreach ($orders as $index => $order) {
            $dispatch = $dispatches[$index % max(1, $dispatches->count())] ?? null;
            $response = $controller->save(Request::create('/demo', 'POST', [
                'business_id' => $order->business_id,
                'business_branch_id' => $order->business_branch_id,
                'warehouse_id' => $order->warehouse_id,
                'commercial_order_id' => $order->id,
                'dispatch_id' => $dispatch?->id,
                'client_id' => $order->client_id,
                'eventual_client_id' => $order->eventual_client_id,
                'driver_id' => $dispatch?->driver_id,
                'vehicle_id' => $dispatch?->vehicle_id,
                'zone_id' => $dispatch?->zone_id,
                'activity_type' => $index % 2 === 0 ? 'delivery' : 'visit',
                'activity_status' => $index < 4 ? 'completed' : ($index < 7 ? 'in_progress' : 'scheduled'),
                'transfer_date' => now()->addDays($index + 1)->toDateString(),
                'manifest_code' => $dispatch?->manifest_code,
                'customer_name' => $order->client?->full_name ?: $order->eventualClient?->business_name,
                'document_number' => $order->client?->document_number ?: $order->eventualClient?->document_number,
                'origin_address' => 'Almacen demo ' . ($index + 1),
                'destination_address' => $order->delivery_address,
                'destination_reference' => $order->delivery_reference,
                'dispatch_contact_name' => $order->dispatch_contact_name,
                'dispatch_contact_phone' => $order->dispatch_contact_phone,
                'ubigeo' => $order->ubigeo,
                'map_lat' => $order->map_lat,
                'map_lng' => $order->map_lng,
                'package_count' => max(1, count($order->items)),
                'gross_weight' => 25 + ($index * 3),
                'observations' => 'Actividad demo sembrada automaticamente',
            ]));

            if ($response->getStatusCode() !== 200) {
                throw new \RuntimeException('No se pudo crear actividad demo: ' . $response->getContent());
            }
        }
    }

    private function seedBillingSimulation($demoBusinessIds): void
    {
        $service = app(BillingDocumentService::class);
        $documents = BillingDocument::query()
            ->whereIn('business_id', $demoBusinessIds)
            ->whereNull('reference_billing_document_id')
            ->where('status', 1)
            ->orderBy('id')
            ->get();

        foreach ($documents->take(5) as $document) {
            $service->issueDocument($document);
        }

        $issued = BillingDocument::query()
            ->whereIn('business_id', $demoBusinessIds)
            ->whereNull('reference_billing_document_id')
            ->where('status', 1)
            ->where('local_status', 'accepted')
            ->orderBy('id')
            ->get()
            ->values();

        if ($issued->count() > 0) {
            $service->cancelDocument($issued[0], 'Anulacion demo controlada');
        }

        if ($issued->count() > 1) {
            $service->createCreditNote($issued[1], [
                'series' => 'FC01',
                'issue_date' => now()->toDateString(),
                'reason' => 'Anulacion de la operacion',
                'note' => 'Nota de credito demo automatica',
            ]);
        }
    }
}
