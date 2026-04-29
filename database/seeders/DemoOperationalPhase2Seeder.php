<?php

namespace Database\Seeders;

use App\Http\Controllers\Admin\BillingDocumentController;
use App\Http\Controllers\Admin\DispatchController;
use App\Http\Controllers\Admin\ServiceOrderController;
use App\Models\Business;
use App\Models\Client;
use App\Models\CommercialOrder;
use App\Models\ServiceCatalog;
use App\Models\ServiceOrder;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DemoOperationalPhase2Seeder extends Seeder
{
    public function run(): void
    {
        $user = User::query()->orderBy('id')->first();
        if (!$user) throw new \RuntimeException('No existe un usuario para sembrar demos');

        Auth::shouldUse('web');
        Auth::setUser($user);

        DB::beginTransaction();
        try {
            $demoBusinessIds = Business::query()->where('name', 'like', 'DEMO OPERATIVO %')->pluck('id');
            if ($demoBusinessIds->isEmpty()) {
                throw new \RuntimeException('Primero ejecuta DemoOperationalModulesSeeder');
            }

            $this->cleanup($demoBusinessIds);
            $services = $this->seedServices($user);
            $serviceOrders = $this->seedServiceOrders($services, $demoBusinessIds);
            $this->seedDispatches($demoBusinessIds);
            $this->seedBillingDocuments($demoBusinessIds, $serviceOrders);

            DB::commit();

            $this->command?->info('Datos demo fase 2 cargados correctamente');
            $this->command?->line('services_demo...................... ' . ServiceCatalog::query()->where('code', 'like', 'SRV-DEMO-%')->count());
            $this->command?->line('service_orders_demo................ ' . ServiceOrder::query()->whereIn('business_id', $demoBusinessIds)->count());
            $this->command?->line('dispatches_demo.................... ' . DB::table('dispatches')->whereIn('business_id', $demoBusinessIds)->count());
            $this->command?->line('billing_documents_demo............. ' . DB::table('billing_documents')->whereIn('business_id', $demoBusinessIds)->count());
        } catch (\Throwable $th) {
            DB::rollBack();
            throw $th;
        }
    }

    private function cleanup($demoBusinessIds): void
    {
        $dispatches = DB::table('dispatches')->whereIn('business_id', $demoBusinessIds)->pluck('exit_note_id')->filter();
        DB::table('dispatch_assignments')->whereIn('dispatch_id', DB::table('dispatches')->whereIn('business_id', $demoBusinessIds)->pluck('id'))->delete();
        DB::table('dispatches')->whereIn('business_id', $demoBusinessIds)->delete();
        if ($dispatches->isNotEmpty()) DB::table('exit_notes')->whereIn('id', $dispatches)->delete();

        $billingIds = DB::table('billing_documents')->whereIn('business_id', $demoBusinessIds)->pluck('id');
        DB::table('billing_events')->whereIn('billing_document_id', $billingIds)->delete();
        DB::table('billing_document_items')->whereIn('billing_document_id', $billingIds)->delete();
        DB::table('billing_documents')->whereIn('id', $billingIds)->delete();

        $serviceOrderIds = DB::table('service_orders')->whereIn('business_id', $demoBusinessIds)->pluck('id');
        $receivableIds = DB::table('accounts_receivable')
            ->where('source_type', 'service_order')
            ->whereIn('source_id', $serviceOrderIds)
            ->pluck('id');
        DB::table('receivable_payments')->whereIn('accounts_receivable_id', $receivableIds)->delete();
        DB::table('accounts_receivable_installments')->whereIn('accounts_receivable_id', $receivableIds)->delete();
        DB::table('accounts_receivable')->whereIn('id', $receivableIds)->delete();
        DB::table('service_order_items')->whereIn('service_order_id', $serviceOrderIds)->delete();
        DB::table('service_orders')->whereIn('id', $serviceOrderIds)->delete();
        DB::table('services')->where('code', 'like', 'SRV-DEMO-%')->delete();
    }

    private function seedServices(User $user): array
    {
        $services = [];
        for ($i = 1; $i <= 10; $i++) {
            $services[] = ServiceCatalog::create([
                'code' => 'SRV-DEMO-' . str_pad((string) $i, 3, '0', STR_PAD_LEFT),
                'name' => 'Servicio Demo ' . $i,
                'category' => $i % 2 === 0 ? 'Almacenamiento' : 'Distribucion',
                'subcategory' => $i % 3 === 0 ? 'Especial' : 'General',
                'service_type' => $i % 2 === 0 ? 'Recurrente' : 'Puntual',
                'billing_unit' => $i % 2 === 0 ? 'Mes' : 'Viaje',
                'unit_price_pen' => 50 + $i,
                'unit_price_usd' => 20 + $i,
                'applicable_zone' => $i % 2 === 0 ? 'Lima' : 'Callao',
                'linked_vehicle_type' => $i % 2 === 0 ? 'Furgon' : 'Moto',
                'commissions_enabled' => $i % 2 === 0,
                'observations' => 'Servicio demo para pruebas',
                'status' => true,
                'created_by' => $user->id,
                'updated_by' => $user->id,
            ]);
        }
        return $services;
    }

    private function seedServiceOrders(array $services, $demoBusinessIds): array
    {
        $controller = app(ServiceOrderController::class);
        $serviceOrders = [];
        $businesses = Business::query()->whereIn('id', $demoBusinessIds)->with('branches')->get()->values();
        $clients = Client::query()->where('full_name', 'like', 'Cliente Demo %')->orderBy('id')->take(6)->get()->values();

        for ($i = 1; $i <= 6; $i++) {
            $business = $businesses[($i - 1) % $businesses->count()];
            $branch = $business->branches->first();
            $client = $clients[$i - 1];
            $serviceA = $services[($i - 1) % count($services)];
            $serviceB = $services[$i % count($services)];
            $serviceOrders[] = $this->persist($controller, [
                'business_id' => $business->id,
                'business_branch_id' => $branch?->id,
                'client_id' => $client->id,
                'expected_document_type' => $i % 2 === 0 ? 'Factura' : 'Boleta',
                'currency' => 'PEN',
                'billing_cycle' => $i % 2 === 0 ? 'Mensual' : 'Eventual',
                'payment_condition' => $i <= 3 ? 'Contado' : 'Credito',
                'installments' => $i <= 3 ? 1 : 2,
                'issue_date' => now()->subDays(5 + $i)->toDateString(),
                'scheduled_at' => now()->addDays($i)->toDateString(),
                'first_due_date' => now()->addDays(10 + $i)->toDateString(),
                'order_status' => $i % 2 === 0 ? 'approved' : 'scheduled',
                'billing_status' => 'pending',
                'tax_amount' => 0,
                'observations' => 'Orden de servicio demo',
                'items' => [
                    ['service_id' => $serviceA->id, 'description' => $serviceA->name, 'quantity' => 1, 'unit_price' => $serviceA->unit_price_pen, 'detraction_percent' => 0, 'commission_percent' => 5, 'total' => $serviceA->unit_price_pen],
                    ['service_id' => $serviceB->id, 'description' => $serviceB->name, 'quantity' => 2, 'unit_price' => $serviceB->unit_price_pen, 'detraction_percent' => 0, 'commission_percent' => 0, 'total' => $serviceB->unit_price_pen * 2],
                ],
            ]);
        }

        return $serviceOrders;
    }

    private function seedDispatches($demoBusinessIds): void
    {
        $controller = app(DispatchController::class);
        $orders = CommercialOrder::query()->whereIn('business_id', $demoBusinessIds)->orderBy('id')->take(6)->get()->values();

        foreach ($orders as $index => $order) {
            $status = $index < 2 ? 'assigned' : ($index < 4 ? 'in_route' : 'delivered');
            $this->persist($controller, [
                'business_id' => $order->business_id,
                'business_branch_id' => $order->business_branch_id,
                'warehouse_id' => $order->warehouse_id,
                'scheduled_date' => now()->addDays($index + 1)->toDateString(),
                'shift' => $index % 2 === 0 ? 'Manana' : 'Tarde',
                'driver_name' => 'Conductor Demo ' . ($index + 1),
                'copilot_name' => 'Copiloto Demo ' . ($index + 1),
                'vehicle_label' => 'Unidad Demo ' . ($index + 1),
                'vehicle_plate' => 'DEM-' . str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT),
                'zone' => $index % 2 === 0 ? 'Lima Centro' : 'Lima Norte',
                'manifest_code' => 'MNF-DEMO-' . str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT),
                'dispatch_status' => $status,
                'observations' => 'Despacho demo',
                'assignments' => [
                    ['commercial_order_id' => $order->id],
                ],
            ]);
        }
    }

    private function seedBillingDocuments($demoBusinessIds, array $serviceOrders): void
    {
        $controller = app(BillingDocumentController::class);
        $commercialOrders = CommercialOrder::query()->whereIn('business_id', $demoBusinessIds)->orderBy('id')->take(6)->get()->values();

        foreach ($commercialOrders as $index => $order) {
            $result = $this->persist($controller, [
                'commercial_order_id' => $order->id,
                'document_type' => $index % 2 === 0 ? 'Factura' : 'Boleta',
                'issue_date' => now()->toDateString(),
                'series' => $index % 2 === 0 ? 'F001' : 'B001',
                'observations' => 'Documento demo comercial',
            ]);

            if ($index < 3) {
                $request = Request::create('/api/admin/billing-documents/' . $result['id'] . '/provider-response', 'POST', [
                    'local_status' => 'accepted',
                    'external_status' => 'aceptado',
                    'external_id' => 'FP5-' . $result['code'],
                    'external_reference' => 'SUNAT-' . $result['code'],
                    'response_payload' => ['status' => 'ok', 'code' => $result['code']],
                ]);
                $controller->registerProviderResponse($request, (string) $result['id']);
            }
        }

        foreach (array_slice($serviceOrders, 0, 3) as $index => $serviceOrder) {
            $result = $this->persist($controller, [
                'service_order_id' => $serviceOrder['id'],
                'document_type' => 'Factura',
                'issue_date' => now()->toDateString(),
                'series' => 'F001',
                'observations' => 'Documento demo servicios',
            ]);

            if ($index === 0) {
                $request = Request::create('/api/admin/billing-documents/' . $result['id'] . '/provider-response', 'POST', [
                    'local_status' => 'sent',
                    'external_status' => 'en_proceso',
                    'external_id' => 'FP5-' . $result['code'],
                    'response_payload' => ['status' => 'sent'],
                ]);
                $controller->registerProviderResponse($request, (string) $result['id']);
            }
        }
    }

    private function persist(object $controller, array $payload): array
    {
        $request = Request::create('/demo', 'POST', $payload);
        $response = $controller->save($request);
        if ($response->getStatusCode() !== 200) {
            throw new \RuntimeException('No se pudo persistir demo fase 2: ' . $response->getContent());
        }
        $data = json_decode($response->getContent(), true);
        if (($data['status'] ?? 400) !== 200 || empty($data['data'])) {
            throw new \RuntimeException('Respuesta invalida demo fase 2: ' . $response->getContent());
        }
        return $data['data'];
    }
}
