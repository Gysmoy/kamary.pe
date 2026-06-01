<?php

namespace App\Support;

use App\Models\Business;
use App\Models\BusinessBranch;
use App\Models\Warehouse;
use Illuminate\Http\Request;

class BusinessScope
{
    public const KAMARY_PERU = 'kamary_peru';
    public const KAMARY_MEDICALS = 'kamary_medicals';

    public static function fixedKeys(): array
    {
        return [self::KAMARY_PERU, self::KAMARY_MEDICALS];
    }

    public static function labels(): array
    {
        return [
            self::KAMARY_PERU => 'Kamary Peru',
            self::KAMARY_MEDICALS => 'Kamary Medicals',
        ];
    }

    public static function normalize(?string $key): ?string
    {
        $normalized = strtolower(trim((string) $key));
        return in_array($normalized, self::fixedKeys(), true) ? $normalized : null;
    }

    public static function keyForPath(?string $path): string
    {
        $normalizedPath = '/' . ltrim(strtolower((string) $path), '/');

        return str_contains($normalizedPath, '/admin/storage')
            ? self::KAMARY_MEDICALS
            : self::KAMARY_PERU;
    }

    public static function keyForUrl(?string $url): string
    {
        $path = parse_url((string) $url, PHP_URL_PATH) ?: (string) $url;
        return self::keyForPath($path);
    }

    public static function scopedKeyForRequest(Request $request, array $neutralPaths = []): ?string
    {
        $explicit = self::normalize($request->input('business_scope_key') ?? $request->input('business_key'));
        if ($explicit) return $explicit;

        return self::keyFromRequestPath($request, $neutralPaths);
    }

    public static function keyFromRequestPath(Request $request, array $neutralPaths = []): ?string
    {
        $refererPath = parse_url((string) $request->headers->get('referer', ''), PHP_URL_PATH) ?: '';
        $refererPath = strtolower($refererPath);

        if ($refererPath === '' || !str_contains($refererPath, '/admin')) return null;

        foreach ($neutralPaths as $neutralPath) {
            if (str_contains($refererPath, strtolower($neutralPath))) return null;
        }

        return self::keyForPath($refererPath);
    }

    public static function businessForKey(?string $key): ?Business
    {
        $normalized = self::normalize($key);
        if (!$normalized) return null;

        return Business::query()
            ->where('business_key', $normalized)
            ->whereNotNull('status')
            ->first();
    }

    public static function findFixedBusiness($id): Business
    {
        $business = Business::query()
            ->whereKey($id)
            ->whereIn('business_key', self::fixedKeys())
            ->whereNotNull('status')
            ->first();

        if (!$business) {
            throw new \Exception('La empresa seleccionada no pertenece a las dos empresas permitidas');
        }

        return $business;
    }

    public static function findFixedBusinessForRequest($id, Request $request, array $neutralPaths = []): Business
    {
        $business = self::findFixedBusiness($id);
        $scopeKey = self::keyFromRequestPath($request, $neutralPaths);

        if ($scopeKey && $business->business_key !== $scopeKey) {
            throw new \Exception('La empresa seleccionada no corresponde al grupo actual');
        }

        return $business;
    }

    public static function findFixedBranchForRequest($id, Request $request, array $neutralPaths = []): BusinessBranch
    {
        $scopeKey = self::keyFromRequestPath($request, $neutralPaths);
        $branch = BusinessBranch::query()
            ->whereKey($id)
            ->whereNotNull('status')
            ->whereHas('business', function ($business) use ($scopeKey) {
                $business->whereIn('business_key', self::fixedKeys())->whereNotNull('status');
                if ($scopeKey) {
                    $business->where('business_key', $scopeKey);
                }
            })
            ->first();

        if (!$branch) {
            throw new \Exception('La sede seleccionada no pertenece a una empresa permitida');
        }

        return $branch;
    }

    public static function requireBranchForBusiness(Business $business, $branchId): BusinessBranch
    {
        $branchId = self::nullableInt($branchId);
        if (!$branchId) {
            throw new \Exception('La sede es obligatoria');
        }

        $branch = $business->branches()
            ->whereKey($branchId)
            ->whereNotNull('status')
            ->first();

        if (!$branch) {
            throw new \Exception('La sede no pertenece a la empresa seleccionada');
        }

        return $branch;
    }

    public static function branchIdFromWarehouse(Business $business, Warehouse $warehouse, $branchId = null): int
    {
        $warehouseBranchId = self::nullableInt($warehouse->business_branch_id);
        if (!$warehouseBranchId) {
            throw new \Exception('El almacen seleccionado no tiene sede asignada');
        }

        $branchId = self::nullableInt($branchId);
        if ($branchId && $branchId !== $warehouseBranchId) {
            throw new \Exception('El almacen seleccionado no pertenece a la sede elegida');
        }

        self::requireBranchForBusiness($business, $warehouseBranchId);

        return $warehouseBranchId;
    }

    private static function nullableInt($value): ?int
    {
        if ($value === null) return null;
        $text = trim((string) $value);
        if ($text === '') return null;
        return (int) $text;
    }
}
