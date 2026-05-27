<?php

namespace App\Http\Middleware;

use App\Support\ModulePermissions;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminPermissionForPath
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (ModulePermissions::isSuperUser($user)) {
            return $next($request);
        }

        $permissions = $this->permissionsFor($request);
        if ($permissions === null) {
            return $next($request);
        }

        foreach ($permissions as $permission) {
            if (ModulePermissions::userCan($user, $permission)) {
                return $next($request);
            }
        }

        if ($request->expectsJson() || str_starts_with('/' . trim($request->path(), '/'), '/api/')) {
            return response()->json([
                'status' => 403,
                'message' => 'No tienes permiso para acceder a este modulo.',
            ], 403);
        }

        abort(403, 'No tienes permiso para acceder a este modulo.');
    }

    private function permissionsFor(Request $request): ?array
    {
        $segments = $request->segments();
        if (($segments[0] ?? null) === 'api') {
            array_shift($segments);
        }

        if (($segments[0] ?? null) !== 'admin') {
            return null;
        }

        array_shift($segments);
        $first = $segments[0] ?? '';
        $second = $segments[1] ?? '';

        if (in_array($first, ['', 'account', 'profile', 'ubigeo'], true)) {
            return null;
        }

        if ($first === 'home') {
            return null;
        }

        if ($first === 'storage') {
            return $this->storagePermissions($second);
        }

        if ($first === 'magistrales') {
            return $this->magistralesPermissions($second);
        }

        return $this->standardPermissions($request, $first, $second, $segments);
    }

    private function standardPermissions(Request $request, string $first, string $second, array $segments): array
    {
        $readRoute = $this->isReadRoute($request, $segments);

        return match ($first) {
            'users' => $readRoute ? ['users', 'sample-orders'] : ['users'],
            'roles' => ['roles'],
            'businesses' => $readRoute ? $this->anyAdminPermission() : ['businesses', 'services-billing'],
            'generals' => ['generals'],

            'articles' => $readRoute ? $this->catalogConsumerPermissions('articles') : ['articles'],
            'inventory', 'inventory-report' => ['inventory'],
            'kardex' => ['kardex'],
            'laboratories' => $readRoute ? $this->catalogConsumerPermissions('laboratories') : ['laboratories', 'articles'],
            'categories' => ['laboratories'],
            'batches' => $readRoute ? ['batches', 'entry-note', 'exit-note', 'purchase-receipts'] : ['batches'],
            'entry-note', 'entry-notes' => ['entry-note'],
            'exit-note', 'exit-notes' => ['exit-note'],
            'warehouses' => $readRoute ? $this->anyAdminPermission() : ['businesses', 'exit-note'],
            'suppliers' => $readRoute ? ['suppliers', 'purchase-orders', 'purchase-receipts', 'entry-note'] : ['suppliers'],
            'units', 'units-of-measure' => $readRoute ? $this->catalogConsumerPermissions('units-of-measure') : ['units-of-measure'],

            'purchase-orders' => ['purchase-orders'],
            'purchase-receipts' => ['purchase-receipts'],
            'accounts-payable' => ['accounts-payable'],
            'expenses', 'transactions' => ['expenses'],
            'daily-summary' => ['daily-summary'],

            'clients' => $readRoute ? ['clients', 'orders', 'take-orders', 'accounts-receivable', 'sample-orders'] : ['clients'],
            'eventual-clients' => ['eventual-clients'],
            'client-distribution' => ($readRoute && str_starts_with('/' . trim($request->path(), '/'), '/api/'))
                ? ['client-distribution', 'clients', 'orders', 'take-orders', 'pricing']
                : ['client-distribution'],
            'accounts-receivable' => ['accounts-receivable'],
            'commercial-orders', 'orders', 'sales-report' => ['orders'],
            'reports' => $second === 'inventory' ? ['inventory'] : ['orders'],
            'take-orders', 'comercial' => ['take-orders'],
            'pricing', 'price-lists' => ['pricing'],

            'activity', 'activities' => ['activity'],
            'driver', 'drivers' => ['driver'],
            'dispatch', 'dispatches', 'driver-routes', 'picking', 'referral-guides', 'delivery-evidence-media' => ['dispatch'],
            'vehicle-zone', 'vehicles', 'zones' => ['vehicle-zone'],

            'services-client' => ['services-client'],
            'services-billing', 'billing-documents' => ['services-billing'],
            'billing-settings' => ['businesses', 'services-billing'],
            'services-service-order', 'service-orders' => ['services-service-order'],
            'services-services', 'services' => ['services-services'],

            'sample-orders' => ['sample-orders'],

            'magistrales-dashboard' => ['magistrales-dashboard'],
            'magistrales-articles' => ['magistrales-products', 'magistrales-articles'],
            'magistrales-category' => ['magistrales-category', 'magistrales-products'],
            'magistrales-formats' => ['magistrales-formats', 'magistrales-products'],
            'magistrales-formulas' => ['magistrales-formulas', 'magistrales-products'],
            'magistrales-incomes' => ['magistrales-incomes', 'magistrales-procurement'],
            'magistrales-inventory' => ['magistrales-inventory', 'magistrales-warehouse'],
            'magistrales-kardex' => ['magistrales-kardex', 'magistrales-warehouse'],
            'magistrales-laboratory' => ['magistrales-laboratory', 'magistrales-products'],
            'magistrales-purchase-order' => ['magistrales-purchase-order', 'magistrales-procurement'],
            'magistrales-production-order' => ['magistrales-production-order', 'magistrales-warehouse'],
            'magistrales-supplier' => ['magistrales-supplier', 'magistrales-procurement'],
            'magistrales-responsible' => ['magistrales-responsible', 'magistrales-warehouse'],
            'magistrales-outputs' => ['magistrales-outputs', 'magistrales-warehouse'],
            'magistrales-unit' => ['magistrales-unit', 'magistrales-products'],
            'magistrales-sales' => ['magistrales-sales', 'magistrales-billing'],

            'storage-inventory' => ['storage-inventory'],
            'storage-clients' => ['storage-clients'],
            'storage-service-orders' => ['storage-service-orders'],
            'storage-units' => ['storage-units'],
            'storage-products' => ['storage-products'],
            'storage-entry-note' => ['storage-entry-note'],
            'storage-exit-note' => ['storage-exit-note'],
            'storage-kardex' => ['storage-kardex'],
            'storage-general-service' => ['storage-general-service'],
            'storage-billing-control' => ['storage-billing-control'],
            'storage-general-service-orders' => ['storage-general-service-orders'],

            default => [],
        };
    }

    private function storagePermissions(string $section): array
    {
        return match ($section) {
            'inventory' => ['storage-inventory'],
            'clients', 'client-contracts', 'client-tariffs', 'client-notifications' => ['storage-clients'],
            'units' => ['storage-units'],
            'articles' => ['storage-products'],
            'entry-notes' => ['storage-entry-note'],
            'exit-notes' => ['storage-exit-note'],
            'kardex' => [
                'storage-kardex',
                'storage-inventory',
                'storage-entry-note',
                'storage-exit-note',
                'storage-service-orders',
                'storage-general-service-orders',
            ],
            'general-service' => ['storage-general-service'],
            'billing-control' => ['storage-billing-control'],
            'service-orders' => ['storage-service-orders'],
            'general-service-orders' => ['storage-general-service-orders'],
            default => $this->storageAnyPermission(),
        };
    }

    private function magistralesPermissions(string $section): array
    {
        return match ($section) {
            'dashboard' => ['magistrales-dashboard'],
            'articles', 'batches', 'units-of-measure', 'units', 'laboratories', 'categories', 'formats', 'formulas' => [
                'magistrales-products',
                'magistrales-articles',
                'magistrales-unit',
                'magistrales-laboratory',
                'magistrales-category',
                'magistrales-formats',
                'magistrales-formulas',
            ],
            'entry-note', 'entry-notes', 'incomes', 'purchase-orders', 'accounts-payable', 'suppliers' => [
                'magistrales-procurement',
                'magistrales-incomes',
                'magistrales-purchase-order',
                'magistrales-supplier',
            ],
            'inventory', 'kardex', 'production-orders', 'responsibles', 'outputs', 'exit-note', 'warehouses' => [
                'magistrales-warehouse',
                'magistrales-inventory',
                'magistrales-kardex',
                'magistrales-production-order',
                'magistrales-responsible',
                'magistrales-outputs',
            ],
            'sales', 'billing-settings', 'billing-documents' => ['magistrales-billing', 'magistrales-sales'],
            default => $this->magistralesAnyPermission(),
        };
    }

    private function isReadRoute(Request $request, array $segments): bool
    {
        if ($request->isMethod('GET') || $request->isMethod('HEAD')) {
            return true;
        }

        return $request->isMethod('POST') && in_array('paginate', $segments, true);
    }

    private function anyAdminPermission(): array
    {
        return array_keys(ModulePermissions::permissions());
    }

    private function storageAnyPermission(): array
    {
        return array_values(array_filter(
            array_keys(ModulePermissions::permissions()),
            fn(string $permission) => str_starts_with($permission, 'storage-')
        ));
    }

    private function magistralesAnyPermission(): array
    {
        return array_values(array_filter(
            array_keys(ModulePermissions::permissions()),
            fn(string $permission) => str_starts_with($permission, 'magistrales-')
        ));
    }

    private function catalogConsumerPermissions(string $basePermission): array
    {
        return array_unique(array_merge([$basePermission], [
            'inventory',
            'kardex',
            'batches',
            'entry-note',
            'exit-note',
            'purchase-orders',
            'purchase-receipts',
            'orders',
            'take-orders',
            'pricing',
            'sample-orders',
        ]));
    }
}
