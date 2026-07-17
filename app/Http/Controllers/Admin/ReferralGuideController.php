<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\BasicController;
use App\Models\Business;
use App\Models\CommercialOrder;
use App\Models\Dispatch;
use App\Models\Driver;
use App\Models\ReferralGuide;
use App\Models\Vehicle;
use App\Services\FacturadorPro5Service;
use App\Services\ReferralGuideService;
use App\Support\BusinessScope;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Auth;
use SoDe\Extend\Response;

class ReferralGuideController extends BasicController
{
    public $model = ReferralGuide::class;
    public $reactView = 'Admin/ManualGuides';
    public $prefix4filter = 'referral_guides';

    public function setReactViewProperties(Request $request)
    {
        $businesses = Business::query()
            ->whereIn('business_key', BusinessScope::fixedKeys())
            ->with(['branches' => fn($q) => $q->whereNotNull('status')->where('status', true)->orderBy('id')])
            ->orderBy('id')
            ->get();

        $drivers = Driver::query()->whereNotNull('status')->where('status', true)
            ->orderBy('full_name')->get(['id', 'business_id', 'full_name', 'document_type', 'document_number', 'license_number']);
        $vehicles = Vehicle::query()->whereNotNull('status')->where('status', true)
            ->orderBy('plate')->get(['id', 'business_id', 'plate', 'label']);

        return [
            'requiredPermission' => 'referral_guides',
            'manualBusinesses' => $businesses->map(fn(Business $b) => [
                'id' => $b->id,
                'name' => $b->name,
                'tax_number' => $b->tax_number,
                'sync_ok' => ($b->facturador_sync_status ?? null) === 'success',
                'branches' => $b->branches->map(fn($br) => [
                    'id' => $br->id,
                    'name' => $br->name,
                    'establishment_code' => $br->establishment_code,
                    'ubigeo' => $br->ubigeo,
                    'address' => $br->address,
                    'series_guia' => $br->series_guia,
                    'synced' => (bool) $br->facturador_establishment_id,
                ])->values(),
            ])->values(),
            'manualDrivers' => $drivers,
            'manualVehicles' => $vehicles,
        ];
    }

    public function createManual(Request $request): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            BusinessScope::findFixedBusinessForRequest($request->input('business_id'), $request);
            $guide = app(ReferralGuideService::class)->createManual($request->all());
            $response->status = 200;
            $response->message = 'Guia manual creada correctamente';
            $response->data = $guide;
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function setPaginationInstance(string $model)
    {
        $query = $model::select('referral_guides.*')
            ->with([
                'business:id,name,tax_number',
                'branch:id,business_id,name,ubigeo,address',
                'warehouse:id,name',
                'dispatch:id,code,manifest_code,dispatch_status,scheduled_date',
                'commercialOrder:id,code,document_type,delivery_address,delivery_reference,dispatch_contact_name,dispatch_contact_phone,total',
                'driver:id,full_name,document_type,document_number,license_number',
                'vehicle:id,plate,label',
                'items:id,referral_guide_id,article_id,item_code,description,unit,quantity,gross_weight,status',
                'creator:id,name,lastname,username,fullname',
                'updater:id,name,lastname,username,fullname',
            ]);

        $scopeKey = BusinessScope::scopedKeyForRequest(request());
        $query->whereHas('business', function ($business) use ($scopeKey) {
            $business->whereIn('business_key', BusinessScope::fixedKeys());
            if ($scopeKey) $business->where('business_key', $scopeKey);
        });

        return $query;
    }

    public function prepareFromDispatch(Request $request, string $dispatchId): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            $dispatch = Dispatch::findOrFail($dispatchId);
            BusinessScope::findFixedBusinessForRequest($dispatch->business_id, $request);
            $response->status = 200;
            $response->message = 'Guias generadas correctamente';
            $response->data = app(ReferralGuideService::class)->prepareForDispatch($dispatch);
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function prepareFromCommercialOrder(Request $request, string $orderId): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            $order = CommercialOrder::findOrFail($orderId);
            BusinessScope::findFixedBusinessForRequest($order->business_id, $request);
            $response->status = 200;
            $response->message = 'Guia generada correctamente';
            $response->data = app(ReferralGuideService::class)->prepareForCommercialOrder($order);
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function connectorPayload(Request $request, string $id): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            $guide = app(ReferralGuideService::class)->loadGuide((int) $id);
            BusinessScope::findFixedBusinessForRequest($guide->business_id, $request);
            $response->status = 200;
            $response->message = 'Operacion correcta';
            $response->data = json_decode($guide->request_payload ?: '[]', true) ?: app(ReferralGuideService::class)->buildProviderPayload($guide);
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function issue(Request $request, string $id): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            $guide = ReferralGuide::findOrFail($id);
            BusinessScope::findFixedBusinessForRequest($guide->business_id, $request);
            $response->status = 200;
            $response->message = 'Guia emitida correctamente';
            $response->data = app(ReferralGuideService::class)->issue($guide);
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function cancel(Request $request, string $id): HttpResponse|ResponseFactory
    {
        $response = new Response();
        try {
            $guide = ReferralGuide::findOrFail($id);
            BusinessScope::findFixedBusinessForRequest($guide->business_id, $request);
            $response->status = 200;
            $response->message = 'Guia anulada correctamente';
            $response->data = app(ReferralGuideService::class)->cancel($guide, trim((string) $request->input('reason')) ?: null);
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }

    public function download(Request $request, string $id, string $type): HttpResponse|ResponseFactory
    {
        try {
            $guide = app(ReferralGuideService::class)->loadGuide((int) $id);
            BusinessScope::findFixedBusinessForRequest($guide->business_id, $request);
            $file = app(FacturadorPro5Service::class)->downloadReferralGuideFile($guide, $type);

            return response($file['content'], 200, [
                'Content-Type' => $file['content_type'],
                'Content-Disposition' => 'inline; filename="' . $file['filename'] . '"',
                'Cache-Control' => 'private, max-age=0, must-revalidate',
            ]);
        } catch (\Throwable $th) {
            return response([
                'status' => 400,
                'message' => $th->getMessage(),
            ], 400);
        }
    }

    public function boolean(Request $request)
    {
        $response = new Response();
        try {
            $guide = ReferralGuide::findOrFail($request->id);
            BusinessScope::findFixedBusinessForRequest($guide->business_id, $request);
            $field = trim((string) $request->field);
            if (!in_array($field, ['guide_status', 'external_status', 'observations'], true)) {
                throw new \Exception('Campo no editable para guia');
            }
            $guide->update([
                $field => $request->value,
                'updated_by' => Auth::id(),
            ]);
            $response->status = 200;
            $response->message = 'Operacion correcta';
        } catch (\Throwable $th) {
            $response->status = 400;
            $response->message = $th->getMessage();
        } finally {
            return response($response->toArray(), $response->status);
        }
    }
}
